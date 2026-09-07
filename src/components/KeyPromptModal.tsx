import React, { useState } from 'react';
import { KeyRound, Shield, ExternalLink, Eye, EyeOff } from 'lucide-react';

interface KeyPromptModalProps {
  onSubmit: (values: { geminiKey: string; mem0McpUrl: string }) => void;
}

export const KeyPromptModal: React.FC<KeyPromptModalProps> = ({ onSubmit }) => {
  const [geminiKey, setGeminiKey] = useState('');
  const [mem0McpUrl, setMem0McpUrl] = useState('');
  const [showGemini, setShowGemini] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!geminiKey.trim()) return;
    onSubmit({ geminiKey: geminiKey.trim(), mem0McpUrl: mem0McpUrl.trim() });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Provide your API keys</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              This app runs entirely in your browser and needs a Gemini key to call the model.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 flex items-start space-x-2">
          <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-900 leading-relaxed">
            <span className="font-semibold">We don't store your keys.</span> They stay in memory in this
            tab and are cleared when you refresh or close it. Requests go directly from your browser to
            Google's Gemini API (and your Mem0 MCP endpoint, if you set one).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-700">
                Gemini API Key <span className="text-rose-500">*</span>
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-indigo-600 hover:text-indigo-700 flex items-center space-x-0.5"
              >
                <span>Get a key</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <div className="relative">
              <input
                type={showGemini ? 'text' : 'password'}
                value={geminiKey}
                onChange={e => setGeminiKey(e.target.value)}
                placeholder="AIza..."
                autoFocus
                autoComplete="off"
                className="w-full pl-3 pr-10 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowGemini(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label={showGemini ? 'Hide key' : 'Show key'}
              >
                {showGemini ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Mem0 MCP URL <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={mem0McpUrl}
              onChange={e => setMem0McpUrl(e.target.value)}
              placeholder="http://localhost:8888/mcp — leave blank to use mock storage"
              autoComplete="off"
              className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              If your Mem0 MCP server is running, paste its URL here. Otherwise memories are kept in
              this browser's local storage (mock mode).
            </p>
          </div>

          <div className="flex items-center justify-end pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={!geminiKey.trim()}
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              Continue for this session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
