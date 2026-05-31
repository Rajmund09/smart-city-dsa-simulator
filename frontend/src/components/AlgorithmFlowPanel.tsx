import React, { useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../store/store';
import { nextStep, prevStep, pauseSimulation, resumeSimulation, resetSimulation } from '../store/simulatorSlice';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Cpu,
  HelpCircle,
  Code,
  Activity,
  Layers,
  MapPin,
  Clock,
  Compass,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const AlgorithmFlowPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const workspace = useAppSelector((state) => state.workspace);
  const simulator = useAppSelector((state) => state.simulator);

  const {
    isRunning,
    isPaused,
    steps,
    currentStepIndex,
    algorithm,
    executionTimeMs,
    memoryUsageBytes,
    timeComplexity,
    spaceComplexity,
  } = simulator;

  // Get active step details
  const activeStep = steps[currentStepIndex];

  // Detailed smart city narrative for current step
  const stepNarrative = useMemo(() => {
    if (!activeStep) return 'Simulation is not running.';

    const getNodeName = (id: string) => {
      const node = workspace.nodes.find((n) => n.id === id);
      return node ? node.name : id;
    };

    const { type, nodeId, sourceId, targetId, value } = activeStep;
    const name = getNodeName(nodeId);
    const srcName = getNodeName(sourceId);
    const destName = getNodeName(targetId);

    switch (type) {
      case 'visit_node':
        return `Processing Node "${name}" (ID: ${nodeId}). The engine popped this intersection from the queue with an accumulated path cost of ${value.toFixed(1)}m. Now expanding neighbors.`;
      case 'examine_edge':
        return `Inspecting connection: "${srcName}" → "${destName}". Computing weight delta of ${value.toFixed(1)}m based on physical GPS coordinates.`;
      case 'update_distance':
        return `Path update: Found shorter candidate route to "${name}" via "${srcName}". Updating its current estimated distance to ${value.toFixed(1)}m.`;
      case 'relax_edge':
        return `Relaxing connection: "${srcName}" → "${destName}". Re-routing estimated distance to "${destName}" down to ${value.toFixed(1)}m via "${srcName}".`;
      case 'mst_add':
        return `Adding grid backbone link: "${srcName}" — "${destName}" (weight: ${value.toFixed(1)}m) to the Minimum Spanning Tree network.`;
      case 'flow_update':
        return `Augmenting pipeline path: Route "${srcName}" → "${destName}" residual capacity adjusted to ${value.toFixed(1)}.`;
      case 'color_node':
        return `Bipartite classification: Classified node "${name}" (ID: ${nodeId}) into infrastructure group ${value === 1 ? 'A (Power Stations)' : 'B (Substations)'}.`;
      default:
        return `Processing traversal step. Node ID: ${nodeId}. Accumulated weight: ${value.toFixed(1)}.`;
    }
  }, [activeStep, workspace.nodes]);

  // Queue visualizer titles
  const queueTitle = useMemo(() => {
    if (['bfs', 'lee'].includes(algorithm)) return 'FIFO Queue Status';
    if (['dfs', 'scc'].includes(algorithm)) return 'Active Call Stack';
    if (['dijkstra', 'astar', 'prim'].includes(algorithm)) return 'Min-Priority Queue (Heap)';
    return 'Exploration Fringe';
  }, [algorithm]);

  // Smart City Infrastructure Context Details
  const cityContext = useMemo(() => {
    switch (algorithm) {
      case 'bfs':
        return {
          title: 'Evacuation Reachability Grid',
          desc: 'BFS processes intersections layer-by-layer. This is ideal for estimating evacuation rings during floods or zoning rescue zones around emergency centers.',
        };
      case 'dfs':
        return {
          title: 'Isolated Network Scan',
          desc: 'DFS drills deep down street lines before backtracking. It is used to discover grid dead-ends or inspect nested pipeline loops.',
        };
      case 'dijkstra':
        return {
          title: 'GPS Dispatch Router',
          desc: 'Dijkstra computes mathematically exact shortest routes. Essential for ambulance route dispatching around traffic delays.',
        };
      case 'astar':
        return {
          title: 'Intelligent Transit Planner',
          desc: 'A* uses spatial Euclidean heuristics (directed search) to speed up response routing, ignoring sections facing away from the target.',
        };
      case 'bellmanford':
        return {
          title: 'Pressure Loop Flow Optimization',
          desc: 'Bellman-Ford checks all links, handling routing loops. Used for detecting pressure losses or negative cost factors in pipelines.',
        };
      case 'floydwarshall':
        return {
          title: 'All-to-All Traffic Matrix',
          desc: 'Floyd-Warshall pre-computes distances between all intersection pairs in the city. Vital for planning subway routing matrices.',
        };
      case 'prim':
        return {
          title: 'Utility Grid Layout',
          desc: 'Prim’s builds an MST starting from a central node. Ideal for laying local power grid wires or water distribution networks at minimum cost.',
        };
      case 'kruskal':
        return {
          title: 'Backbone Link Cable Network',
          desc: 'Kruskal’s sorts all weights globally to connect separate sectors. Standard for building the regional fiber optic internet backbone.',
        };
      case 'topological':
        return {
          title: 'Construction Dependency Scheduling',
          desc: 'Topological sort sequences directed task networks. Ensures sewer pipes are laid before concrete is poured, avoiding deadlocks.',
        };
      case 'scc':
        return {
          title: 'Grid Redundancy Rings',
          desc: 'Tarjan’s groups strongly connected nodes. In smart grids, these denote loops where nodes can fail without isolating electrical sectors.',
        };
      case 'maxflow':
        return {
          title: 'Water Pipe Congestion Peak',
          desc: 'Edmonds-Karp computes peak utility flow capacities. Models bottleneck analysis in storm sewer networks during cloudbursts.',
        };
      default:
        return {
          title: 'Metaheuristic Network Optimizer',
          desc: 'Ant Colony / Genetic optimizers search massive layout graphs to solve Traveling Salesperson constraints, reducing logistics costs.',
        };
    }
  }, [algorithm]);

  // Algorithm Pseudocode Blocks
  const pseudocode = useMemo(() => {
    switch (algorithm) {
      case 'dijkstra':
        return [
          '1. Initialize distances[V] = ∞, distances[start] = 0',
          '2. priority_queue.push(0, start)',
          '3. while PQ is not empty:',
          '4.   u = PQ.pop_minimum()',
          '5.   for each adjacent neighbor v of u:',
          '6.     newDist = distances[u] + weight(u, v)',
          '7.     if newDist < distances[v]:',
          '8.       distances[v] = newDist, parent[v] = u',
          '9.       PQ.pushOrUpdate(newDist, v)',
        ];
      case 'astar':
        return [
          '1. gScore[V] = ∞, gScore[start] = 0',
          '2. fScore[start] = gScore[start] + heuristic(start, end)',
          '3. openSet.push(start, fScore[start])',
          '4. while openSet is not empty:',
          '5.   u = openSet.pop_minimum_fScore()',
          '6.   for each adjacent neighbor v of u:',
          '7.     temp_gScore = gScore[u] + weight(u, v)',
          '8.     if temp_gScore < gScore[v]:',
          '9.       gScore[v] = temp_gScore',
          '10.      fScore[v] = temp_gScore + heuristic(v, end)',
          '11.      openSet.pushOrUpdate(v, fScore[v])',
        ];
      case 'bfs':
        return [
          '1. queue.push(start), visited.add(start)',
          '2. while queue is not empty:',
          '3.   u = queue.pop_front()',
          '4.   for each adjacent neighbor v of u:',
          '5.     if v is not visited:',
          '6.       visited.add(v), queue.push(v)',
        ];
      case 'dfs':
        return [
          '1. DFS_recurse(u): visited.add(u)',
          '2.   for each adjacent neighbor v of u:',
          '3.     if v is not visited:',
          '4.       stack.push(v)',
          '5.       DFS_recurse(v)',
          '6.       stack.pop()',
        ];
      case 'prim':
        return [
          '1. visited.add(start), PQ.push(edges of start)',
          '2. while PQ is not empty and |MST| < V - 1:',
          '3.   edge(u, v, wt) = PQ.pop_minimum()',
          '4.   if v is not visited:',
          '5.     add edge(u, v) to MST, visited.add(v)',
          '6.     for each neighbor w of v:',
          '7.       if w is not visited: PQ.push(edge(v, w, wt))',
        ];
      case 'kruskal':
        return [
          '1. Sort all edges globally by weight ascending',
          '2. Initialize Disjoint Set Union (DSU) sets',
          '3. for each edge(u, v) in sorted list:',
          '4.   if find_root(u) != find_root(v):',
          '5.     add edge(u, v) to MST',
          '6.     union_sets(u, v)',
        ];
      case 'maxflow':
        return [
          '1. Initialize flow = 0 on all edges',
          '2. while BFS finds augmenting path in residual graph:',
          '3.   bottleNeck = min(residual capacities along path)',
          '4.   for each edge(u, v) in augmenting path:',
          '5.     update_residual_capacities(u, v, bottleNeck)',
          '6.   flow += bottleNeck',
        ];
      default:
        return [
          '1. Initialize traversal structures',
          '2. while exploration space is not empty:',
          '3.   pop candidate node u',
          '4.   evaluate cost/capacity constraints',
          '5.   relax connections or add to trace path',
          '6.   push updated nodes to queue',
        ];
    }
  }, [algorithm]);

  // Map step type to highlighted line indices of pseudocode (0-indexed)
  const highlightedLines = useMemo(() => {
    if (!activeStep) return [];
    const type = activeStep.type;

    if (algorithm === 'dijkstra') {
      if (type === 'visit_node') return [2, 3];
      if (type === 'examine_edge') return [4, 5];
      if (type === 'update_distance') return [6, 7, 8];
    }
    if (algorithm === 'astar') {
      if (type === 'visit_node') return [3, 4];
      if (type === 'examine_edge') return [5, 6];
      if (type === 'update_distance') return [7, 8, 9, 10];
    }
    if (algorithm === 'bfs') {
      if (type === 'visit_node') return [1, 2];
      if (type === 'examine_edge') return [3];
      if (type === 'update_distance') return [4, 5];
    }
    if (algorithm === 'dfs') {
      if (type === 'visit_node') return [0];
      if (type === 'examine_edge') return [1, 2];
      if (type === 'update_distance') return [3, 4];
    }
    if (algorithm === 'prim') {
      if (type === 'visit_node') return [0];
      if (type === 'examine_edge') return [1, 2, 3];
      if (type === 'mst_add') return [4, 5, 6];
    }
    if (algorithm === 'kruskal') {
      if (type === 'visit_node') return [0, 1];
      if (type === 'examine_edge') return [2, 3];
      if (type === 'mst_add') return [4, 5];
    }
    if (algorithm === 'maxflow') {
      if (type === 'visit_node') return [1];
      if (type === 'flow_update') return [2, 3, 4, 5];
    }
    return [];
  }, [activeStep, algorithm]);

  if (!isRunning || steps.length === 0) return null;

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      className="fixed right-4 top-4 bottom-4 w-[380px] flex flex-col z-20 clay-panel overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-500" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-200">
            Execution Flow Card
          </h3>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
          Running
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 Scrollbar">
        {/* Step Info Narrative */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-brand-500" /> Current Step Detail
          </label>
          <div className="clay-inset p-4">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
              {stepNarrative}
            </p>
          </div>
        </div>

        {/* Dynamic Pseudocode Visualizer */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Code className="w-3.5 h-3.5 text-brand-500" /> Trace Pseudocode
          </label>
          <div className="clay-inset p-3 font-mono text-[9px] text-slate-600 dark:text-slate-300 leading-normal relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 to-transparent pointer-events-none" />
            <div className="space-y-1 relative z-10">
              {pseudocode.map((line, idx) => {
                const isHighlighted = highlightedLines.includes(idx);
                return (
                  <div
                    key={idx}
                    className={`py-0.5 px-2 rounded transition-colors duration-150 ${
                      isHighlighted
                        ? 'bg-brand-500/20 text-brand-400 border-l-2 border-brand-500 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    {line}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Fringe / Priority Queue Visualizer */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-brand-500" /> {queueTitle}
          </label>
          <div className="clay-inset p-3.5">
            {activeStep && activeStep.queueState && activeStep.queueState.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {activeStep.queueState.map((qId, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700/80 text-[8px] font-black text-slate-700 dark:text-slate-300 shadow-sm"
                  >
                    <MapPin className="w-2.5 h-2.5 text-brand-500" />
                    <span>{qId}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 italic text-center py-2">
                Queue structure is empty
              </div>
            )}
          </div>
        </div>

        {/* C++ Execution Insights Section */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-brand-500" /> C++ Optimization Insights
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="clay-inset p-3 flex flex-col justify-center">
              <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <Clock className="w-3 h-3 text-brand-500" /> Core Speed
              </div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-wide mt-1.5">
                {executionTimeMs.toFixed(4)} ms
              </div>
              <div className="text-[9px] font-medium text-slate-400 mt-1 uppercase tracking-widest">
                ~25x faster than JS
              </div>
            </div>

            <div className="clay-inset p-3 flex flex-col justify-center">
              <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <Activity className="w-3 h-3 text-brand-500" /> RAM Peak (RSS)
              </div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-wide mt-1.5">
                {memoryUsageBytes > 0 ? `${(memoryUsageBytes / 1024).toFixed(1)} KB` : 'Dynamic'}
              </div>
              <div className="text-[9px] font-medium text-slate-400 mt-1 uppercase tracking-widest">
                Optimized C++ Struct
              </div>
            </div>
          </div>

          <div className="bg-slate-50/75 dark:bg-dark-950/40 border border-slate-200/50 dark:border-dark-700/50 rounded-2xl p-3.5 space-y-2 text-[9px]">
            <div className="flex justify-between font-bold">
              <span className="text-slate-400 dark:text-slate-500">Complexity</span>
              <span className="text-slate-700 dark:text-slate-200">
                Time: {timeComplexity} | Space: {spaceComplexity}
              </span>
            </div>
            <div className="w-full h-[1px] bg-slate-200/50 dark:bg-dark-800/40" />
            <div className="flex justify-between font-bold">
              <span className="text-slate-400 dark:text-slate-500">Search space efficiency</span>
              <span className="text-emerald-500 dark:text-emerald-400">
                {activeStep && activeStep.visited
                  ? `${((activeStep.visited.length / Math.max(workspace.nodes.length, 1)) * 100).toFixed(0)}%`
                  : 'N/A'}{' '}
                visited
              </span>
            </div>
          </div>
        </div>

        {/* Smart City Urban Context */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-brand-500" /> Municipal Use-Case
          </label>
          <div className="clay-inset border border-brand-500/20 p-4">
            <h4 className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-1.5">
              {cityContext.title}
            </h4>
            <p className="text-[10px] font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              {cityContext.desc}
            </p>
          </div>
        </div>
      </div>

      {/* Floating control bar in the flow card */}
      <div className="p-3.5 border-t border-slate-200/80 dark:border-dark-700/60 bg-white/40 dark:bg-dark-900/40 flex items-center justify-between gap-2.5">
        <button
          onClick={() => dispatch(prevStep())}
          disabled={currentStepIndex === 0}
          className="p-2 rounded-xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 cursor-pointer flex items-center justify-center hover:bg-slate-50"
          title="Previous Step"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>

        {isRunning && !isPaused ? (
          <button
            onClick={() => dispatch(pauseSimulation())}
            className="flex-1 py-2 rounded-xl bg-amber-500 text-white text-[10px] font-extrabold uppercase tracking-wider hover:bg-amber-600 cursor-pointer flex items-center justify-center gap-1 shadow-sm"
          >
            <Pause className="w-3.5 h-3.5 fill-white" /> Pause
          </button>
        ) : (
          <button
            onClick={() => {
              if (currentStepIndex === steps.length - 1) {
                dispatch(resetSimulation());
              } else {
                dispatch(resumeSimulation());
              }
            }}
            className="flex-1 py-2 rounded-xl bg-brand-500 text-white text-[10px] font-extrabold uppercase tracking-wider hover:bg-brand-600 cursor-pointer flex items-center justify-center gap-1 shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-white" /> Play Trace
          </button>
        )}

        <button
          onClick={() => dispatch(nextStep())}
          disabled={currentStepIndex === steps.length - 1}
          className="p-2 rounded-xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 cursor-pointer flex items-center justify-center hover:bg-slate-50"
          title="Next Step"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
};
