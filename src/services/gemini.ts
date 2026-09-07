import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

// Session-only key: held in memory for this tab, cleared on refresh. Never persisted.
let sessionKey = '';

// The build-time key (VITE_GEMINI_API_KEY) is only present if the operator baked one
// into the deploy. On a normal deploy it is empty and the app prompts the user for one.
function getApiKey(): string {
  return sessionKey || (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) || '';
}

export function hasGeminiKey(): boolean {
  return !!getApiKey();
}

// Store the user-supplied key for this session only. No localStorage, no cookies.
export function setSessionGeminiKey(key: string): void {
  sessionKey = key.trim();
  aiInstance = null;
}

export function clearSessionGeminiKey(): void {
  sessionKey = '';
  aiInstance = null;
}

export function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not set. Gemini calls will fail. Set VITE_GEMINI_API_KEY at build time or paste a key via the UI.');
    }
    aiInstance = new GoogleGenAI({ apiKey: apiKey || '' });
  }
  return aiInstance;
}

export interface ModelCallResult {
  text: string;
  usage: {
    promptTokens: number;
    candidateTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
  };
}

export function calculateCost(promptTokens: number, candidateTokens: number): number {
  const promptCost = (promptTokens / 1_000_000) * 0.075;
  const candidateCost = (candidateTokens / 1_000_000) * 0.30;
  return Number((promptCost + candidateCost).toFixed(6));
}

export async function callGeminiModel(
  systemInstruction: string,
  userPrompt: string,
  options?: {
    model?: string;
    temperature?: number;
    responseMimeType?: string;
  }
): Promise<ModelCallResult> {
  const ai = getGeminiClient();
  const modelName = options?.model || 'gemini-3.7-flash';

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: options?.temperature ?? 0.7,
        responseMimeType: options?.responseMimeType,
      },
    });

    const text = response.text || '';
    const metadata = response.usageMetadata;
    const promptTokens = metadata?.promptTokenCount || Math.ceil((systemInstruction.length + userPrompt.length) / 4);
    const candidateTokens = metadata?.candidatesTokenCount || Math.ceil(text.length / 4);
    const totalTokens = metadata?.totalTokenCount || promptTokens + candidateTokens;
    const estimatedCostUsd = calculateCost(promptTokens, candidateTokens);

    return {
      text,
      usage: { promptTokens, candidateTokens, totalTokens, estimatedCostUsd },
    };
  } catch (err: any) {
    console.error('Gemini API Error:', err);
    throw new Error(`Gemini API Error: ${err.message || String(err)}`);
  }
}
