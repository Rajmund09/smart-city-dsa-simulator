import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from './store/store';
import { ControlPanel } from './components/ControlPanel';
import { GraphWorkspace } from './components/GraphWorkspace';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { Map, BarChart2, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'workspace' | 'analytics'>('workspace');
  const [darkMode, setDarkMode] = useState(true); // Dark mode by default

  // Sync dark class on body element
  useEffect(() => {
    const root = window.document.body;
    if (darkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [darkMode]);

  const tabs = [
    { id: 'workspace', label: 'Simulation Canvas', icon: Map },
    { id: 'analytics', label: 'Analytics Dashboard', icon: BarChart2 },
  ] as const;

  return (
    <div className="w-screen h-screen relative bg-slate-50 dark:bg-dark-950 transition-colors duration-300 overflow-hidden text-slate-800 dark:text-slate-200">
      
      {/* Floating Left Control Panel */}
      <ControlPanel />

      {/* Floating Bottom macOS Glass Dock */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 px-3.5 py-2.5 rounded-2xl flex items-center gap-3.5 glass-dock">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center relative cursor-pointer group transition-colors duration-200 ${
                isActive ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title={tab.label}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 bg-brand-500 rounded-xl shadow-lg shadow-brand-500/35"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className="w-5 h-5 z-10 transition-transform duration-200 group-hover:scale-110" />
            </button>
          );
        })}
        
        <div className="w-[1.5px] h-6 bg-slate-200/20 dark:bg-white/10 self-center" />

        {/* Theme Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-200 transition cursor-pointer"
          title="Toggle theme"
        >
          <motion.div
            key={darkMode ? 'dark' : 'light'}
            initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400 fill-amber-400/20" /> : <Moon className="w-5 h-5 text-indigo-400" />}
          </motion.div>
        </button>
      </div>

      {/* Main View Area (takes up entire screen) */}
      <div className="w-full h-full absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          {activeTab === 'workspace' ? (
            <motion.div
              key="workspace"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="w-full h-full"
            >
              <GraphWorkspace />
            </motion.div>
          ) : (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="w-full h-full pt-4 pl-88 pr-4 pb-28"
            >
              <AnalyticsDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </Provider>
  );
}
