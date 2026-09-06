# Self-Improving Research Team — Screenshot Gallery

UI captures grouped by surface, taken from a live development session.

**Demo walkthrough video:** [▶ Watch on Loom](https://www.loom.com/share/e901dc95e9214794a70c9d96944764c8)

Regenerate all screenshots after UI changes:

```bash
# Ensure the dev server is running first
npm run dev &
# Then (requires arm64 Node on Apple Silicon):
~/.nvm/versions/node/v22.19.0/bin/node scripts/capture-screenshots.mjs
```

---

## 1. Dashboard

The Studio, Minimal Form, and Preview All UI variants.

### Studio — ready state

The default Studio view showing the Research Topic & Prompt panel and quick presets.

![Studio ready state](01-dashboard/01-studio-ready.png)

### Minimal Form view

Compact single-prompt input for rapid research launches.

![Minimal Form view](01-dashboard/02-minimal-form.png)

### Preview All panels

Side-by-side overview of all active panels in one view.

![Preview All panels](01-dashboard/03-preview-all.png)

---

## 2. Research Workflow

Multi-agent orchestration lifecycle from prompt to synthesis.

### Prompt input — ready

Research Topic & Prompt with quick preset chips and Loop-Guarded Agent Callbacks toggle.

![Research prompt input](02-research/01-prompt-input.png)

### Agents running

Scout, Critic, and Hermes-like Evolver agents active with live step callbacks.

![Agents running](02-research/02-research-running.png)

### Mid-run progress

Step milestones, token counters, and Mem0 MCP search/store calls in flight.

![Mid-run progress](02-research/03-research-progress.png)

### Completed synthesis report

Final durable markdown report produced after all three agents complete.

![Completed output](02-research/04-research-complete.png)

---

## 3. Mem0 Memory Bank

Long-term research memory stored and retrieved via the Mem0 MCP server.

### Empty state

Memory panel before any research run — shows MCP connection status.

![Mem0 empty state](03-mem0-memory/01-mem0-panel.png)

### Populated after research

Memories ingested during the research run, searchable by semantic query.

![Mem0 populated](03-mem0-memory/02-mem0-populated.png)

---

## 4. AutoSkill Evolution

Autonomous `SKILL.md` synthesis driven by the Hermes-like Evolver agent.

### Empty state

AutoSkill panel before any research run.

![AutoSkill empty](04-autoskill/01-autoskill-panel.png)

### Populated after research

Skills synthesised by the Evolver agent and hot-reloaded into the live system.

![AutoSkill populated](04-autoskill/02-autoskill-populated.png)

---

## 5. Token Telemetry

Real-time input/output token tracking, estimated cost, and per-step durations.

### Token Telemetry panel

![Token Telemetry](05-token-telemetry/01-token-telemetry.png)

---

## 6. CLI Console

Built-in developer terminal for direct orchestration commands.

### CLI Console

![CLI Console](06-cli-console/01-cli-console.png)

### Terminal view

Full-screen terminal for `research run`, `memory`, and `skills` commands.

![Terminal view](06-cli-console/02-terminal-view.png)
