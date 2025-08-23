'use client';

import { Area, AreaChart, CartesianGrid, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, ReferenceLine } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { CG_ENVELOPE, LIMITS, AIRCRAFT_SPECS } from '@/lib/constants';

type CgEnvelopeChartProps = {
  totalWeight: number;
  totalCg: number;
  landingWeight: number;
  landingCg: number;
  isWithinLimits: boolean;
};

export default function CgEnvelopeChart({ totalWeight, totalCg, landingWeight, landingCg, isWithinLimits }: CgEnvelopeChartProps) {
  const statusColor = isWithinLimits ? 'hsl(var(--chart-1))' : 'hsl(var(--destructive))';
  const landingStatusColor = 'hsl(var(--chart-2))';

  const chartConfig = {
    envelope: {
      label: "Safe Envelope",
      color: "hsl(var(--chart-1))",
    },
    current: {
      label: "Current CG",
    },
    landing: {
        label: "Max Landing Weight",
        color: "hsl(var(--chart-2))",
    }
  };

  const domainX: [number, number] = [32, 48];
  const domainY: [number, number] = [1800, 3200];


  return (
    <>
      <h3 className="text-lg font-semibold">Center of Gravity Limits</h3>
      <p className="text-sm text-muted-foreground mb-4">
        The calculated Center of Gravity must be within the safe envelope for takeoff and landing.
      </p>
      <div className="h-80">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <AreaChart
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
              tickCount={17}
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
                dataKey="weight"
                type="linear"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={false}
                activeDot={false}
            />

            <ReferenceLine y={LIMITS.maxLandingWeight} stroke="blue" strokeWidth={2} label={{ value: 'Landing', position: 'right', fill: 'blue' }} />
            <ReferenceLine x={34} stroke="green" strokeWidth={2} segment={[{y: 1800}, {y: 2400}]} label={{ value: 'NoAutoPilot', position: 'insideTop', fill: 'green' }}/>

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
          </AreaChart>
        </ChartContainer>
      </div>
    </>
  );
}

    