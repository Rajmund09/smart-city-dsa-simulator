import React, { useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../store/store';
import { setActiveTab, setAutoOpenAnalyticsOnProcess, fetchCityData } from '../store/workspaceSlice';
import { resetSimulation } from '../store/simulatorSlice';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Activity,
  Cpu,
  Database,
  Info,
  GitFork,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Compass,
  Layers,
  FileText,
  ChevronDown,
  ChevronUp,
  Play,
  Search,
  Building2,
  Gauge,
  Network,
  Share2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAlgorithmDetails, type AlgorithmMeta } from '../utils/algorithmDetails';

// Executive Muted Palette for Charts
const CHART_COLORS = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export const AnalyticsDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { cities, activeCityId, activeCityName, nodes, autoOpenAnalyticsOnProcess } = useAppSelector(
    (state) => state.workspace
  );
  const simulator = useAppSelector((state) => state.simulator);

  const [showTraceLogs, setShowTraceLogs] = useState(false);
  const [logSearch, setLogSearch] = useState('');

  // Fetch graph stats via react-query
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['analyticsStats', activeCityId],
    queryFn: async () => {
      if (!activeCityId) return null;
      const res = await fetch(`/api/analytics/stats?cityId=${activeCityId}`);
      if (!res.ok) throw new Error('Failed to load stats');
      return res.json();
    },
    enabled: !!activeCityId,
  });

  // Fetch performance benchmarks via react-query
  const { data: performance, isLoading: perfLoading } = useQuery({
    queryKey: ['analyticsPerformance', activeCityId],
    queryFn: async () => {
      if (!activeCityId) return null;
      const res = await fetch(`/api/analytics/performance?cityId=${activeCityId}`);
      if (!res.ok) throw new Error('Failed to load performance metrics');
      return res.json();
    },
    enabled: !!activeCityId,
  });

  // Algorithm details metadata
  const algoMeta: AlgorithmMeta = useMemo(() => {
    return getAlgorithmDetails(simulator.algorithm);
  }, [simulator.algorithm]);

  // Node helper
  const getNode = (id?: string) => {
    if (!id) return null;
    return nodes.find((n) => n.id === id) || null;
  };

  // Aggregated step telemetry
  const stepStats = useMemo(() => {
    let visits = 0;
    let examines = 0;
    let relaxes = 0;
    let updates = 0;
    let others = 0;
    const visitedSet = new Set<string>();

    simulator.steps.forEach((s) => {
      if (s.nodeId) visitedSet.add(s.nodeId);
      if (s.sourceId) visitedSet.add(s.sourceId);
      if (s.targetId) visitedSet.add(s.targetId);

      if (s.type === 'visit_node') visits++;
      else if (s.type === 'examine_edge') examines++;
      else if (s.type === 'relax_edge') relaxes++;
      else if (s.type === 'update_distance') updates++;
      else others++;
    });

    return {
      totalSteps: simulator.steps.length,
      visits,
      examines,
      relaxes,
      updates,
      others,
      uniqueNodesVisited: visitedSet.size,
    };
  }, [simulator.steps]);

  // Formatted step logs for audit inspection
  const formattedSteps = useMemo(() => {
    return simulator.steps.map((step, index) => {
      const srcNode = nodes.find((n) => n.id === step.sourceId);
      const dstNode = nodes.find((n) => n.id === step.targetId);
      const cur = nodes.find((n) => n.id === step.nodeId);

      const srcName = srcNode ? srcNode.name : step.sourceId;
      const dstName = dstNode ? dstNode.name : step.targetId;
      const curName = cur ? cur.name : step.nodeId;

      let badge = step.type.replace('_', ' ').toUpperCase();
      let badgeColor = 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      let message = '';

      switch (step.type) {
        case 'visit_node':
          badge = 'POPPED QUEUE';
          badgeColor = 'bg-sky-500/10 text-sky-400 border-sky-500/20';
          message = `Evaluated Node "${curName || step.nodeId}" (Accumulated path cost: ${step.value.toFixed(1)}m). Expanding neighbors.`;
          break;
        case 'examine_edge':
          badge = 'EXAMINED EDGE';
          badgeColor = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
          message = `Inspecting link "${srcName}" ➔ "${dstName}" (Physical segment length: ${step.value.toFixed(1)}m).`;
          break;
        case 'update_distance':
          badge = 'UPDATED ESTIMATE';
          badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
          message = `Found shorter path candidate to "${curName || step.nodeId}". Distance estimate revised to ${step.value.toFixed(1)}m.`;
          break;
        case 'relax_edge':
          badge = 'RELAXED CONNECTION';
          badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
          message = `Relaxed connection "${srcName}" ➔ "${dstName}". Re-routed path cost lowered to ${step.value.toFixed(1)}m.`;
          break;
        case 'mst_add':
          badge = 'ADDED TO MST';
          badgeColor = 'bg-teal-500/10 text-teal-400 border-teal-500/20';
          message = `Appended grid link "${srcName}" — "${dstName}" (weight: ${step.value.toFixed(1)}m) to Minimum Spanning Tree.`;
          break;
        case 'flow_update':
          badge = 'FLOW ADJUSTED';
          badgeColor = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
          message = `Adjusted residual pipeline capacity for "${srcName}" ➔ "${dstName}" to ${step.value.toFixed(1)}.`;
          break;
        case 'color_node':
          badge = 'BIPARTITE GROUP';
          badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
          message = `Assigned node "${curName || step.nodeId}" to partition group ${step.value === 1 ? 'A (Power)' : 'B (Demand)'}.`;
          break;
        default:
          message = `Processed operation on Node "${curName || step.nodeId}". Metric value: ${step.value.toFixed(1)}.`;
          break;
      }

      return {
        index: index + 1,
        type: step.type,
        badge,
        badgeColor,
        message,
        nodeId: step.nodeId,
        sourceId: step.sourceId,
        targetId: step.targetId,
        value: step.value,
      };
    });
  }, [simulator.steps, nodes]);

  // Filtered steps based on search query
  const filteredSteps = useMemo(() => {
    if (!logSearch.trim()) return formattedSteps;
    const q = logSearch.toLowerCase();
    return formattedSteps.filter(
      (s) =>
        s.message.toLowerCase().includes(q) ||
        s.badge.toLowerCase().includes(q) ||
        (s.nodeId && s.nodeId.toLowerCase().includes(q))
    );
  }, [formattedSteps, logSearch]);

  if (!activeCityId) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-slate-400 dark:text-slate-500">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-dark-800 flex items-center justify-center mb-4">
          <Database className="w-8 h-8 text-slate-400 animate-pulse" />
        </div>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">No City Selected</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm text-center">
          Select or initialize a city workspace from the simulation canvas to view analytics telemetry.
        </p>
        <button
          onClick={() => dispatch(setActiveTab('workspace'))}
          className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-500 text-white hover:bg-brand-600 transition cursor-pointer"
        >
          Open Simulation Canvas
        </button>
      </div>
    );
  }

  // Node types breakdown for donut chart
  const nodeTypeData = stats?.nodeTypes
    ? Object.keys(stats.nodeTypes).map((key) => ({
        name: key.replace('_', ' ').toUpperCase(),
        value: stats.nodeTypes[key],
      }))
    : [];

  const hasAlgorithmResults = simulator.steps.length > 0 || simulator.executionTimeMs > 0 || simulator.isComputing;

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50 dark:bg-[#0B0F17] px-8 py-8 pb-36 space-y-7 scrollbar-thin text-slate-800 dark:text-slate-200">
      
      {/* 1. Header Mission Control Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              City Network Intelligence
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time topology diagnostics, physical graph weights & C++20 engine metrics for{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{activeCityName}</span>
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center flex-wrap gap-3">
          {/* City Selector Dropdown */}
          <div className="flex items-center gap-2 bg-white dark:bg-[#131B2A] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium">City:</span>
            <select
              value={activeCityId || ''}
              onChange={(e) => {
                const id = Number(e.target.value);
                if (id) dispatch(fetchCityData(id));
              }}
              className="bg-transparent font-semibold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer pr-1"
            >
              {cities.map((city) => (
                <option key={city.id} value={city.id} className="dark:bg-[#131B2A]">
                  {city.name}
                </option>
              ))}
            </select>
          </div>

          {/* Auto-open Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-[#131B2A] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition">
            <input
              type="checkbox"
              checked={autoOpenAnalyticsOnProcess}
              onChange={(e) => dispatch(setAutoOpenAnalyticsOnProcess(e.target.checked))}
              className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-brand-500 focus:ring-brand-500 cursor-pointer"
            />
            <span>Auto-open on run</span>
          </label>

          {/* Return to Canvas Button */}
          <button
            onClick={() => dispatch(setActiveTab('workspace'))}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#131B2A] border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition shadow-sm hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-sky-500" />
            <span>Canvas Map</span>
          </button>
        </div>
      </div>

      {/* 2. Primary KPI Metric Cards (Refined & Clean) */}
      {statsLoading ? (
        <div className="h-24 flex items-center justify-center text-xs text-slate-400">Loading graph metrics...</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#131B2A] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Network Vertices</span>
              <Network className="w-4 h-4 text-sky-500/80" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">{stats?.nodes || 0}</span>
              <span className="text-xs font-medium text-slate-400">nodes</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1">Active municipal infrastructure locations</span>
          </div>

          <div className="bg-white dark:bg-[#131B2A] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Physical Links</span>
              <Share2 className="w-4 h-4 text-indigo-500/80" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">{stats?.edges || 0}</span>
              <span className="text-xs font-medium text-slate-400">edges</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1">Interconnecting roads & utility spans</span>
          </div>

          <div className="bg-white dark:bg-[#131B2A] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Graph Density</span>
              <Gauge className="w-4 h-4 text-emerald-500/80" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                {stats?.density ? stats.density.toFixed(4) : '0.0000'}
              </span>
              <span className="text-xs font-medium text-slate-400">ratio</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1">Sparsity vs complete graph connectivity</span>
          </div>

          <div className="bg-white dark:bg-[#131B2A] p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Mean Link Distance</span>
              <MapPin className="w-4 h-4 text-amber-500/80" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                {stats?.avgWeight ? `${stats.avgWeight.toFixed(1)}m` : '0.0m'}
              </span>
              <span className="text-xs font-medium text-slate-400">distance</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1">Average Euclidean GPS segment weight</span>
          </div>
        </div>
      )}

      {/* 3. Consolidated Algorithm Execution Panel (Zero Redundancy, Pure Precision) */}
      {hasAlgorithmResults ? (
        <div className="bg-white dark:bg-[#131B2A] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
          
          {/* Top Panel Banner */}
          <div className="px-6 py-4 bg-slate-50/50 dark:bg-[#162032] border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-500 flex items-center justify-center font-bold">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {algoMeta.name}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                    {algoMeta.paradigm}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {algoMeta.description}
                </p>
              </div>
            </div>

            {/* Play on Canvas Button */}
            <button
              onClick={() => {
                dispatch(resetSimulation());
                dispatch(setActiveTab('workspace'));
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-sky-500 hover:bg-sky-600 active:scale-95 transition shadow-sm cursor-pointer shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Watch Animation on Canvas</span>
            </button>
          </div>

          {/* 4-Stat Performance Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-200/80 dark:border-slate-800 divide-y md:divide-y-0 md:divide-x divide-slate-200/80 dark:divide-slate-800">
            <div className="p-4">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Execution Time</span>
              <div className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                {simulator.isComputing ? (
                  <span className="text-amber-500 animate-pulse">Computing...</span>
                ) : (
                  `${simulator.executionTimeMs.toFixed(4)} ms`
                )}
              </div>
              <span className="text-[11px] text-slate-400">
                {!simulator.isComputing && `${(simulator.executionTimeMs * 1000).toFixed(0)} µs C++ engine`}
              </span>
            </div>

            <div className="p-4">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Memory Allocation</span>
              <div className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                {simulator.memoryUsageBytes > 0
                  ? `${(simulator.memoryUsageBytes / 1024).toFixed(1)} KB`
                  : '0 bytes (L1/L2 cache)'}
              </div>
              <span className="text-[11px] text-slate-400">Peak Linux process RSS</span>
            </div>

            <div className="p-4">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Time Complexity</span>
              <div className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                {algoMeta.timeComplexity}
              </div>
              <span className="text-[11px] text-slate-400">Optimal upper asymptotic bound</span>
            </div>

            <div className="p-4">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">Space Complexity</span>
              <div className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                {algoMeta.spaceComplexity}
              </div>
              <span className="text-[11px] text-slate-400">Auxiliary heap & set tables</span>
            </div>
          </div>

          {/* Resolved Route Waypoints Timeline */}
          {simulator.path && simulator.path.length > 0 && (
            <div className="p-6 border-b border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Computed Optimal Route Waypoints
                  </span>
                </div>
                <div className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                  Total Distance:{' '}
                  <span className="text-emerald-500 dark:text-emerald-400 font-bold">
                    {simulator.cost > 0 ? `${simulator.cost.toFixed(2)}m` : '0.00m'}
                  </span>{' '}
                  • {simulator.path.length} vertices ({Math.max(0, simulator.path.length - 1)} spans)
                </div>
              </div>

              {/* Waypoints Sequence Bar */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {simulator.path.map((nodeId, idx) => {
                  const n = getNode(nodeId);
                  const isFirst = idx === 0;
                  const isLast = idx === simulator.path.length - 1;

                  return (
                    <React.Fragment key={idx}>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#1A2333] border border-slate-200 dark:border-slate-700/80 shadow-sm text-xs">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono ${
                            isFirst
                              ? 'bg-emerald-500 text-white'
                              : isLast
                              ? 'bg-rose-500 text-white'
                              : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                          {n ? n.name : nodeId}
                        </span>
                        {n?.type && (
                          <span className="text-[10px] font-mono uppercase text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {n.type}
                          </span>
                        )}
                      </div>

                      {idx < simulator.path.length - 1 && (
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {/* Engine Diagnostics & Municipal Context Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200/80 dark:divide-slate-800">
            {/* Traversal Telemetry */}
            <div className="p-6 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-500" /> Engine Traversal Telemetry
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#162032] border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Nodes Visited</span>
                  <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                    {stepStats.uniqueNodesVisited}{' '}
                    <span className="text-xs text-slate-400 font-sans font-normal">
                      / {stats?.nodes || 0} (
                      {stats?.nodes ? Math.round((stepStats.uniqueNodesVisited / stats.nodes) * 100) : 0}%)
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#162032] border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Edges Relaxed</span>
                  <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                    {stepStats.relaxes + stepStats.updates}{' '}
                    <span className="text-xs text-slate-400 font-sans font-normal">updates</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                The C++ solver evaluated <span className="font-semibold text-slate-700 dark:text-slate-300">{stepStats.totalSteps} discrete operations</span>, inspecting {stepStats.examines} candidate connections across {stepStats.visits} priority queue pops.
              </p>
            </div>

            {/* Smart City Operational Role */}
            <div className="p-6 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-500" /> Smart City Municipal Role
              </span>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {algoMeta.smartCityRole}
              </p>

              <div className="pt-2">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1.5">
                  Internal C++20 Data Structures
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {algoMeta.dataStructures.map((ds, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-[#162032] border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      {ds}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Ready State */
        <div className="bg-white dark:bg-[#131B2A] p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-500 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
            Ready to Execute Algorithm
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
            Select a start and destination node on the canvas, choose from 15+ C++ graph algorithms in the control panel, and click &ldquo;Compute in C++&rdquo; to populate execution telemetry.
          </p>
          <button
            onClick={() => dispatch(setActiveTab('workspace'))}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 text-white hover:bg-sky-600 transition shadow-sm cursor-pointer"
          >
            Go to Simulation Canvas
          </button>
        </div>
      )}

      {/* 4. Dual Charts Grid (Prominently Displayed & Visible) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Performance Benchmark Bar Chart (2 cols) */}
        <div className="bg-white dark:bg-[#131B2A] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-sky-500" /> C++ Compute Benchmarks (Execution Time)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Average execution duration in milliseconds across recent algorithmic runs
            </p>
          </div>

          <div className="h-64 flex-1">
            {perfLoading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Loading benchmark history...</div>
            ) : !performance || performance.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-1.5">
                <Info className="w-5 h-5 text-slate-400" />
                <span className="font-semibold text-[11px] uppercase tracking-wider">No Run History</span>
                <p className="text-[11px] text-slate-500 text-center max-w-xs">Run traversal or routing algorithms to generate performance comparisons.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="algorithm" tick={{ fontSize: 10, fill: '#94a3b8' }} stroke="#334155" />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    stroke="#334155"
                    label={{ value: 'ms', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#94a3b8' } }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: 12,
                      fontSize: 11,
                      color: '#F8FAFC',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
                    }}
                    formatter={(value: any) => [`${parseFloat(value || 0).toFixed(4)} ms`, 'Avg Time']}
                  />
                  <Bar dataKey="avgExecutionTimeMs" fill="#0ea5e9" radius={[6, 6, 0, 0]}>
                    {performance.map((_: unknown, index: number) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Infrastructure Distribution Pie Chart (1 col) */}
        <div className="bg-white dark:bg-[#131B2A] p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <GitFork className="w-4 h-4 text-indigo-500" /> Infrastructure Node Distribution
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Breakdown of city facilities and intersections in database
            </p>
          </div>

          <div className="h-64 flex-1 flex items-center justify-center">
            {statsLoading ? (
              <div className="text-xs text-slate-400">Loading infrastructure breakdown...</div>
            ) : nodeTypeData.length === 0 ? (
              <div className="text-xs text-slate-400">No nodes found in active city.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={nodeTypeData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {nodeTypeData.map((_, index) => (
                      <Cell key={`pie-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: 12,
                      fontSize: 11,
                      color: '#F8FAFC',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconSize={8}
                    wrapperStyle={{ fontSize: 10, fill: '#94a3b8' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* 5. Collapsible Step-by-Step Execution Trace Audit Trail */}
      {hasAlgorithmResults && (
        <div className="bg-white dark:bg-[#131B2A] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowTraceLogs(!showTraceLogs)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50/50 dark:hover:bg-[#162032] transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-sky-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Detailed Step-by-Step Execution Trace Log
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {formattedSteps.length} recorded events
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <span>{showTraceLogs ? 'Collapse Audit Trail' : 'Expand Audit Trail'}</span>
              {showTraceLogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          <AnimatePresence>
            {showTraceLogs && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-slate-200/80 dark:border-slate-800 p-6 space-y-4"
              >
                {/* Search filter for trace operations */}
                <div className="relative max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    placeholder="Filter operations by node ID, name, or event type..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Scrollable Terminal List */}
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1 font-mono text-[11px] scrollbar-thin">
                  {filteredSteps.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400 font-sans">
                      No matching operations found for &ldquo;{logSearch}&rdquo;.
                    </div>
                  ) : (
                    filteredSteps.map((step) => (
                      <div
                        key={step.index}
                        className="p-3 rounded-xl bg-slate-50/70 dark:bg-[#0E1524] border border-slate-200/50 dark:border-slate-800/80 flex items-start gap-3 transition hover:border-sky-500/30"
                      >
                        <span className="text-[10px] font-bold text-slate-400 pt-0.5 select-none w-7 text-right">
                          #{step.index}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border tracking-tight shrink-0 ${step.badgeColor}`}
                        >
                          {step.badge}
                        </span>
                        <span className="text-slate-700 dark:text-slate-300 leading-relaxed flex-1">
                          {step.message}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
