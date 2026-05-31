import React from 'react';
import { useAppSelector } from '../store/store';
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
import { Activity, Cpu, Database, Info, GitFork, Scaling } from 'lucide-react';
import { motion } from 'framer-motion';

const COLORS = ['#06b6d4', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06
    }
  }
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } }
} as const;

export const AnalyticsDashboard: React.FC = () => {
  const { activeCityId, activeCityName } = useAppSelector((state) => state.workspace);
  const simulator = useAppSelector((state) => state.simulator);

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

  if (!activeCityId) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 dark:text-slate-500 font-medium space-y-5"
      >
        <div className="w-full max-w-[220px] aspect-square rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 dark:border-dark-700/60 bg-white/50 dark:bg-dark-900/50 backdrop-blur-md p-1 flex items-center justify-center">
          <img
            src="/smart-city-network.png"
            alt="Smart City Illustration"
            className="w-full h-full object-cover rounded-2xl dark:opacity-80"
          />
        </div>
        <div className="text-center space-y-1.5">
          <h2 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center justify-center gap-2">
            <Database className="w-4 h-4 text-brand-500 animate-pulse" /> Dashboard Inactive
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[260px] leading-relaxed mx-auto font-medium">
            Please select an active city workspace in the left panel to load analytics dashboards.
          </p>
        </div>
      </motion.div>
    );
  }

  // Map node types for pie chart
  const nodeTypeData = stats?.nodeTypes
    ? Object.keys(stats.nodeTypes).map((key) => ({
        name: key.replace('_', ' ').toUpperCase(),
        value: stats.nodeTypes[key],
      }))
    : [];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-dark-950 p-6 space-y-6 scrollbar-thin">
      
      {/* Dashboard header */}
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-dark-700 pb-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white uppercase tracking-wider">City Dashboard</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Real-time analytics for <span className="font-bold text-brand-500 dark:text-brand-400">{activeCityName}</span>
          </p>
        </div>
      </div>

      {/* Grid of numerical metrics */}
      {statsLoading ? (
        <div className="h-20 flex items-center justify-center text-xs text-slate-400">Loading graph metrics...</div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <motion.div variants={cardVariants} className="glass-panel p-4 flex flex-col justify-between border-l-4 border-l-brand-500 bg-white/40 dark:bg-dark-900/40 glass-panel-hover hover:scale-[1.03]">
            <span className="text-[9px] uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500">Total Nodes</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{stats?.nodes || 0}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">vertices</span>
            </div>
          </motion.div>

          <motion.div variants={cardVariants} className="glass-panel p-4 flex flex-col justify-between border-l-4 border-l-indigo-500 bg-white/40 dark:bg-dark-900/40 glass-panel-hover hover:scale-[1.03]">
            <span className="text-[9px] uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500">Total Edges</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{stats?.edges || 0}</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">links</span>
            </div>
          </motion.div>

          <motion.div variants={cardVariants} className="glass-panel p-4 flex flex-col justify-between border-l-4 border-l-emerald-500 bg-white/40 dark:bg-dark-900/40 glass-panel-hover hover:scale-[1.03]">
            <span className="text-[9px] uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500">Graph Density</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {stats?.density ? stats.density.toFixed(4) : '0.0000'}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ratio</span>
            </div>
          </motion.div>

          <motion.div variants={cardVariants} className="glass-panel p-4 flex flex-col justify-between border-l-4 border-l-amber-500 bg-white/40 dark:bg-dark-900/40 glass-panel-hover hover:scale-[1.03]">
            <span className="text-[9px] uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500">Avg Link Weight</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {stats?.avgWeight ? `${stats.avgWeight.toFixed(1)}m` : '0.0m'}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">distance</span>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Simulator Micro Benchmarks */}
      {simulator.steps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="glass-panel p-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900/95 dark:bg-dark-900/90 text-white border-0 neon-glow-brand"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/20 rounded-lg text-sky-400"><Activity className="w-5 h-5" /></div>
            <div>
              <div className="text-[9px] uppercase tracking-wider text-slate-450 font-extrabold">Algorithm</div>
              <div className="text-xs font-bold text-slate-100 uppercase tracking-wide">{simulator.steps[0] ? simulator.steps[0].type.replace('_', ' ') : 'SEARCH'}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400"><Cpu className="w-5 h-5 animate-pulse" /></div>
            <div>
              <div className="text-[9px] uppercase tracking-wider text-slate-450 font-extrabold">Execution Time</div>
              <div className="text-xs font-bold text-slate-100">{simulator.executionTimeMs.toFixed(4)} ms</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400"><Database className="w-5 h-5" /></div>
            <div>
              <div className="text-[9px] uppercase tracking-wider text-slate-450 font-extrabold">Memory Usage</div>
              <div className="text-xs font-bold text-slate-100">{simulator.memoryUsageBytes} bytes</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400"><Scaling className="w-5 h-5" /></div>
            <div>
              <div className="text-[9px] uppercase tracking-wider text-slate-450 font-extrabold">Complexity</div>
              <div className="text-xs font-bold text-slate-150">
                T: {simulator.timeComplexity} | S: {simulator.spaceComplexity}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Charts Row */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        
        {/* Execution Time Chart (2 cols) */}
        <motion.div variants={cardVariants} className="glass-panel p-5 lg:col-span-2 flex flex-col glass-panel-hover">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-brand-500" /> C++ Compute Benchmark (Execution Time)
              </h2>
              <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wide">Average execution duration in milliseconds (lower is better)</p>
            </div>
          </div>

          <div className="h-64 flex-1">
            {perfLoading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Loading performance data...</div>
            ) : !performance || performance.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 gap-1.5">
                <Info className="w-5 h-5 text-slate-350 dark:text-slate-650" />
                <span className="font-semibold text-[10px] uppercase tracking-widest">No Run History</span>
                <p className="text-[10px] text-slate-400 text-center max-w-[250px] leading-relaxed">Execute traversal or optimization routing on the canvas to see computational speeds.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="algorithm" tick={{ fontSize: 9, fontWeight: 700 }} stroke="#64748b" />
                  <YAxis tick={{ fontSize: 9, fontWeight: 600 }} stroke="#64748b" label={{ value: 'ms', angle: -90, position: 'insideLeft', style: { fontSize: 9, fontWeight: 700 } }} />
                  <Tooltip
                    contentStyle={{ fontSize: 10, borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    formatter={(value: number | string) => [`${parseFloat(value as string).toFixed(4)} ms`, 'Avg Time']}
                  />
                  <Bar dataKey="avgExecutionTimeMs" fill="#06b6d4" radius={[6, 6, 0, 0]}>
                    {performance.map((_: unknown, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Node Types Distribution Chart (1 col) */}
        <motion.div variants={cardVariants} className="glass-panel p-5 flex flex-col glass-panel-hover">
          <div className="mb-4">
            <h2 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <GitFork className="w-4 h-4 text-brand-500" /> Infrastructure Node Distribution
            </h2>
            <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wide">Breakdown of city node types in the database</p>
          </div>

          <div className="h-64 flex-1 relative flex items-center justify-center">
            {statsLoading ? (
              <div className="text-xs text-slate-400">Loading node metrics...</div>
            ) : nodeTypeData.length === 0 ? (
              <div className="text-xs text-slate-400">No nodes found. Add nodes to populate chart.</div>
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
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 10, borderRadius: 12, border: 'none' }} />
                  <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: 9, fontWeight: 700 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
