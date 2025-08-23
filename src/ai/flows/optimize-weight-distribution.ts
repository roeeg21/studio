// src/ai/flows/optimize-weight-distribution.ts
'use server';

/**
 * @fileOverview Provides suggestions for optimizing weight distribution in an aircraft.
 *
 * - optimizeWeightDistribution - A function that takes aircraft load information and provides suggestions for optimizing weight distribution.
 * - OptimizeWeightDistributionInput - The input type for the optimizeWeightDistribution function.
 * - OptimizeWeightDistributionOutput - The return type for the optimizeWeightDistribution function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeWeightDistributionInputSchema = z.object({
  pilotWeight: z.number().describe('Weight of the pilot in pounds.'),
  passengerWeight: z.number().describe('Weight of the passenger in pounds.'),
  fuelWeight: z.number().describe('Weight of the fuel in pounds.'),
  baggageWeight: z.number().describe('Weight of the baggage in pounds.'),
  currentCG: z.number().describe('Current center of gravity of the aircraft.'),
  cgLimits: z.object({
    forwardLimit: z.number().describe('Forward center of gravity limit.'),
    aftLimit: z.number().describe('Aft center of gravity limit.'),
  }).describe('Acceptable center of gravity limits.'),
});

export type OptimizeWeightDistributionInput = z.infer<typeof OptimizeWeightDistributionInputSchema>;

const OptimizeWeightDistributionOutputSchema = z.object({
  suggestions: z.string().describe('Suggestions for optimizing weight distribution.'),
});

export type OptimizeWeightDistributionOutput = z.infer<typeof OptimizeWeightDistributionOutputSchema>;

export async function optimizeWeightDistribution(input: OptimizeWeightDistributionInput): Promise<OptimizeWeightDistributionOutput> {
  return optimizeWeightDistributionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeWeightDistributionPrompt',
  input: {schema: OptimizeWeightDistributionInputSchema},
  output: {schema: OptimizeWeightDistributionOutputSchema},
  prompt: `You are an expert aircraft weight and balance specialist. Analyze the following aircraft loading and provide suggestions to optimize the weight distribution to ensure it is within safe operational limits.

Pilot Weight: {{pilotWeight}} lbs
Passenger Weight: {{passengerWeight}} lbs
Fuel Weight: {{fuelWeight}} lbs
Baggage Weight: {{baggageWeight}} lbs
Current CG: {{currentCG}}
CG Forward Limit: {{cgLimits.forwardLimit}}
CG Aft Limit: {{cgLimits.aftLimit}}

Provide specific and actionable suggestions to adjust the weight distribution.
`,
});

const optimizeWeightDistributionFlow = ai.defineFlow(
  {
    name: 'optimizeWeightDistributionFlow',
    inputSchema: OptimizeWeightDistributionInputSchema,
    outputSchema: OptimizeWeightDistributionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
