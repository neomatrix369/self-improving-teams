import React from 'react';
import {
  Activity,
  Coins,
  Cpu,
  Layers,
  TrendingUp,
  PieChart as PieChartIcon,
  Bot,
  Sparkles,
} from 'lucide-react';
import { ResearchRun, RunTokenSummary } from '../types';

interface TokenAnalyticsProps {
  currentRun: ResearchRun | null;
  runHistory: ResearchRun[];
}

export const TokenAnalytics: React.FC<TokenAnalyticsProps> = ({ currentRun, runHistory }) => {
  // Aggregate lifetime metrics across runs
  const totalTokensAllRuns = runHistory.reduce(
    (acc, r) => acc + (r.tokenSummary?.total?.totalTokens || 0),
    0
  );
  const totalCostAllRuns = runHistory.reduce(
    (acc, r) => acc + (r.tokenSummary?.total?.estimatedCostUsd || 0),
    0
  );
  const avgTokensPerRun =
    runHistory.length > 0 ? Math.round(totalTokensAllRuns / runHistory.length) : 0;

  const currentSummary: RunTokenSummary = currentRun?.tokenSummary || {
    orchestrator: { promptTokens: 0, candidateTokens: 0, totalTokens: 0, estimatedCostUsd: 0 },
    research: { promptTokens: 0, candidateTokens: 0, totalTokens: 0, estimatedCostUsd: 0 },
    analysis: { promptTokens: 0, candidateTokens: 0, totalTokens: 0, estimatedCostUsd: 0 },
    synthesis: { promptTokens: 0, candidateTokens: 0, totalTokens: 0, estimatedCostUsd: 0 },
    callbacks: { promptTokens: 0, candidateTokens: 0, totalTokens: 0, estimatedCostUsd: 0 },
    total: { promptTokens: 0, candidateTokens: 0, totalTokens: 0, estimatedCostUsd: 0 },
  };

  const agentBreakdown = [
    {
      name: 'Orchestrator',
      desc: 'Context retrieval, divergence decision, memory commit & skill pattern check',
      color: 'bg-purple-600',
      textColor: 'text-purple-700',
      bgColor: 'bg-purple-50',
      data: currentSummary.orchestrator,
    },
    {
      name: 'Research Agent',
      desc: 'Subtopic investigation, fact finding, development tracking',
      color: 'bg-blue-600',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50',
      data: currentSummary.research,
    },
    {
      name: 'Analysis Agent',
      desc: 'Knowledge graph reasoning, concept connections & continuity evaluation',
      color: 'bg-emerald-600',
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      data: currentSummary.analysis,
    },
    {
      name: 'Synthesis Agent',
      desc: 'Final structured user-facing markdown research report',
      color: 'bg-amber-600',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      data: currentSummary.synthesis,
    },
    {
      name: 'AgentTool Callbacks',
      desc: 'Direct worker-to-worker loop-guarded follow-up calls',
      color: 'bg-rose-500',
      textColor: 'text-rose-700',
      bgColor: 'bg-rose-50',
      data: currentSummary.callbacks,
    },
  ];

  const totalTokensCurrent = Math.max(1, currentSummary.total.totalTokens);

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Run Tokens</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {currentSummary.total.totalTokens.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Prompt: {currentSummary.total.promptTokens.toLocaleString()} · Output: {currentSummary.total.candidateTokens.toLocaleString()}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Estimated Run Cost</span>
            <Coins className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            ${currentSummary.total.estimatedCostUsd.toFixed(5)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Gemini 3.7 Flash pricing
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Lifetime Tokens</span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {totalTokensAllRuns.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Across {runHistory.length} total research executions
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Cost / Report</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            ${runHistory.length > 0 ? (totalCostAllRuns / runHistory.length).toFixed(4) : '0.0000'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            ~{avgTokensPerRun.toLocaleString()} tokens per run
          </div>
        </div>
      </div>

      {/* Visual Token Distribution Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center">
            <PieChartIcon className="w-4 h-4 mr-1.5 text-indigo-600" />
            Token Distribution by Agent Component (Current Run)
          </h3>
          <span className="text-xs font-mono text-slate-500">
            {currentSummary.total.totalTokens} Total Tokens
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex">
          {agentBreakdown.map((item, idx) => {
            const pct = Math.max(0, (item.data.totalTokens / totalTokensCurrent) * 100);
            if (pct === 0) return null;
            return (
              <div
                key={idx}
                style={{ width: `${pct}%` }}
                className={`${item.color} h-full transition-all`}
                title={`${item.name}: ${item.data.totalTokens} tokens (${pct.toFixed(1)}%)`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
          {agentBreakdown.map((item, idx) => (
            <div key={idx} className="flex items-center space-x-1.5 text-xs">
              <span className={`w-2.5 h-2.5 rounded-full ${item.color} shrink-0`}></span>
              <span className="text-slate-600 truncate">{item.name}</span>
              <span className="font-mono text-slate-400 text-[11px]">
                {((item.data.totalTokens / totalTokensCurrent) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Agent Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Detailed Telemetry Breakdown</h3>
          <span className="text-xs text-slate-500">Captured via Gemini Usage Metadata</span>
        </div>

        <div className="divide-y divide-slate-100">
          {agentBreakdown.map((item, idx) => (
            <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${item.bgColor} ${item.textColor} mt-0.5`}>
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">{item.name}</div>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </div>

              <div className="flex items-center space-x-6 text-xs font-mono shrink-0 pl-11 sm:pl-0">
                <div>
                  <div className="text-slate-400 text-[10px] uppercase">Prompt</div>
                  <div className="font-semibold text-slate-700">{item.data.promptTokens.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase">Candidate</div>
                  <div className="font-semibold text-slate-700">{item.data.candidateTokens.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase">Total</div>
                  <div className="font-bold text-slate-900">{item.data.totalTokens.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[10px] uppercase">Cost (USD)</div>
                  <div className="font-bold text-emerald-600">${item.data.estimatedCostUsd.toFixed(5)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
