import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Plus,
  Trash2,
  Tag,
  RotateCcw,
  Sparkles,
  Check,
  Network,
  Radio,
  Server,
  Settings2,
  Activity,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Cpu,
  RefreshCw,
  Sliders,
  Shield,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Mem0Memory, GraphRelation, Mem0Config, Mem0ToolInfo } from '../types';
import { mem0Store } from '../services/mem0Store';

interface Mem0MemoryBankProps {
  onRefreshStats: () => void;
}

export const Mem0MemoryBank: React.FC<Mem0MemoryBankProps> = ({ onRefreshStats }) => {
  const [memories, setMemories] = useState<Mem0Memory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showToolsDrawer, setShowToolsDrawer] = useState(false);

  // Mem0 Config state
  const [config, setConfig] = useState<Mem0Config>({
    mode: 'mock',
    transport: 'HTTP',
    mcpUrl: 'http://localhost:8888/mcp/mcp',
    connected: true,
    latencyMs: 418,
    toolsDiscovered: 9,
    tools: [
      { name: 'add_memory_tool', description: 'Store a conversation or memory payload in Mem0.' },
      { name: 'search_memories_tool', description: 'Search stored memories using a natural-language query.' },
      { name: 'get_memory_tool', description: 'Fetch a single memory entry by its identifier.' },
      { name: 'get_all_memories_tool', description: 'List memories for a given user, agent, or run.' },
      { name: 'update_memory_tool', description: 'Update the text or metadata of an existing memory.' },
      { name: 'memory_history_tool', description: 'Fetch the history for a memory entry.' },
      { name: 'delete_memory_tool', description: 'Delete a single memory entry.' },
      { name: 'delete_all_memories_tool', description: 'Delete all memories for the provided identifier.' },
      { name: 'reset_memories_tool', description: 'Reset all memories stored by the Mem0 instance.' },
    ],
    statusMessage: 'Ready',
  });

  // Config edit state - only MEM0_MCP_URL from .env
  const [editMcpUrl, setEditMcpUrl] = useState('http://localhost:8888/mcp/mcp');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // New memory form state
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState<'preference' | 'finding' | 'insight' | 'graph_relation'>('preference');
  const [newTags, setNewTags] = useState('privacy, local-ai');
  const [newSource, setNewSource] = useState('Hermes-like agent');
  const [newRel, setNewRel] = useState('uses');
  const [newTarget, setNewTarget] = useState('Qwen 2.5');

  const fetchConfig = async () => {
    try {
      const data = mem0Store.getConfig();
      setConfig(data);
      setEditMcpUrl(data.mcpUrl || 'http://localhost:8888/mcp/mcp');
    } catch (e) {
      console.error('Failed to load Mem0 config', e);
    }
  };

  const fetchMemories = async () => {
    setLoading(true);
    try {
      const data = searchQuery.trim()
        ? await mem0Store.searchMemory(searchQuery.trim())
        : await mem0Store.listMemories(selectedCategory !== 'all' ? { category: selectedCategory } : undefined);
      setMemories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch memories', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [searchQuery, selectedCategory]);

  const handleModeToggle = async (newMode: 'mock' | 'real') => {
    try {
      const updated = await mem0Store.setConfig({ mode: newMode });
      setConfig(updated);
      fetchMemories();
      onRefreshStats();
    } catch (e) {
      console.error('Failed to switch Mem0 mode', e);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const data = await mem0Store.testConnection(editMcpUrl);
      setTestResult({ success: data.connected, message: data.message });
      fetchConfig();
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || 'Failed to ping MCP server' });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await mem0Store.setConfig({ mcpUrl: editMcpUrl });
      setConfig(updated);
      setShowConfigModal(false);
      fetchMemories();
      onRefreshStats();
    } catch (e) {
      console.error('Failed to save config', e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await mem0Store.deleteMemory(id);
      fetchMemories();
      onRefreshStats();
    } catch (e) {
      console.error('Failed to delete memory', e);
    }
  };

  const handleReset = async () => {
    if (!window.confirm(`Are you sure you want to reset all Mem0 memories (${config.mode.toUpperCase()} mode) to zero state?`)) return;
    try {
      await mem0Store.resetMemories();
      fetchMemories();
      onRefreshStats();
    } catch (e) {
      console.error('Failed to reset memories', e);
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const relations: GraphRelation[] =
      newSource && newRel && newTarget
        ? [{ source: newSource.trim(), relation: newRel.trim(), target: newTarget.trim() }]
        : [];

    const tags = newTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    try {
      await mem0Store.addMemories(
        [{ text: newText.trim(), category: newCategory, relations, tags }],
        'user'
      );
      setShowAddModal(false);
      setNewText('');
      fetchMemories();
      onRefreshStats();
    } catch (e) {
      console.error('Failed to add memory', e);
    }
  };

  // Collect all graph triples for visualization
  const allTriples: GraphRelation[] = [];
  memories.forEach(m => {
    if (m.relations) allTriples.push(...m.relations);
  });

  return (
    <div className="space-y-6">
      {/* Real vs Mock Mode & MCP Connection Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              config.mode === 'real'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                : 'bg-indigo-50 border border-indigo-200 text-indigo-600'
            }`}>
              {config.mode === 'real' ? <Server className="w-5 h-5" /> : <Database className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-slate-900">
                  Mem0 Long-Term Memory
                </h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                  config.mode === 'real'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {config.mode === 'real' ? 'Real MCP Server' : 'Mocked Store'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {config.mode === 'real'
                  ? `Connected to local machine MCP endpoint (${config.mcpUrl})`
                  : 'Operating with in-memory & local disk persistence for zero-dependency testing'}
              </p>
            </div>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center space-x-2">
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
              <button
                id="btn-toggle-mem0-mock"
                onClick={() => handleModeToggle('mock')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  config.mode === 'mock'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mocked (Local)
              </button>
              <button
                id="btn-toggle-mem0-real"
                onClick={() => handleModeToggle('real')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center space-x-1 ${
                  config.mode === 'real'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Server className="w-3 h-3" />
                <span>Real MCP Server</span>
              </button>
            </div>

            <button
              id="btn-mem0-config"
              onClick={() => setShowConfigModal(true)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              title="MCP Server Endpoint Settings"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real MCP Telemetry & Tool Discovery Bar */}
        <div className={`p-3.5 rounded-lg border text-xs font-mono transition-all ${
          config.mode === 'real'
            ? config.connected
              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
              : 'bg-amber-50/60 border-amber-200 text-amber-900'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="flex items-center space-x-1.5 font-sans font-semibold">
                <span className={`w-2 h-2 rounded-full ${
                  config.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`} />
                <span>Transport:</span>
                <span className="font-mono font-bold">HTTP → {config.mcpUrl}</span>
              </span>
              <span className="text-slate-500">Auth: none</span>
              <span className="flex items-center space-x-1 text-emerald-700 font-semibold">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Connected ({config.latencyMs || 418}ms)</span>
              </span>
              <span className="flex items-center space-x-1 font-semibold text-indigo-700">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Tools discovered: {config.toolsDiscovered || 9}</span>
              </span>
            </div>

            <div className="flex items-center space-x-2 font-sans">
              <button
                id="btn-toggle-tools-drawer"
                onClick={() => setShowToolsDrawer(!showToolsDrawer)}
                className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-semibold flex items-center space-x-1 shadow-2xs"
              >
                <span>{showToolsDrawer ? 'Hide MCP Tools' : 'Inspect 9 Tools'}</span>
                {showToolsDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              <button
                id="btn-test-mcp-ping"
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold flex items-center space-x-1 shadow-2xs transition-all disabled:opacity-50"
              >
                {testingConnection ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />}
                <span>{testingConnection ? 'Pinging...' : 'Ping Server'}</span>
              </button>
            </div>
          </div>

          {/* Collapsible Discovered 9 MCP Tools List */}
          {showToolsDrawer && (
            <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 font-sans flex items-center justify-between">
                <span>Discovered MCP Tool Definitions (9 Total)</span>
                <span className="font-mono text-slate-500 font-normal">JSON-RPC 2.0 / tools/call</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {config.tools.map((tool, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-white rounded-md border border-slate-200/90 flex flex-col justify-between space-y-1 shadow-2xs"
                  >
                    <div className="flex items-center space-x-1.5">
                      <Cpu className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="font-mono font-bold text-slate-900 text-xs">{tool.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-sans leading-normal">
                      {tool.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Controls & Memory Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center space-x-2">
            <button
              id="btn-add-memory"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Memory
            </button>
            <button
              id="btn-reset-mem0"
              onClick={handleReset}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-rose-600 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset Zero State
            </button>
          </div>

          <div className="flex items-center space-x-1 overflow-x-auto">
            {['all', 'preference', 'finding', 'insight', 'graph_relation'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                  selectedCategory === cat
                    ? 'bg-indigo-100 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            id="input-mem0-search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={`Search Mem0 memory via ${config.mode === 'real' ? 'search_memories_tool' : 'mock search'}...`}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Knowledge Graph Relations Overview if any exist */}
      {allTriples.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center space-x-2">
            <Network className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              Extracted Knowledge Graph Triples ({allTriples.length})
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {allTriples.map((rel, idx) => (
              <div
                key={idx}
                className="inline-flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg text-xs font-mono"
              >
                <span className="text-emerald-950 font-bold">{rel.source}</span>
                <span className="text-emerald-600 font-medium">──[{rel.relation}]──▶</span>
                <span className="text-indigo-700 font-bold">{rel.target}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Memories List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs font-mono">
            Searching Mem0 MCP Store ({config.mode.toUpperCase()})...
          </div>
        ) : memories.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
            <Database className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-700">
              Mem0 Long-Term Memory is Empty ({config.mode === 'real' ? 'Real MCP' : 'Mock'} Cold Start)
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Run research workflows or manually add memories. Durable findings and user preferences are automatically committed by the Orchestrator after each run.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {memories.map(mem => (
              <div
                key={mem.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-indigo-200 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {mem.category}
                      </span>
                      {mem.relevanceScore !== undefined && (
                        <span className="text-[11px] font-mono text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                          Score: {mem.relevanceScore}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(mem.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                      title="Delete memory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs font-medium text-slate-800 leading-relaxed mb-3">
                    {mem.text}
                  </p>

                  {mem.relations && mem.relations.length > 0 && (
                    <div className="mb-3 space-y-1 bg-slate-50 p-2 rounded border border-slate-100 font-mono text-[11px]">
                      {mem.relations.map((rel, rIdx) => (
                        <div key={rIdx} className="flex items-center space-x-1.5 text-slate-700">
                          <span className="font-semibold text-indigo-600">{rel.source}</span>
                          <span className="text-slate-400">→ [{rel.relation}] →</span>
                          <span className="font-semibold text-emerald-600">{rel.target}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center space-x-2">
                    <Tag className="w-3 h-3 text-slate-400" />
                    <span>{mem.tags?.join(', ') || 'general'}</span>
                  </div>
                  <span className="font-mono">{new Date(mem.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Add Memory ({config.mode === 'real' ? 'Real MCP add_memory_tool' : 'Mock Store'})
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMemory} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Memory Text</label>
                <textarea
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  placeholder="e.g. User prioritizes self-hosted local models and privacy above cloud speed."
                  rows={3}
                  required
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="preference">Preference</option>
                    <option value="finding">Finding</option>
                    <option value="insight">Insight</option>
                    <option value="graph_relation">Graph Relation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={e => setNewTags(e.target.value)}
                    className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <span className="text-[11px] font-semibold text-slate-700">Optional Graph Triple</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <input
                    type="text"
                    placeholder="Subject"
                    value={newSource}
                    onChange={e => setNewSource(e.target.value)}
                    className="p-1.5 text-[11px] border border-slate-200 rounded bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Relation"
                    value={newRel}
                    onChange={e => setNewRel(e.target.value)}
                    className="p-1.5 text-[11px] border border-slate-200 rounded bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Object"
                    value={newTarget}
                    onChange={e => setNewTarget(e.target.value)}
                    className="p-1.5 text-[11px] border border-slate-200 rounded bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Store Memory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MCP Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Server className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-semibold text-slate-900">Mem0 MCP Endpoint</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Local MCP Server URL (from .env / MEM0_MCP_URL)
                </label>
                <input
                  type="text"
                  value={editMcpUrl}
                  onChange={e => setEditMcpUrl(e.target.value)}
                  placeholder="http://localhost:8888/mcp/mcp"
                  className="w-full p-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Transport: HTTP → {editMcpUrl} (Auth: none)
                </p>
              </div>

              {testResult && (
                <div className={`p-3 rounded-lg text-xs font-mono flex items-start space-x-2 ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{testResult.message}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center space-x-1 transition-colors"
                >
                  {testingConnection ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                  <span>Test Connection</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowConfigModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Save & Apply
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
