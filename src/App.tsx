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
import { agentOrchestrator } from './services/agentOrchestrator';
import { mem0Store } from './services/mem0Store';
import { skillManager } from './services/skillManager';
import { hasGeminiKey, setSessionGeminiKey } from './services/gemini';
import { KeyPromptModal } from './components/KeyPromptModal';

export default function App() {
  const [layoutMode, setLayoutMode] = useState<UILayoutMode>(() => {
    return (localStorage.getItem('adk_ui_layout') as UILayoutMode) || 'studio';
  });
  const [activeTab, setActiveTab] = useState<'workflow' | 'mem0' | 'skills' | 'tokens' | 'cli'>('workflow');
  const [currentRun, setCurrentRun] = useState<ResearchRun | null>(null);
  const [runHistory, setRunHistory] = useState<ResearchRun[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [mem0Count, setMem0Count] = useState(0);
  const [skillsCount, setSkillsCount] = useState(0);
  // Show the key prompt on first load unless a build-time key is baked in.
  const [showKeyPrompt, setShowKeyPrompt] = useState(() => !hasGeminiKey());

  const handleKeySubmit = async ({ geminiKey, mem0McpUrl }: { geminiKey: string; mem0McpUrl: string }) => {
    setSessionGeminiKey(geminiKey);
    if (mem0McpUrl) {
      try {
        await mem0Store.setSessionMcpUrl(mem0McpUrl);
      } catch (e) {
        console.error('Failed to apply Mem0 MCP URL for this session', e);
      }
    }
    setShowKeyPrompt(false);
  };

  const handleSetLayoutMode = (mode: UILayoutMode) => {
    setLayoutMode(mode);
    localStorage.setItem('adk_ui_layout', mode);
  };

  const fetchGlobalStats = async () => {
    try {
      const mems = await mem0Store.listMemories();
      setMem0Count(mems.length);

      const skills = skillManager.getAllSkills();
      setSkillsCount(skills.filter(s => s.version > 0).length);

      const history = agentOrchestrator.getAllRuns();
      if (history.length > 0) {
        setRunHistory(history);
        setCurrentRun(prev => prev ?? history[0]);
      }
    } catch (e) {
      console.error('Failed to fetch initial stats:', e);
    }
  };

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  const handleStartResearch = async (
    topic: string,
    options: { triggerCallbackDemo: boolean }
  ) => {
    setIsRunning(true);
    setIsStopping(false);
    setActiveTab('workflow');

    try {
      const run = await agentOrchestrator.executeResearch(topic, {
        triggerCallbackDemo: options.triggerCallbackDemo,
        onProgress: updated => {
          setCurrentRun(updated);
          setRunHistory(prev => {
            const withoutCurrent = prev.filter(r => r.id !== updated.id);
            return [updated, ...withoutCurrent];
          });
        },
      });
      setCurrentRun(run);
      setRunHistory(prev => [run, ...prev.filter(r => r.id !== run.id)]);
      fetchGlobalStats();
    } catch (e: any) {
      console.error('Failed to launch research:', e);
    } finally {
      setIsRunning(false);
      setIsStopping(false);
    }
  };

  const handleStopResearch = async () => {
    if (!isRunning) return;
    setIsStopping(true);
    try {
      agentOrchestrator.stopResearch(currentRun?.id);
      if (currentRun?.id) {
        const updated = agentOrchestrator.getRun(currentRun.id);
        if (updated) setCurrentRun(updated);
      }
    } catch (e) {
      console.error('Failed to stop research:', e);
    } finally {
      // The in-flight executeResearch will resolve with status="cancelled" and clear isRunning via its finally block.
      setIsStopping(false);
      fetchGlobalStats();
    }
  };

  const handleResetColdStart = async () => {
    if (!window.confirm('Wipe all Mem0 long-term memory & reset all autonomous SKILL.md files to cold-start zero state?')) return;
    try {
      await mem0Store.resetMemories();
      skillManager.resetSkills();
      fetchGlobalStats();
      setCurrentRun(null);
    } catch (e) {
      console.error('Failed to reset cold start:', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col font-sans text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
      {showKeyPrompt && <KeyPromptModal onSubmit={handleKeySubmit} />}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isRunning={isRunning}
        isStopping={isStopping}
        onStopResearch={handleStopResearch}
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
            isStopping={isStopping}
            onStartResearch={handleStartResearch}
            onStopResearch={handleStopResearch}
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
            isStopping={isStopping}
            onStopResearch={handleStopResearch}
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
                    isStopping={isStopping}
                    onStartResearch={handleStartResearch}
                    onStopResearch={handleStopResearch}
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
