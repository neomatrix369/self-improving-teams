import { AgentType, AgentSkill, Mem0Memory } from '../types';
import { callGeminiModel } from './gemini';
import { readJSON, writeJSON, removeKey } from './storage';

const STORAGE_KEY_META = 'adk_skills_meta';
const SKILL_KEY_PREFIX = 'adk_skill_';
const AGENTS: AgentType[] = ['orchestrator', 'research', 'analysis', 'synthesis'];

interface SkillMetaRecord {
  agent: AgentType;
  version: number;
  updatedAt: string;
  triggerHistory: string[];
}

class SkillManager {
  private getSkillKey(agent: AgentType): string {
    return SKILL_KEY_PREFIX + agent;
  }

  private getMetaRecords(): Record<string, SkillMetaRecord> {
    return readJSON<Record<string, SkillMetaRecord>>(STORAGE_KEY_META, {});
  }

  private saveMetaRecords(records: Record<string, SkillMetaRecord>) {
    writeJSON(STORAGE_KEY_META, records);
  }

  public getSkill(agent: AgentType): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(this.getSkillKey(agent));
  }

  public getAllSkills(): AgentSkill[] {
    const meta = this.getMetaRecords();
    return AGENTS.map(agent => {
      const content = this.getSkill(agent);
      const m = meta[agent] || {
        agent,
        version: content ? 1 : 0,
        updatedAt: content ? new Date().toISOString() : '',
        triggerHistory: [],
      };
      return {
        agent,
        name: `${agent.charAt(0).toUpperCase() + agent.slice(1)} Autonomous Skill`,
        version: m.version,
        updatedAt: m.updatedAt,
        content: content || '',
        triggerHistory: m.triggerHistory || [],
      };
    });
  }

  public async patternCheckAndGenerate(
    agent: AgentType,
    accumulatedMemories: Mem0Memory[],
    runContext: { topic: string; outputSnippet: string }
  ): Promise<{ created: boolean; skillSnippet: string; reason: string; version: number }> {
    if (accumulatedMemories.length === 0 && !runContext.outputSnippet) {
      return {
        created: false,
        skillSnippet: '',
        reason: 'Insufficient memory history or output to derive repeatable skill patterns.',
        version: 0,
      };
    }

    const currentSkill = this.getSkill(agent);
    const memoriesText = accumulatedMemories
      .map(m => `- [${m.category}] ${m.text} ${m.relations ? `(Relations: ${JSON.stringify(m.relations)})` : ''}`)
      .join('\n');

    const prompt = `You are the AutoSkill pattern extractor for the '${agent}' agent in a persistent personal research system.
Evaluate the accumulated Mem0 memories and the recent run context to decide if there are repeatable behavioral patterns, user preferences, or specialized operational guidelines that should be codified into this agent's SKILL.md.

Accumulated Mem0 Memories:
${memoriesText || '(No prior memories)'}

Recent Run Topic:
${runContext.topic}

Recent Agent Output Snippet:
${runContext.outputSnippet.slice(0, 1500)}

Existing SKILL.md (if any):
${currentSkill || '(None - Cold Start)'}

CRITERIA FOR SKILL GENERATION:
1. Identify persistent user preferences (e.g. privacy-first, local self-hosted models, rigorous citation standards, benchmark focus).
2. Identify repeatable structural habits (e.g. structured knowledge-graph triples, specific comparative matrices).
3. If new patterns or updates to existing patterns are discovered, synthesize a concise, high-impact Markdown operational guideline.
4. Keep guidelines actionable, concrete, and under 250 words.

OUTPUT FORMAT (JSON):
{
  "shouldUpdate": true | false,
  "reason": "Clear 1-2 sentence explanation of why a pattern was detected or why existing skills suffice.",
  "skillContent": "# ${agent.toUpperCase()} Operational Skill Guidelines\\n\\n..." (The complete updated SKILL.md markdown text)
}`;

    try {
      const result = await callGeminiModel(
        'You are an expert AI agent capability compiler and AutoSkill evaluator. Output valid JSON only.',
        prompt,
        { responseMimeType: 'application/json' }
      );

      const parsed = JSON.parse(result.text.trim());
      const meta = this.getMetaRecords();

      if (parsed.shouldUpdate && parsed.skillContent) {
        localStorage.setItem(this.getSkillKey(agent), parsed.skillContent);

        const currentMeta = meta[agent] || {
          agent,
          version: 0,
          updatedAt: new Date().toISOString(),
          triggerHistory: [],
        };

        const newVersion = currentMeta.version + 1;
        meta[agent] = {
          agent,
          version: newVersion,
          updatedAt: new Date().toISOString(),
          triggerHistory: [
            ...(currentMeta.triggerHistory || []),
            `v${newVersion} triggered on '${runContext.topic}': ${parsed.reason}`,
          ],
        };
        this.saveMetaRecords(meta);

        return {
          created: true,
          skillSnippet: parsed.skillContent,
          reason: parsed.reason,
          version: newVersion,
        };
      }

      return {
        created: false,
        skillSnippet: currentSkill || '',
        reason: parsed.reason || 'Pattern check complete. Existing instructions are sufficient.',
        version: meta[agent]?.version || 0,
      };
    } catch (e: any) {
      console.error(`Skill pattern check failed for ${agent}:`, e);
      return {
        created: false,
        skillSnippet: currentSkill || '',
        reason: `Pattern check error: ${e.message}`,
        version: 0,
      };
    }
  }

  public resetSkills(): void {
    for (const agent of AGENTS) {
      removeKey(this.getSkillKey(agent));
    }
    removeKey(STORAGE_KEY_META);
  }
}

export const skillManager = new SkillManager();
