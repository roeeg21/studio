'use server';
/**
 * @fileOverview Translates raw METAR/TAF strings into human-readable weather reports.
 *
 * - translateWeather - A function that takes a raw weather string and returns a structured, readable format.
 * - WeatherInput - The input type for the translateWeather function.
 * - TranslatedWeather - The return type for the translateWeather function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const WeatherInputSchema = z.object({
  raw: z.string().describe('The raw METAR or TAF string to be translated.'),
});
export type WeatherInput = z.infer<typeof WeatherInputSchema>;

const TranslatedWeatherSchema = z.object({
  wind: z.string().describe('Wind direction, speed, and gusts. Example: "280° at 12 knots, gusting to 18 knots"'),
  visibility: z.string().describe('Visibility in statute miles. Example: "10+ statute miles" or "3 statute miles"'),
  clouds: z.string().describe('Cloud cover and altitude. Example: "Scattered clouds at 2,500 feet"'),
  temperature: z.string().describe('Temperature and dew point in Celsius. Example: "28°C / Dew Point 18°C"'),
  altimeter: z.string().describe('Altimeter setting in inches of mercury. Example: "30.12 inHg"'),
});
export type TranslatedWeather = z.infer<typeof TranslatedWeatherSchema>;


export async function translateWeather(input: WeatherInput): Promise<TranslatedWeather> {
  return translateWeatherFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateWeatherPrompt',
  input: { schema: WeatherInputSchema },
  output: { schema: TranslatedWeatherSchema },
  prompt: `You are an expert aviation meteorologist. Your task is to translate a raw METAR or TAF weather report into a clear, human-readable format.

Provide the following information based on the raw data:
- Wind: Direction in degrees, speed in knots, and any gusts.
- Visibility: In statute miles. If it's 9999, report as "10+ statute miles".
- Clouds: Report cloud cover (e.g., Scattered, Broken, Overcast) and altitude in feet.
- Temperature: Report temperature and dew point in Celsius.
- Altimeter: Report the altimeter setting in inches of mercury (inHg), prefixed with 'Q' or 'A'.

Raw weather data:
{{{raw}}}`,
});

const translateWeatherFlow = ai.defineFlow(
  {
    name: 'translateWeatherFlow',
    inputSchema: WeatherInputSchema,
    outputSchema: TranslatedWeatherSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
