import React from 'react';
import {
  LayoutGrid,
  LayoutList,
  Terminal,
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle2,
  Database,
  Bot,
  Activity,
  Code2,
  FileText,
  Workflow,
  Shield,
  Eye,
  Sliders,
  X,
} from 'lucide-react';
import { UILayoutMode } from './Header';

interface LayoutsPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: UILayoutMode;
  onSelectMode: (mode: UILayoutMode) => void;
}

export const LayoutsPreviewModal: React.FC<LayoutsPreviewModalProps> = ({
  isOpen,
  onClose,
  currentMode,
  onSelectMode,
}) => {
  if (!isOpen) return null;

  const layoutVariants: {
    id: UILayoutMode;
    name: string;
    badge: string;
    tagline: string;
    description: string;
    icon: typeof LayoutGrid;
    previewComponent: React.ReactNode;
    features: string[];
  }[] = [
    {
      id: 'studio',
      name: 'Studio Dashboard',
      badge: 'Full Suite',
      tagline: 'Split-Screen Workspace with Integrated Memory & Skill Inspectors',
      description:
        'Designed for full multi-agent orchestration. View workflow inputs and live pipeline execution steps side-by-side with rich markdown reports, knowledge graphs, Mem0 stores, and AutoSkill evolution trackers.',
      icon: LayoutGrid,
      features: [
        'Interactive 2-column split layout with live stepping',
        'Direct tab navigation to Mem0 Memory Bank & Graph Triples',
        'AutoSkill evolution inspector with version diffing',
        'Token telemetry and prompt cache analytics',
      ],
      previewComponent: (
        <div className="w-full h-44 bg-slate-900 rounded-lg p-2.5 flex flex-col justify-between border border-slate-800 font-mono text-[10px] text-slate-300 select-none pointer-events-none">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-slate-400">
            <div className="flex items-center space-x-1.5">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-300 font-semibold ml-1">Studio View</span>
            </div>
            <div className="flex space-x-2 text-[9px]">
              <span className="text-indigo-400 font-bold border-b border-indigo-400">Workflow</span>
              <span className="text-slate-500">Mem0</span>
              <span className="text-slate-500">Skills</span>
              <span className="text-slate-500">Tokens</span>
            </div>
          </div>
          <div className="grid grid-cols-12 gap-2 flex-1 pt-2">
            {/* Left Col Mock */}
            <div className="col-span-5 bg-slate-800/80 rounded p-1.5 flex flex-col justify-between border border-slate-700">
              <div className="space-y-1">
                <div className="h-2 w-3/4 bg-indigo-500/40 rounded" />
                <div className="h-3 w-full bg-slate-700 rounded" />
                <div className="flex items-center space-x-1 text-[8px] text-slate-400 pt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Divergence: 2 Sub-topics</span>
                </div>
              </div>
              <div className="space-y-0.5 pt-1 text-[8px]">
                <div className="bg-slate-900/80 px-1 py-0.5 rounded text-indigo-300 flex justify-between">
                  <span>[RESEARCH] Fact Finding</span>
                  <span>100%</span>
                </div>
                <div className="bg-slate-900/80 px-1 py-0.5 rounded text-emerald-300 flex justify-between">
                  <span>[ANALYSIS] Triples Extracted</span>
                  <span>⇄ 1x</span>
                </div>
              </div>
            </div>
            {/* Right Col Mock */}
            <div className="col-span-7 bg-slate-800/80 rounded p-1.5 flex flex-col justify-between border border-slate-700">
              <div className="flex justify-between items-center pb-1 border-b border-slate-700 text-[8px]">
                <span className="font-bold text-slate-200"># Autonomous Synthesis Report</span>
                <span className="bg-indigo-900 text-indigo-300 px-1 rounded text-[7px]">Markdown</span>
              </div>
              <div className="space-y-1 flex-1 pt-1">
                <div className="h-1.5 w-full bg-slate-600/60 rounded" />
                <div className="h-1.5 w-5/6 bg-slate-600/60 rounded" />
                <div className="h-1.5 w-4/6 bg-slate-600/60 rounded" />
                <div className="p-1 bg-slate-900/60 rounded border border-slate-700/60 text-[7px] text-indigo-300 flex justify-between">
                  <span>• Framework A: 94.2% Privacy</span>
                  <span>• Scalability: High</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'minimal',
      name: 'Minimal Form',
      badge: 'Classic Single-Page',
      tagline: 'Focused Research Input & Linear Publication Output',
      description:
        'A distraction-free, single-column interface. Perfect for quick research tasks, straightforward document creation, and immediate Markdown export without peripheral dashboards.',
      icon: LayoutList,
      features: [
        'Centred single-column form with preset query templates',
        'Loop-guarded callback toggle & cold-start reset controls',
        'Step-by-step collapsible execution log feed',
        'One-click Markdown report copy and download',
      ],
      previewComponent: (
        <div className="w-full h-44 bg-slate-100 rounded-lg p-2.5 flex flex-col justify-between border border-slate-300 font-sans text-[10px] text-slate-700 select-none pointer-events-none">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
            <span className="font-bold text-slate-800 text-[11px]">Autonomous Research Portal</span>
            <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[8px]">Minimal Form</span>
          </div>
          <div className="space-y-1.5 flex-1 pt-1.5">
            <div className="bg-white p-2 rounded border border-slate-200 shadow-xs space-y-1">
              <div className="text-[8px] font-semibold text-slate-500 uppercase">Research Query:</div>
              <div className="h-4 bg-slate-50 border border-slate-200 rounded text-[8px] px-1 flex items-center text-slate-600">
                Self-Hosted AI Inference Privacy Frameworks...
              </div>
              <div className="flex justify-between items-center pt-0.5">
                <span className="text-[7px] text-slate-400">☑ Guarded Callbacks (Max 1x)</span>
                <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[8px] font-semibold">
                  ▶ Submit Request
                </span>
              </div>
            </div>
            <div className="bg-white p-1.5 rounded border border-slate-200 text-[8px] space-y-0.5">
              <div className="flex justify-between text-slate-700 font-medium">
                <span>✓ Pipeline Completed (3 Agents)</span>
                <span className="text-emerald-600 font-bold">1,840 tok</span>
              </div>
              <div className="text-slate-500 truncate text-[7px]">
                Report compiled with 4 citations and 3 Mem0 memory triples.
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'terminal',
      name: 'Developer Terminal',
      badge: 'CLI & RPC First',
      tagline: 'Interactive Shell with Live JSON-RPC MCP Stream & Telemetry',
      description:
        'Engineered for developers and engineers. Run research directly via CLI commands (`research "..."`, `mem0 list`, `skills diff`), test raw agent tool calls, and monitor ADK system metrics.',
      icon: Terminal,
      features: [
        'Full interactive Unix-style terminal console',
        'Direct Mem0 MCP query and memory inspection commands',
        'AutoSkill version inspection and hot-patching',
        'Side telemetry panel with token counters and protocol status',
      ],
      previewComponent: (
        <div className="w-full h-44 bg-slate-950 rounded-lg p-2.5 flex flex-col justify-between border border-slate-800 font-mono text-[9px] text-emerald-400 select-none pointer-events-none">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1 text-slate-400">
            <span className="text-slate-300 font-semibold">adk-cli@gemini-research:~</span>
            <span className="text-emerald-400 font-bold text-[8px]">● ONLINE</span>
          </div>
          <div className="grid grid-cols-12 gap-1.5 flex-1 pt-1.5">
            <div className="col-span-8 bg-black/60 rounded p-1.5 border border-slate-800 text-[8px] text-slate-300 space-y-0.5 overflow-hidden">
              <div className="text-slate-400">$ research "Local LLM Frameworks"</div>
              <div className="text-indigo-400">&gt; mem0_search: 6 memories retrieved</div>
              <div className="text-purple-400">&gt; divergence: single_focus=false (2 facets)</div>
              <div className="text-emerald-400">&gt; synthesis: complete (1,420 tokens)</div>
              <div className="text-slate-500 animate-pulse">$ _</div>
            </div>
            <div className="col-span-4 bg-slate-900/90 rounded p-1.5 border border-slate-800 text-[7px] text-slate-300 space-y-1">
              <div className="text-indigo-400 font-bold border-b border-slate-800 pb-0.5">TELEMETRY</div>
              <div>Mem0: 12 recs</div>
              <div>Skills: 3 active</div>
              <div>LLM: Gemini 3.7</div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <span>UI Layout Switcher & Visual Preview</span>
              </h3>
              <p className="text-xs text-slate-500">
                Choose the interface layout that best fits your current workflow and device.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content / Layout Cards */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {layoutVariants.map(variant => {
              const Icon = variant.icon;
              const isSelected = currentMode === variant.id;

              return (
                <div
                  key={variant.id}
                  onClick={() => {
                    onSelectMode(variant.id);
                  }}
                  className={`flex flex-col justify-between rounded-xl border-2 transition-all p-4 cursor-pointer relative group ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/20 shadow-md ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 flex items-center space-x-1 px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Active</span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <div
                        className={`p-1.5 rounded-lg ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">
                          {variant.name}
                        </h4>
                        <span className="text-[10px] text-indigo-600 font-medium font-mono">
                          {variant.badge}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mb-3 min-h-[36px]">
                      {variant.tagline}
                    </p>

                    {/* Visual Preview Graphic */}
                    <div className="mb-4">{variant.previewComponent}</div>

                    {/* Features list */}
                    <ul className="space-y-1.5 text-[11px] text-slate-600 mb-4">
                      {variant.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start space-x-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      onSelectMode(variant.id);
                      onClose();
                    }}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                    }`}
                  >
                    <span>{isSelected ? 'Currently Selected' : `Switch to ${variant.name}`}</span>
                    {!isSelected && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-1">
            <Sliders className="w-4 h-4 text-slate-400" />
            <span>Layouts switch instantly with full state & memory preservation.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
