import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  Sparkles,
  Bot,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronDown,
  Layers,
  Database,
  ArrowRight,
  ShieldCheck,
  Cpu,
  RefreshCw,
  Zap,
  Square,
  AlertCircle,
} from 'lucide-react';
import { ResearchRun, AgentStepEvent, AgentType } from '../types';

interface WorkflowPanelProps {
  currentRun: ResearchRun | null;
  isRunning: boolean;
  onStartResearch: (topic: string, options: { triggerCallbackDemo: boolean }) => void;
  onResetColdStart: () => void;
  runHistory: ResearchRun[];
  onSelectRun: (run: ResearchRun) => void;
  onStopResearch?: () => void;
  isStopping?: boolean;
}

export const WorkflowPanel: React.FC<WorkflowPanelProps> = ({
  currentRun,
  isRunning,
  onStartResearch,
  onResetColdStart,
  runHistory,
  onSelectRun,
  onStopResearch,
  isStopping,
}) => {
  const [topicInput, setTopicInput] = useState('Local AI Agents: Privacy-Preserving Self-Hosted Inference Frameworks');
  const [enableCallbackDemo, setEnableCallbackDemo] = useState(true);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

  const presetTopics = [
    {
      title: 'Local AI Agents & Privacy',
      query: 'Local AI Agents: Privacy-Preserving Self-Hosted Inference Frameworks',
      badge: 'Cold Start Demo 1',
    },
    {
      title: 'Hermes vs Local Serving',
      query: 'Evaluate Hermes Agent Framework performance when paired with Qwen 2.5 local inference',
      badge: 'Warm Memory Demo 2',
    },
    {
      title: 'MCP Protocol vs Function Calling',
      query: 'Model Context Protocol (MCP) tool integration architecture compared to classic OpenAPI function calling in 2026',
      badge: 'Architecture Analysis',
    },
    {
      title: 'Small Language Models on Edge',
      query: 'State of 1B-3B Small Language Models running on consumer edge devices with WebGPU',
      badge: 'Edge AI Trends',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput.trim() || isRunning) return;
    onStartResearch(topicInput.trim(), { triggerCallbackDemo: enableCallbackDemo });
  };

  const getAgentColor = (agent: AgentType | 'system' | 'mem0_mcp') => {
    switch (agent) {
      case 'orchestrator':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'research':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'analysis':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'synthesis':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'mem0_mcp':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Prominent Input Control Box */}
      <div className="bg-white rounded-2xl border-2 border-indigo-100 shadow-sm p-6 space-y-4 relative overflow-hidden">
        {/* Subtle decorative top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <label htmlFor="research-topic-input" className="block text-sm font-bold text-slate-900 tracking-tight">
                    Research Topic & Prompt
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Type a research question, deep inquiry, or architectural comparison below
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                  isRunning
                    ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {isRunning ? '● Orchestrating Pipeline' : '● Ready For Input'}
                </span>
                <button
                  type="button"
                  id="btn-cold-reset"
                  onClick={onResetColdStart}
                  className="text-xs text-slate-500 hover:text-rose-600 px-2 py-1 rounded-md hover:bg-rose-50 border border-transparent hover:border-rose-200 flex items-center space-x-1 transition-all"
                  title="Wipe Mem0 memory & reset all generated skills to zero state"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Cold Start Reset</span>
                </button>
              </div>
            </div>

            {/* High-Visibility Interactive Entry Box */}
            <div className="relative group rounded-xl border-2 border-slate-300 focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-500/15 bg-slate-50/70 focus-within:bg-white shadow-inner transition-all">
              <div className="flex items-start p-3">
                <div className="shrink-0 pt-1 mr-3">
                  <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center font-mono text-xs font-bold">
                    ❯
                  </div>
                </div>

                <textarea
                  id="research-topic-input"
                  rows={2}
                  value={topicInput}
                  onChange={e => setTopicInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="Enter subject for multi-agent autonomous investigation (e.g. Compare local LLM inference engines like vLLM vs Ollama with Mem0 memory)..."
                  disabled={isRunning}
                  className="w-full text-sm sm:text-base font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal bg-transparent focus:outline-none resize-none leading-relaxed"
                />

                {topicInput && !isRunning && (
                  <button
                    type="button"
                    onClick={() => setTopicInput('')}
                    className="shrink-0 text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 text-xs transition-colors"
                    title="Clear input"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Bottom bar inside prompt container */}
              <div className="px-3 pb-2.5 pt-1 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span className="font-mono text-[11px] text-slate-400 flex items-center">
                  <span className="font-semibold text-slate-600 mr-1">Tip:</span> Press <kbd className="mx-1 px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded font-mono text-[10px] shadow-2xs">Enter ↵</kbd> to launch, or use presets below
                </span>

                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono text-slate-400">{topicInput.length} chars</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick preset chips with high visual clarity */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-slate-500 font-semibold flex items-center mr-1">
              <Zap className="w-3.5 h-3.5 mr-1 text-amber-500" />
              Quick Prompts:
            </span>
            {presetTopics.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                id={`btn-preset-${idx}`}
                onClick={() => setTopicInput(preset.query)}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-800 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 shadow-2xs transition-all active:scale-98"
              >
                <span>{preset.title}</span>
                <span className="ml-1.5 text-[10px] text-slate-500 font-mono bg-white px-1.5 py-0.2 rounded border border-slate-200">
                  {preset.badge}
                </span>
              </button>
            ))}
          </div>

          {/* Settings & Launch Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
            <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                id="toggle-callback"
                checked={enableCallbackDemo}
                onChange={e => setEnableCallbackDemo(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <span className="font-medium">Enable Loop-Guarded Agent Callbacks</span>
              <span className="text-slate-400">(Max 1 call per pair: Analysis ➔ Research, Synthesis ➔ Analysis)</span>
            </label>

            <div className="flex items-center space-x-2">
              {isRunning && onStopResearch && (
                <button
                  type="button"
                  id="btn-stop-research-panel"
                  onClick={onStopResearch}
                  disabled={isStopping}
                  className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-sm transition-all active:scale-95 disabled:opacity-50"
                  title="Stop agent orchestration at will"
                >
                  <Square className="w-4 h-4 mr-1.5 fill-current" />
                  {isStopping ? 'Stopping...' : 'Stop Agents'}
                </button>
              )}

              <button
                type="submit"
                id="btn-launch-research"
                disabled={isRunning || !topicInput.trim()}
                className="inline-flex items-center px-6 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Orchestrating...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2 fill-current" />
                    Launch Research Team
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Live Pipeline Stepper */}
      {currentRun && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <h2 className="text-sm font-semibold text-slate-900">
                ADK Orchestrated Execution Pipeline
              </h2>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="font-mono text-slate-500">Run ID: {currentRun.id}</span>
              {isRunning && onStopResearch && (
                <button
                  type="button"
                  id="btn-stepper-stop"
                  onClick={onStopResearch}
                  disabled={isStopping}
                  className="px-2 py-0.5 rounded font-medium bg-rose-100 text-rose-800 hover:bg-rose-200 transition-colors flex items-center space-x-1"
                >
                  <Square className="w-2.5 h-2.5 fill-current" />
                  <span>{isStopping ? 'Stopping...' : 'Stop'}</span>
                </button>
              )}
              <span
                className={`px-2 py-0.5 rounded-full font-medium ${
                  currentRun.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : currentRun.status === 'running'
                    ? 'bg-amber-100 text-amber-800 animate-pulse'
                    : currentRun.status === 'cancelled'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {currentRun.status === 'cancelled' ? 'STOPPED' : currentRun.status.toUpperCase()}
              </span>
            </div>
          </div>

          {currentRun.status === 'cancelled' && (
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg flex items-center space-x-2 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Orchestration was cancelled at will by user. Partial token usage and generated outputs preserved below.</span>
            </div>
          )}

          {/* Amended SOUL Interactive Flow Diagram */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider flex items-center">
                <Cpu className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                SOUL Execution Topology (Orchestrator v2.0)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Loop Guard: Max 1x/Pair</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-mono">
              <div className="flex items-center px-2 py-1 bg-indigo-50 border border-indigo-200 rounded text-indigo-700 font-medium">
                <Database className="w-3 h-3 mr-1" />
                1. Mem0 Search
              </div>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <div className="flex items-center px-2 py-1 bg-purple-50 border border-purple-200 rounded text-purple-700 font-medium">
                <Sparkles className="w-3 h-3 mr-1" />
                2.5. Divergence
              </div>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <div className="flex items-center px-2 py-1 bg-blue-50 border border-blue-200 rounded text-blue-700 font-medium">
                <Bot className="w-3 h-3 mr-1" />
                3. Research
              </div>
              <span className="text-[10px] text-amber-600 font-bold">⇄ (1x)</span>
              <div className="flex items-center px-2 py-1 bg-emerald-50 border border-emerald-200 rounded text-emerald-700 font-medium">
                <Bot className="w-3 h-3 mr-1" />
                4. Analysis
              </div>
              <span className="text-[10px] text-amber-600 font-bold">⇄ (1x)</span>
              <div className="flex items-center px-2 py-1 bg-amber-50 border border-amber-200 rounded text-amber-800 font-medium">
                <Bot className="w-3 h-3 mr-1" />
                5. Synthesis
              </div>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <div className="flex items-center px-2 py-1 bg-indigo-50 border border-indigo-200 rounded text-indigo-700 font-medium">
                <Database className="w-3 h-3 mr-1" />
                6. Mem0 Write
              </div>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <div className="flex items-center px-2 py-1 bg-purple-50 border border-purple-200 rounded text-purple-700 font-medium">
                <Sparkles className="w-3 h-3 mr-1" />
                7.5. Pattern Check
              </div>
            </div>
          </div>

          {/* Divergence Decision Callout if available */}
          {currentRun.divergenceDecision && (
            <div className="p-3.5 bg-purple-50/70 border border-purple-200/80 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-900 flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-purple-600" />
                  Orchestrator Step 2.5: Divergence Decision
                </span>
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-purple-200/70 text-purple-900">
                  {currentRun.divergenceDecision.isDivergent ? 'Multi-Facet Divergence' : 'Single Narrow Topic'}
                </span>
              </div>
              <p className="text-xs text-purple-950 font-medium">
                {currentRun.divergenceDecision.rationale}
              </p>
              {currentRun.divergenceDecision.subtopics && currentRun.divergenceDecision.subtopics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {currentRun.divergenceDecision.subtopics.map((sub, i) => (
                    <span key={i} className="text-[11px] bg-white px-2 py-0.5 rounded border border-purple-200 text-purple-800">
                      • {sub}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step list */}
          <div className="space-y-2.5">
            {currentRun.steps.map((step, idx) => {
              const isExpanded = expandedStepId === step.id;
              return (
                <div
                  key={step.id || idx}
                  className={`border rounded-lg transition-all ${
                    step.status === 'running'
                      ? 'border-indigo-300 bg-indigo-50/30'
                      : step.status === 'completed'
                      ? 'border-slate-200 bg-white'
                      : 'border-slate-100 bg-slate-50'
                  }`}
                >
                  <div
                    onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 rounded-lg select-none"
                  >
                    <div className="flex items-center space-x-3">
                      {step.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : step.status === 'running' ? (
                        <RefreshCw className="w-4 h-4 text-indigo-600 shrink-0 animate-spin" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      )}

                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-[11px] font-mono uppercase px-2 py-0.5 rounded border ${getAgentColor(step.agent)}`}>
                            {step.agent}
                          </span>
                          <span className="text-xs font-semibold text-slate-800">
                            {step.stepName}
                          </span>
                        </div>
                        {step.details && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{step.details}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-xs">
                      {step.tokens && (
                        <span className="font-mono text-slate-400 text-[11px] hidden sm:inline-block">
                          {step.tokens.totalTokens} tok (${step.tokens.estimatedCostUsd})
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded step details */}
                  {isExpanded && step.data && (
                    <div className="px-4 pb-3 pt-1 border-t border-slate-100 text-xs bg-slate-50/70 rounded-b-lg">
                      <div className="font-mono text-[11px] text-slate-700 bg-white p-2.5 rounded border border-slate-200 max-h-48 overflow-y-auto whitespace-pre-wrap">
                        {typeof step.data === 'string'
                          ? step.data
                          : JSON.stringify(step.data, null, 2)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Stats Bar */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center space-x-4">
              <span>Tokens: <strong className="text-slate-800 font-mono">{currentRun.tokenSummary.total.totalTokens}</strong></span>
              <span>Cost: <strong className="text-slate-800 font-mono">${currentRun.tokenSummary.total.estimatedCostUsd}</strong></span>
              <span>Mem0 Writes: <strong className="text-slate-800 font-mono">{currentRun.mem0Writes.length}</strong></span>
              <span>Callbacks: <strong className="text-slate-800 font-mono">{currentRun.callbacksExecuted.length}</strong></span>
            </div>
            <div className="text-[11px]">
              Started: {new Date(currentRun.startTime).toLocaleTimeString()}
              {currentRun.endTime && ` · Finished: ${new Date(currentRun.endTime).toLocaleTimeString()}`}
            </div>
          </div>
        </div>
      )}

      {/* Historical Runs Carousel */}
      {runHistory.length > 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Recent Research Executions ({runHistory.length})
          </h3>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {runHistory.map(r => (
              <div
                key={r.id}
                onClick={() => onSelectRun(r)}
                className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer border transition-colors ${
                  currentRun?.id === r.id
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-medium'
                    : 'bg-slate-50 border-slate-200/60 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="truncate mr-3">
                  <span className="font-semibold">{r.topic}</span>
                </div>
                <div className="flex items-center space-x-2 shrink-0 font-mono text-[11px] text-slate-400">
                  <span>{r.tokenSummary.total.totalTokens} tok</span>
                  <span>{new Date(r.startTime).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
