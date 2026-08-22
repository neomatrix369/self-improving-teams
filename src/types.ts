export type AgentType = 'orchestrator' | 'research' | 'analysis' | 'synthesis';

export interface GraphRelation {
  source: string;
  relation: string;
  target: string;
}

export interface Mem0Memory {
  id: string;
  text: string;
  category: 'preference' | 'finding' | 'insight' | 'graph_relation' | 'system';
  relations?: GraphRelation[];
  agentSource: AgentType | 'user' | 'system';
  timestamp: string;
  runId?: string;
  tags?: string[];
  relevanceScore?: number;
}

export interface AgentTokenUsage {
  promptTokens: number;
  candidateTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

export interface RunTokenSummary {
  orchestrator: AgentTokenUsage;
  research: AgentTokenUsage;
  analysis: AgentTokenUsage;
  synthesis: AgentTokenUsage;
  callbacks: AgentTokenUsage;
  total: AgentTokenUsage;
}

export interface AgentStepEvent {
  id: string;
  timestamp: string;
  agent: AgentType | 'system' | 'mem0_mcp';
  stepName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  details?: string;
  data?: any;
  tokens?: AgentTokenUsage;
}

export interface AgentCallbackExecution {
  fromAgent: AgentType;
  toAgent: AgentType;
  reason: string;
  query: string;
  response: string;
  tokens: AgentTokenUsage;
  timestamp: string;
}

export interface SkillUpdateInfo {
  agent: AgentType;
  created: boolean;
  skillSnippet: string;
  reason: string;
  version: number;
}

export interface DivergenceDecision {
  isDivergent: boolean;
  rationale: string;
  subtopics: string[];
}

export interface ResearchRun {
  id: string;
  topic: string;
  userQuery: string;
  status: 'idle' | 'running' | 'completed' | 'error' | 'cancelled';
  startTime: string;
  endTime?: string;
  divergenceDecision?: DivergenceDecision;
  researchBrief?: string;
  analysisReport?: string;
  synthesisReport?: string;
  callbacksExecuted: AgentCallbackExecution[];
  mem0Writes: Mem0Memory[];
  skillUpdates: SkillUpdateInfo[];
  tokenSummary: RunTokenSummary;
  steps: AgentStepEvent[];
  error?: string;
}

export interface AgentSkill {
  agent: AgentType;
  name: string;
  version: number;
  updatedAt: string;
  content: string;
  triggerHistory: string[];
}

export interface Mem0ToolInfo {
  name: string;
  description: string;
}

export interface Mem0Config {
  mode: 'mock' | 'real';
  transport: string;
  mcpUrl: string;
  connected: boolean;
  latencyMs?: number;
  toolsDiscovered: number;
  tools: Mem0ToolInfo[];
  statusMessage?: string;
  lastChecked?: string;
}

