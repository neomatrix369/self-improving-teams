# Self-Improving Research Team

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-3.7_Flash-orange.svg)](https://ai.google.dev/)
[![Mem0](https://img.shields.io/badge/Mem0-MCP_Server-emerald.svg)](https://mem0.ai/)

> **▶ [Watch the full demo on Loom](https://www.loom.com/share/e901dc95e9214794a70c9d96944764c8)** — see the ADK multi-agent pipeline, Mem0 MCP memory, AutoSkill synthesis, and token telemetry in action.

An enterprise-grade, multi-agent autonomous research system orchestrated by Google Agent Development Kit (ADK) principles, powered by Google Gemini models, and backed by long-term memory via the **Mem0 Model Context Protocol (MCP)** server. The system features autonomous skill synthesis, real-time token and budget tracking, execution loop guards, and hot-reloadable agent souls.

---

## 📑 Table of Contents
1. [Demo & Screenshots](#-demo--screenshots)
2. [Architecture Diagram](#-architecture-diagram)
3. [Key Capabilities](#-key-capabilities)
4. [Agent Hierarchy & Roles](#-agent-hierarchy--roles)
5. [Setup & Quick Start](#-setup--quick-start)
6. [Mem0 MCP Integration](#-mem0-mcp-integration)
7. [Autonomous Skill Synthesis & Reload](#-autonomous-skill-synthesis--reload)
8. [Repository Structure](#-repository-structure)
9. [CLI & API Reference](#-cli--api-reference)
10. [License](#-license)

---

## 🎬 Demo & Screenshots

### ▶ Video Demo

> **[Watch the full demo on Loom](https://www.loom.com/share/e901dc95e9214794a70c9d96944764c8)**
>
> See how [@rxShri99](https://github.com/rxShri99) walks us through the whole app start to finish — from submitting a research topic, watching Scout → Critic → Hermes-like Evolver agents run in a loop-guarded ADK pipeline, Mem0 MCP memory being searched and written, AutoSkill synthesis producing `SKILL.md` files, and live token/cost telemetry across all panels.

### Screenshots

Browse the full [screenshot gallery](docs/screenshots/README.md) for all UI surfaces. Key highlights:

| Surface | Preview |
|:---|:---|
| **Research Workflow** — prompt input with quick presets | ![Research prompt](docs/screenshots/02-research/01-prompt-input.png) |
| **Research Workflow** — agents running | ![Agents running](docs/screenshots/02-research/02-research-running.png) |
| **Research Workflow** — completed synthesis | ![Completed](docs/screenshots/02-research/04-research-complete.png) |
| **Mem0 Memory Bank** — after research run | ![Mem0 populated](docs/screenshots/03-mem0-memory/02-mem0-populated.png) |
| **AutoSkill Evolution** — synthesised skills | ![AutoSkill](docs/screenshots/04-autoskill/02-autoskill-populated.png) |
| **Token Telemetry** — live counters | ![Token Telemetry](docs/screenshots/05-token-telemetry/01-token-telemetry.png) |
| **CLI Console** | ![CLI Console](docs/screenshots/06-cli-console/01-cli-console.png) |

---

## 🏛 Architecture Diagram

```
                             +-----------------------------------+
                             |     User / Studio Web UI / CLI    |
                             +-----------------+-----------------+
                                               |
                                               v
+-----------------------------------------------------------------------------------------------+
|                                    Express + TypeScript Server                                |
|                                                                                               |
|  +-----------------------------------------------------------------------------------------+  |
|  |                            ADK Research Orchestrator Engine                             |  |
|  |                                                                                         |  |
|  |  +------------------+     +--------------------+     +-------------------------------+  |  |
|  |  |   Run Loop Guard | --> | Token Budget Guard | --> | Live Agent Callbacks & Events |  |  |
|  |  +------------------+     +--------------------+     +-------------------------------+  |  |
|  +-----------------------------------------------------------------------------------------+  |
|             |                            |                             |                      |
|             v                            v                             v                      |
|  +---------------------+    +-------------------------+   +--------------------------------+  |
|  |  Scout Agent        |    |  Critic Agent           |   |  Hermes-like Evolver Agent     |  |
|  |  - Deep Query       |    |  - Hallucination Audits |   |  - Skill Synthesis             |  |
|  |  - Source Synthesis |    |  - Logical Coherence    |   |  - Meta-Evolution (.soul.md)   |  |
|  +---------------------+    +-------------------------+   +--------------------------------+  |
|             |                            |                             |                      |
|             +----------------------------+-----------------------------+                      |
|                                          |                                                    |
|                                          v                                                    |
|  +-----------------------------------------------------------------------------------------+  |
|  |                         Unified Mem0 MCP Client & Store                                 |  |
|  |                                                                                         |  |
|  |  Mode: [ Mocked Local Store <──────── 1-Click Toggle ────────> Real MCP Server ]       |  |
|  |  Endpoint: process.env.MEM0_MCP_URL (http://localhost:8888/mcp/mcp)                     |  |
|  |  Transport: HTTP JSON-RPC 2.0 (Auth: none)                                              |  |
|  +-----------------------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------------------+
                                           |
                                           v
                       +---------------------------------------+
                       |    Mem0 MCP Server (Local Machine)    |
                       |    9 Tools: add_memory, search, ...   |
                       +---------------------------------------+
```

### Subsystem Flow (Mermaid)

```mermaid
graph TD
    User([User Prompt / Topic]) --> Orchestrator[ADK Orchestrator]
    Orchestrator --> QueryMem0[Mem0: search_memories_tool]
    QueryMem0 --> ContextEnriched[Context Enrichment]
    
    ContextEnriched --> Scout[Scout Agent: Investigation]
    Scout --> Critic[Critic Agent: Verification & Fact-Audit]
    Critic --> Hermes[Hermes-like agent: Skill Synthesis]
    
    Hermes --> SkillGen[Synthesize SKILL.md / Agent Soul]
    Hermes --> StoreMem0[Mem0: add_memory_tool]
    
    StoreMem0 --> FinalReport[Durable Markdown Synthesis Report]
```

---

## ⚡ Key Capabilities

- **ADK Multi-Agent Orchestration**: Specialized Scout, Critic, and Hermes-like Evolver agents run in coordinated pipelines with step-level status tracking and loop-guard timeouts.
- **Mem0 MCP Server Integration**:
  - Direct HTTP JSON-RPC 2.0 client communicating with local Mem0 MCP server.
  - Native support for **all 9 Mem0 tools** (`add_memory_tool`, `search_memories_tool`, `get_memory_tool`, `get_all_memories_tool`, `update_memory_tool`, `memory_history_tool`, `delete_memory_tool`, `delete_all_memories_tool`, `reset_memories_tool`).
  - **1-Click Mode Toggle**: Switch seamlessly between **Mocked Store** and **Real MCP Server**.
- **Autonomous Skill Generation (`SKILL.md`)**: Agents detect knowledge gaps and formulate production-ready `SKILL.md` documents on the fly with live dynamic reloading.
- **Live Token & Budget Telemetry**: Real-time tracking of input tokens, output tokens, estimated cost, run durations, and step milestones.
- **Enterprise UI**: Responsive dashboard with Research Hub, Agent Network visualizer, Mem0 Memory Bank, Autonomous Skills matrix, and Developer CLI Console.

---

## 🤖 Agent Hierarchy & Roles

| Agent | Model | Primary Responsibility |
| :--- | :--- | :--- |
| **Orchestrator** | Gemini 3.7 Flash | Deconstructs user query, manages execution DAG, interacts with Mem0 MCP, compiles final report |
| **Scout** | Gemini 3.7 Flash | Discovers primary domain sources, identifies technical trade-offs, gathers core evidence |
| **Critic** | Gemini 3.7 Flash | Verifies claims, conducts hallucination audits, calculates confidence scores |
| **Hermes-like agent** | Gemini 3.7 Flash | Identifies capability gaps, creates durable skills (`SKILL.md`), updates agent souls (`.soul.md`) |

---

## 🚀 Setup & Quick Start

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **bun**
- **Gemini API Key**: Obtainable from [Google AI Studio](https://aistudio.google.com/)
- *(Optional)* **Local Mem0 MCP Server**: If using real MCP mode (e.g. running on `http://localhost:8888/mcp/mcp`)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-org/self-improving-research-team.git
cd self-improving-research-team
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env`:
```env
# Gemini AI API Key (Required for server-side LLM inference)
GEMINI_API_KEY="your-gemini-api-key-here"

# Mem0 MCP Server HTTP Endpoint (Local Machine)
MEM0_MCP_URL="http://localhost:8888/mcp/mcp"
```

### 3. Run in Development Mode
```bash
npm run dev
```
The application starts at `http://localhost:3000`.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🧠 Mem0 MCP Integration

The application contains a unified Mem0 engine (`server/mem0Store.ts`) that handles both local development and live enterprise MCP endpoints.

### Supported Mem0 MCP Tools
1. `add_memory_tool`: Stores facts, insights, and knowledge graph triples.
2. `search_memories_tool`: Performs semantic search over accumulated research history.
3. `get_memory_tool`: Fetches individual memory nodes.
4. `get_all_memories_tool`: Retrieves all memory records.
5. `update_memory_tool`: Modifies existing memory text or metadata.
6. `memory_history_tool`: Queries evolution history of a memory.
7. `delete_memory_tool`: Deletes single memory entries.
8. `delete_all_memories_tool`: Clears memories for a given namespace.
9. `reset_memories_tool`: Resets storage to cold-start zero state.

### Toggling Between Mock and Real MCP
- **In UI**: Open the **Mem0 Memory Bank** tab and click **"Mocked (Local)"** or **"Real MCP Server"**.
- **In CLI**: Run `memory mode real` or `memory mode mock`.

---

## 🛠 Repository Structure

```
.
├── .env.example            # Documented environment variables (MEM0_MCP_URL, GEMINI_API_KEY)
├── LICENSE                 # Apache License 2.0
├── README.md               # Comprehensive documentation and setup instructions
├── metadata.json           # Platform capability declarations
├── package.json            # Node.js dependencies and build scripts
├── server.ts               # Express backend API & Vite SSR middleware
├── server/
│   ├── adkOrchestrator.ts  # Multi-agent ADK execution pipeline & token tracking
│   ├── cliRunner.ts        # Interactive developer terminal commands
│   ├── geminiClient.ts     # Resilient Google GenAI SDK interface with rate limiting
│   ├── mem0Store.ts        # Unified Mem0 MCP Client & Mock Store
│   └── skillManager.ts     # SKILL.md and Hermes-like agent SOUL hot-reloading manager
├── skills/                 # Dynamically generated & system SKILL.md files
├── souls/                  # Agent personality & metacognition profiles
├── src/
│   ├── App.tsx             # Main React application shell
│   ├── components/         # Modular UI components (Dashboard, Mem0Bank, Skills, CLI)
│   ├── types.ts            # Shared TypeScript type definitions
│   └── index.css           # Tailwind CSS styles
└── vite.config.ts          # Vite bundler configuration
```

---

## 💻 CLI & API Reference

### CLI Terminal Commands
The built-in CLI Console allows rapid agent orchestration and inspection:
- `research run "<topic>"`: Launch a full autonomous research cycle.
- `memory status`: View Mem0 MCP transport, endpoint, and tool discovery health.
- `memory mode [mock|real]`: Toggle between Mock and Real MCP modes.
- `memory search "<query>"`: Search long-term memory.
- `skills list`: Display status of all active agent skills.
- `skills reset`: Reset skills to cold-start state.

### Key Backend REST Endpoints
- `POST /api/research/start`: Start a new research orchestration run.
- `GET /api/mem0/config`: Get Mem0 MCP connection status and discovered tools.
- `POST /api/mem0/config`: Update Mem0 configuration (`mcpUrl`, `mode`).
- `POST /api/mem0/test-connection`: Ping target MCP server and measure latency.
- `GET /api/mem0/memories`: Query or search stored memories.
- `GET /api/skills`: List all active `SKILL.md` files.

---

## 📄 License

This project is licensed under the **Apache License 2.0**. See the [LICENSE](LICENSE) file for details.
