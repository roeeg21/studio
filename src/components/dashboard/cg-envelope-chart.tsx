'use client';

import { ComposedChart, CartesianGrid, ReferenceDot, ResponsiveContainer, XAxis, YAxis, Line, ReferenceLine } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { CG_ENVELOPE, LIMITS, AIRCRAFT_SPECS } from '@/lib/constants';

type CgEnvelopeChartProps = {
  totalWeight: number;
  totalCg: number;
  landingWeight: number;
  landingCg: number;
  zeroFuelWeight: number;
  zeroFuelCg: number;
  isWithinLimits: boolean;
};

export default function CgEnvelopeChart({ totalWeight, totalCg, landingWeight, landingCg, zeroFuelWeight, zeroFuelCg, isWithinLimits }: CgEnvelopeChartProps) {
  const statusColor = isWithinLimits ? 'hsl(var(--chart-1))' : 'hsl(var(--destructive))';
  const landingStatusColor = 'hsl(var(--chart-2))';
  const zeroFuelStatusColor = 'hsl(var(--chart-4))';

  const chartConfig = {
    envelope: {
      label: "Safe Envelope",
      color: "hsl(var(--destructive))",
    },
    current: {
      label: "Takeoff CG",
      color: statusColor,
    },
    landing: {
        label: "Landing CG",
        color: landingStatusColor,
    },
    zeroFuel: {
        label: "Zero Fuel CG",
        color: zeroFuelStatusColor,
    }
  };

  // Updated domains to match the new envelope
  const domainX: [number, number] = [34, 48];
  const domainY: [number, number] = [1800, 3200];

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
            {/* The No Autopilot zone is not standard on the 2000 model POH, so it has been removed. */}

            {totalWeight > AIRCRAFT_SPECS.emptyWeight && (
              <ReferenceDot
                x={totalCg}
                y={totalWeight}
                r={8}
                fill={statusColor}
                stroke="hsl(var(--background))"
                strokeWidth={2}
                ifOverflow="extendDomain"
              />
            )}
            
            {landingWeight > AIRCRAFT_SPECS.emptyWeight && landingCg > 0 && (
              <ReferenceDot
                x={landingCg}
                y={landingWeight}
                r={8}
                fill={landingStatusColor}
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
                    fill={zeroFuelStatusColor}
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
