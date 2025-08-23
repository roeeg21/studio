'use client';

import { ComposedChart, CartesianGrid, ReferenceDot, ResponsiveContainer, XAxis, YAxis, Line, ReferenceLine } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { CG_ENVELOPE, LIMITS, AIRCRAFT_SPECS } from '@/lib/constants';

type CgEnvelopeChartProps = {
  totalWeight: number;
  totalCg: number;
  zeroFuelWeight: number;
  zeroFuelCg: number;
  isWithinLimits: boolean;
};

export default function CgEnvelopeChart({ totalWeight, totalCg, zeroFuelWeight, zeroFuelCg, isWithinLimits }: CgEnvelopeChartProps) {
  const takeoffStatusColor = isWithinLimits ? 'hsl(var(--chart-1))' : 'hsl(var(--destructive))';
  const zeroFuelStatusColor = 'hsl(var(--destructive))';

  const chartConfig = {
    envelope: {
      label: "Safe Envelope",
      color: "hsl(var(--destructive))",
    },
    takeoff: {
      label: "Takeoff CG",
      color: 'hsl(142.1 76.2% 41%)', // Green
    },
    zeroFuel: {
        label: "Zero Fuel CG",
        color: 'hsl(0 84.2% 60.2%)', // Red
    }
  };

  const domainX: [number, number] = [34, 48];
  const domainY: [number, number] = [1800, 3200];
  
  const fuelBurnLineData = (totalWeight > AIRCRAFT_SPECS.emptyWeight && zeroFuelWeight > AIRCRAFT_SPECS.emptyWeight)
    ? [{ cg: totalCg, weight: totalWeight }, { cg: zeroFuelCg, weight: zeroFuelWeight }]
    : [];


  return (
    <>
      <h3 className="text-lg font-semibold">Center of Gravity Limits</h3>
      <p className="text-sm text-muted-foreground mb-4">
        The calculated Center of Gravity must be within the safe envelope for takeoff and landing.
      </p>
      <div className="h-80">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ComposedChart
            accessibilityLayer
            data={CG_ENVELOPE}
            margin={{
              top: 5,
              right: 20,
              left: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="cg"
              type="number"
              domain={domainX}
              label={{ value: 'CG (in)', position: 'bottom', offset: 10 }}
              tickCount={15}
              tickFormatter={(value) => value.toString()}
              axisLine={{ stroke: 'hsl(var(--foreground))' }}
              tickLine={{ stroke: 'hsl(var(--foreground))' }}
            />
            <YAxis
              dataKey="weight"
              type="number"
              domain={domainY}
              label={{ value: 'Weight (lbs)', angle: -90, position: 'insideLeft', offset: -10 }}
              tickCount={15}
              tickFormatter={(value) => value.toString()}
              axisLine={{ stroke: 'hsl(var(--foreground))' }}
              tickLine={{ stroke: 'hsl(var(--foreground))' }}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" labelKey="weight" />} />
            
            <Line
                data={CG_ENVELOPE}
                dataKey="weight"
                type="linear"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={false}
                activeDot={false}
            />

            <ReferenceLine y={LIMITS.maxLandingWeight} stroke="hsl(var(--chart-2))" strokeDasharray="4 4" label={{ value: 'Max Landing Weight', position: 'insideBottomRight', fill: 'hsl(var(--foreground))', fontSize: 12 }} />

            {/* Line connecting takeoff and zero-fuel points */}
            <Line
                data={fuelBurnLineData}
                dataKey="weight"
                type="linear"
                stroke="hsl(var(--foreground))"
                strokeDasharray="5 5"
                strokeWidth={1}
                dot={false}
                activeDot={false}
            />

            {totalWeight > AIRCRAFT_SPECS.emptyWeight && (
              <ReferenceDot
                x={totalCg}
                y={totalWeight}
                r={8}
                fill={isWithinLimits ? chartConfig.takeoff.color : chartConfig.zeroFuel.color}
                stroke="hsl(var(--background))"
                strokeWidth={2}
                ifOverflow="extendDomain"
              />
            )}
            
            {zeroFuelWeight > AIRCRAFT_SPECS.emptyWeight && zeroFuelCg > 0 && (
                <ReferenceDot
                    x={zeroFuelCg}
                    y={zeroFuelWeight}
                    r={8}
                    fill={chartConfig.zeroFuel.color}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                    ifOverflow="extendDomain"
                />
            )}
          </ComposedChart>
        </ChartContainer>
      </div>
    </>
  );
}
