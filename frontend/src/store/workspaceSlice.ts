import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';

export interface CityNode {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: string;
}

export interface CityEdge {
  id: string;
  source: string;
  destination: string;
  weight: number;
  type: string;
}

export interface City {
  id: number;
  name: string;
}

interface WorkspaceState {
  cities: City[];
  activeCityId: number | null;
  activeCityName: string;
  nodes: CityNode[];
  edges: CityEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  isLoading: boolean;
  error: string | null;
  history: {
    past: { nodes: CityNode[]; edges: CityEdge[] }[];
    future: { nodes: CityNode[]; edges: CityEdge[] }[];
  };
}

const initialState: WorkspaceState = {
  cities: [],
  activeCityId: null,
  activeCityName: '',
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  isLoading: false,
  error: null,
  history: {
    past: [],
    future: [],
  },
};

const API_BASE = '/api';

// Async Thunks
export const fetchCities = createAsyncThunk('workspace/fetchCities', async () => {
  const res = await fetch(`${API_BASE}/city/list`);
  if (!res.ok) throw new Error('Failed to load cities');
  return (await res.json()) as City[];
});

export const initializeCity = createAsyncThunk('workspace/initializeCity', async (name: string) => {
  const res = await fetch(`${API_BASE}/city/initialize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to create city workspace');
  return (await res.json()) as { cityId: number; name: string };
});

export const fetchCityData = createAsyncThunk('workspace/fetchCityData', async (cityId: number) => {
  const [nodesRes, edgesRes] = await Promise.all([
    fetch(`${API_BASE}/city/nodes?cityId=${cityId}`),
    fetch(`${API_BASE}/city/edges?cityId=${cityId}`),
  ]);
  if (!nodesRes.ok || !edgesRes.ok) throw new Error('Failed to fetch city nodes/edges');
  const nodes = (await nodesRes.json()) as CityNode[];
  const edges = (await edgesRes.json()) as CityEdge[];
  return { cityId, nodes, edges };
});

export const addNodeDb = createAsyncThunk(
  'workspace/addNodeDb',
  async ({ cityId, node }: { cityId: number; node: CityNode }) => {
    const res = await fetch(`${API_BASE}/city/addNode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cityId, ...node }),
    });
    if (!res.ok) throw new Error('Failed to save node');
    return node;
  }
);

export const addEdgeDb = createAsyncThunk(
  'workspace/addEdgeDb',
  async ({ cityId, edge }: { cityId: number; edge: CityEdge }) => {
    const res = await fetch(`${API_BASE}/city/addEdge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cityId, ...edge }),
    });
    if (!res.ok) throw new Error('Failed to save edge');
    return edge;
  }
);

export const deleteNodeDb = createAsyncThunk(
  'workspace/deleteNodeDb',
  async ({ cityId, nodeId }: { cityId: number; nodeId: string }) => {
    const res = await fetch(`${API_BASE}/city/node/${nodeId}?cityId=${cityId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete node');
    return nodeId;
  }
);

export const deleteEdgeDb = createAsyncThunk(
  'workspace/deleteEdgeDb',
  async ({ cityId, source, destination, type }: { cityId: number; source: string; destination: string; type: string }) => {
    const res = await fetch(`${API_BASE}/city/edge/${source}/${destination}?cityId=${cityId}&type=${type}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete edge');
    return { source, destination, type };
  }
);

const saveToHistory = (state: WorkspaceState) => {
  state.history.past.push({
    nodes: [...state.nodes],
    edges: [...state.edges],
  });
  state.history.future = [];
  if (state.history.past.length > 30) {
    state.history.past.shift();
  }
};

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    selectNode: (state, action: PayloadAction<string | null>) => {
      state.selectedNodeId = action.payload;
    },
    selectEdge: (state, action: PayloadAction<string | null>) => {
      state.selectedEdgeId = action.payload;
    },
    clearWorkspace: (state) => {
      state.activeCityId = null;
      state.activeCityName = '';
      state.nodes = [];
      state.edges = [];
      state.selectedNodeId = null;
      state.selectedEdgeId = null;
    },
    undo: (state) => {
      const prev = state.history.past.pop();
      if (prev) {
        state.history.future.push({
          nodes: [...state.nodes],
          edges: [...state.edges],
        });
        state.nodes = prev.nodes;
        state.edges = prev.edges;
      }
    },
    redo: (state) => {
      const next = state.history.future.pop();
      if (next) {
        state.history.past.push({
          nodes: [...state.nodes],
          edges: [...state.edges],
        });
        state.nodes = next.nodes;
        state.edges = next.edges;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Cities
      .addCase(fetchCities.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCities.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cities = action.payload;
      })
      .addCase(fetchCities.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch cities';
      })
      // Initialize City
      .addCase(initializeCity.fulfilled, (state, action) => {
        state.activeCityId = action.payload.cityId;
        state.activeCityName = action.payload.name;
        state.nodes = [];
        state.edges = [];
        const index = state.cities.findIndex(c => c.id === action.payload.cityId);
        if (index === -1) {
          state.cities.push({ id: action.payload.cityId, name: action.payload.name });
        }
      })
      // Fetch City Data
      .addCase(fetchCityData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCityData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeCityId = action.payload.cityId;
        const city = state.cities.find(c => c.id === action.payload.cityId);
        state.activeCityName = city ? city.name : `City #${action.payload.cityId}`;
        state.nodes = action.payload.nodes;
        state.edges = action.payload.edges;
      })
      .addCase(fetchCityData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to load city data';
      })
      // Add Node
      .addCase(addNodeDb.fulfilled, (state, action) => {
        saveToHistory(state);
        const idx = state.nodes.findIndex(n => n.id === action.payload.id);
        if (idx > -1) {
          state.nodes[idx] = action.payload;
        } else {
          state.nodes.push(action.payload);
        }
      })
      // Add Edge
      .addCase(addEdgeDb.fulfilled, (state, action) => {
        saveToHistory(state);
        const idx = state.edges.findIndex(
          e => e.source === action.payload.source &&
               e.destination === action.payload.destination &&
               e.type === action.payload.type
        );
        if (idx > -1) {
          state.edges[idx] = action.payload;
        } else {
          state.edges.push(action.payload);
        }
      })
      // Delete Node
      .addCase(deleteNodeDb.fulfilled, (state, action) => {
        saveToHistory(state);
        state.nodes = state.nodes.filter(n => n.id !== action.payload);
        state.edges = state.edges.filter(e => e.source !== action.payload && e.destination !== action.payload);
        state.selectedNodeId = null;
      })
      // Delete Edge
      .addCase(deleteEdgeDb.fulfilled, (state, action) => {
        saveToHistory(state);
        state.edges = state.edges.filter(
          e => !(e.source === action.payload.source &&
                 e.destination === action.payload.destination &&
                 e.type === action.payload.type)
        );
        state.selectedEdgeId = null;
      });
  },
});

export const { selectNode, selectEdge, clearWorkspace, undo, redo } = workspaceSlice.actions;
export default workspaceSlice.reducer;
