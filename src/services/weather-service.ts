'use server';

import { z } from 'zod';

export type WeatherData = {
  metar: string;
  taf: string;
};

// Schema for the CheckWX API response
const CheckWxResponseSchema = z.object({
  results: z.number(),
  data: z.array(z.object({
    raw_text: z.string(),
  })).optional(),
});


async function fetchFromCheckWx(station: string, reportType: 'metar' | 'taf'): Promise<string> {
    // This is a demo key with limitations. For production, a real key would be needed.
    const apiKey = '0e0a708261b05220a28243a207';
    // The API expects the station code to be in lowercase.
    const url = `https://api.checkwx.com/${reportType}/${station.toLowerCase()}/decoded`;

    try {
        const response = await fetch(url, {
            headers: { 'X-API-Key': apiKey },
            // Using no-cache to ensure fresh data is fetched every time
            cache: 'no-store',
        });
        
        if (!response.ok) {
            console.error(`CheckWX API error for ${reportType}! status: ${response.status}`);
            return 'N/A';
        }

        const json = await response.json();
        const parsed = CheckWxResponseSchema.safeParse(json);

        if (!parsed.success || !parsed.data || parsed.data.length === 0) {
            console.error(`Failed to parse CheckWX ${reportType} data for ${station}`, parsed.error);
            return 'N/A';
        }
        
        return parsed.data[0].raw_text;

    } catch (error) {
        console.error(`Error fetching ${reportType} data from CheckWX for ${station}:`, error);
        return 'N/A';
    }
}


export async function getWeatherData(airportCode: string): Promise<WeatherData> {
    const [metar, taf] = await Promise.all([
        fetchFromCheckWx(airportCode, 'metar'),
        fetchFromCheckWx(airportCode, 'taf')
    ]);

    return { metar, taf };
}
