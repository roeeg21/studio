'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AIRPORT_DATA, type AirportData } from '@/lib/constants';
import { TowerControl, Wind, CloudSun, Briefcase, Thermometer, Eye, Cloud } from 'lucide-react';
import { getFlightCategory, FlightCategory } from '@/lib/weather-utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { translateWeather, type TranslatedWeather } from '@/ai/flows/weather-flow';
import { getWeatherData, type WeatherData } from '@/services/weather-service';
import { Skeleton } from '@/components/ui/skeleton';

const airportIdentifiers = Object.keys(AIRPORT_DATA) as (keyof typeof AIRPORT_DATA)[];

const categoryStyles: Record<FlightCategory, string> = {
  VFR: 'bg-green-500 hover:bg-green-600',
  MVFR: 'bg-blue-500 hover:bg-blue-600',
  IFR: 'bg-red-500 hover:bg-red-600',
  LIFR: 'bg-purple-500 hover:bg-purple-600',
};

function WeatherInfo({ airportId, airport }: { airportId: string; airport: AirportData }) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [translatedMetar, setTranslatedMetar] = useState<TranslatedWeather | null>(null);
  const [translatedTaf, setTranslatedTaf] = useState<TranslatedWeather | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAndTranslateWeather() {
      try {
        setLoading(true);
        const data = await getWeatherData(airportId);
        setWeatherData(data);

        if (data.metar && data.metar !== 'N/A') {
          const translated = await translateWeather({ raw: data.metar });
          setTranslatedMetar(translated);
        } else {
          setTranslatedMetar(null);
        }
        if (data.taf && data.taf !== 'N/A') {
          const translated = await translateWeather({ raw: data.taf });
          setTranslatedTaf(translated);
        } else {
          setTranslatedTaf(null);
        }
      } catch (error) {
        console.error(`Failed to fetch weather for ${airportId}`, error);
        setWeatherData({ metar: 'Error loading data.', taf: 'Error loading data.' });
      } finally {
        setLoading(false);
      }
    }
    fetchAndTranslateWeather();
  }, [airportId]);

  if (loading) {
    return (
       <div className="space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!weatherData) {
    return <p>Could not load weather data.</p>;
  }
  
  const metarCategory = getFlightCategory(weatherData.metar);
  const tafCategory = getFlightCategory(weatherData.taf);

  return (
    <div className="space-y-4">
      <h4 className="font-semibold">{airport.name}</h4>
      {/* METAR */}
      <div className="flex flex-col gap-2 rounded-md border p-3">
        <div className="flex items-start gap-2">
            <CloudSun className="mt-1 h-5 w-5 text-primary shrink-0" />
            <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                    <p className="font-mono text-sm font-semibold">METAR</p>
                    <Badge className={cn('text-white', categoryStyles[metarCategory])}>{metarCategory}</Badge>
                </div>
                <p className="font-mono text-xs break-words">{weatherData.metar}</p>
            </div>
        </div>
        {translatedMetar && <WeatherTranslationDisplay weather={translatedMetar} />}
      </div>
      
      {/* TAF */}
      <div className="flex flex-col gap-2 rounded-md border p-3">
        <div className="flex items-start gap-2">
            <Wind className="mt-1 h-5 w-5 text-accent shrink-0" />
            <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                    <p className="font-mono text-sm font-semibold">TAF</p>
                    <Badge className={cn('text-white', categoryStyles[tafCategory])}>{tafCategory}</Badge>
                </div>
                <p className="font-mono text-xs break-words">{weatherData.taf}</p>
            </div>
        </div>
         {translatedTaf && <WeatherTranslationDisplay weather={translatedTaf} />}
      </div>
      
      {/* Frequencies */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <TowerControl className="h-5 w-5 text-primary" />
          <p className="font-mono text-sm font-semibold">ATC Frequencies</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Frequency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {airport.frequencies.map((freq) => (
              <TableRow key={freq.type}>
                <TableCell>{freq.type}</TableCell>
                <TableCell className="font-mono">{freq.freq}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function WeatherTranslationDisplay({ weather }: { weather: TranslatedWeather }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm pt-2 border-t">
       <div className="flex items-center gap-2"><Wind className="h-4 w-4 text-muted-foreground"/> <span>{weather.wind}</span></div>
       <div className="flex items-center gap-2"><Eye className="h-4 w-4 text-muted-foreground"/> <span>{weather.visibility}</span></div>
       <div className="flex items-center gap-2"><Cloud className="h-4 w-4 text-muted-foreground"/> <span>{weather.clouds}</span></div>
       <div className="flex items-center gap-2"><Thermometer className="h-4 w-4 text-muted-foreground"/> <span>{weather.temperature}</span></div>
       <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-muted-foreground"/> <span>{weather.altimeter}</span></div>
    </div>
  )
}

export default function AeroDataCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Aerodrome Data</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="LLHA">
          <TabsList className="grid w-full grid-cols-3">
            {airportIdentifiers.map((id) => (
              <TabsTrigger key={id} value={id}>
                {id}
              </TabsTrigger>
            ))}
          </TabsList>
          {airportIdentifiers.map((id) => {
            const airport = AIRPORT_DATA[id];
            return (
              <TabsContent key={id} value={id} className="mt-4">
                  <WeatherInfo airportId={id} airport={airport} />
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
