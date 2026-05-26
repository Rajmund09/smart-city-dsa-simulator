import React, { useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Node,
  type Edge,
  type Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useAppSelector, useAppDispatch } from '../store/store';
import {
  selectNode,
  selectEdge,
  addNodeDb,
  addEdgeDb,
  deleteNodeDb,
} from '../store/workspaceSlice';
import { setStartNode, setEndNode } from '../store/simulatorSlice';
import { Zap, Droplet, Activity, MapPin, Train } from 'lucide-react';
import { motion } from 'framer-motion';

// Reference center GPS coordinate for scaling: Manhattan, NY (approx)
const CENTER_LAT = 40.7128;
const CENTER_LNG = -74.0060;
const METERS_PER_DEGREE_LAT = 111000;
const METERS_PER_DEGREE_LNG = 111000 * Math.cos((CENTER_LAT * Math.PI) / 180);

// Helper functions to convert between GPS coordinates and Canvas pixels (1px = 1m)
const latLngToXY = (lat: number, lng: number) => {
  const x = (lng - CENTER_LNG) * METERS_PER_DEGREE_LNG;
  const y = (CENTER_LAT - lat) * METERS_PER_DEGREE_LAT; // invert Y since canvas goes down
  return { x, y };
};

const xyToLatLng = (x: number, y: number) => {
  const lat = CENTER_LAT - y / METERS_PER_DEGREE_LAT;
  const lng = CENTER_LNG + x / METERS_PER_DEGREE_LNG;
  return { lat, lng };
};

// Custom Node Renderer
const CustomNodeComponent = ({ data, selected }: { data: any; selected: boolean }) => {
  const icon = useMemo(() => {
    switch (data.type) {
      case 'power_station':
        return <Zap className="w-5 h-5 text-amber-500 fill-amber-500/20" />;
      case 'water_source':
        return <Droplet className="w-5 h-5 text-blue-500 fill-blue-500/20" />;
      case 'hospital':
        return <Activity className="w-5 h-5 text-rose-500" />;
      case 'station':
        return <Train className="w-5 h-5 text-emerald-500" />;
      default:
        return <MapPin className="w-5 h-5 text-slate-500 dark:text-slate-400" />;
    }
  }, [data.type]);

  const stateClass = useMemo(() => {
    if (data.isPath) return 'border-emerald-500 ring-4 ring-emerald-500/35 bg-emerald-50 dark:bg-emerald-950/40 shadow-emerald-500/20 dark:shadow-emerald-500/10';
    if (data.isActive) return 'border-sky-500 ring-4 ring-sky-500/40 bg-sky-50 dark:bg-sky-950/40 scale-110 shadow-sky-500/20 dark:shadow-sky-500/10 node-pulse-slow';
    if (data.isVisited) return 'border-indigo-400 ring-2 ring-indigo-400/25 bg-indigo-50/50 dark:bg-indigo-950/20';
    if (data.isQueue) return 'border-amber-400 border-dashed bg-amber-50/20';
    return 'border-slate-200 dark:border-dark-700/80 bg-white/95 dark:bg-dark-850/95';
  }, [data.isPath, data.isActive, data.isVisited, data.isQueue]);

  return (
    <motion.div
      initial={{ scale: 0.3, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.12 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className="flex flex-col items-center select-none relative cursor-pointer"
    >
      {/* Ripple ring for active algorithm node */}
      {data.isActive && (
        <div className="absolute top-0 w-10 h-10 bg-sky-500/20 rounded-full node-ripple -z-10" />
      )}
      
      {/* Badge indicator on top right */}
      {data.isPath && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 z-20">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 text-[8px] text-white font-extrabold items-center justify-center shadow">★</span>
        </span>
      )}
      
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-md transition-all duration-300 ${stateClass} ${
          selected ? 'border-brand-500 ring-4 ring-brand-500/25 scale-105' : ''
        }`}
      >
        {icon}
      </div>
      <div className="mt-1.5 px-2.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-widest bg-slate-900/90 text-slate-100 dark:bg-dark-900/95 dark:text-slate-200 border border-slate-700/40 shadow-md max-w-[120px] truncate">
        {data.label}
      </div>
    </motion.div>
  );
};

export const GraphWorkspace: React.FC = () => {
  const dispatch = useAppDispatch();
  const { nodes: wsNodes, edges: wsEdges, activeCityId, selectedNodeId } = useAppSelector((state) => state.workspace);
  const {
    isRunning,
    steps,
    currentStepIndex,
    path: finalPath,
    startNode,
    endNode,
  } = useAppSelector((state) => state.simulator);

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);

  const nodeTypes = useMemo(() => ({ cityNode: CustomNodeComponent }), []);

  // Sync workspace nodes/edges with React Flow states
  useEffect(() => {
    // Determine algorithm execution highlights
    const activeStep = isRunning && steps[currentStepIndex] ? steps[currentStepIndex] : null;
    const visitedSet = new Set<string>();
    const queueSet = new Set<string>();
    let activeNodeId = '';
    let activeEdgeSrc = '';
    let activeEdgeDest = '';

    if (activeStep) {
      if (activeStep.type === 'visit_node') {
        activeNodeId = activeStep.nodeId;
      } else if (activeStep.type === 'examine_edge' || activeStep.type === 'update_distance' || activeStep.type === 'relax_edge' || activeStep.type === 'mst_add' || activeStep.type === 'flow_update') {
        activeNodeId = activeStep.nodeId;
        activeEdgeSrc = activeStep.sourceId;
        activeEdgeDest = activeStep.targetId;
      }
      activeStep.visited.forEach((id) => visitedSet.add(id));
      activeStep.queueState.forEach((id) => queueSet.add(id));
    }

    const pathSet = new Set(finalPath);

    // Map workspace nodes to React Flow nodes
    const mappedNodes: Node[] = wsNodes.map((n) => {
      const pos = latLngToXY(n.latitude, n.longitude);
      const isPath = pathSet.has(n.id);
      const isActive = activeNodeId === n.id;
      const isVisited = visitedSet.has(n.id);
      const isQueue = queueSet.has(n.id);

      return {
        id: n.id,
        type: 'cityNode',
        position: pos,
        data: {
          label: n.name,
          type: n.type,
          isPath,
          isActive,
          isVisited,
          isQueue,
        },
      };
    });

    // Map workspace edges to React Flow edges
    const mappedEdges: Edge[] = wsEdges.map((e) => {
      const isPath = pathSet.has(e.source) && pathSet.has(e.destination);
      // Determine if this edge is active in current step
      const isActive = (activeEdgeSrc === e.source && activeEdgeDest === e.destination) ||
                       (activeEdgeSrc === e.destination && activeEdgeDest === e.source);

      let edgeColor = '#94a3b8'; // Slate-400
      let edgeWidth = 1.5;
      let animated = false;

      if (isPath) {
        edgeColor = '#10b981'; // Emerald-500
        edgeWidth = 3;
        animated = true;
      } else if (isActive) {
        edgeColor = '#0ea5e9'; // Sky-500
        edgeWidth = 3;
        animated = true;
      } else if (visitedSet.has(e.source) && visitedSet.has(e.destination)) {
        edgeColor = '#818cf8'; // Indigo-400
        edgeWidth = 2;
      }

      return {
        id: `${e.source}-${e.destination}-${e.type}`,
        source: e.source,
        target: e.destination,
        label: `${e.weight.toFixed(1)}m`,
        type: 'straight',
        animated,
        style: {
          stroke: edgeColor,
          strokeWidth: edgeWidth,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
          width: 10,
          height: 10,
        },
      };
    });

    setRfNodes(mappedNodes);
    setRfEdges(mappedEdges);
  }, [wsNodes, wsEdges, isRunning, steps, currentStepIndex, finalPath, setRfNodes, setRfEdges]);

  // Handle node drag stop: Update GPS coordinate in DB
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (!activeCityId) return;
      const originalNode = wsNodes.find((n) => n.id === node.id);
      if (!originalNode) return;

      const { lat, lng } = xyToLatLng(node.position.x, node.position.y);
      dispatch(
        addNodeDb({
          cityId: activeCityId,
          node: {
            ...originalNode,
            latitude: lat,
            longitude: lng,
          },
        })
      );
    },
    [activeCityId, wsNodes, dispatch]
  );

  // Handle drawing connections to create new edges
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!activeCityId || !connection.source || !connection.target) return;

      const srcNode = wsNodes.find((n) => n.id === connection.source);
      const destNode = wsNodes.find((n) => n.id === connection.target);

      if (!srcNode || !destNode) return;

      // Automatically calculate weight as the physical distance in meters (approx)
      const dist = distanceHeuristic(srcNode, destNode);

      dispatch(
        addEdgeDb({
          cityId: activeCityId,
          edge: {
            id: '',
            source: connection.source,
            destination: connection.target,
            weight: dist,
            type: 'road', // Default type
          },
        })
      );
    },
    [activeCityId, wsNodes, dispatch]
  );

  // Custom function for A* heuristic
  const distanceHeuristic = (n1: any, n2: any) => {
    const dx = n1.latitude - n2.latitude;
    const dy = n1.longitude - n2.longitude;
    return Math.sqrt(dx * dx + dy * dy) * 111000;
  };

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      dispatch(selectNode(node.id));
      dispatch(selectEdge(null));

      // Quick hotkeys: Set start/end node for simulator on node selection
      if (!startNode) {
        dispatch(setStartNode(node.id));
      } else if (startNode && !endNode && startNode !== node.id) {
        dispatch(setEndNode(node.id));
      }
    },
    [dispatch, startNode, endNode]
  );

  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      dispatch(selectEdge(edge.id));
      dispatch(selectNode(null));
    },
    [dispatch]
  );

  const onPaneClick = useCallback(() => {
    dispatch(selectNode(null));
    dispatch(selectEdge(null));
  }, [dispatch]);

  // Handle Delete key to remove elements
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Prevent deleting if user is typing in input boxes
        if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

        if (activeCityId && selectedNodeId) {
          dispatch(deleteNodeDb({ cityId: activeCityId, nodeId: selectedNodeId }));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCityId, selectedNodeId, dispatch]);

  return (
    <div className="w-full h-full relative bg-slate-50 dark:bg-dark-950">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        fitView
      >
        <Background gap={24} size={1} color="#38bdf8" className="opacity-30 dark:opacity-[0.06]" />
        <Controls position="top-right" className="!top-4 !right-4 bg-white/70 dark:bg-dark-900/40 border border-slate-200/40 dark:border-white/5 text-slate-800 dark:text-slate-100 rounded-xl shadow-xl backdrop-blur-md" />
        <MiniMap
          position="bottom-right"
          nodeColor={(node) => {
            if (node.data?.isPath) return '#10b981';
            if (node.data?.isActive) return '#0ea5e9';
            if (node.data?.isVisited) return '#818cf8';
            return '#cbd5e1';
          }}
          maskColor="rgba(0, 0, 0, 0.2)"
          className="glass-panel border-slate-200/40 dark:border-white/5 !bottom-28 !right-4 rounded-2xl shadow-xl"
        />
      </ReactFlow>
    </div>
  );
};
