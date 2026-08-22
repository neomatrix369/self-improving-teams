import React from 'react';
import { CliConsole } from './CliConsole';
import { ResearchRun } from '../types';
import { Bot, Database, Sparkles, Activity, Layers, Square } from 'lucide-react';

interface TerminalFirstLayoutProps {
  currentRun: ResearchRun | null;
  isRunning: boolean;
  mem0Count: number;
  skillsCount: number;
  onRefresh: () => void;
  onStopResearch?: () => void;
  isStopping?: boolean;
}

export const TerminalFirstLayout: React.FC<TerminalFirstLayoutProps> = ({
  currentRun,
  isRunning,
  mem0Count,
  skillsCount,
  onRefresh,
  onStopResearch,
  isStopping,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Full CLI Console */}
      <div className="lg:col-span-8">
        <CliConsole onWorkflowTriggered={onRefresh} />
      </div>

      {/* Right Column: Live Telemetry & Inspector Feed */}
      <div className="lg:col-span-4 space-y-4">
        {/* System Monitor Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-200 shadow-xl font-mono text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-indigo-400 font-bold">
            <span className="flex items-center">
              <Activity className="w-3.5 h-3.5 mr-1" />
              ADK SYSTEM TELEMETRY
            </span>
            <div className="flex items-center space-x-2">
              {isRunning && onStopResearch && (
                <button
                  id="btn-terminal-stop"
                  onClick={onStopResearch}
                  disabled={isStopping}
                  className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-sans text-[11px] flex items-center space-x-1 transition-all active:scale-95 disabled:opacity-50"
                  title="Stop agent orchestration at will"
                >
                  <Square className="w-2.5 h-2.5 fill-current" />
                  <span>{isStopping ? 'Stopping...' : 'STOP'}</span>
                </button>
              )}
              <span className={isRunning ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}>
                {isRunning ? '● RUNNING' : '● IDLE'}
              </span>
            </div>
          </div>

          <div className="space-y-1 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Mem0 Memory Store:</span>
              <span className="font-bold text-indigo-300">{mem0Count} memories</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">AutoSkill Guidelines:</span>
              <span className="font-bold text-purple-300">{skillsCount} active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Gemini LLM Backbone:</span>
              <span className="font-bold text-emerald-400">gemini-3.7-flash</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">MCP Protocol:</span>
              <span className="font-bold text-slate-200">Local JSON RPC</span>
            </div>
          </div>
        </div>

        {/* Latest Run Stream */}
        {currentRun && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-200 shadow-xl font-mono text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400 font-bold">LATEST RUN: {currentRun.id}</span>
              <span className="text-emerald-400 font-bold">
                {currentRun.tokenSummary.total.totalTokens} tok
              </span>
            </div>

            <div className="text-[11px] text-slate-300 space-y-1">
              <div className="text-slate-400 font-bold truncate">Topic: {currentRun.topic}</div>
              {currentRun.divergenceDecision && (
                <div className="text-purple-300">
                  Divergence: {currentRun.divergenceDecision.isDivergent ? 'Multi-Facet' : 'Single Narrow'}
                </div>
              )}
            </div>

            <div className="space-y-1.5 pt-2 max-h-64 overflow-y-auto">
              {currentRun.steps.map((s, idx) => (
                <div key={idx} className="p-1.5 rounded bg-slate-800/60 border border-slate-700 text-[10px]">
                  <div className="flex justify-between text-indigo-300">
                    <span>[{s.agent.toUpperCase()}] {s.stepName}</span>
                    <span>{s.status}</span>
                  </div>
                  {s.details && <div className="text-slate-400 line-clamp-1">{s.details}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
