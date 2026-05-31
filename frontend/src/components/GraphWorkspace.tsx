import React, { useCallback, useMemo, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
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
import { Zap, Droplet, Activity, MapPin, Train, Cpu } from 'lucide-react';
import AnimatedFlowEdge from './AnimatedFlowEdge';
import { motion, AnimatePresence } from 'framer-motion';
import { CanvasLegend } from './CanvasLegend';
import { playTechBlip, playSuccessChime } from '../utils/audio';

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
const CustomNodeComponent = ({ data, selected }: { data: { label: string, type: string, isPath: boolean, isActive: boolean, isVisited: boolean, isQueue: boolean }; selected: boolean }) => {
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
      <Handle type="target" position={Position.Top} className="w-1 h-1 opacity-0" />
      <Handle type="source" position={Position.Bottom} className="w-1 h-1 opacity-0" />
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
    isComputing,
    algorithm,
  } = useAppSelector((state) => state.simulator);

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);

  const nodeTypes = useMemo(() => ({ cityNode: CustomNodeComponent }), []);
  const edgeTypes = useMemo(() => ({ animatedPath: AnimatedFlowEdge }), []);

  const activeStep = isRunning && steps[currentStepIndex] ? steps[currentStepIndex] : null;
  const activeEdgeSrc = activeStep && (activeStep.type === 'examine_edge' || activeStep.type === 'update_distance' || activeStep.type === 'relax_edge' || activeStep.type === 'mst_add' || activeStep.type === 'flow_update') ? activeStep.sourceId : '';
  const activeEdgeDest = activeStep && (activeStep.type === 'examine_edge' || activeStep.type === 'update_distance' || activeStep.type === 'relax_edge' || activeStep.type === 'mst_add' || activeStep.type === 'flow_update') ? activeStep.targetId : '';

  // Sync sound effect with step progression
  const prevStepRef = useRef(currentStepIndex);
  useEffect(() => {
    if (currentStepIndex !== prevStepRef.current) {
      if (activeEdgeSrc && activeEdgeDest) {
        playTechBlip();
      }
      prevStepRef.current = currentStepIndex;
    }
  }, [currentStepIndex, activeEdgeSrc, activeEdgeDest]);

  // Sync success sound when final path is found
  const prevPathLengthRef = useRef(0);
  useEffect(() => {
    if (finalPath.length > 0 && prevPathLengthRef.current === 0) {
      playSuccessChime();
    }
    prevPathLengthRef.current = finalPath.length;
  }, [finalPath.length]);

  // Sync workspace nodes/edges with React Flow states
  useEffect(() => {
    // Determine algorithm execution highlights
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
      
      // Determine traversal direction for the animation. If it's part of the final path, use the path's direction.
      let isReversed: boolean;
      if (isPath) {
        const sourceIdx = finalPath.indexOf(e.source);
        const destIdx = finalPath.indexOf(e.destination);
        isReversed = sourceIdx > destIdx;
      } else {
        isReversed = activeEdgeSrc === e.destination && activeEdgeDest === e.source;
      }

      let edgeColor = '#94a3b8'; // Slate-400
      let edgeWidth = 1.5;
      let animated = false;

      let className = '';
      if (isPath) {
        edgeColor = '#10b981'; // Emerald-500
        edgeWidth = 3;
        animated = true;
        className = 'animate-edge-path';
      } else if (isActive) {
        edgeColor = '#3b82f6'; // Blue-500
        edgeWidth = 3;
        animated = true;
        className = 'animate-edge-active';
      } else if (visitedSet.has(e.source) && visitedSet.has(e.destination)) {
        edgeColor = '#818cf8'; // Indigo-400
        edgeWidth = 2;
      }

      return {
        id: `${e.source}-${e.destination}-${e.type}`,
        source: e.source,
        target: e.destination,
        label: `${e.weight.toFixed(1)}m`,
        type: 'animatedPath',
        data: { isActive, isReversed, isPath },
        animated,
        className,
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
  }, [wsNodes, wsEdges, isRunning, steps, currentStepIndex, finalPath, setRfNodes, setRfEdges, activeStep]);

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

  // Custom function for A* heuristic
  const distanceHeuristic = (n1: { latitude: number; longitude: number }, n2: { latitude: number; longitude: number }) => {
    const dx = n1.latitude - n2.latitude;
    const dy = n1.longitude - n2.longitude;
    return Math.sqrt(dx * dx + dy * dy) * 111000;
  };

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

  const isFlowPanelOpen = isRunning && steps.length > 0;

  return (
    <div className="w-full h-full relative bg-slate-50 dark:bg-dark-950">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
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
        <Controls
          position="top-right"
          className={`!top-4 transition-all duration-300 ${
            isFlowPanelOpen ? '!right-[416px]' : '!right-4'
          } bg-white/70 dark:bg-dark-900/40 border border-slate-200/40 dark:border-white/5 text-slate-800 dark:text-slate-100 rounded-xl shadow-xl backdrop-blur-md`}
        />
        <MiniMap
          position="bottom-right"
          nodeColor={(node) => {
            if (node.data?.isPath) return '#10b981';
            if (node.data?.isActive) return '#0ea5e9';
            if (node.data?.isVisited) return '#818cf8';
            return '#cbd5e1';
          }}
          maskColor="rgba(0, 0, 0, 0.2)"
          className={`glass-panel border-slate-200/40 dark:border-white/5 !bottom-28 transition-all duration-300 ${
            isFlowPanelOpen ? '!right-[416px]' : '!right-4'
          } rounded-2xl shadow-xl`}
        />
      </ReactFlow>
      <CanvasLegend />

      {/* Professional Computing Scanner HUD (non-obstructive) */}
      <AnimatePresence>
        {isComputing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex flex-col items-center pointer-events-none select-none"
          >
            {/* Elegant Scanner Sweep Line moving across the graph */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent shadow-[0_0_20px_rgba(59,130,246,1)] animate-scan" />

            {/* Floating Top Pill HUD */}
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 24, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="clay-panel px-6 py-3 flex items-center gap-4"
            >
              {/* Spinning processor indicator */}
              <div className="relative w-6 h-6 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin" />
                <Cpu className="w-3.5 h-3.5 text-brand-500" />
              </div>

              <div className="flex flex-col">
                <h3 className="text-[11px] font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping" /> C++ Compute Engine Active
                </h3>
                <p className="text-[9px] font-medium text-slate-500">
                  Executing {algorithm.toUpperCase()} algorithm...
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
