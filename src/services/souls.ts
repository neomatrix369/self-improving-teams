// Vite ?raw imports bundle these markdown files into the client build at build time.
// The trailing ?raw suffix is a Vite-specific loader that returns the file contents as a string.
import orchestratorSoul from '../../souls/01_Research_Orchestrator_SOUL.md?raw';
import researchSoul from '../../souls/02_Research_Agent_SOUL.md?raw';
import analysisSoul from '../../souls/03_Analysis_Agent_SOUL.md?raw';
import synthesisSoul from '../../souls/04_Synthesis_Agent_SOUL.md?raw';

import type { AgentType } from '../types';

const SOULS: Record<AgentType, string> = {
  orchestrator: orchestratorSoul,
  research: researchSoul,
  analysis: analysisSoul,
  synthesis: synthesisSoul,
};

export function getSoul(agent: AgentType): string {
  return SOULS[agent] || `You are the ${agent} agent.`;
}
