import { Mem0Memory, GraphRelation, Mem0Config, Mem0ToolInfo } from '../types';
import { readJSON, writeJSON } from './storage';

const STORAGE_KEY_MEMORIES = 'adk_mem0_memories';
const STORAGE_KEY_CONFIG = 'adk_mem0_config';

const KNOWN_MEM0_TOOLS: Mem0ToolInfo[] = [
  { name: 'add_memory_tool', description: 'Store a conversation or memory payload in Mem0.' },
  { name: 'search_memories_tool', description: 'Search stored memories using a natural-language query.' },
  { name: 'get_memory_tool', description: 'Fetch a single memory entry by its identifier.' },
  { name: 'get_all_memories_tool', description: 'List memories for a given user, agent, or run.' },
  { name: 'update_memory_tool', description: 'Update the text or metadata of an existing memory.' },
  { name: 'memory_history_tool', description: 'Fetch the history for a memory entry.' },
  { name: 'delete_memory_tool', description: 'Delete a single memory entry.' },
  { name: 'delete_all_memories_tool', description: 'Delete all memories for the provided identifier.' },
  { name: 'reset_memories_tool', description: 'Reset all memories stored by the Mem0 instance.' },
];

interface PersistedConfig {
  mode: 'mock' | 'real';
  mcpUrl: string;
}

class Mem0BrowserStore {
  private memories: Mem0Memory[] = [];
  private mode: 'mock' | 'real' = 'mock';
  private mcpUrl: string =
    (import.meta.env.VITE_MEM0_MCP_URL as string | undefined) || 'http://localhost:8888/mcp';

  private isConnected = false;
  private latencyMs = 0;
  private lastChecked = '';
  private statusMessage = 'Initialized in mock mode';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    this.memories = readJSON<Mem0Memory[]>(STORAGE_KEY_MEMORIES, []);
    const cfg = readJSON<PersistedConfig | null>(STORAGE_KEY_CONFIG, null);
    if (cfg) {
      this.mode = cfg.mode;
      if (cfg.mcpUrl) this.mcpUrl = cfg.mcpUrl;
    }
  }

  private saveMemoriesToStorage() {
    writeJSON(STORAGE_KEY_MEMORIES, this.memories);
  }

  private saveConfigToStorage() {
    writeJSON(STORAGE_KEY_CONFIG, { mode: this.mode, mcpUrl: this.mcpUrl });
  }

  public getConfig(): Mem0Config {
    return {
      mode: this.mode,
      transport: 'HTTP',
      mcpUrl: this.mcpUrl,
      connected: this.mode === 'mock' ? true : this.isConnected,
      latencyMs: this.mode === 'mock' ? 418 : this.latencyMs,
      toolsDiscovered: KNOWN_MEM0_TOOLS.length,
      tools: KNOWN_MEM0_TOOLS,
      statusMessage: this.statusMessage,
      lastChecked: this.lastChecked || new Date().toISOString(),
    };
  }

  public async setConfig(newConfig: Partial<Mem0Config>): Promise<Mem0Config> {
    if (newConfig.mode) this.mode = newConfig.mode;
    if (newConfig.mcpUrl) this.mcpUrl = newConfig.mcpUrl.trim();
    this.saveConfigToStorage();

    if (this.mode === 'real') {
      await this.testConnection();
    } else {
      this.statusMessage = 'Operating in Mock Mode (browser localStorage)';
    }
    return this.getConfig();
  }

  // Session-only override: sets the MCP URL and flips to real mode without persisting
  // anything to localStorage. Used by the startup key prompt so the URL disappears on refresh.
  public async setSessionMcpUrl(url: string): Promise<Mem0Config> {
    const trimmed = url.trim();
    if (!trimmed) return this.getConfig();
    this.mcpUrl = trimmed;
    this.mode = 'real';
    await this.testConnection();
    return this.getConfig();
  }

  public async testConnection(urlOverride?: string): Promise<{
    connected: boolean;
    latencyMs: number;
    toolsDiscovered: number;
    tools: Mem0ToolInfo[];
    message: string;
  }> {
    const targetUrl = urlOverride || this.mcpUrl;
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const rpcPayload = { jsonrpc: '2.0', id: Date.now(), method: 'tools/list', params: {} };
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(rpcPayload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const latency = Date.now() - startTime;
      this.latencyMs = latency;
      this.lastChecked = new Date().toISOString();

      if (res.ok) {
        this.isConnected = true;
        this.statusMessage = `Connected to Mem0 MCP server (${latency}ms)`;
        return {
          connected: true,
          latencyMs: latency,
          toolsDiscovered: KNOWN_MEM0_TOOLS.length,
          tools: KNOWN_MEM0_TOOLS,
          message: `Connected (${latency}ms) to ${targetUrl}`,
        };
      }
      this.isConnected = false;
      this.statusMessage = `MCP server returned HTTP ${res.status}: ${res.statusText}`;
      return {
        connected: false,
        latencyMs: latency,
        toolsDiscovered: KNOWN_MEM0_TOOLS.length,
        tools: KNOWN_MEM0_TOOLS,
        message: `Failed: HTTP ${res.status} ${res.statusText}`,
      };
    } catch (err: any) {
      const latency = Date.now() - startTime;
      this.latencyMs = latency;
      this.isConnected = false;
      this.lastChecked = new Date().toISOString();
      const errMsg = err.name === 'AbortError' ? 'Connection timed out (4s)' : err.message || 'Unknown network error';
      this.statusMessage = `Connection offline: ${errMsg}`;
      return {
        connected: false,
        latencyMs: latency,
        toolsDiscovered: KNOWN_MEM0_TOOLS.length,
        tools: KNOWN_MEM0_TOOLS,
        message: `Could not reach ${targetUrl} (${errMsg}). Note: browser CORS may block direct calls to your MCP server.`,
      };
    }
  }

  private async callMcpTool(toolName: string, args: Record<string, any>): Promise<any> {
    const payload = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: { name: toolName, arguments: args },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);
    try {
      const res = await fetch(this.mcpUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`MCP '${toolName}' failed HTTP ${res.status} ${res.statusText}`);

      const json = await res.json();
      if (json.error) throw new Error(`MCP Error [${json.error.code || 'rpc'}]: ${json.error.message || JSON.stringify(json.error)}`);

      if (json.result?.content && Array.isArray(json.result.content)) {
        const textContent = json.result.content.find((c: any) => c.type === 'text')?.text;
        if (textContent) {
          try {
            return JSON.parse(textContent);
          } catch {
            return textContent;
          }
        }
      }
      return json.result ?? json;
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn(`[Mem0 MCP call failed: ${toolName}]`, err.message);
      throw err;
    }
  }

  public async searchMemory(query: string, limit = 8): Promise<Mem0Memory[]> {
    if (this.mode === 'real') {
      try {
        const res = await this.callMcpTool('search_memories_tool', { query: query || '', limit });
        const rawList = Array.isArray(res) ? res : res?.memories || res?.results || [];
        if (Array.isArray(rawList)) return rawList.map((item, idx) => this.normalizeMemory(item, idx));
      } catch (err: any) {
        console.warn('[Mem0 Real Search Failed, falling back to local cache]', err.message);
      }
    }

    if (!query || query.trim() === '') return this.memories.slice(0, limit);

    const queryTokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    const scored = this.memories.map(mem => {
      const textLower = mem.text.toLowerCase();
      let score = 0;
      if (textLower.includes(query.toLowerCase())) score += 10;
      for (const token of queryTokens) {
        if (textLower.includes(token)) score += 2;
        if (mem.tags?.some(tag => tag.toLowerCase().includes(token))) score += 3;
      }
      if (mem.relations) {
        for (const rel of mem.relations) {
          if (
            rel.source.toLowerCase().includes(query.toLowerCase()) ||
            rel.target.toLowerCase().includes(query.toLowerCase()) ||
            rel.relation.toLowerCase().includes(query.toLowerCase())
          )
            score += 4;
        }
      }
      return { mem, score };
    });

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => ({ ...item.mem, relevanceScore: item.score }));
  }

  public async listMemories(filter?: { category?: string; agentSource?: string }): Promise<Mem0Memory[]> {
    if (this.mode === 'real') {
      try {
        const res = await this.callMcpTool('get_all_memories_tool', {});
        const rawList = Array.isArray(res) ? res : res?.memories || res?.results || [];
        if (Array.isArray(rawList)) {
          const normalized = rawList.map((item, idx) => this.normalizeMemory(item, idx));
          this.memories = normalized;
          this.saveMemoriesToStorage();
          let result = [...normalized];
          if (filter?.category) result = result.filter(m => m.category === filter.category);
          if (filter?.agentSource) result = result.filter(m => m.agentSource === filter.agentSource);
          return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
      } catch (err: any) {
        console.warn('[Mem0 Real List Failed, using local cache]', err.message);
      }
    }

    let result = [...this.memories];
    if (filter?.category) result = result.filter(m => m.category === filter.category);
    if (filter?.agentSource) result = result.filter(m => m.agentSource === filter.agentSource);
    return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public listMemoriesCached(): Mem0Memory[] {
    return [...this.memories];
  }

  public async addMemories(
    memoriesToAdd: Array<{
      text: string;
      category?: 'preference' | 'finding' | 'insight' | 'graph_relation' | 'system';
      relations?: GraphRelation[];
      tags?: string[];
    }>,
    callerAgent: string,
    runId?: string
  ): Promise<{ addedCount: number; addedMemories: Mem0Memory[]; message: string }> {
    if (callerAgent !== 'orchestrator' && callerAgent !== 'system' && callerAgent !== 'user') {
      throw new Error(`Permission Denied: Only Orchestrator can call add_memories. Agent '${callerAgent}' is restricted.`);
    }

    const createdList: Mem0Memory[] = [];

    for (const item of memoriesToAdd) {
      if (!item.text || item.text.trim().length === 0) continue;

      const newMem: Mem0Memory = {
        id: 'mem_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36),
        text: item.text.trim(),
        category: item.category || (item.relations && item.relations.length > 0 ? 'graph_relation' : 'insight'),
        relations: item.relations,
        agentSource: 'orchestrator',
        timestamp: new Date().toISOString(),
        runId,
        tags: item.tags || [],
      };

      if (this.mode === 'real') {
        try {
          await this.callMcpTool('add_memory_tool', {
            messages: [{ role: 'user', content: item.text.trim() }],
            metadata: {
              category: newMem.category,
              tags: newMem.tags,
              relations: newMem.relations,
              runId,
              agentSource: 'orchestrator',
            },
          });
        } catch (err: any) {
          console.warn('[Mem0 Real Add Tool Error, continuing to local store]', err.message);
        }
      }

      const existing = this.memories.find(m => m.text.trim().toLowerCase() === item.text.trim().toLowerCase());
      if (existing) {
        if (item.relations && item.relations.length > 0) {
          existing.relations = [...(existing.relations || []), ...item.relations];
        }
        if (item.tags && item.tags.length > 0) {
          existing.tags = Array.from(new Set([...(existing.tags || []), ...item.tags]));
        }
        createdList.push(existing);
      } else {
        this.memories.push(newMem);
        createdList.push(newMem);
      }
    }

    this.saveMemoriesToStorage();

    return {
      addedCount: createdList.length,
      addedMemories: createdList,
      message: `Stored ${createdList.length} durable memories in Mem0 (${this.mode.toUpperCase()} mode, browser).`,
    };
  }

  public async getMemory(id: string): Promise<Mem0Memory | null> {
    if (this.mode === 'real') {
      try {
        const res = await this.callMcpTool('get_memory_tool', { memory_id: id });
        if (res) return this.normalizeMemory(res, 0);
      } catch (err: any) {
        console.warn('[Mem0 get_memory_tool error]', err.message);
      }
    }
    return this.memories.find(m => m.id === id) || null;
  }

  public async updateMemory(id: string, text: string, metadata?: any): Promise<boolean> {
    if (this.mode === 'real') {
      try {
        await this.callMcpTool('update_memory_tool', { memory_id: id, text, metadata });
      } catch (err: any) {
        console.warn('[Mem0 update_memory_tool error]', err.message);
      }
    }
    const item = this.memories.find(m => m.id === id);
    if (item) {
      item.text = text;
      if (metadata?.category) item.category = metadata.category;
      if (metadata?.tags) item.tags = metadata.tags;
      if (metadata?.relations) item.relations = metadata.relations;
      this.saveMemoriesToStorage();
      return true;
    }
    return false;
  }

  public async getMemoryHistory(id: string): Promise<any> {
    if (this.mode === 'real') {
      try {
        return await this.callMcpTool('memory_history_tool', { memory_id: id });
      } catch (err: any) {
        console.warn('[Mem0 memory_history_tool error]', err.message);
      }
    }
    const mem = this.memories.find(m => m.id === id);
    return mem ? [{ timestamp: mem.timestamp, text: mem.text, event: 'created' }] : [];
  }

  public async deleteMemory(id: string): Promise<boolean> {
    if (this.mode === 'real') {
      try {
        await this.callMcpTool('delete_memory_tool', { memory_id: id, id });
      } catch (err: any) {
        console.warn('[Mem0 delete_memory_tool error]', err.message);
      }
    }
    const initialLen = this.memories.length;
    this.memories = this.memories.filter(m => m.id !== id);
    if (this.memories.length !== initialLen) {
      this.saveMemoriesToStorage();
      return true;
    }
    return false;
  }

  public async resetMemories(): Promise<void> {
    if (this.mode === 'real') {
      try {
        await this.callMcpTool('reset_memories_tool', {});
      } catch {
        try {
          await this.callMcpTool('delete_all_memories_tool', {});
        } catch (e: any) {
          console.warn('[Mem0 reset error]', e.message);
        }
      }
    }
    this.memories = [];
    this.saveMemoriesToStorage();
  }

  public async getAllGraphRelations(): Promise<GraphRelation[]> {
    const mems = await this.listMemories();
    const relations: GraphRelation[] = [];
    for (const mem of mems) if (mem.relations) relations.push(...mem.relations);
    return relations;
  }

  private normalizeMemory(item: any, fallbackIdx: number): Mem0Memory {
    const text = typeof item === 'string' ? item : item.text || item.memory || item.content || JSON.stringify(item);
    const id = item.id || item.memory_id || `mem_${fallbackIdx}_${Date.now().toString(36)}`;
    const metadata = item.metadata || item.meta || {};

    return {
      id: String(id),
      text: String(text),
      category: metadata.category || item.category || 'insight',
      relations: metadata.relations || item.relations || undefined,
      agentSource: metadata.agentSource || item.agentSource || 'orchestrator',
      timestamp: item.created_at || item.timestamp || metadata.timestamp || new Date().toISOString(),
      runId: metadata.runId || item.runId,
      tags: metadata.tags || item.tags || ['mcp-real'],
      relevanceScore: item.score || item.relevanceScore,
    };
  }
}

export const mem0Store = new Mem0BrowserStore();
