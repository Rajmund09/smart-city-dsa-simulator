import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';

export interface AlgorithmStep {
  type: string;
  nodeId: string;
  sourceId: string;
  targetId: string;
  value: number;
  queueState: string[];
  visited: string[];
}

export interface RunAlgorithmPayload {
  algorithm: string;
  cityId: number;
  start?: string;
  end?: string;
}

interface SimulatorState {
  isRunning: boolean;
  isPaused: boolean;
  isComputing: boolean;
  algorithm: string;
  startNode: string;
  endNode: string;
  speed: number; // in ms
  currentStepIndex: number;
  steps: AlgorithmStep[];
  path: string[];
  cost: number;
  executionTimeMs: number;
  memoryUsageBytes: number;
  timeComplexity: string;
  spaceComplexity: string;
  logs: string[];
  error: string | null;
}

const initialState: SimulatorState = {
  isRunning: false,
  isPaused: false,
  isComputing: false,
  algorithm: 'dijkstra',
  startNode: '',
  endNode: '',
  speed: 250, // default 250ms per step
  currentStepIndex: 0,
  steps: [],
  path: [],
  cost: 0,
  executionTimeMs: 0,
  memoryUsageBytes: 0,
  timeComplexity: '',
  spaceComplexity: '',
  logs: [],
  error: null,
};

const API_BASE = '/api';

export const runAlgorithmDb = createAsyncThunk(
  'simulator/runAlgorithm',
  async (payload: RunAlgorithmPayload) => {
    const { algorithm, cityId, start, end } = payload;
    let endpoint = `${API_BASE}/algorithms/${algorithm}`;
    const body: Record<string, any> = { cityId };
    if (start) body.start = start;
    if (end) body.end = end;

    // Minimum delay to let the high-tech scanning HUD animate on the UI map canvas
    const delayPromise = new Promise((resolve) => setTimeout(resolve, 900));

    const fetchPromise = fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const [, res] = await Promise.all([delayPromise, fetchPromise]);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to execute algorithm on engine');
    }

    return (await res.json()) as {
      name: string;
      executionTimeMs: number;
      memoryUsageBytes: number;
      path: string[];
      cost: number;
      steps: AlgorithmStep[];
      timeComplexity: string;
      spaceComplexity: string;
    };
  }
);

const simulatorSlice = createSlice({
  name: 'simulator',
  initialState,
  reducers: {
    setAlgorithm: (state, action: PayloadAction<string>) => {
      state.algorithm = action.payload;
      state.steps = [];
      state.path = [];
      state.currentStepIndex = 0;
      state.isRunning = false;
      state.isPaused = false;
    },
    setStartNode: (state, action: PayloadAction<string>) => {
      state.startNode = action.payload;
    },
    setEndNode: (state, action: PayloadAction<string>) => {
      state.endNode = action.payload;
    },
    setSpeed: (state, action: PayloadAction<number>) => {
      state.speed = action.payload;
    },
    pauseSimulation: (state) => {
      state.isPaused = true;
    },
    resumeSimulation: (state) => {
      state.isPaused = false;
    },
    stopSimulation: (state) => {
      state.isRunning = false;
      state.isPaused = false;
      state.currentStepIndex = 0;
    },
    nextStep: (state) => {
      if (state.currentStepIndex < state.steps.length - 1) {
        state.currentStepIndex += 1;
        const step = state.steps[state.currentStepIndex];
        // Add log entry
        let logMsg = '';
        if (step.type === 'visit_node') {
          logMsg = `[Visiting Node] ID: ${step.nodeId} (cost so far: ${step.value.toFixed(2)})`;
        } else if (step.type === 'examine_edge') {
          logMsg = `[Examining Connection] ${step.sourceId} → ${step.targetId} (weight: ${step.value.toFixed(2)})`;
        } else if (step.type === 'update_distance') {
          logMsg = `[Updating Path Estimate] Node: ${step.nodeId} to cost ${step.value.toFixed(2)}`;
        } else if (step.type === 'relax_edge') {
          logMsg = `[Relaxing Path Connection] ${step.sourceId} → ${step.targetId} (new estimate: ${step.value.toFixed(2)})`;
        } else if (step.type === 'mst_add') {
          logMsg = `[Adding to Spanning Tree] Edge: ${step.sourceId} — ${step.targetId} (weight: ${step.value.toFixed(2)})`;
        } else if (step.type === 'flow_update') {
          logMsg = `[Updating Capacity Network] ${step.sourceId} → ${step.targetId} (residual: ${step.value.toFixed(2)})`;
        } else if (step.type === 'color_node') {
          logMsg = `[Bipartite Coloring] Node: ${step.nodeId} to Group ${step.value}`;
        }
        if (logMsg) {
          state.logs.push(logMsg);
        }
      } else {
        state.isRunning = false;
        state.logs.push(`[Success] Pathfinding completed. Final Cost: ${state.cost.toFixed(2)}.`);
      }
    },
    prevStep: (state) => {
      if (state.currentStepIndex > 0) {
        state.currentStepIndex -= 1;
        state.logs.pop();
      }
    },
    resetSimulation: (state) => {
      state.currentStepIndex = 0;
      state.logs = [`[System] Ready to play back traversal animation (${state.steps.length} steps found)`];
      state.isPaused = false;
      state.isRunning = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(runAlgorithmDb.pending, (state) => {
        state.isRunning = false;
        state.isPaused = false;
        state.isComputing = true;
        state.error = null;
        state.logs = ['[System] Connecting to C++ Core Graph Engine...'];
      })
      .addCase(runAlgorithmDb.fulfilled, (state, action) => {
        state.isRunning = true;
        state.isComputing = false;
        state.steps = action.payload.steps;
        state.path = action.payload.path;
        state.cost = action.payload.cost;
        state.executionTimeMs = action.payload.executionTimeMs;
        state.memoryUsageBytes = action.payload.memoryUsageBytes;
        state.timeComplexity = action.payload.timeComplexity;
        state.spaceComplexity = action.payload.spaceComplexity;
        state.currentStepIndex = 0;
        state.logs = [
          `[System] C++ Execution success: ${action.payload.executionTimeMs.toFixed(4)} ms.`,
          `[System] Process Memory Footprint: ${action.payload.memoryUsageBytes} bytes.`,
          `[System] Complexity Analysis: Time: ${action.payload.timeComplexity} | Space: ${action.payload.spaceComplexity}`,
          `[System] Loading visual trace animation (${action.payload.steps.length} total steps)...`
        ];
      })
      .addCase(runAlgorithmDb.rejected, (state, action) => {
        state.isRunning = false;
        state.isComputing = false;
        state.error = action.error.message || 'Algorithm execution failed';
        state.logs = [`[Error] C++ Engine failed: ${state.error}`];
      });
  },
});

export const {
  setAlgorithm,
  setStartNode,
  setEndNode,
  setSpeed,
  pauseSimulation,
  resumeSimulation,
  stopSimulation,
  nextStep,
  prevStep,
  resetSimulation,
} = simulatorSlice.actions;

export default simulatorSlice.reducer;
