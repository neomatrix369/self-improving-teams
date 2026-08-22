import fs from 'fs';
import path from 'path';
import { Mem0Memory, GraphRelation } from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const MEM0_FILE = path.join(DATA_DIR, 'mem0_store.json');

class Mem0McpStore {
  private memories: Mem0Memory[] = [];

  constructor() {
    this.ensureDataDir();
    this.loadFromDisk();
  }

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

  /**
   * search_memory MCP tool implementation
   */
  public searchMemory(query: string, limit = 8): Mem0Memory[] {
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
   * list_memories MCP tool implementation
   */
  public listMemories(filter?: { category?: string; agentSource?: string }): Mem0Memory[] {
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
   * add_memories MCP tool implementation
   * Strictly enforces that only the Orchestrator has write permission per SOUL guidelines.
   */
  public addMemories(
    memoriesToAdd: Array<{
      text: string;
      category?: 'preference' | 'finding' | 'insight' | 'graph_relation' | 'system';
      relations?: GraphRelation[];
      tags?: string[];
    }>,
    callerAgent: string,
    runId?: string
  ): { addedCount: number; addedMemories: Mem0Memory[]; message: string } {
    if (callerAgent !== 'orchestrator' && callerAgent !== 'system' && callerAgent !== 'user') {
      throw new Error(`Permission Denied: Only Orchestrator can call add_memories on Mem0 MCP. Agent '${callerAgent}' is restricted.`);
    }

    const createdList: Mem0Memory[] = [];

    for (const item of memoriesToAdd) {
      if (!item.text || item.text.trim().length === 0) continue;

      // Deduplicate if identical memory exists
      const existing = this.memories.find(m => m.text.trim().toLowerCase() === item.text.trim().toLowerCase());
      if (existing) {
        // Update relations/tags if provided
        if (item.relations && item.relations.length > 0) {
          existing.relations = [...(existing.relations || []), ...item.relations];
        }
        if (item.tags && item.tags.length > 0) {
          existing.tags = Array.from(new Set([...(existing.tags || []), ...item.tags]));
        }
        createdList.push(existing);
        continue;
      }

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

      this.memories.push(newMem);
      createdList.push(newMem);
    }

    this.saveToDisk();

    return {
      addedCount: createdList.length,
      addedMemories: createdList,
      message: `Successfully stored ${createdList.length} durable memories in Mem0 MCP.`,
    };
  }

  /**
   * delete_memory MCP tool
   */
  public deleteMemory(id: string): boolean {
    const initialLen = this.memories.length;
    this.memories = this.memories.filter(m => m.id !== id);
    if (this.memories.length !== initialLen) {
      this.saveToDisk();
      return true;
    }
    return false;
  }

  /**
   * Reset memories to zero-state
   */
  public resetMemories(): void {
    this.memories = [];
    this.saveToDisk();
  }

  /**
   * Get all extracted graph relations across memories
   */
  public getAllGraphRelations(): GraphRelation[] {
    const relations: GraphRelation[] = [];
    for (const mem of this.memories) {
      if (mem.relations) {
        relations.push(...mem.relations);
      }
    }
    return relations;
  }
}

export const mem0Store = new Mem0McpStore();
