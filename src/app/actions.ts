'use server';

import { optimizeWeightDistribution, OptimizeWeightDistributionInput } from '@/ai/flows/optimize-weight-distribution';
import { z } from 'zod';

const ActionInputSchema = z.object({
  pilotWeight: z.number(),
  passengerWeight: z.number(),
  fuelWeight: z.number(),
  baggageWeight: z.number(),
  currentCG: z.number(),
  cgLimits: z.object({
    forwardLimit: z.number(),
    aftLimit: z.number(),
  }),
});

export async function getWeightOptimizationSuggestions(input: OptimizeWeightDistributionInput) {
  const parsedInput = ActionInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return { error: 'Invalid input.', suggestions: null };
  }

  try {
    const result = await optimizeWeightDistribution(parsedInput.data);
    return { error: null, suggestions: result.suggestions };
  } catch (e) {
    console.error(e);
    return { error: 'Failed to get suggestions from AI.', suggestions: null };
  }
}
