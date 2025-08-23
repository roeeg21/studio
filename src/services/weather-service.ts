'use server';

export type WeatherData = {
  metar: string;
  taf: string;
};

async function fetchFromAviationWeather(station: string, reportType: 'metar' | 'taf'): Promise<string> {
  const url = `https://aviationweather.gov/api/data/${reportType}?ids=${station.toUpperCase()}&format=csv`;

  try {
    const response = await fetch(url, {
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`AviationWeather API error for ${reportType}! status: ${response.status}`);
      return 'N/A';
    }

    const csvText = await response.text();
    const lines = csvText.split('\n');

    if (lines.length > 1 && lines[1]) {
      const columns = lines[1].split(',');
      // The column index for the raw text is different for METAR and TAF reports.
      const rawTextColumnIndex = reportType === 'metar' ? 0 : 1;
      
      if (columns.length > rawTextColumnIndex) {
        const rawText = columns[rawTextColumnIndex];
        if (rawText) {
          return rawText;
        }
      }
    }
    
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
