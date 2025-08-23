'use server';

import { z } from 'zod';
import { XMLParser } from 'fast-xml-parser';

export type WeatherData = {
  metar: string;
  taf: string;
};

const WeatherResponseSchema = z.object({
  response: z.object({
    data: z.object({
      METAR: z.array(z.object({
        raw_text: z.string(),
      })).optional(),
      TAF: z.array(z.object({
        raw_text: z.string(),
      })).optional(),
    }),
  }),
});

export async function getWeatherData(airportCode: string): Promise<WeatherData> {
  const url = `https://www.aviationweather.gov/adds/dataserver_current/httpparam?dataSource=metars&dataSource=tafs&requestType=retrieve&format=xml&stationString=${airportCode}&hoursBeforeNow=3`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Cessna182T-Dashboard/1.0',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlText = await response.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const jsonObj = parser.parse(xmlText);
    
    const parsed = WeatherResponseSchema.safeParse(jsonObj);

    if (!parsed.success) {
      console.error("Failed to parse weather XML:", parsed.error.issues);
      throw new Error("Failed to parse weather data");
    }

    const data = parsed.data.response.data;

    return {
      metar: data.METAR?.[0]?.raw_text ?? 'N/A',
      taf: data.TAF?.[0]?.raw_text ?? 'N/A',
    };
  } catch (error) {
    console.error(`Error fetching weather data for ${airportCode}:`, error);
    throw new Error('Could not fetch weather data.');
  }
}
