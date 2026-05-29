import React, { useState } from 'react';
import { MapPin, Zap, Droplet, Activity, Train, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CanvasLegend: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="absolute bottom-4 left-4 z-10 select-none">
      <div className="cyber-panel border-slate-200/40 dark:border-white/5 rounded-xl shadow-xl overflow-hidden max-w-xs">
        {/* Header toggle */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3.5 py-2.5 flex items-center justify-between text-left cursor-pointer hover:bg-slate-50/50 dark:hover:bg-dark-800/10 transition-colors"
        >
          <span className="text-[10px] font-display font-bold uppercase tracking-widest text-slate-400 dark:text-slate-300 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-brand-500" /> Map Legend
          </span>
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              <div className="px-3.5 pb-3.5 pt-1 space-y-3 border-t border-slate-100 dark:border-dark-800/30 text-[10px] font-medium leading-tight">
                {/* Node Types Section */}
                <div className="space-y-1.5">
                  <div className="text-[9px] font-display font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Infrastructure Nodes
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700/80 flex items-center justify-center">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <span>Road Intersection</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700/80 flex items-center justify-center">
                        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                      </div>
                      <span>Power Grid Station</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700/80 flex items-center justify-center">
                        <Droplet className="w-3.5 h-3.5 text-blue-500 fill-blue-500/20" />
                      </div>
                      <span>Water Substation</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700/80 flex items-center justify-center">
                        <Activity className="w-3.5 h-3.5 text-rose-500" />
                      </div>
                      <span>Emergency Center</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700/80 flex items-center justify-center">
                        <Train className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                      <span>Railway / Metro Hub</span>
                    </div>
                  </div>
                </div>

                <div className="w-full h-[1px] bg-slate-100 dark:bg-dark-800/40" />

                {/* Algorithm States Section */}
                <div className="space-y-1.5">
                  <div className="text-[9px] font-display font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Traversal Animation States
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <div className="w-6 h-6 rounded-full border-2 border-sky-500 bg-sky-50 dark:bg-sky-950/40 ring-2 ring-sky-500/20 flex items-center justify-center shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                      </div>
                      <span className="font-semibold text-sky-600 dark:text-sky-400">Active Node</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <div className="w-6 h-6 rounded-full border border-amber-400 border-dashed bg-amber-50/20 flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-amber-400" />
                      </div>
                      <span>Frontier / Queue State</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <div className="w-6 h-6 rounded-full border border-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20 flex items-center justify-center" />
                      <span>Visited / Settled Node</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <div className="w-6 h-6 rounded-full border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20 flex items-center justify-center relative shadow-emerald-500/10">
                        <span className="text-[8px] text-emerald-500 font-black">★</span>
                      </div>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">Optimal Path Node</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
