import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Plus,
  Trash2,
  Share2,
  Tag,
  Clock,
  RotateCcw,
  Sparkles,
  Check,
  Network,
} from 'lucide-react';
import { Mem0Memory, GraphRelation } from '../types';

interface Mem0MemoryBankProps {
  onRefreshStats: () => void;
}

export const Mem0MemoryBank: React.FC<Mem0MemoryBankProps> = ({ onRefreshStats }) => {
  const [memories, setMemories] = useState<Mem0Memory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New memory form state
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState<'preference' | 'finding' | 'insight' | 'graph_relation'>('preference');
  const [newTags, setNewTags] = useState('privacy, local-ai');
  const [newSource, setNewSource] = useState('Hermes');
  const [newRel, setNewRel] = useState('uses');
  const [newTarget, setNewTarget] = useState('Qwen 2.5');

  const fetchMemories = async () => {
    setLoading(true);
    try {
      const url = searchQuery.trim()
        ? `/api/mem0/memories?q=${encodeURIComponent(searchQuery.trim())}`
        : selectedCategory !== 'all'
        ? `/api/mem0/memories?category=${encodeURIComponent(selectedCategory)}`
        : '/api/mem0/memories';
      const res = await fetch(url);
      const data = await res.json();
      setMemories(data);
    } catch (e) {
      console.error('Failed to fetch memories', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [searchQuery, selectedCategory]);

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/mem0/memory/${id}`, { method: 'DELETE' });
      fetchMemories();
      onRefreshStats();
    } catch (e) {
      console.error('Failed to delete memory', e);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all Mem0 memories to cold-start zero state?')) return;
    try {
      await fetch('/api/mem0/reset', { method: 'POST' });
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
      await fetch('/api/mem0/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newText.trim(),
          category: newCategory,
          relations,
          tags,
        }),
      });
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
      {/* Header & Stats Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Self-Hosted Mem0 MCP Long-Term Memory
              </h2>
              <p className="text-xs text-slate-500">
                Persistent store accessed by Orchestrator, Research, Analysis, and Synthesis via MCP tools
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="btn-add-memory"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors"
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
              Reset (Cold Start)
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              id="input-mem0-search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Mem0 memory (simulates search_memory MCP tool)..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
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
            Searching Mem0 MCP Store...
          </div>
        ) : memories.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
            <Database className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-700">Mem0 Long-Term Memory is Empty (Cold Start)</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Run research workflows or manually add memories. Durable findings and user preferences are automatically stored by the Orchestrator after each run.
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
              <h3 className="text-sm font-semibold text-slate-900">Add Memory to Mem0 MCP</h3>
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
    </div>
  );
};
