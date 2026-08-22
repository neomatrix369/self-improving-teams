import React from 'react';
import {
  Bot,
  BrainCircuit,
  Database,
  Sparkles,
  Terminal,
  Activity,
  Zap,
  LayoutGrid,
  LayoutList,
  Columns,
  Eye,
  Square,
} from 'lucide-react';
import { LayoutsPreviewModal } from './LayoutsPreviewModal';

export type UILayoutMode = 'studio' | 'minimal' | 'terminal';

interface HeaderProps {
  activeTab: 'workflow' | 'mem0' | 'skills' | 'tokens' | 'cli';
  setActiveTab: (tab: 'workflow' | 'mem0' | 'skills' | 'tokens' | 'cli') => void;
  isRunning: boolean;
  mem0Count: number;
  skillsCount: number;
  layoutMode: UILayoutMode;
  setLayoutMode: (mode: UILayoutMode) => void;
  onStopResearch?: () => void;
  isStopping?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isRunning,
  mem0Count,
  skillsCount,
  layoutMode,
  setLayoutMode,
  onStopResearch,
  isStopping,
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

  const tabs = [
    { id: 'workflow', label: 'Research Workflow', icon: Bot },
    { id: 'mem0', label: `Mem0 Memory (${mem0Count})`, icon: Database },
    { id: 'skills', label: `AutoSkill Evolution (${skillsCount})`, icon: Sparkles },
    { id: 'tokens', label: 'Token Telemetry', icon: Activity },
    { id: 'cli', label: 'CLI Console', icon: Terminal },
  ] as const;

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm ring-1 ring-slate-900/10">
              <BrainCircuit className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-semibold text-slate-900 tracking-tight">
                  ADK Self-Improving Research Team
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  Mem0 MCP + AutoSkill
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                4 Autonomous SOUL Agents · Loop-Guarded Callbacks · Autonomous SKILL.md Evolution
              </p>
            </div>
          </div>

          {/* Right Controls: UI Layout Switcher & Status */}
          <div className="flex items-center space-x-3">
            {/* UI Layout Picker */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
              <span className="text-[10px] font-semibold uppercase text-slate-400 px-1.5 hidden sm:inline-block">
                UI:
              </span>
              <button
                id="btn-layout-studio"
                onClick={() => setLayoutMode('studio')}
                className={`flex items-center space-x-1 px-2 py-1 rounded font-medium transition-all ${
                  layoutMode === 'studio'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Studio Dashboard Layout (Split View with Tabs)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Studio</span>
              </button>
              <button
                id="btn-layout-minimal"
                onClick={() => setLayoutMode('minimal')}
                className={`flex items-center space-x-1 px-2 py-1 rounded font-medium transition-all ${
                  layoutMode === 'minimal'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Minimal Single-Column Flask Form Layout"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Minimal Form</span>
              </button>
              <button
                id="btn-layout-terminal"
                onClick={() => setLayoutMode('terminal')}
                className={`flex items-center space-x-1 px-2 py-1 rounded font-medium transition-all ${
                  layoutMode === 'terminal'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Developer Terminal-First Layout"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Terminal</span>
              </button>

              <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block" />

              {/* Visual Preview Button */}
              <button
                id="btn-open-preview-modal"
                onClick={() => setIsPreviewOpen(true)}
                className="flex items-center space-x-1 px-2 py-1 rounded font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
                title="Visual Preview & Guide for All UI Layouts"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="font-semibold hidden lg:inline">Preview All</span>
              </button>
            </div>

            {isRunning && (
              <div className="flex items-center space-x-2">
                <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                  <Zap className="w-3.5 h-3.5 mr-1 text-amber-600 animate-spin" />
                  <span className="hidden sm:inline">Pipeline Active</span>
                </div>
                {onStopResearch && (
                  <button
                    id="btn-header-stop-agent"
                    onClick={onStopResearch}
                    disabled={isStopping}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all active:scale-95 disabled:opacity-50"
                    title="Stop running agent pipeline immediately"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>{isStopping ? 'Stopping...' : 'Stop'}</span>
                  </button>
                )}
              </div>
            )}
            <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              <span className="font-mono font-medium">Gemini 3.7</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Only in Studio mode or when relevant) */}
        {layoutMode === 'studio' && (
          <div className="flex space-x-1 sm:space-x-4 border-t border-slate-100 pt-1 overflow-x-auto no-scrollbar">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-nav-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Visual Layouts Preview Modal */}
      <LayoutsPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        currentMode={layoutMode}
        onSelectMode={(mode) => {
          setLayoutMode(mode);
          setIsPreviewOpen(false);
        }}
      />
    </header>
  );
};
