import { agentOrchestrator } from './agentOrchestrator';
import { mem0Store } from './mem0Store';
import { skillManager } from './skillManager';

export async function runCliCommand(args: string[]): Promise<string> {
  const command = args[0] || 'help';

  if (command === 'help' || command === '--help' || command === '-h') {
    return `
🤖 ADK Self-Improving Research Team CLI
Usage:
  research --topic "<topic>" [--callback]   Run complete multi-agent research workflow
  stop                                      Stop active running research orchestration
  memory list                               List all stored Mem0 memories
  memory search "<query>"                   Search Mem0 long-term memory
  memory status                             Show Mem0 MCP transport, mode, and health
  memory mode [mock|real]                   Toggle between Mocked and Real MCP mode
  memory reset                              Clear all Mem0 memories to zero state
  skills list                               View active SKILL.md status for all agents
  skills reset                              Reset all SKILL.md files to cold start
  history                                   List previous research runs
  help                                      Show this help manual
`;
  }

  if (command === 'memory') {
    const sub = args[1];
    if (sub === 'status' || sub === 'config') {
      const cfg = mem0Store.getConfig();
      return `=== Mem0 Configuration & Health ===\nMode: ${cfg.mode.toUpperCase()}\nTransport: ${cfg.transport}\nEndpoint: ${cfg.mcpUrl}\nStatus: ${cfg.connected ? 'CONNECTED (Online)' : 'DISCONNECTED'}\nLatency: ${cfg.latencyMs}ms\nDiscovered Tools (${cfg.toolsDiscovered}):\n${cfg.tools.map(t => `  - ${t.name.padEnd(26)} : ${t.description}`).join('\n')}`;
    }
    if (sub === 'mode') {
      const targetMode = args[2] === 'real' ? 'real' : 'mock';
      await mem0Store.setConfig({ mode: targetMode });
      const updated = mem0Store.getConfig();
      return `Mem0 mode switched to: ${updated.mode.toUpperCase()}.\nEndpoint: ${updated.mcpUrl}\nStatus: ${updated.connected ? 'CONNECTED' : 'DISCONNECTED'} (${updated.statusMessage})`;
    }
    if (sub === 'list') {
      const mems = await mem0Store.listMemories();
      if (mems.length === 0) return 'Mem0 MCP: No memories stored (Cold Start).';
      return mems
        .map(
          (m, i) =>
            `[${i + 1}] (${m.category}) ${m.text}\n    Source: ${m.agentSource} | Date: ${new Date(m.timestamp).toLocaleTimeString()}${
              m.relations ? `\n    Relations: ${m.relations.map(r => `${r.source} -> ${r.relation} -> ${r.target}`).join(', ')}` : ''
            }`
        )
        .join('\n\n');
    }
    if (sub === 'search') {
      const q = args.slice(2).join(' ').replace(/^["']|["']$/g, '');
      const results = await mem0Store.searchMemory(q);
      if (results.length === 0) return `Mem0 MCP: No memories found matching "${q}".`;
      return results
        .map((m, i) => `[${i + 1}] (Score: ${m.relevanceScore || 1}) [${m.category}] ${m.text}`)
        .join('\n');
    }
    if (sub === 'reset') {
      await mem0Store.resetMemories();
      return 'Mem0 MCP: All long-term memories successfully wiped to cold-start zero state.';
    }
  }

  if (command === 'skills') {
    const sub = args[1];
    if (sub === 'list' || !sub) {
      const skills = skillManager.getAllSkills();
      return skills
        .map(
          s =>
            `=== ${s.name} (v${s.version}) ===\n${
              s.content ? s.content : '(No SKILL.md yet - cold start)\n'
            }\nTriggers:\n${s.triggerHistory.length > 0 ? s.triggerHistory.map(t => '  - ' + t).join('\n') : '  (None)'}`
        )
        .join('\n\n');
    }
    if (sub === 'reset') {
      skillManager.resetSkills();
      return 'AutoSkill: All agent SKILL.md files successfully reset to cold-start zero state.';
    }
  }

  if (command === 'stop' || command === 'abort' || command === 'kill') {
    const runId = args[1];
    const res = agentOrchestrator.stopResearch(runId);
    return res.message;
  }

  if (command === 'history') {
    const runs = agentOrchestrator.getAllRuns();
    if (runs.length === 0) return 'No previous research runs on record.';
    return runs
      .map(
        (r, i) =>
          `[Run ${i + 1}] ID: ${r.id} | Status: ${r.status.toUpperCase()} | Started: ${new Date(r.startTime).toLocaleTimeString()}\n` +
          `  Topic: "${r.topic}"\n` +
          `  Tokens: ${r.tokenSummary.total.totalTokens} (Est: $${r.tokenSummary.total.estimatedCostUsd})\n` +
          `  Callbacks: ${r.callbacksExecuted.length} | Mem0 Writes: ${r.mem0Writes.length} | Skills Updated: ${r.skillUpdates.filter(s => s.created).length}`
      )
      .join('\n\n');
  }

  if (command === 'research') {
    let topic = '';
    let triggerCallback = false;

    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--topic' || args[i] === '-t') {
        topic = args[i + 1] || '';
        i++;
      } else if (args[i] === '--callback' || args[i] === '-c') {
        triggerCallback = true;
      } else if (!topic && !args[i].startsWith('-')) {
        topic = args[i];
      }
    }

    if (!topic) {
      return 'Error: Please specify a topic using `research --topic "<topic>"`';
    }

    const outputLog: string[] = [];
    outputLog.push(`\n🚀 Launching ADK Research Team for topic: "${topic}"\n`);

    const result = await agentOrchestrator.executeResearch(topic, {
      triggerCallbackDemo: triggerCallback,
    });

    outputLog.push(`=== 1. ORCHESTRATION & DIVERGENCE (Step 2.5) ===`);
    outputLog.push(`Divergence: ${result.divergenceDecision?.isDivergent ? 'Multi-Facet' : 'Single Deep'}`);
    outputLog.push(`Rationale: ${result.divergenceDecision?.rationale}`);
    outputLog.push(`Subtopics: ${result.divergenceDecision?.subtopics?.join(', ')}\n`);

    if (result.callbacksExecuted.length > 0) {
      outputLog.push(`=== 2. LOOP-GUARDED CALLBACKS (${result.callbacksExecuted.length}) ===`);
      for (const cb of result.callbacksExecuted) {
        outputLog.push(`[${cb.fromAgent} -> ${cb.toAgent}]`);
        outputLog.push(`Reason: ${cb.reason}`);
        outputLog.push(`Query: ${cb.query}`);
        outputLog.push(`Response Snippet: ${cb.response.slice(0, 180)}...\n`);
      }
    }

    outputLog.push(`=== 3. MEM0 MCP DURABLE WRITES (${result.mem0Writes.length}) ===`);
    for (const mem of result.mem0Writes) {
      outputLog.push(`+ [${mem.category}] ${mem.text}`);
    }
    outputLog.push('');

    outputLog.push(`=== 4. SKILL PATTERN-CHECK (Step 7.5) ===`);
    for (const sk of result.skillUpdates) {
      if (sk.created) {
        outputLog.push(`⚡ [${sk.agent.toUpperCase()}] Evolved to v${sk.version}: ${sk.reason}`);
      } else {
        outputLog.push(`- [${sk.agent.toUpperCase()}] No update needed: ${sk.reason}`);
      }
    }
    outputLog.push('');

    outputLog.push(`=== 5. TOKEN USAGE & COST BREAKDOWN ===`);
    outputLog.push(`Orchestrator: ${result.tokenSummary.orchestrator.totalTokens} tokens ($${result.tokenSummary.orchestrator.estimatedCostUsd})`);
    outputLog.push(`Research:     ${result.tokenSummary.research.totalTokens} tokens ($${result.tokenSummary.research.estimatedCostUsd})`);
    outputLog.push(`Analysis:     ${result.tokenSummary.analysis.totalTokens} tokens ($${result.tokenSummary.analysis.estimatedCostUsd})`);
    outputLog.push(`Synthesis:    ${result.tokenSummary.synthesis.totalTokens} tokens ($${result.tokenSummary.synthesis.estimatedCostUsd})`);
    if (result.tokenSummary.callbacks.totalTokens > 0) {
      outputLog.push(`Callbacks:    ${result.tokenSummary.callbacks.totalTokens} tokens ($${result.tokenSummary.callbacks.estimatedCostUsd})`);
    }
    outputLog.push(`TOTAL:        ${result.tokenSummary.total.totalTokens} tokens (Est. Cost: $${result.tokenSummary.total.estimatedCostUsd})\n`);

    outputLog.push(`=== 6. FINAL SYNTHESIS REPORT ===\n`);
    outputLog.push(result.synthesisReport || '(No report produced)');

    return outputLog.join('\n');
  }

  return `Unknown command: '${command}'. Type 'help' for available commands.`;
}

// Standalone execution if invoked from terminal directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  runCliCommand(args.length > 0 ? args : ['help']).then(output => {
    console.log(output);
  });
}
