'use server';

export type WeatherData = {
  metar: string;
  taf: string;
};

async function fetchFromAVWX(station: string, reportType: 'metar' | 'taf'): Promise<string> {
  const url = `https://avwx.rest/api/${reportType}/${station}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.AVWX_API_KEY || ''}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`AVWX API error for ${reportType}! status: ${response.status}`);
      const errorBody = await response.text();
      console.error('Error Body:', errorBody);
      return 'N/A';
    }

    const json = await response.json();
    
    // The raw METAR/TAF string is available in the 'raw' property for AVWX
    return json.raw || 'N/A';

  } catch (error) {
    console.error(`Error fetching ${reportType} data from AVWX for ${station}:`, error);
    return 'N/A';
  }
}


export async function getWeatherData(airportCode: string): Promise<WeatherData> {
  const [metar, taf] = await Promise.all([
    fetchFromAVWX(airportCode, 'metar'),
    fetchFromAVWX(airportCode, 'taf')
  ]);

  return { metar, taf };
}
