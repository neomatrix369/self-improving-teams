import React, { useState, useEffect } from 'react';
import { Header, UILayoutMode } from './components/Header';
import { WorkflowPanel } from './components/WorkflowPanel';
import { ReportViewer } from './components/ReportViewer';
import { Mem0MemoryBank } from './components/Mem0MemoryBank';
import { SkillsInspector } from './components/SkillsInspector';
import { TokenAnalytics } from './components/TokenAnalytics';
import { CliConsole } from './components/CliConsole';
import { MinimalLayout } from './components/MinimalLayout';
import { TerminalFirstLayout } from './components/TerminalFirstLayout';
import { ResearchRun } from './types';

export default function App() {
  const [layoutMode, setLayoutMode] = useState<UILayoutMode>(() => {
    return (localStorage.getItem('adk_ui_layout') as UILayoutMode) || 'studio';
  });
  const [activeTab, setActiveTab] = useState<'workflow' | 'mem0' | 'skills' | 'tokens' | 'cli'>('workflow');
  const [currentRun, setCurrentRun] = useState<ResearchRun | null>(null);
  const [runHistory, setRunHistory] = useState<ResearchRun[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [mem0Count, setMem0Count] = useState(0);
  const [skillsCount, setSkillsCount] = useState(0);

  const handleSetLayoutMode = (mode: UILayoutMode) => {
    setLayoutMode(mode);
    localStorage.setItem('adk_ui_layout', mode);
  };

  // Fetch initial stats and history
  const fetchGlobalStats = async () => {
    try {
      const [healthRes, historyRes, skillsRes] = await Promise.all([
        fetch('/api/health').catch(() => null),
        fetch('/api/research/history').catch(() => null),
        fetch('/api/skills').catch(() => null),
      ]);

      if (healthRes && healthRes.ok) {
        const hData = await healthRes.json();
        setMem0Count(hData.mem0Count || 0);
      }

      if (skillsRes && skillsRes.ok) {
        const sData = await skillsRes.json();
        const activeCount = Array.isArray(sData) ? sData.filter((s: any) => s.version > 0).length : 0;
        setSkillsCount(activeCount);
      }

      if (historyRes && historyRes.ok) {
        const histData = await historyRes.json();
        if (Array.isArray(histData) && histData.length > 0) {
          setRunHistory(histData);
          if (!currentRun) {
            setCurrentRun(histData[0]);
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch initial stats:', e);
    }
  };

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  // Poll active run if running
  useEffect(() => {
    if (!isRunning || !currentRun?.id) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/research/status/${currentRun.id}`);
        if (res.ok) {
          const updatedRun: ResearchRun = await res.json();
          setCurrentRun(updatedRun);
          if (updatedRun.status !== 'running') {
            setIsRunning(false);
            fetchGlobalStats();
          }
        }
      } catch (e) {
        console.error('Error polling status', e);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [isRunning, currentRun?.id]);

  const handleStartResearch = async (
    topic: string,
    options: { triggerCallbackDemo: boolean }
  ) => {
    setIsRunning(true);
    setActiveTab('workflow');

    try {
      const res = await fetch('/api/research/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          triggerCallbackDemo: options.triggerCallbackDemo,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to start research');
      }

      const run: ResearchRun = await res.json();
      setCurrentRun(run);
      setRunHistory(prev => [run, ...prev.filter(r => r.id !== run.id)]);
      fetchGlobalStats();
    } catch (e: any) {
      console.error('Failed to launch research:', e);
      setIsRunning(false);
    }
  };

  const handleResetColdStart = async () => {
    if (!window.confirm('Wipe all Mem0 long-term memory & reset all autonomous SKILL.md files to cold-start zero state?')) return;
    try {
      await Promise.all([
        fetch('/api/mem0/reset', { method: 'POST' }),
        fetch('/api/skills/reset', { method: 'POST' }),
      ]);
      fetchGlobalStats();
      setCurrentRun(null);
    } catch (e) {
      console.error('Failed to reset cold start:', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col font-sans text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isRunning={isRunning}
        mem0Count={mem0Count}
        skillsCount={skillsCount}
        layoutMode={layoutMode}
        setLayoutMode={handleSetLayoutMode}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Minimal Flask-Style Form Layout */}
        {layoutMode === 'minimal' && (
          <MinimalLayout
            currentRun={currentRun}
            isRunning={isRunning}
            onStartResearch={handleStartResearch}
            onResetColdStart={handleResetColdStart}
            mem0Count={mem0Count}
            skillsCount={skillsCount}
          />
        )}

        {/* Terminal-First Developer Hub Layout */}
        {layoutMode === 'terminal' && (
          <TerminalFirstLayout
            currentRun={currentRun}
            isRunning={isRunning}
            mem0Count={mem0Count}
            skillsCount={skillsCount}
            onRefresh={fetchGlobalStats}
          />
        )}

        {/* Studio Dashboard Layout (Default) */}
        {layoutMode === 'studio' && (
          <>
            {activeTab === 'workflow' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Workflow Controls & Execution Timeline */}
                <div className="lg:col-span-5 space-y-6">
                  <WorkflowPanel
                    currentRun={currentRun}
                    isRunning={isRunning}
                    onStartResearch={handleStartResearch}
                    onResetColdStart={handleResetColdStart}
                    runHistory={runHistory}
                    onSelectRun={run => setCurrentRun(run)}
                  />
                </div>

                {/* Right Column: Interactive Report & Synthesis Viewer */}
                <div className="lg:col-span-7 min-h-[600px]">
                  {currentRun ? (
                    <ReportViewer run={currentRun} />
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[500px]">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                        <span className="text-2xl">🔬</span>
                      </div>
                      <h3 className="text-base font-semibold text-slate-900">
                        ADK Multi-Agent Research System Ready
                      </h3>
                      <p className="text-xs text-slate-500 max-w-md mt-1.5 leading-relaxed">
                        Submit a research topic on the left or select one of the presets. The team will search Mem0 MCP memory, make a divergence decision, orchestrate Research, Analysis, and Synthesis agents with loop-guarded callbacks, commit durable knowledge, and synthesize SKILL.md evolution rules.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'mem0' && (
              <Mem0MemoryBank onRefreshStats={fetchGlobalStats} />
            )}

            {activeTab === 'skills' && (
              <SkillsInspector onRefreshStats={fetchGlobalStats} />
            )}

            {activeTab === 'tokens' && (
              <TokenAnalytics currentRun={currentRun} runHistory={runHistory} />
            )}

            {activeTab === 'cli' && (
              <CliConsole onWorkflowTriggered={fetchGlobalStats} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/60 py-4 px-6 text-center text-xs text-slate-500">
        Google ADK Orchestrated Research Team · 4 Verbatim SOUL Instructions · Mem0 MCP Protocol · AutoSkill Pattern Compiler
      </footer>
    </div>
  );
}
