import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Download, Copy, Check, FileText, Search, Network, Sparkles, Database, AlertCircle } from 'lucide-react';
import { ResearchRun } from '../types';

interface ReportViewerProps {
  run: ResearchRun;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ run }) => {
  const [copied, setCopied] = useState(false);
  const [activeReportTab, setActiveReportTab] = useState<'synthesis' | 'research' | 'analysis' | 'graph'>('synthesis');

  const handleCopy = () => {
    const textToCopy =
      activeReportTab === 'synthesis'
        ? run.synthesisReport || ''
        : activeReportTab === 'research'
        ? run.researchBrief || ''
        : activeReportTab === 'analysis'
        ? run.analysisReport || ''
        : JSON.stringify(run.mem0Writes, null, 2);

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = run.synthesisReport || run.analysisReport || run.researchBrief || 'No report generated.';
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Research_Report_${run.topic.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Top action toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-semibold text-slate-800">
            {activeReportTab === 'synthesis'
              ? 'Final Synthesis Report'
              : activeReportTab === 'research'
              ? 'Research Agent Brief'
              : activeReportTab === 'analysis'
              ? 'Analysis Agent Reasoning'
              : 'Extracted Graph Relations'}
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {run.id} · {run.tokenSummary.total.totalTokens} tokens
          </span>
          {run.status === 'cancelled' && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
              STOPPED
            </span>
          )}
        </div>

        {/* View mode buttons */}
        <div className="flex items-center space-x-1 bg-slate-200/70 p-1 rounded-lg">
          <button
            id="tab-synthesis-report"
            onClick={() => setActiveReportTab('synthesis')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              activeReportTab === 'synthesis'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Synthesis Report
          </button>
          <button
            id="tab-research-brief"
            onClick={() => setActiveReportTab('research')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              activeReportTab === 'research'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Research Brief
          </button>
          <button
            id="tab-analysis-report"
            onClick={() => setActiveReportTab('analysis')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              activeReportTab === 'analysis'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Analysis Breakdown
          </button>
          <button
            id="tab-graph-relations"
            onClick={() => setActiveReportTab('graph')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              activeReportTab === 'graph'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Graph & Mem0
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            id="btn-copy-report"
            onClick={handleCopy}
            className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
            title="Copy content to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1 text-slate-500" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            id="btn-download-report"
            onClick={handleDownload}
            className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors"
            title="Download Report as .md file"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Download .md
          </button>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-6 overflow-y-auto flex-1 bg-white">
        {run.status === 'cancelled' && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start space-x-3">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-950">Orchestration Stopped by User</p>
              <p className="text-amber-800">
                The agent pipeline execution was stopped at will. All intermediate agent outputs, research briefs, analysis artifacts, and token metrics recorded before cancellation remain fully accessible via the tabs above.
              </p>
            </div>
          </div>
        )}
        {activeReportTab === 'synthesis' && (
          <div>
            {run.synthesisReport ? (
              <div className="prose prose-slate max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-indigo-600">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {run.synthesisReport}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">Synthesis report will be generated when pipeline completes.</p>
              </div>
            )}
          </div>
        )}

        {activeReportTab === 'research' && (
          <div>
            {run.researchBrief ? (
              <div className="prose prose-slate max-w-none prose-headings:font-semibold">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {run.researchBrief}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">Research brief will appear as soon as the Research Agent runs.</p>
              </div>
            )}
          </div>
        )}

        {activeReportTab === 'analysis' && (
          <div>
            {run.analysisReport ? (
              <div className="prose prose-slate max-w-none prose-headings:font-semibold">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {run.analysisReport}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Network className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">Analysis reasoning will appear when the Analysis Agent runs.</p>
              </div>
            )}
          </div>
        )}

        {activeReportTab === 'graph' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
                <Database className="w-4 h-4 mr-1.5 text-indigo-600" />
                Mem0 Long-Term Memories Committed This Run ({run.mem0Writes.length})
              </h3>
              {run.mem0Writes.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No durable memories written in this run yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {run.mem0Writes.map((m, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-mono uppercase font-semibold px-2 py-0.5 rounded bg-indigo-100/70 text-indigo-700">
                          {m.category}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(m.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium mb-2">{m.text}</p>
                      {m.relations && m.relations.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/60 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Graph Triples:</span>
                          {m.relations.map((rel, rIdx) => (
                            <div key={rIdx} className="text-xs font-mono bg-white px-2 py-1 rounded border border-slate-200 flex items-center space-x-1.5">
                              <span className="text-indigo-600 font-semibold">{rel.source}</span>
                              <span className="text-slate-400">→ [{rel.relation}] →</span>
                              <span className="text-emerald-600 font-semibold">{rel.target}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Loop-Guarded Callbacks Executed */}
            {run.callbacksExecuted.length > 0 && (
              <div className="pt-4 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center">
                  <Network className="w-4 h-4 mr-1.5 text-amber-600" />
                  Direct Agent-to-Agent Callbacks Executed ({run.callbacksExecuted.length})
                </h3>
                <div className="space-y-3">
                  {run.callbacksExecuted.map((cb, idx) => (
                    <div key={idx} className="p-3 bg-amber-50/50 border border-amber-200/70 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-amber-900 font-mono">
                          {cb.fromAgent.toUpperCase()} ➔ {cb.toAgent.toUpperCase()} (AgentTool)
                        </span>
                        <span className="text-[11px] text-amber-700 font-mono">
                          {cb.tokens.totalTokens} tokens (${cb.tokens.estimatedCostUsd})
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 mb-2">
                        <span className="font-semibold text-slate-700">Query: </span>"{cb.query}"
                      </div>
                      <div className="text-xs text-slate-700 bg-white p-2.5 rounded border border-amber-200/50 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {cb.response}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
