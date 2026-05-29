import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../store/store';
import {
  fetchCities,
  initializeCity,
  fetchCityData,
  addNodeDb,
  addEdgeDb,
  deleteNodeDb,
  deleteEdgeDb,
} from '../store/workspaceSlice';
import {
  setAlgorithm,
  setStartNode,
  setEndNode,
  setSpeed,
  runAlgorithmDb,
  pauseSimulation,
  resumeSimulation,
  nextStep,
  prevStep,
  resetSimulation,
} from '../store/simulatorSlice';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Plus,
  Trash,
  Download,
  Upload,
  Layers,
  ChevronDown,
  Database,
  Sliders,
  Terminal as TermIcon,
  Link,
  Share2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ControlPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const workspace = useAppSelector((state) => state.workspace);
  const simulator = useAppSelector((state) => state.simulator);

  const [newCityName, setNewCityName] = useState('');
  const [nodeId, setNodeId] = useState('');
  const [nodeName, setNodeName] = useState('');
  const [nodeType, setNodeType] = useState('intersection');
  const [nodeLat, setNodeLat] = useState('40.7128');
  const [nodeLng, setNodeLng] = useState('-74.0060');

  const [edgeSource, setEdgeSource] = useState('');
  const [edgeDest, setEdgeDest] = useState('');
  const [edgeWeight, setEdgeWeight] = useState('50.0');
  const [edgeType, setEdgeType] = useState('road');

  // Accordion active tab
  const [activeAccordion, setActiveAccordion] = useState<'algo' | 'node' | 'edge' | 'io'>('algo');

  const terminalRef = useRef<HTMLDivElement>(null);
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load cities on mount
  useEffect(() => {
    dispatch(fetchCities());
  }, [dispatch]);

  // Load city details when active ID changes
  useEffect(() => {
    if (workspace.activeCityId) {
      dispatch(fetchCityData(workspace.activeCityId));
    }
  }, [workspace.activeCityId, dispatch]);

  // Handle auto scrolling terminal logs without moving the main page
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [simulator.logs, simulator.currentStepIndex]);

  // Simulator playback logic loop
  useEffect(() => {
    if (simulator.isRunning && !simulator.isPaused) {
      playTimerRef.current = setInterval(() => {
        dispatch(nextStep());
      }, simulator.speed);
    } else {
      if (playTimerRef.current) {
        clearInterval(playTimerRef.current);
        playTimerRef.current = null;
      }
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [simulator.isRunning, simulator.isPaused, simulator.speed, dispatch]);

  const handleCreateCity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCityName.trim()) return;
    dispatch(initializeCity(newCityName.trim())).then(() => {
      dispatch(fetchCities());
      setNewCityName('');
    });
  };

  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace.activeCityId || !nodeId.trim() || !nodeName.trim()) return;

    dispatch(
      addNodeDb({
        cityId: workspace.activeCityId,
        node: {
          id: nodeId.trim(),
          name: nodeName.trim(),
          latitude: parseFloat(nodeLat),
          longitude: parseFloat(nodeLng),
          type: nodeType,
        },
      })
    ).then(() => {
      setNodeId('');
      setNodeName('');
    });
  };

  const handleAddEdge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace.activeCityId || !edgeSource || !edgeDest) return;

    dispatch(
      addEdgeDb({
        cityId: workspace.activeCityId,
        edge: {
          id: '',
          source: edgeSource,
          destination: edgeDest,
          weight: parseFloat(edgeWeight),
          type: edgeType,
        },
      })
    ).then(() => {
      setEdgeSource('');
      setEdgeDest('');
    });
  };

  const handleDeleteSelected = () => {
    if (!workspace.activeCityId) return;
    if (workspace.selectedNodeId) {
      dispatch(deleteNodeDb({ cityId: workspace.activeCityId, nodeId: workspace.selectedNodeId }));
    } else if (workspace.selectedEdgeId) {
      const parts = workspace.selectedEdgeId.split('-');
      if (parts.length >= 3) {
        dispatch(
          deleteEdgeDb({
            cityId: workspace.activeCityId,
            source: parts[0],
            destination: parts[1],
            type: parts[2],
          })
        );
      }
    }
  };

  const handleRunAlgorithm = () => {
    if (!workspace.activeCityId) return;

    const needsStart = ['bfs', 'dfs', 'dijkstra', 'astar', 'bellmanford', 'floydwarshall', 'lee', 'prim', 'aco', 'genetic', 'sa', 'maxflow'].includes(simulator.algorithm);
    const needsEnd = ['dijkstra', 'astar', 'bellmanford', 'floydwarshall', 'lee', 'aco', 'genetic', 'sa', 'maxflow'].includes(simulator.algorithm);

    if (needsStart && !simulator.startNode) {
      alert('Please select a starting node on the graph (or in control panel).');
      return;
    }
    if (needsEnd && !simulator.endNode) {
      alert('Please select a destination node on the graph.');
      return;
    }

    dispatch(
      runAlgorithmDb({
        algorithm: simulator.algorithm,
        cityId: workspace.activeCityId,
        start: needsStart ? simulator.startNode : undefined,
        end: needsEnd ? simulator.endNode : undefined,
      })
    );
  };

  const handleExportJSON = () => {
    if (!workspace.activeCityId) return;
    fetch(`/api/export/json?cityId=${workspace.activeCityId}`, { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${workspace.activeCityName || 'city'}_graph.json`;
        link.click();
      });
  };

  const handleExportCSV = () => {
    if (!workspace.activeCityId) return;
    fetch(`/api/export/csv?cityId=${workspace.activeCityId}`, { method: 'POST' })
      .then((res) => res.text())
      .then((data) => {
        const blob = new Blob([data], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${workspace.activeCityName || 'city'}_graph.csv`;
        link.click();
      });
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!workspace.activeCityId || !e.target.files?.length) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.nodes && parsed.edges) {
          for (const node of parsed.nodes) {
            await dispatch(addNodeDb({ cityId: workspace.activeCityId!, node }));
          }
          for (const edge of parsed.edges) {
            await dispatch(addEdgeDb({ cityId: workspace.activeCityId!, edge }));
          }
          dispatch(fetchCityData(workspace.activeCityId!));
          alert('City graph imported successfully.');
        }
      } catch (err) {
        alert('Failed to parse graph JSON.');
      }
    };
    reader.readAsText(file);
  };

  // Helper to toggle accordion
  const toggleAccordion = (panel: 'algo' | 'node' | 'edge' | 'io') => {
    setActiveAccordion(activeAccordion === panel ? 'algo' : panel);
  };

  return (
    <div className="fixed left-4 top-4 bottom-4 w-80 flex flex-col z-20 clay-panel overflow-hidden">
      
      {/* City selector header */}
      <div className="p-4 border-b border-slate-200/5 dark:border-dark-700/30 flex flex-col gap-2.5 clay-inset m-2 bg-transparent">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <Database className="w-4 h-4 text-brand-500" /> Workspace City
        </label>
        
        <div className="flex gap-2">
          <select
            className="flex-1 text-xs bg-slate-50/50 dark:bg-dark-800/45 border border-slate-200 dark:border-dark-700/80 rounded-xl p-2.5 font-semibold focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
            value={workspace.activeCityId || ''}
            onChange={(e) => e.target.value && dispatch(fetchCityData(parseInt(e.target.value)))}
          >
            <option value="" disabled>Select City Graph...</option>
            {workspace.cities.map((city) => (
              <option key={city.id} value={city.id}>{city.name}</option>
            ))}
          </select>
        </div>

        {/* Create City inline */}
        <form onSubmit={handleCreateCity} className="flex gap-2 mt-1">
          <input
            type="text"
            placeholder="New City Name..."
            className="flex-1 text-xs bg-slate-100/50 dark:bg-dark-800/25 border border-transparent rounded-xl px-3 py-2 focus:outline-none focus:bg-white dark:focus:bg-dark-800 focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/10 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
            value={newCityName}
            onChange={(e) => setNewCityName(e.target.value)}
          />
          <button
            type="submit"
            className="clay-btn-primary px-3"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 Scrollbar">
        
        {/* If no city is selected */}
        {!workspace.activeCityId ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full flex flex-col items-center justify-center p-6 text-center space-y-5"
          >
            <div className="w-full max-w-[210px] aspect-square rounded-2xl overflow-hidden shadow-xl border border-slate-200/60 dark:border-dark-700/40 bg-slate-100/60 dark:bg-dark-850 flex items-center justify-center">
              <img
                src="/smart-city-network.png"
                alt="Smart City Network"
                className="w-full h-full object-cover dark:opacity-80"
              />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                No Active Grid
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[230px] leading-relaxed mx-auto font-medium">
                Select an existing city from the dropdown or build a new one to unlock the simulator controls.
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-3.5">
            
            {/* Accordion 1: Algorithm Runner */}
            <div className="clay-inset overflow-hidden mx-3 mb-1">
              <button
                type="button"
                onClick={() => toggleAccordion('algo')}
                className="w-full p-3.5 flex items-center justify-between text-left cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-brand-500" /> Algorithm Runner
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${activeAccordion === 'algo' ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence initial={false}>
                {activeAccordion === 'algo' && (
                  <motion.div
                    initial="collapsed"
                    animate="open"
                    exit="collapsed"
                    variants={{
                      open: { height: 'auto', opacity: 1 },
                      collapsed: { height: 0, opacity: 0 }
                    }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                  >
                    <div className="p-3.5 pt-0 space-y-3 border-t border-slate-100 dark:border-dark-800/30">
                      <div className="flex flex-col gap-1 mt-1">
                        <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Select Algorithm</label>
                        <select
                          className="clay-input py-2"
                          value={simulator.algorithm}
                          onChange={(e) => dispatch(setAlgorithm(e.target.value))}
                        >
                          <optgroup label="Traversals">
                            <option value="bfs">Breadth-First Search (BFS)</option>
                            <option value="dfs">Depth-First Search (DFS)</option>
                          </optgroup>
                          <optgroup label="Shortest Paths">
                            <option value="dijkstra">Dijkstra (Weighted)</option>
                            <option value="astar">A* Pathfinding</option>
                            <option value="bellmanford">Bellman-Ford</option>
                            <option value="floydwarshall">Floyd-Warshall</option>
                            <option value="lee">Lee Grid Pathfinding</option>
                          </optgroup>
                          <optgroup label="Minimum Spanning Trees">
                            <option value="prim">Prim's Algorithm</option>
                            <option value="kruskal">Kruskal's Algorithm</option>
                          </optgroup>
                          <optgroup label="Advanced Operations">
                            <option value="topological">Topological Sort</option>
                            <option value="scc">Strongly Connected (Tarjan)</option>
                            <option value="bipartite">Bipartite Checking</option>
                            <option value="maxflow">Max Flow (Edmonds-Karp)</option>
                          </optgroup>
                          <optgroup label="Metaheuristic Optimizers">
                            <option value="aco">Ant Colony Optimization (ACO)</option>
                            <option value="genetic">Genetic Algorithm (GA)</option>
                            <option value="sa">Simulated Annealing (SA)</option>
                          </optgroup>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Start Node</label>
                          <select
                            className="clay-input py-2"
                            value={simulator.startNode}
                            onChange={(e) => dispatch(setStartNode(e.target.value))}
                          >
                            <option value="">(Click canvas)</option>
                            {workspace.nodes.map((n) => (
                              <option key={n.id} value={n.id}>{n.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Target Node</label>
                          <select
                            className="clay-input py-2"
                            value={simulator.endNode}
                            onChange={(e) => dispatch(setEndNode(e.target.value))}
                            disabled={['kruskal', 'topological', 'scc', 'bipartite'].includes(simulator.algorithm)}
                          >
                            <option value="">(Click canvas)</option>
                            {workspace.nodes.map((n) => (
                              <option key={n.id} value={n.id}>{n.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRunAlgorithm}
                        className="w-full clay-btn-primary py-2.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" /> Compute in C++
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Animation & Speed controller */}
            {simulator.steps.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="clay-inset p-3.5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">Step {simulator.currentStepIndex + 1} / {simulator.steps.length}</label>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">{simulator.speed}ms</label>
                </div>

                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="50"
                  className="w-full h-1.5 bg-slate-200 dark:bg-dark-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                  value={simulator.speed}
                  onChange={(e) => dispatch(setSpeed(parseInt(e.target.value)))}
                />

                <div className="flex justify-between mt-1 gap-1.5">
                  <button
                    onClick={() => dispatch(prevStep())}
                    disabled={simulator.currentStepIndex === 0}
                    className="flex-1 clay-btn p-2"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                  </button>

                  {simulator.isRunning && !simulator.isPaused ? (
                    <button
                      onClick={() => dispatch(pauseSimulation())}
                      className="flex-[2] clay-btn-primary py-2"
                    >
                      <Pause className="w-3.5 h-3.5 fill-white" /> Pause
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (simulator.currentStepIndex === simulator.steps.length - 1) {
                          dispatch(resetSimulation());
                        } else {
                          dispatch(resumeSimulation());
                        }
                      }}
                      className="flex-[2] clay-btn-primary py-2"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" /> Play
                    </button>
                  )}

                  <button
                    onClick={() => dispatch(resetSimulation())}
                    className="flex-1 clay-btn p-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => dispatch(nextStep())}
                    disabled={simulator.currentStepIndex === simulator.steps.length - 1}
                    className="flex-1 clay-btn p-2"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Selection Action (Delete Node/Edge) */}
            <AnimatePresence>
              {(workspace.selectedNodeId || workspace.selectedEdgeId) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  className="bg-rose-50/50 dark:bg-rose-950/10 border border-rose-200/50 dark:border-rose-900/30 p-3.5 rounded-2xl flex items-center justify-between shadow-sm"
                >
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Trash className="w-3.5 h-3.5" /> {workspace.selectedNodeId ? `Node [${workspace.selectedNodeId}]` : 'Selected Link'}
                  </span>
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition cursor-pointer flex items-center gap-1 shadow-sm hover:scale-105 active:scale-95"
                  >
                    Remove
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Accordion 2: Create Nodes */}
            <div className="clay-inset overflow-hidden mx-3 mb-1">
              <button
                type="button"
                onClick={() => toggleAccordion('node')}
                className="w-full p-3.5 flex items-center justify-between text-left cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand-500" /> Create Stations / Nodes
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${activeAccordion === 'node' ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence initial={false}>
                {activeAccordion === 'node' && (
                  <motion.div
                    initial="collapsed"
                    animate="open"
                    exit="collapsed"
                    variants={{
                      open: { height: 'auto', opacity: 1 },
                      collapsed: { height: 0, opacity: 0 }
                    }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                  >
                    <form onSubmit={handleAddNode} className="p-3.5 pt-0 space-y-3 border-t border-slate-100 dark:border-dark-800/30 text-xs">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-extrabold text-slate-400 dark:text-slate-500">Node ID</label>
                          <input
                            type="text"
                            placeholder="e.g. N11"
                            className="clay-input"
                            value={nodeId}
                            onChange={(e) => setNodeId(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-extrabold text-slate-400 dark:text-slate-500">Name</label>
                          <input
                            type="text"
                            placeholder="e.g. City Mall"
                            className="clay-input"
                            value={nodeName}
                            onChange={(e) => setNodeName(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] uppercase font-extrabold text-slate-400 dark:text-slate-500">Type</label>
                        <select
                          className="clay-input"
                          value={nodeType}
                          onChange={(e) => setNodeType(e.target.value)}
                        >
                          <option value="intersection">Road Intersection</option>
                          <option value="power_station">Power Grid Station</option>
                          <option value="water_source">Water Substation</option>
                          <option value="hospital">Emergency Center</option>
                          <option value="station">Railway/Metro Hub</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-extrabold text-slate-400 dark:text-slate-500">Latitude</label>
                          <input
                            type="text"
                            className="clay-input"
                            value={nodeLat}
                            onChange={(e) => setNodeLat(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-extrabold text-slate-400 dark:text-slate-500">Longitude</label>
                          <input
                            type="text"
                            className="clay-input"
                            value={nodeLng}
                            onChange={(e) => setNodeLng(e.target.value)}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full clay-btn-primary py-2.5"
                      >
                        Add Node
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Accordion 3: Create Edges */}
            <div className="clay-inset overflow-hidden mx-3 mb-1">
              <button
                type="button"
                onClick={() => toggleAccordion('edge')}
                className="w-full p-3.5 flex items-center justify-between text-left cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <Link className="w-4 h-4 text-brand-500" /> Create Infrastructure Links
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${activeAccordion === 'edge' ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence initial={false}>
                {activeAccordion === 'edge' && (
                  <motion.div
                    initial="collapsed"
                    animate="open"
                    exit="collapsed"
                    variants={{
                      open: { height: 'auto', opacity: 1 },
                      collapsed: { height: 0, opacity: 0 }
                    }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                  >
                    <form onSubmit={handleAddEdge} className="p-3.5 pt-0 space-y-3 border-t border-slate-100 dark:border-dark-800/30 text-xs">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-extrabold text-slate-400 dark:text-slate-500">Source ID</label>
                          <select
                            className="clay-input"
                            value={edgeSource}
                            onChange={(e) => setEdgeSource(e.target.value)}
                          >
                            <option value="">Select...</option>
                            {workspace.nodes.map((n) => (
                              <option key={n.id} value={n.id}>{n.id} ({n.name})</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-extrabold text-slate-400 dark:text-slate-500">Dest ID</label>
                          <select
                            className="clay-input"
                            value={edgeDest}
                            onChange={(e) => setEdgeDest(e.target.value)}
                          >
                            <option value="">Select...</option>
                            {workspace.nodes.map((n) => (
                              <option key={n.id} value={n.id}>{n.id} ({n.name})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-extrabold text-slate-400 dark:text-slate-500">Weight (m)</label>
                          <input
                            type="text"
                            placeholder="e.g. 150.0"
                            className="clay-input"
                            value={edgeWeight}
                            onChange={(e) => setEdgeWeight(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] uppercase font-extrabold text-slate-400 dark:text-slate-500">Link Type</label>
                          <select
                            className="clay-input"
                            value={edgeType}
                            onChange={(e) => setEdgeType(e.target.value)}
                          >
                            <option value="road">Road link</option>
                            <option value="power_line">Power grid line</option>
                            <option value="water_pipe">Water pipe channel</option>
                            <option value="railway">Railway track</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-slate-900 dark:bg-dark-700 hover:bg-slate-800 dark:hover:bg-dark-600 text-white rounded-xl py-2.5 transition font-extrabold uppercase tracking-widest text-[10px] cursor-pointer hover:scale-102 active:scale-98 shadow-md"
                      >
                        Add Link Connection
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Accordion 4: Import / Export */}
            <div className="clay-inset overflow-hidden mx-3 mb-3">
              <button
                type="button"
                onClick={() => toggleAccordion('io')}
                className="w-full p-3.5 flex items-center justify-between text-left cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-brand-500" /> Import / Export Grid
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${activeAccordion === 'io' ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence initial={false}>
                {activeAccordion === 'io' && (
                  <motion.div
                    initial="collapsed"
                    animate="open"
                    exit="collapsed"
                    variants={{
                      open: { height: 'auto', opacity: 1 },
                      collapsed: { height: 0, opacity: 0 }
                    }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                  >
                    <div className="p-3.5 pt-0 flex gap-2 border-t border-slate-100 dark:border-dark-800/30 mt-1">
                      <button
                        type="button"
                        onClick={handleExportJSON}
                        className="flex-1 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-700 dark:text-slate-300 rounded-xl py-2 text-[10px] font-extrabold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-dark-700/50 transition cursor-pointer flex items-center justify-center gap-1 shadow-sm hover:scale-[1.03]"
                      >
                        <Download className="w-3.5 h-3.5" /> JSON
                      </button>

                      <button
                        type="button"
                        onClick={handleExportCSV}
                        className="flex-1 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-700 dark:text-slate-300 rounded-xl py-2 text-[10px] font-extrabold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-dark-700/50 transition cursor-pointer flex items-center justify-center gap-1 shadow-sm hover:scale-[1.03]"
                      >
                        <Download className="w-3.5 h-3.5" /> CSV
                      </button>

                      <label className="flex-1 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-700 dark:text-slate-300 rounded-xl py-2 text-[10px] font-extrabold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-dark-700/50 transition cursor-pointer flex items-center justify-center gap-1 shadow-sm hover:scale-[1.03] text-center">
                        <Upload className="w-3.5 h-3.5" /> Import
                        <input
                          type="file"
                          accept=".json"
                          className="hidden"
                          onChange={handleImportJSON}
                        />
                      </label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        )}
      </div>

      {/* Real-time Traversal Terminal / Logs */}
      {workspace.activeCityId && (
        <div className="h-44 clay-inset m-2 text-brand-300 font-mono text-[10px] p-3.5 flex flex-col overflow-hidden relative">
          
          <div className="flex items-center gap-1.5 border-b border-black/10 dark:border-white/10 pb-1.5 mb-2 relative z-10">
            <TermIcon className="w-3.5 h-3.5 text-brand-500" />
            <span className="font-bold text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400">Visual Traversal Console</span>
            <div className="ml-auto w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
          </div>
          
          <div ref={terminalRef} className="flex-1 overflow-y-auto space-y-1 relative z-10 scrollbar-thin scrollbar-thumb-brand-500/20">
            <AnimatePresence>
              {simulator.logs.map((log, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                  className="leading-relaxed flex items-start gap-1"
                >
                  <span className="text-brand-500/60 shrink-0 select-none">$</span>
                  <span className="text-slate-600 dark:text-slate-300">{log}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};
