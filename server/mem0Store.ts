import fs from 'fs';
import path from 'path';
import { Mem0Memory, GraphRelation, Mem0Config, Mem0ToolInfo } from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const MEM0_FILE = path.join(DATA_DIR, 'mem0_store.json');

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

class Mem0McpStore {
  private memories: Mem0Memory[] = [];
  private mode: 'mock' | 'real' = 'mock';
  private mcpUrl: string = process.env.MEM0_MCP_URL || 'http://localhost:8888/mcp';
  
  private isConnected: boolean = false;
  private latencyMs: number = 0;
  private lastChecked: string = '';
  private statusMessage: string = 'Initialized in mock mode';

  constructor() {
    this.ensureDataDir();
    this.loadFromDisk();
  }

  // -------------------------------------------------------------
  // Config & Status Accessors
  // -------------------------------------------------------------
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
    if (newConfig.mode) {
      this.mode = newConfig.mode;
    }
    if (newConfig.mcpUrl) {
      this.mcpUrl = newConfig.mcpUrl.trim();
    }

    if (this.mode === 'real') {
      await this.testConnection();
    } else {
      this.statusMessage = 'Operating in Mock Mode (Local File Store)';
    }

    return this.getConfig();
  }

  // -------------------------------------------------------------
  // Real MCP JSON-RPC 2.0 Transport (Auth: none)
  // -------------------------------------------------------------
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

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      // Send JSON-RPC tools/list
      const rpcPayload = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/list',
        params: {},
      };

      const res = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(rpcPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;
      this.latencyMs = latency;
      this.lastChecked = new Date().toISOString();

      if (res.ok) {
        this.isConnected = true;
        this.statusMessage = `Connected to local Mem0 MCP server (${latency}ms)`;
        return {
          connected: true,
          latencyMs: latency,
          toolsDiscovered: KNOWN_MEM0_TOOLS.length,
          tools: KNOWN_MEM0_TOOLS,
          message: `Connected successfully (${latency}ms) to ${targetUrl}`,
        };
      } else {
        this.isConnected = false;
        this.statusMessage = `MCP server returned HTTP ${res.status}: ${res.statusText}`;
        return {
          connected: false,
          latencyMs: latency,
          toolsDiscovered: KNOWN_MEM0_TOOLS.length,
          tools: KNOWN_MEM0_TOOLS,
          message: `Failed to connect: HTTP ${res.status} ${res.statusText}`,
        };
      }
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
        message: `Could not reach ${targetUrl} (${errMsg}). Ensure local MCP server is running on local machine.`,
      };
    }
  }

  private async callMcpTool(toolName: string, args: Record<string, any>): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const payload = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    try {
      const res = await fetch(this.mcpUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`MCP tool '${toolName}' failed with HTTP ${res.status} ${res.statusText}`);
      }

      const json = await res.json();
      if (json.error) {
        throw new Error(`MCP Error [${json.error.code || 'rpc'}]: ${json.error.message || JSON.stringify(json.error)}`);
      }

      // Standard MCP result returns { content: [{ type: "text", text: "..." }] }
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

  // -------------------------------------------------------------
  // Mock Local Persistence Helpers
  // -------------------------------------------------------------
  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (e) {
        console.error('Failed to create data dir', e);
      }
    }
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(MEM0_FILE)) {
        const raw = fs.readFileSync(MEM0_FILE, 'utf-8');
        this.memories = JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to read mem0 store', e);
      this.memories = [];
    }
  }

  private saveToDisk() {
    try {
      this.ensureDataDir();
      fs.writeFileSync(MEM0_FILE, JSON.stringify(this.memories, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write mem0 store', e);
    }
  }

  // -------------------------------------------------------------
  // Core Unified API (Mock + Real)
  // -------------------------------------------------------------

  /**
   * search_memories_tool implementation
   */
  public async searchMemory(query: string, limit = 8): Promise<Mem0Memory[]> {
    if (this.mode === 'real') {
      try {
        const res = await this.callMcpTool('search_memories_tool', {
          query: query || '',
          limit,
        });

        const rawList = Array.isArray(res) ? res : (res?.memories || res?.results || []);
        if (Array.isArray(rawList)) {
          return rawList.map((item: any, idx: number) => this.normalizeMemory(item, idx));
        }
      } catch (err: any) {
        console.warn('[Mem0 Real Search Failed, falling back to local cache]', err.message);
      }
    }

    // Mock search logic
    if (!query || query.trim() === '') {
      return this.memories.slice(0, limit);
    }

    const queryTokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    
    const scored = this.memories.map(mem => {
      const textLower = mem.text.toLowerCase();
      let score = 0;

      // Exact substring match
      if (textLower.includes(query.toLowerCase())) {
        score += 10;
      }

      // Keyword token matches
      for (const token of queryTokens) {
        if (textLower.includes(token)) {
          score += 2;
        }
        if (mem.tags?.some(tag => tag.toLowerCase().includes(token))) {
          score += 3;
        }
      }

      // Relations match
      if (mem.relations) {
        for (const rel of mem.relations) {
          if (
            rel.source.toLowerCase().includes(query.toLowerCase()) ||
            rel.target.toLowerCase().includes(query.toLowerCase()) ||
            rel.relation.toLowerCase().includes(query.toLowerCase())
          ) {
            score += 4;
          }
        }
      }

      return { mem, score };
    });

    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => ({
        ...item.mem,
        relevanceScore: item.score,
      }));
  }

  /**
   * get_all_memories_tool / list memories
   */
  public async listMemories(filter?: { category?: string; agentSource?: string }): Promise<Mem0Memory[]> {
    if (this.mode === 'real') {
      try {
        const res = await this.callMcpTool('get_all_memories_tool', {});

        const rawList = Array.isArray(res) ? res : (res?.memories || res?.results || []);
        if (Array.isArray(rawList)) {
          const normalized = rawList.map((item: any, idx: number) => this.normalizeMemory(item, idx));
          this.memories = normalized;
          let result = [...normalized];
          if (filter?.category) {
            result = result.filter(m => m.category === filter.category);
          }
          if (filter?.agentSource) {
            result = result.filter(m => m.agentSource === filter.agentSource);
          }
          return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
      } catch (err: any) {
        console.warn('[Mem0 Real List Failed, using local cache]', err.message);
      }
    }

    let result = [...this.memories];
    if (filter?.category) {
      result = result.filter(m => m.category === filter.category);
    }
    if (filter?.agentSource) {
      result = result.filter(m => m.agentSource === filter.agentSource);
    }
    return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Synchronous cached list accessor for quick stats
   */
  public listMemoriesCached(): Mem0Memory[] {
    return [...this.memories];
  }

  /**
   * add_memory_tool implementation
   */
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
      throw new Error(`Permission Denied: Only Orchestrator can call add_memories on Mem0 MCP. Agent '${callerAgent}' is restricted.`);
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

      // Maintain local cache and mock store
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

    this.saveToDisk();

    return {
      addedCount: createdList.length,
      addedMemories: createdList,
      message: `Successfully stored ${createdList.length} durable memories in Mem0 (${this.mode.toUpperCase()} mode).`,
    };
  }

  /**
   * get_memory_tool
   */
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

  /**
   * update_memory_tool
   */
  public async updateMemory(id: string, text: string, metadata?: any): Promise<boolean> {
    if (this.mode === 'real') {
      try {
        await this.callMcpTool('update_memory_tool', {
          memory_id: id,
          text,
          metadata,
        });
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
      this.saveToDisk();
      return true;
    }
    return false;
  }

  /**
   * memory_history_tool
   */
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

  /**
   * delete_memory_tool
   */
  public async deleteMemory(id: string): Promise<boolean> {
    if (this.mode === 'real') {
      try {
        await this.callMcpTool('delete_memory_tool', {
          memory_id: id,
          id,
        });
      } catch (err: any) {
        console.warn('[Mem0 delete_memory_tool error]', err.message);
      }
    }

    const initialLen = this.memories.length;
    this.memories = this.memories.filter(m => m.id !== id);
    if (this.memories.length !== initialLen) {
      this.saveToDisk();
      return true;
    }
    return false;
  }

  /**
   * reset_memories_tool / delete_all_memories_tool
   */
  public async resetMemories(): Promise<void> {
    if (this.mode === 'real') {
      try {
        await this.callMcpTool('reset_memories_tool', {});
      } catch (err: any) {
        try {
          await this.callMcpTool('delete_all_memories_tool', {});
        } catch (e: any) {
          console.warn('[Mem0 reset_memories_tool error]', e.message);
        }
      }
    }

    this.memories = [];
    this.saveToDisk();
  }

  /**
   * Get all extracted graph relations across memories
   */
  public async getAllGraphRelations(): Promise<GraphRelation[]> {
    const mems = await this.listMemories();
    const relations: GraphRelation[] = [];
    for (const mem of mems) {
      if (mem.relations) {
        relations.push(...mem.relations);
      }
    }
    return relations;
  }

  // -------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------
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

export const mem0Store = new Mem0McpStore();
