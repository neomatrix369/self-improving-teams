import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('Warning: GEMINI_API_KEY environment variable is not set. Gemini API calls will fail.');
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
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

// Cost calculation approximate for gemini-3.7-flash ($0.075 / 1M prompt, $0.30 / 1M output)
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
    const totalTokens = metadata?.totalTokenCount || (promptTokens + candidateTokens);
    const estimatedCostUsd = calculateCost(promptTokens, candidateTokens);

    return {
      text,
      usage: {
        promptTokens,
        candidateTokens,
        totalTokens,
        estimatedCostUsd,
      },
    };
  } catch (err: any) {
    console.error('Gemini API Error:', err);
    throw new Error(`Gemini API Error: ${err.message || String(err)}`);
  }
}
