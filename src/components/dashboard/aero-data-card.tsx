'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AIRPORT_DATA } from '@/lib/constants';
import { TowerControl, Wind, CloudSun, Badge } from 'lucide-react';
import { getFlightCategory, FlightCategory } from '@/lib/weather-utils';
import { Badge as BadgeUI } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const airportIdentifiers = Object.keys(AIRPORT_DATA) as (keyof typeof AIRPORT_DATA)[];

const categoryStyles: Record<FlightCategory, string> = {
  VFR: 'bg-green-500 hover:bg-green-600',
  MVFR: 'bg-blue-500 hover:bg-blue-600',
  IFR: 'bg-red-500 hover:bg-red-600',
  LIFR: 'bg-purple-500 hover:bg-purple-600',
};

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
              <TabsTrigger key={id} value={id}>{id}</TabsTrigger>
            ))}
          </TabsList>
          {airportIdentifiers.map((id) => {
            const airport = AIRPORT_DATA[id];
            const metarCategory = getFlightCategory(airport.metar);
            const tafCategory = getFlightCategory(airport.taf);

            return (
              <TabsContent key={id} value={id} className="mt-4">
                <div className="space-y-4">
                  <h4 className="font-semibold">{airport.name}</h4>
                  <div className="flex items-start gap-2 rounded-md border p-3">
                    <CloudSun className="mt-1 h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-mono text-sm font-semibold">METAR</p>
                        <BadgeUI className={cn("text-white", categoryStyles[metarCategory])}>{metarCategory}</BadgeUI>
                      </div>
                      <p className="font-mono text-xs break-words">{airport.metar}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 rounded-md border p-3">
                    <Wind className="mt-1 h-5 w-5 text-accent shrink-0" />
                    <div className="flex-1">
                       <div className="flex justify-between items-center mb-1">
                        <p className="font-mono text-sm font-semibold">TAF</p>
                        <BadgeUI className={cn("text-white", categoryStyles[tafCategory])}>{tafCategory}</BadgeUI>
                      </div>
                      <p className="font-mono text-xs break-words">{airport.taf}</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                        <TowerControl className="h-5 w-5 text-primary"/>
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
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
