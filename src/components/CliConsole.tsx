import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Send, Trash2, HelpCircle, Sparkles, Play } from 'lucide-react';

interface CliConsoleProps {
  onWorkflowTriggered?: () => void;
}

export const CliConsole: React.FC<CliConsoleProps> = ({ onWorkflowTriggered }) => {
  const [commandInput, setCommandInput] = useState('');
  const [history, setHistory] = useState<Array<{ command: string; output: string; timestamp: string }>>([
    {
      command: 'help',
      output: `🤖 ADK Self-Improving Research Team CLI Interface
Connected to local Express server, Mem0 MCP store, and Gemini 3.7 Flash.

Available Commands:
  research --topic "<topic>" [--callback]   Run full multi-agent research workflow
  memory list                               List all stored Mem0 memories
  memory search "<query>"                   Search Mem0 long-term memory
  memory reset                              Clear all Mem0 memories to zero state
  skills list                               View active SKILL.md status for all agents
  skills reset                              Reset all SKILL.md files to cold start
  history                                   List previous research runs
  help                                      Show this help manual`,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  const executeCommand = async (cmdToRun?: string) => {
    const cmd = (cmdToRun || commandInput).trim();
    if (!cmd || loading) return;

    setLoading(true);
    setCommandInput('');
    setHistoryIndex(null);

    try {
      const res = await fetch('/api/cli/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });
      const data = await res.json();

      setHistory(prev => [
        ...prev,
        {
          command: cmd,
          output: data.output || 'No output returned.',
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);

      if (cmd.startsWith('research') && onWorkflowTriggered) {
        onWorkflowTriggered();
      }
    } catch (err: any) {
      setHistory(prev => [
        ...prev,
        {
          command: cmd,
          output: `CLI Error: ${err.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand();
    } else if (e.key === 'ArrowUp') {
      if (history.length === 0) return;
      const nextIdx = historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setCommandInput(history[nextIdx]?.command || '');
    } else if (e.key === 'ArrowDown') {
      if (historyIndex === null) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= history.length) {
        setHistoryIndex(null);
        setCommandInput('');
      } else {
        setHistoryIndex(nextIdx);
        setCommandInput(history[nextIdx]?.command || '');
      }
    }
  };

  const clearTerminal = () => {
    setHistory([]);
  };

  const quickCommands = [
    { label: 'Search Mem0', cmd: 'memory search "privacy"' },
    { label: 'List Skills', cmd: 'skills list' },
    { label: 'List Memories', cmd: 'memory list' },
    { label: 'Run Research', cmd: 'research --topic "Local AI Agents with Privacy" --callback' },
  ];

  return (
    <div className="bg-slate-950 rounded-xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[650px]">
      {/* Terminal Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
          </div>
          <span className="text-xs font-mono text-slate-400 ml-2 flex items-center">
            <Terminal className="w-3.5 h-3.5 mr-1 text-indigo-400" />
            adk-research-team@local-mcp:~$
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={clearTerminal}
            className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800 transition-colors flex items-center"
            title="Clear terminal log"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Clear
          </button>
        </div>
      </div>

      {/* Quick Command Ribbon */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-2 flex items-center gap-2 overflow-x-auto text-xs font-mono">
        <span className="text-slate-500 text-[11px]">Quick:</span>
        {quickCommands.map((q, idx) => (
          <button
            key={idx}
            onClick={() => executeCommand(q.cmd)}
            disabled={loading}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 text-[11px] whitespace-nowrap transition-colors"
          >
            $ {q.label}
          </button>
        ))}
      </div>

      {/* Terminal Output Area */}
      <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-slate-200 space-y-4">
        {history.map((item, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex items-center space-x-2 text-indigo-400">
              <span className="text-emerald-400 font-semibold">➜</span>
              <span className="text-slate-400">adk-team$</span>
              <span className="text-white font-semibold">{item.command}</span>
              <span className="text-[10px] text-slate-600 ml-auto">{item.timestamp}</span>
            </div>
            <pre className="text-slate-300 whitespace-pre-wrap pl-5 border-l-2 border-slate-800 py-1 leading-relaxed">
              {item.output}
            </pre>
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-2 text-amber-400 animate-pulse pl-5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span>Orchestrator & Agents executing command...</span>
          </div>
        )}

        <div ref={terminalEndRef} />
      </div>

      {/* Terminal Input Line */}
      <div className="bg-slate-900 border-t border-slate-800 p-3 flex items-center space-x-2">
        <span className="text-emerald-400 font-mono font-bold text-sm">➜</span>
        <input
          type="text"
          value={commandInput}
          onChange={e => setCommandInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type command (e.g. research --topic 'Local AI' --callback)..."
          disabled={loading}
          className="flex-1 bg-transparent border-none text-slate-100 font-mono text-xs focus:ring-0 focus:outline-none placeholder:text-slate-600"
          autoFocus
        />
        <button
          onClick={() => executeCommand()}
          disabled={loading || !commandInput.trim()}
          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs flex items-center transition-colors disabled:opacity-50"
        >
          <Send className="w-3 h-3 mr-1" />
          Run
        </button>
      </div>
    </div>
  );
};
