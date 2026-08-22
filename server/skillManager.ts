import fs from 'fs';
import path from 'path';
import { AgentType, AgentSkill, Mem0Memory } from '../src/types';
import { callGeminiModel } from './geminiClient';

const SKILLS_DIR = path.join(process.cwd(), 'skills');
const SKILLS_META_FILE = path.join(SKILLS_DIR, 'skills_meta.json');

interface SkillMetaRecord {
  agent: AgentType;
  version: number;
  updatedAt: string;
  triggerHistory: string[];
}

export class SkillManager {
  constructor() {
    this.ensureSkillsDir();
  }

  private ensureSkillsDir() {
    if (!fs.existsSync(SKILLS_DIR)) {
      try {
        fs.mkdirSync(SKILLS_DIR, { recursive: true });
      } catch (e) {
        console.error('Failed to create skills directory', e);
      }
    }
  }

  private getSkillFilePath(agent: AgentType): string {
    return path.join(SKILLS_DIR, `${agent}_skill.md`);
  }

  private getMetaRecords(): Record<string, SkillMetaRecord> {
    try {
      if (fs.existsSync(SKILLS_META_FILE)) {
        return JSON.parse(fs.readFileSync(SKILLS_META_FILE, 'utf-8'));
      }
    } catch (e) {
      console.error('Failed to read skills metadata', e);
    }
    return {};
  }

  private saveMetaRecords(records: Record<string, SkillMetaRecord>) {
    try {
      this.ensureSkillsDir();
      fs.writeFileSync(SKILLS_META_FILE, JSON.stringify(records, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save skills metadata', e);
    }
  }

  /**
   * Retrieves the current SKILL.md content for an agent if one exists
   */
  public getSkill(agent: AgentType): string | null {
    const filePath = this.getSkillFilePath(agent);
    if (fs.existsSync(filePath)) {
      try {
        return fs.readFileSync(filePath, 'utf-8');
      } catch (e) {
        console.error(`Failed to read skill file for ${agent}`, e);
      }
    }
    return null;
  }

  /**
   * Returns details about all registered agent skills
   */
  public getAllSkills(): AgentSkill[] {
    const agents: AgentType[] = ['orchestrator', 'research', 'analysis', 'synthesis'];
    const meta = this.getMetaRecords();

    return agents.map(agent => {
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

  /**
   * Evaluates accumulated memories and determines if an operational SKILL.md should be synthesized.
   * Modeled on AutoSkill's approach: pattern extraction, distillation into actionable rules, and layering.
   */
  public async patternCheckAndGenerate(
    agent: AgentType,
    accumulatedMemories: Mem0Memory[],
    runContext: {
      topic: string;
      outputSnippet: string;
    }
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
        const filePath = this.getSkillFilePath(agent);
        this.ensureSkillsDir();
        fs.writeFileSync(filePath, parsed.skillContent, 'utf-8');

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
      } else {
        return {
          created: false,
          skillSnippet: currentSkill || '',
          reason: parsed.reason || 'Pattern check complete. Existing instructions are sufficient.',
          version: meta[agent]?.version || 0,
        };
      }
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

  /**
   * Reset all agent SKILL.md files to cold start
   */
  public resetSkills(): void {
    const agents: AgentType[] = ['orchestrator', 'research', 'analysis', 'synthesis'];
    for (const agent of agents) {
      const filePath = this.getSkillFilePath(agent);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.error(`Failed to delete skill file for ${agent}`, e);
        }
      }
    }
    if (fs.existsSync(SKILLS_META_FILE)) {
      try {
        fs.unlinkSync(SKILLS_META_FILE);
      } catch (e) {
        console.error('Failed to delete skills metadata file', e);
      }
    }
  }
}

export const skillManager = new SkillManager();
