// Token pricing per million tokens (USD) - as of Jan 2026
// https://www.anthropic.com/pricing

interface ModelPricing {
  input: number;   // $ per 1M input tokens
  output: number;  // $ per 1M output tokens
}

const PRICING: Record<string, ModelPricing> = {
  // Opus 4.5
  'opus': { input: 15, output: 75 },
  'opus-4': { input: 15, output: 75 },
  'opus 4.5': { input: 15, output: 75 },

  // Sonnet 4
  'sonnet': { input: 3, output: 15 },
  'sonnet-4': { input: 3, output: 15 },
  'sonnet 4': { input: 3, output: 15 },

  // Haiku 3.5
  'haiku': { input: 0.80, output: 4 },
  'haiku-3': { input: 0.80, output: 4 },
  'haiku 3.5': { input: 0.80, output: 4 },
};

function getPricing(modelName: string): ModelPricing {
  const lower = modelName.toLowerCase();

  for (const [key, pricing] of Object.entries(PRICING)) {
    if (lower.includes(key)) {
      return pricing;
    }
  }

  // Default to Sonnet pricing
  return PRICING['sonnet'];
}

export interface CostInfo {
  totalCost: number;      // Total session cost in USD
  hourlyRate: number;     // Burn rate in USD/hour
}

export function calculateCost(
  modelName: string,
  inputTokens: number,
  outputTokens: number,
  sessionDurationMs: number
): CostInfo {
  const pricing = getPricing(modelName);

  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  const totalCost = inputCost + outputCost;

  // Calculate hourly rate
  const hours = sessionDurationMs / (1000 * 60 * 60);
  const hourlyRate = hours > 0 ? totalCost / hours : 0;

  return { totalCost, hourlyRate };
}

export function calculateTokensPerMinute(
  totalTokens: number,
  sessionDurationMs: number
): number {
  const minutes = sessionDurationMs / (1000 * 60);
  return minutes > 0 ? Math.round(totalTokens / minutes) : 0;
}
