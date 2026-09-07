import {
  AgentType,
  ResearchRun,
  AgentStepEvent,
  AgentCallbackExecution,
  AgentTokenUsage,
  RunTokenSummary,
  DivergenceDecision,
  SkillUpdateInfo,
} from '../types';
import { mem0Store } from './mem0Store';
import { skillManager } from './skillManager';
import { callGeminiModel, calculateCost } from './gemini';
import { getSoul } from './souls';
import { readJSON, writeJSON } from './storage';

const STORAGE_KEY_HISTORY = 'adk_run_history';
const MAX_HISTORY = 25;

export type RunProgressListener = (run: ResearchRun) => void;

export interface ExecuteResearchOptions {
  triggerCallbackDemo?: boolean;
  forcePatternCheck?: boolean;
  onProgress?: RunProgressListener;
}

class AgentOrchestrator {
  private activeRuns: Map<string, ResearchRun> = new Map();
  private runHistory: ResearchRun[] = [];
  private cancelledRuns: Set<string> = new Set();

  constructor() {
    this.runHistory = readJSON<ResearchRun[]>(STORAGE_KEY_HISTORY, []);
  }

  private persistHistory() {
    writeJSON(STORAGE_KEY_HISTORY, this.runHistory.slice(0, MAX_HISTORY));
  }

  public stopResearch(runId?: string): { success: boolean; message: string; stoppedRunIds: string[] } {
    const stoppedRunIds: string[] = [];

    if (runId) {
      if (this.activeRuns.has(runId)) {
        this.cancelledRuns.add(runId);
        stoppedRunIds.push(runId);
        const run = this.activeRuns.get(runId);
        if (run) {
          run.status = 'cancelled';
          run.error = 'Orchestration stopped by user request.';
          this.addStepEvent(run, 'system', 'Pipeline Terminated', 'failed', 'Orchestration manually stopped by user.');
        }
      }
    } else {
      for (const [id, run] of this.activeRuns.entries()) {
        this.cancelledRuns.add(id);
        stoppedRunIds.push(id);
        run.status = 'cancelled';
        run.error = 'Orchestration stopped by user request.';
        this.addStepEvent(run, 'system', 'Pipeline Terminated', 'failed', 'Orchestration manually stopped by user.');
      }
    }

    return {
      success: stoppedRunIds.length > 0,
      message:
        stoppedRunIds.length > 0
          ? `Successfully sent stop signal to ${stoppedRunIds.length} active run(s).`
          : 'No active runs were found to stop.',
      stoppedRunIds,
    };
  }

  private checkAborted(runId: string, run: ResearchRun) {
    if (this.cancelledRuns.has(runId) || run.status === 'cancelled') {
      throw new Error('ORCHESTRATION_CANCELLED_BY_USER');
    }
  }

  private getAgentInstruction(agent: AgentType): string {
    const baseSoul = getSoul(agent);
    const existingSkill = skillManager.getSkill(agent);
    if (existingSkill && existingSkill.trim().length > 0) {
      return `${baseSoul}\n\n---\n## ACTIVE LAYERED SKILL (Reloaded from ${agent.toUpperCase()}_SKILL.md)\n${existingSkill}\n---\n`;
    }
    return baseSoul;
  }

  public getRun(runId: string): ResearchRun | undefined {
    return this.activeRuns.get(runId) || this.runHistory.find(r => r.id === runId);
  }

  public getAllRuns(): ResearchRun[] {
    const active = Array.from(this.activeRuns.values());
    const combined = [...active, ...this.runHistory.filter(r => !this.activeRuns.has(r.id))];
    return combined.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  private notify(run: ResearchRun, listener?: RunProgressListener) {
    if (!listener) return;
    // Structured clone so React sees a new reference for state updates.
    listener(structuredClone(run));
  }

  private addStepEvent(
    run: ResearchRun,
    agent: AgentType | 'system' | 'mem0_mcp',
    stepName: string,
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped',
    details?: string,
    data?: any,
    tokens?: AgentTokenUsage
  ): AgentStepEvent {
    const step: AgentStepEvent = {
      id: 'step_' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      agent,
      stepName,
      status,
      details,
      data,
      tokens,
    };
    run.steps.push(step);
    return step;
  }

  private createZeroUsage(): AgentTokenUsage {
    return { promptTokens: 0, candidateTokens: 0, totalTokens: 0, estimatedCostUsd: 0 };
  }

  private combineUsage(u1: AgentTokenUsage, u2: AgentTokenUsage): AgentTokenUsage {
    const prompt = u1.promptTokens + u2.promptTokens;
    const candidate = u1.candidateTokens + u2.candidateTokens;
    return {
      promptTokens: prompt,
      candidateTokens: candidate,
      totalTokens: prompt + candidate,
      estimatedCostUsd: calculateCost(prompt, candidate),
    };
  }

  public async executeResearch(topic: string, options?: ExecuteResearchOptions): Promise<ResearchRun> {
    const listener = options?.onProgress;
    const runId = 'run_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);

    const initialTokenSummary: RunTokenSummary = {
      orchestrator: this.createZeroUsage(),
      research: this.createZeroUsage(),
      analysis: this.createZeroUsage(),
      synthesis: this.createZeroUsage(),
      callbacks: this.createZeroUsage(),
      total: this.createZeroUsage(),
    };

    const run: ResearchRun = {
      id: runId,
      topic,
      userQuery: topic,
      status: 'running',
      startTime: new Date().toISOString(),
      callbacksExecuted: [],
      mem0Writes: [],
      skillUpdates: [],
      tokenSummary: initialTokenSummary,
      steps: [],
    };

    this.activeRuns.set(runId, run);
    this.notify(run, listener);

    const loopGuard = {
      analysisToResearchCallbacks: 0,
      synthesisToAnalysisCallbacks: 0,
      maxCallbacksPerPair: 1,
      orchestratorRevisionCycles: 0,
      maxRevisionCycles: 3,
    };

    try {
      // STEP 1: Retrieve Mem0 context
      this.checkAborted(runId, run);
      this.addStepEvent(run, 'mem0_mcp', 'search_memories_tool', 'running', `Searching long-term memory for topic: "${topic}"`);
      this.notify(run, listener);
      const retrievedMemories = await mem0Store.searchMemory(topic, 8);
      const allGraphRelations = await mem0Store.getAllGraphRelations();
      const allMemsCount = (await mem0Store.listMemories()).length;

      this.addStepEvent(
        run,
        'mem0_mcp',
        'search_memories_tool',
        'completed',
        retrievedMemories.length > 0
          ? `Retrieved ${retrievedMemories.length} relevant memories from Mem0 MCP.`
          : 'Cold start: No prior memories found in Mem0 MCP.',
        { retrievedMemories, totalStored: allMemsCount }
      );
      this.notify(run, listener);

      const memoryContextText =
        retrievedMemories.length > 0
          ? retrievedMemories.map(m => `- [${m.category}] ${m.text}`).join('\n')
          : '(None - Zero prior context / cold start)';

      // STEP 2.5: Divergence Decision
      this.checkAborted(runId, run);
      this.addStepEvent(run, 'orchestrator', 'Divergence Decision (Step 2.5)', 'running', 'Orchestrator evaluating single topic vs multi-subtopic divergence...');
      this.notify(run, listener);
      const orchInstruction = this.getAgentInstruction('orchestrator');

      const divergencePrompt = `You are the Research Orchestrator.
User research request: "${topic}"

Relevant long-term memories retrieved:
${memoryContextText}

Perform Step 2.5 of your mission: Make an explicit divergence decision yourself — determine if this is a single, narrow topic or requires breaking down into multiple distinct sub-topics for the Research Agent.

Output valid JSON only in the following format:
{
  "isDivergent": true | false,
  "rationale": "Clear 1-2 sentence justification for single topic or multi-faceted divergence.",
  "subtopics": ["Subtopic 1", "Subtopic 2", ...]
}`;

      const divergenceResult = await callGeminiModel(orchInstruction, divergencePrompt, {
        responseMimeType: 'application/json',
      });
      this.checkAborted(runId, run);

      let divergenceData: DivergenceDecision;
      try {
        divergenceData = JSON.parse(divergenceResult.text.trim());
      } catch {
        divergenceData = {
          isDivergent: true,
          rationale: 'Topic encompasses multiple architectural and operational dimensions.',
          subtopics: [topic, `${topic} architectural patterns`, `${topic} state of the art & trade-offs`],
        };
      }

      run.divergenceDecision = divergenceData;
      run.tokenSummary.orchestrator = this.combineUsage(run.tokenSummary.orchestrator, divergenceResult.usage);

      this.addStepEvent(
        run,
        'orchestrator',
        'Divergence Decision (Step 2.5)',
        'completed',
        divergenceData.isDivergent
          ? `Divergence Decision: Multi-subtopic investigation (${divergenceData.subtopics.length} facets).`
          : `Divergence Decision: Single focused investigation.`,
        divergenceData,
        divergenceResult.usage
      );
      this.notify(run, listener);

      // STEP 3: Research Agent
      this.checkAborted(runId, run);
      this.addStepEvent(run, 'research', 'Investigation & Fact Discovery', 'running', 'Research Agent investigating subtopics and identifying developments...');
      this.notify(run, listener);
      const researchInstruction = this.getAgentInstruction('research');

      const researchPrompt = `You are the Research Agent.
Research Question: "${topic}"
Orchestrator Divergence Scope:
- Divergence Type: ${divergenceData.isDivergent ? 'Multi-faceted Subtopics' : 'Single Deep Topic'}
- Subtopics to cover: ${JSON.stringify(divergenceData.subtopics)}
- Divergence Rationale: ${divergenceData.rationale}

Relevant Prior Context (from Mem0 MCP):
${memoryContextText}

Execute your mission and produce a structured Research Brief conforming to your Output section (# Research Brief, ## Research Question, ## Relevant Prior Context, ## Key Findings, ## Recent Developments, ## Contradictions, ## Uncertainties, ## Research Gaps, ## Sources, ## Recommendations for Further Research, ## Potential Mem0 Memories).
Never fabricate sources or speculate as fact.`;

      const researchResult = await callGeminiModel(researchInstruction, researchPrompt);
      this.checkAborted(runId, run);
      run.researchBrief = researchResult.text;
      run.tokenSummary.research = this.combineUsage(run.tokenSummary.research, researchResult.usage);
      this.addStepEvent(
        run,
        'research',
        'Investigation & Fact Discovery',
        'completed',
        'Research Brief generated with key findings, developments, and potential Mem0 candidates.',
        { preview: researchResult.text.slice(0, 300) + '...' },
        researchResult.usage
      );
      this.notify(run, listener);

      // STEP 4: Analysis -> Research callback (optional)
      let researchFindingsForAnalysis = researchResult.text;

      if (options?.triggerCallbackDemo && loopGuard.analysisToResearchCallbacks < loopGuard.maxCallbacksPerPair) {
        this.checkAborted(runId, run);
        loopGuard.analysisToResearchCallbacks += 1;

        const callbackQuery = `Please provide a specialized, deeper breakdown with specific benchmark metrics or protocol details regarding "${topic}" to validate architectural viability.`;
        this.addStepEvent(
          run,
          'analysis',
          'AgentTool Callback -> Research Agent',
          'running',
          `Analysis invoked Research Agent tool (Callback Guard: ${loopGuard.analysisToResearchCallbacks}/${loopGuard.maxCallbacksPerPair}): "${callbackQuery}"`
        );
        this.notify(run, listener);

        const callbackPrompt = `You are the Research Agent being called via direct AgentTool callback by the Analysis Agent.
Follow-up Question: "${callbackQuery}"
Original Context: "${topic}"

Provide a concise, evidence-driven supplemental fact sheet with concrete details and benchmarks.`;

        const callbackResult = await callGeminiModel(researchInstruction, callbackPrompt);
        this.checkAborted(runId, run);
        const callbackTokens = callbackResult.usage;
        run.tokenSummary.callbacks = this.combineUsage(run.tokenSummary.callbacks, callbackTokens);

        const callbackExec: AgentCallbackExecution = {
          fromAgent: 'analysis',
          toAgent: 'research',
          reason: 'Insufficient empirical benchmarks in initial research brief to draw definitive conclusion.',
          query: callbackQuery,
          response: callbackResult.text,
          tokens: callbackTokens,
          timestamp: new Date().toISOString(),
        };
        run.callbacksExecuted.push(callbackExec);
        researchFindingsForAnalysis += `\n\n### Supplemental Callback Research:\n${callbackResult.text}`;

        this.addStepEvent(
          run,
          'analysis',
          'AgentTool Callback -> Research Agent',
          'completed',
          `Callback completed successfully (Guard enforced: ${loopGuard.analysisToResearchCallbacks}/${loopGuard.maxCallbacksPerPair}).`,
          callbackExec,
          callbackTokens
        );
        this.notify(run, listener);
      }

      // STEP 5: Analysis Agent
      this.checkAborted(runId, run);
      this.addStepEvent(run, 'analysis', 'Reasoning & Knowledge Graph Connection', 'running', 'Analysis Agent synthesizing findings, changes, and knowledge graph relations...');
      this.notify(run, listener);
      const analysisInstruction = this.getAgentInstruction('analysis');

      const analysisPrompt = `You are the Analysis Agent.
Original Request: "${topic}"
Relevant Prior Mem0 Context:
${memoryContextText}

Existing Knowledge Graph Relations in Mem0:
${allGraphRelations.length > 0 ? JSON.stringify(allGraphRelations, null, 2) : '(None yet)'}

Research Findings:
${researchFindingsForAnalysis}

Perform your mission: Determine what changed, what remains true, how concepts relate, what conclusions are supported, what gaps remain, and knowledge graph triples (e.g. A -> uses/depends_on/enables/competes_with -> B).
Produce your structured # Analysis output with ## Research Context, ## New Information, ## Changes, ## Connections, ## Insights, ## Contradictions, ## Knowledge Gaps, ## Recommended Next Steps, and ## Potential Mem0 Updates (including relationship triples).`;

      const analysisResult = await callGeminiModel(analysisInstruction, analysisPrompt);
      this.checkAborted(runId, run);
      run.analysisReport = analysisResult.text;
      run.tokenSummary.analysis = this.combineUsage(run.tokenSummary.analysis, analysisResult.usage);
      this.addStepEvent(
        run,
        'analysis',
        'Reasoning & Knowledge Graph Connection',
        'completed',
        'Analysis completed with concept connections, knowledge-graph triples, and continuity evaluation.',
        { preview: analysisResult.text.slice(0, 300) + '...' },
        analysisResult.usage
      );
      this.notify(run, listener);

      // STEP 6: Synthesis -> Analysis callback (optional)
      let analysisFindingsForSynthesis = analysisResult.text;

      if (options?.triggerCallbackDemo && loopGuard.synthesisToAnalysisCallbacks < loopGuard.maxCallbacksPerPair) {
        this.checkAborted(runId, run);
        loopGuard.synthesisToAnalysisCallbacks += 1;

        const synthCallbackQuery = `Clarify the concrete mechanism connecting the privacy/self-hosted aspects to local execution before stating final conclusions.`;
        this.addStepEvent(
          run,
          'synthesis',
          'AgentTool Callback -> Analysis Agent',
          'running',
          `Synthesis invoked Analysis Agent tool (Callback Guard: ${loopGuard.synthesisToAnalysisCallbacks}/${loopGuard.maxCallbacksPerPair}): "${synthCallbackQuery}"`
        );
        this.notify(run, listener);

        const synthCallbackPrompt = `You are the Analysis Agent called by the Synthesis Agent.
Question: "${synthCallbackQuery}"
Clarify the specific reasoning connecting the findings so Synthesis can present it accurately.`;

        const synthCallbackResult = await callGeminiModel(analysisInstruction, synthCallbackPrompt);
        this.checkAborted(runId, run);
        const synthCbTokens = synthCallbackResult.usage;
        run.tokenSummary.callbacks = this.combineUsage(run.tokenSummary.callbacks, synthCbTokens);

        const cbRecord: AgentCallbackExecution = {
          fromAgent: 'synthesis',
          toAgent: 'analysis',
          reason: 'Verify reasoning connection between local execution architecture and privacy claims.',
          query: synthCallbackQuery,
          response: synthCallbackResult.text,
          tokens: synthCbTokens,
          timestamp: new Date().toISOString(),
        };
        run.callbacksExecuted.push(cbRecord);
        analysisFindingsForSynthesis += `\n\n### Synthesis Clarification Handoff:\n${synthCallbackResult.text}`;

        this.addStepEvent(
          run,
          'synthesis',
          'AgentTool Callback -> Analysis Agent',
          'completed',
          `Callback completed (Guard enforced: ${loopGuard.synthesisToAnalysisCallbacks}/${loopGuard.maxCallbacksPerPair}).`,
          cbRecord,
          synthCbTokens
        );
        this.notify(run, listener);
      }

      // STEP 7: Synthesis Agent
      this.checkAborted(runId, run);
      this.addStepEvent(run, 'synthesis', 'Final Report Synthesis', 'running', 'Synthesis Agent compiling final user-facing response with historical context...');
      this.notify(run, listener);
      const synthesisInstruction = this.getAgentInstruction('synthesis');

      const synthesisPrompt = `You are the Synthesis Agent.
Original User Request: "${topic}"

Relevant Prior Context (from Mem0 MCP):
${memoryContextText}

Research Brief:
${researchFindingsForAnalysis}

Analysis Report:
${analysisFindingsForSynthesis}

Transform all findings and analysis into the final authoritative user-facing response.
Follow your format:
# Summary
# Key Findings
# Analysis
# What This Means
# Recommended Next Steps
# Sources

Do not expose internal memory candidate formatting or hidden tool calls. Preserve accuracy, uncertainty, and highlight continuity across sessions.`;

      const synthesisResult = await callGeminiModel(synthesisInstruction, synthesisPrompt);
      this.checkAborted(runId, run);
      run.synthesisReport = synthesisResult.text;
      run.tokenSummary.synthesis = this.combineUsage(run.tokenSummary.synthesis, synthesisResult.usage);
      this.addStepEvent(
        run,
        'synthesis',
        'Final Report Synthesis',
        'completed',
        'Final research report synthesized in authoritative Markdown format.',
        { preview: synthesisResult.text.slice(0, 300) + '...' },
        synthesisResult.usage
      );
      this.notify(run, listener);

      // STEP 8: Durable memory write
      this.checkAborted(runId, run);
      this.addStepEvent(run, 'orchestrator', 'Durable Memory Extraction & MCP Commit', 'running', 'Orchestrator reviewing candidate memories and writing to Mem0 MCP...');
      this.notify(run, listener);

      const memExtractPrompt = `You are the Research Orchestrator.
Review the Research Brief and Analysis Report from this run on topic "${topic}".
Identify durable new knowledge, user preferences, verified facts, and knowledge-graph relationships that should be committed to Mem0 MCP for long-term retention across future runs.

Research Brief:
${researchFindingsForAnalysis.slice(0, 2000)}

Analysis Report:
${analysisFindingsForSynthesis.slice(0, 2000)}

Extract 2-4 high-value atomic memories.
Output valid JSON in the following schema:
{
  "memories": [
    {
      "text": "Concise atomic fact or preference statement",
      "category": "preference" | "finding" | "insight" | "graph_relation",
      "tags": ["tag1", "tag2"],
      "relations": [
        { "source": "ConceptA", "relation": "uses | depends_on | enables | competes_with", "target": "ConceptB" }
      ]
    }
  ]
}`;

      const memExtractResult = await callGeminiModel(orchInstruction, memExtractPrompt, {
        responseMimeType: 'application/json',
      });
      this.checkAborted(runId, run);
      run.tokenSummary.orchestrator = this.combineUsage(run.tokenSummary.orchestrator, memExtractResult.usage);

      let extractedMemories: Array<{
        text: string;
        category?: 'preference' | 'finding' | 'insight' | 'graph_relation' | 'system';
        tags?: string[];
        relations?: any[];
      }> = [];

      try {
        const parsed = JSON.parse(memExtractResult.text.trim());
        extractedMemories = parsed.memories || [];
      } catch {
        extractedMemories = [
          {
            text: `User researched ${topic} and established key baseline findings.`,
            category: 'finding',
            tags: [topic.toLowerCase().replace(/\s+/g, '-')],
          },
        ];
      }

      const commitResult = await mem0Store.addMemories(extractedMemories, 'orchestrator', runId);
      run.mem0Writes = commitResult.addedMemories;

      this.addStepEvent(
        run,
        'mem0_mcp',
        'add_memory_tool',
        'completed',
        commitResult.message,
        { committedMemories: commitResult.addedMemories },
        memExtractResult.usage
      );
      this.notify(run, listener);

      // STEP 9: SKILL.md pattern-check per worker
      this.checkAborted(runId, run);
      this.addStepEvent(run, 'orchestrator', 'Skill Pattern-Check (Step 7.5)', 'running', 'Orchestrator retrieving accumulated memories and evaluating SKILL.md creation for workers...');
      this.notify(run, listener);

      const workers: AgentType[] = ['research', 'analysis', 'synthesis'];
      const allAccumulated = await mem0Store.listMemories();

      for (const worker of workers) {
        this.checkAborted(runId, run);
        const snippet =
          worker === 'research'
            ? run.researchBrief || ''
            : worker === 'analysis'
            ? run.analysisReport || ''
            : run.synthesisReport || '';

        const skillResult = await skillManager.patternCheckAndGenerate(worker, allAccumulated, {
          topic,
          outputSnippet: snippet,
        });

        const updateInfo: SkillUpdateInfo = {
          agent: worker,
          created: skillResult.created,
          skillSnippet: skillResult.skillSnippet,
          reason: skillResult.reason,
          version: skillResult.version,
        };
        run.skillUpdates.push(updateInfo);

        if (skillResult.created) {
          this.addStepEvent(
            run,
            'orchestrator',
            `AutoSkill Evolved: ${worker.toUpperCase()}`,
            'completed',
            `Synthesized new SKILL.md (v${skillResult.version}) for ${worker}: ${skillResult.reason}`,
            { skillContent: skillResult.skillSnippet, version: skillResult.version }
          );
          this.notify(run, listener);
        }
      }

      this.addStepEvent(
        run,
        'orchestrator',
        'Skill Pattern-Check (Step 7.5)',
        'completed',
        `Pattern check completed across all 3 workers. Active skills ready for reload on next run.`,
        { updates: run.skillUpdates }
      );
      this.notify(run, listener);

      // Totals
      const totalPrompt =
        run.tokenSummary.orchestrator.promptTokens +
        run.tokenSummary.research.promptTokens +
        run.tokenSummary.analysis.promptTokens +
        run.tokenSummary.synthesis.promptTokens +
        run.tokenSummary.callbacks.promptTokens;

      const totalCandidate =
        run.tokenSummary.orchestrator.candidateTokens +
        run.tokenSummary.research.candidateTokens +
        run.tokenSummary.analysis.candidateTokens +
        run.tokenSummary.synthesis.candidateTokens +
        run.tokenSummary.callbacks.candidateTokens;

      run.tokenSummary.total = {
        promptTokens: totalPrompt,
        candidateTokens: totalCandidate,
        totalTokens: totalPrompt + totalCandidate,
        estimatedCostUsd: calculateCost(totalPrompt, totalCandidate),
      };

      run.status = 'completed';
      run.endTime = new Date().toISOString();
      this.runHistory.unshift(run);
      this.persistHistory();
      this.activeRuns.delete(runId);
      this.cancelledRuns.delete(runId);
      this.notify(run, listener);

      return run;
    } catch (err: any) {
      const isCancelled = err.message === 'ORCHESTRATION_CANCELLED_BY_USER' || this.cancelledRuns.has(runId);

      const totalPrompt =
        run.tokenSummary.orchestrator.promptTokens +
        run.tokenSummary.research.promptTokens +
        run.tokenSummary.analysis.promptTokens +
        run.tokenSummary.synthesis.promptTokens +
        run.tokenSummary.callbacks.promptTokens;

      const totalCandidate =
        run.tokenSummary.orchestrator.candidateTokens +
        run.tokenSummary.research.candidateTokens +
        run.tokenSummary.analysis.candidateTokens +
        run.tokenSummary.synthesis.candidateTokens +
        run.tokenSummary.callbacks.candidateTokens;

      run.tokenSummary.total = {
        promptTokens: totalPrompt,
        candidateTokens: totalCandidate,
        totalTokens: totalPrompt + totalCandidate,
        estimatedCostUsd: calculateCost(totalPrompt, totalCandidate),
      };

      run.endTime = new Date().toISOString();

      if (isCancelled) {
        run.status = 'cancelled';
        run.error = 'Orchestration stopped by user.';
        run.steps.forEach(st => {
          if (st.status === 'running') {
            st.status = 'failed';
            st.details = (st.details ? st.details + ' - ' : '') + 'Stopped by user request.';
          }
        });
        this.addStepEvent(run, 'system', 'Pipeline Terminated', 'failed', 'Orchestration manually stopped by user.');
      } else {
        console.error('Research Run Failed:', err);
        run.status = 'error';
        run.error = err.message || String(err);
        this.addStepEvent(run, 'system', 'Execution Error', 'failed', run.error);
      }

      this.runHistory.unshift(run);
      this.persistHistory();
      this.activeRuns.delete(runId);
      this.cancelledRuns.delete(runId);
      this.notify(run, listener);
      return run;
    }
  }
}

export const agentOrchestrator = new AgentOrchestrator();
