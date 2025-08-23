'use server';

export type WeatherData = {
  metar: string;
  taf: string;
};

async function fetchFromAviationWeather(station: string, reportType: 'metar' | 'taf'): Promise<string> {
  // Use the official aviationweather.gov API
  const url = `https://aviationweather.gov/api/data/${reportType}?ids=${station.toUpperCase()}&format=csv`;

  try {
    const response = await fetch(url, {
      // Using no-cache to ensure fresh data is fetched every time
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`AviationWeather API error for ${reportType}! status: ${response.status}`);
      return 'N/A';
    }

    const csvText = await response.text();
    const lines = csvText.split('\n');

    // Find the line corresponding to the raw text
    // The first line is headers, the second should be the data.
    if (lines.length > 1 && lines[1]) {
        const columns = lines[1].split(',');
        // In both METAR and TAF CSV, the first column is the raw_text
        const rawText = columns[0];
        if (rawText) {
            return rawText;
        }
    }
    
    // If no data is found after parsing
    return 'N/A';

  } catch (error) {
    console.error(`Error fetching ${reportType} data from AviationWeather for ${station}:`, error);
    return 'N/A';
  }
}

export async function getWeatherData(airportCode: string): Promise<WeatherData> {
  const [metar, taf] = await Promise.all([
    fetchFromAviationWeather(airportCode, 'metar'),
    fetchFromAviationWeather(airportCode, 'taf')
  ]);

  return { metar, taf };
}
