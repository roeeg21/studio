'use server';

import { z } from 'zod';
import { XMLParser } from 'fast-xml-parser';

export type WeatherData = {
  metar: string;
  taf: string;
};

// This is a loose schema because the API can return a single object or an array
const ReportSchema = z.union([
  z.object({ raw_text: z.string() }),
  z.array(z.object({ raw_text: z.string() })),
]);

const WeatherResponseSchema = z.object({
  response: z.object({
    data: z.object({
      METAR: ReportSchema.optional(),
      TAF: ReportSchema.optional(),
    }),
  }),
});

export async function getWeatherData(airportCode: string): Promise<WeatherData> {
  const url = `https://www.aviationweather.gov/adds/dataserver_current/httpparam?dataSource=metars&dataSource=tafs&requestType=retrieve&format=xml&stationString=${airportCode}&hoursBeforeNow=3`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Cessna182T-Dashboard/1.0',
      },
      // Using no-cache to ensure fresh data is fetched every time
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlText = await response.text();
    // The API sometimes returns an empty response for airports with no data
    if (!xmlText.trim()) {
      return { metar: 'N/A', taf: 'N/A' };
    }
    
    const parser = new XMLParser({ ignoreAttributes: false });
    const jsonObj = parser.parse(xmlText);
    
    const parsed = WeatherResponseSchema.safeParse(jsonObj);

    if (!parsed.success) {
      console.error("Failed to parse weather XML:", parsed.error.issues);
      throw new Error("Failed to parse weather data");
    }

    const data = parsed.data.response.data;
    
    // Helper function to extract raw_text whether it's an object or an array
    const getRawText = (report?: z.infer<typeof ReportSchema>): string => {
        if (!report) return 'N/A';
        if (Array.isArray(report)) {
            return report[0]?.raw_text ?? 'N/A';
        }
        return report.raw_text ?? 'N/A';
    }

    return {
      metar: getRawText(data.METAR),
      taf: getRawText(data.TAF),
    };
  } catch (error) {
    console.error(`Error fetching weather data for ${airportCode}:`, error);
    // Return N/A to prevent the component from crashing on a failed fetch
    return { metar: 'N/A', taf: 'N/A' };
  }
}
