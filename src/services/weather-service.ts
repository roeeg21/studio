'use server';

export type WeatherData = {
  metar: string;
  taf: string;
};

async function fetchFromCheckWX(station: string, reportType: 'metar' | 'taf'): Promise<string> {
  const url = `https://api.checkwx.com/${reportType}/${station}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        // IMPORTANT: You need to get a free API key from https://www.checkwx.com/
        'X-API-Key': process.env.CHECKWX_API_KEY || '',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`CheckWX API error for ${reportType}! status: ${response.status}`);
      const errorBody = await response.text();
      console.error('Error Body:', errorBody);
      return 'N/A';
    }

    const json = await response.json();
    
    if (json.results > 0 && json.data && json.data[0]) {
      // The raw METAR/TAF string is available in the 'raw_text' property
      return json.data[0].raw_text || 'N/A';
    }
    
    return 'N/A';

  } catch (error) {
    console.error(`Error fetching ${reportType} data from CheckWX for ${station}:`, error);
    return 'N/A';
  }
}


export async function getWeatherData(airportCode: string): Promise<WeatherData> {
  const [metar, taf] = await Promise.all([
    fetchFromCheckWX(airportCode, 'metar'),
    fetchFromCheckWX(airportCode, 'taf')
  ]);

  return { metar, taf };
}
