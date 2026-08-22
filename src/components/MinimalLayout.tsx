import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Play,
  RotateCcw,
  RefreshCw,
  CheckCircle2,
  Clock,
  Database,
  Cpu,
  Sparkles,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ResearchRun } from '../types';

interface MinimalLayoutProps {
  currentRun: ResearchRun | null;
  isRunning: boolean;
  onStartResearch: (topic: string, options: { triggerCallbackDemo: boolean }) => void;
  onResetColdStart: () => void;
  mem0Count: number;
  skillsCount: number;
}

export const MinimalLayout: React.FC<MinimalLayoutProps> = ({
  currentRun,
  isRunning,
  onStartResearch,
  onResetColdStart,
  mem0Count,
  skillsCount,
}) => {
  const [topic, setTopic] = useState('Local AI Agents: Privacy-Preserving Self-Hosted Inference Frameworks');
  const [triggerCallback, setTriggerCallback] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showLogs, setShowLogs] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || isRunning) return;
    onStartResearch(topic.trim(), { triggerCallbackDemo: triggerCallback });
  };

  const handleCopy = () => {
    if (!currentRun?.synthesisReport) return;
    navigator.clipboard.writeText(currentRun.synthesisReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!currentRun?.synthesisReport) return;
    const blob = new Blob([currentRun.synthesisReport], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Research_${currentRun.topic.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 25)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Minimal Flask-Style Form Container */}
      <div className="bg-white rounded-xl border border-slate-300 p-6 shadow-sm">
        <div className="border-b border-slate-200 pb-4 mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Autonomous Multi-Agent Research System
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Classic Form Interface · Mem0 MCP: {mem0Count} memories · Active Skills: {skillsCount}
            </p>
          </div>
          <button
            type="button"
            onClick={onResetColdStart}
            className="text-xs text-slate-500 hover:text-rose-600 flex items-center space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Cold Start</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="minimal-topic" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Research Query / Topic:
            </label>
            <textarea
              id="minimal-topic"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              rows={2}
              disabled={isRunning}
              className="w-full p-3 text-sm font-sans bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-800 focus:outline-none"
              placeholder="Enter subject for autonomous investigation..."
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={triggerCallback}
                onChange={e => setTriggerCallback(e.target.checked)}
                className="rounded text-slate-900 focus:ring-slate-800"
              />
              <span>Enable Loop-Guarded Agent Callbacks (Max 1x per pair)</span>
            </label>

            <button
              type="submit"
              disabled={isRunning || !topic.trim()}
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm disabled:opacity-50 flex items-center space-x-2"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Executing Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Submit Research Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Live Stepper Feed */}
      {currentRun && (
        <div className="bg-white rounded-xl border border-slate-300 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Execution Pipeline Status:
              </span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-mono font-semibold ${
                  currentRun.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : currentRun.status === 'running'
                    ? 'bg-amber-100 text-amber-800 animate-pulse'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {currentRun.status.toUpperCase()}
              </span>
            </div>

            <button
              onClick={() => setShowLogs(!showLogs)}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1"
            >
              <span>{showLogs ? 'Hide Steps' : 'Show Steps'}</span>
              {showLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Divergence banner */}
          {currentRun.divergenceDecision && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded text-xs">
              <span className="font-bold text-purple-900">Step 2.5 Divergence Decision: </span>
              <span className="text-purple-800">{currentRun.divergenceDecision.rationale}</span>
            </div>
          )}

          {/* Steps Timeline */}
          {showLogs && (
            <div className="space-y-2">
              {currentRun.steps.map((step, idx) => (
                <div
                  key={step.id || idx}
                  className="flex items-start space-x-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono"
                >
                  {step.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : step.status === 'running' ? (
                    <RefreshCw className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5 animate-spin" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        [{step.agent.toUpperCase()}] {step.stepName}
                      </span>
                      {step.tokens && (
                        <span className="text-[10px] text-slate-400">
                          {step.tokens.totalTokens} tok
                        </span>
                      )}
                    </div>
                    {step.details && (
                      <p className="text-slate-600 mt-0.5 text-[11px] font-sans">{step.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Report Display */}
          {currentRun.synthesisReport && (
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Final Markdown Research Report</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopy}
                    className="px-2.5 py-1 rounded text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 flex items-center space-x-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="px-2.5 py-1 rounded text-xs bg-slate-900 text-white hover:bg-slate-800 flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              <div className="p-6 bg-slate-50/50 rounded-xl border border-slate-300 prose prose-slate max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {currentRun.synthesisReport}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
