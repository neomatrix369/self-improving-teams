import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Sparkles,
  Bot,
  RotateCcw,
  RefreshCw,
  FileCode,
  History,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { AgentSkill, AgentType } from '../types';

interface SkillsInspectorProps {
  onRefreshStats: () => void;
}

export const SkillsInspector: React.FC<SkillsInspectorProps> = ({ onRefreshStats }) => {
  const [skills, setSkills] = useState<AgentSkill[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('research');
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<any>(null);

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/skills');
      const data = await res.json();
      setSkills(data);
    } catch (e) {
      console.error('Failed to fetch skills', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleResetSkills = async () => {
    if (!window.confirm('Reset all generated SKILL.md files back to cold-start state?')) return;
    try {
      await fetch('/api/skills/reset', { method: 'POST' });
      fetchSkills();
      onRefreshStats();
      setEvalResult(null);
    } catch (e) {
      console.error('Failed to reset skills', e);
    }
  };

  const handleManualCheck = async () => {
    setEvaluating(true);
    setEvalResult(null);
    try {
      const res = await fetch('/api/skills/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: selectedAgent,
          topic: 'Manual Pattern Evaluation',
          outputSnippet: 'Recent agent output synthesis',
        }),
      });
      const data = await res.json();
      setEvalResult(data);
      fetchSkills();
      onRefreshStats();
    } catch (e: any) {
      setEvalResult({ error: e.message });
    } finally {
      setEvaluating(false);
    }
  };

  const currentSkill = skills.find(s => s.agent === selectedAgent);

  const agentDescriptions: Record<AgentType, string> = {
    orchestrator: 'Coordinates workflow, divergence decision (Step 2.5), Mem0 commits, and triggers AutoSkill evolution.',
    research: 'Information discovery specialist. Investigates subtopics, discovers facts, sources, and proposes Mem0 candidates.',
    analysis: 'Reasoning and knowledge-connection specialist. Connects findings to Mem0 history, detects contradictions and graph triples.',
    synthesis: 'Final communication layer. Compiles authoritative markdown reports tailored to user context and preferences.',
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-semibold text-slate-900">
                  Autonomous AutoSkill Evolution Engine (SKILL.md)
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-100/70 text-purple-700 font-semibold">
                  Orchestrator Step 7.5
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Analyzes accumulated Mem0 history & outputs, generates operational guidelines, and layers them at run start
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="btn-manual-pattern-check"
              onClick={handleManualCheck}
              disabled={evaluating}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 shadow-xs transition-colors disabled:opacity-50"
            >
              {evaluating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" />
                  Evaluating AutoSkill...
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 mr-1" />
                  Evaluate Pattern Check
                </>
              )}
            </button>
            <button
              id="btn-reset-skills"
              onClick={handleResetSkills}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-rose-600 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset All Skills
            </button>
          </div>
        </div>

        {/* Agent Selector Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(['research', 'analysis', 'synthesis', 'orchestrator'] as AgentType[]).map(agent => {
            const sk = skills.find(s => s.agent === agent);
            const isSelected = selectedAgent === agent;
            const hasSkill = sk && sk.version > 0 && sk.content.trim().length > 0;

            return (
              <button
                key={agent}
                onClick={() => {
                  setSelectedAgent(agent);
                  setEvalResult(null);
                }}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-purple-600 bg-purple-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold uppercase font-mono text-slate-800">
                    {agent}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      hasSkill
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {hasSkill ? `v${sk.version}` : 'Cold Start'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 line-clamp-1">
                  {hasSkill ? 'Active & Layered' : 'Base SOUL only'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Check Feedback Alert */}
      {evalResult && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
          <div className="flex items-center space-x-2 text-xs font-semibold text-purple-900">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>AutoSkill Evaluation Result for {selectedAgent.toUpperCase()}:</span>
          </div>
          <p className="text-xs text-purple-800 font-medium">
            {evalResult.reason || (evalResult.created ? 'New SKILL.md synthesized.' : 'Pattern check complete.')}
          </p>
        </div>
      )}

      {/* Selected Agent Skill View */}
      {currentSkill && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <FileCode className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-semibold text-slate-800">
                  {currentSkill.name}
                </h3>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                  Version: {currentSkill.version > 0 ? `v${currentSkill.version}` : 'Cold Start (0)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {agentDescriptions[selectedAgent]}
              </p>
            </div>

            {currentSkill.updatedAt && (
              <div className="text-xs text-slate-400 font-mono">
                Updated: {new Date(currentSkill.updatedAt).toLocaleString()}
              </div>
            )}
          </div>

          <div className="p-6 space-y-6">
            {/* Skill Content Display */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Active SKILL.md (Layered on top of {selectedAgent.toUpperCase()}_SOUL.md)
              </h4>
              {currentSkill.content ? (
                <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-xs max-h-72 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner border border-slate-800">
                  {currentSkill.content}
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  <AlertCircle className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-600 font-medium">
                    No custom SKILL.md generated yet for {selectedAgent.toUpperCase()} (Cold Start).
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    The agent operates strictly from its base SOUL prompt. When research workflows accumulate patterns in Mem0, the Orchestrator autonomously generates this agent's operational guidelines.
                  </p>
                </div>
              )}
            </div>

            {/* Pattern Check Evolution History */}
            {currentSkill.triggerHistory && currentSkill.triggerHistory.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center">
                  <History className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  Evolution Trigger Log
                </h4>
                <div className="space-y-1.5">
                  {currentSkill.triggerHistory.map((trig, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono text-slate-700 flex items-start space-x-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{trig}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
