'use client';

import { Area, AreaChart, CartesianGrid, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { CG_ENVELOPE, LIMITS, AIRCRAFT_SPECS } from '@/lib/constants';

type CgEnvelopeChartProps = {
  totalWeight: number;
  totalCg: number;
  isWithinLimits: boolean;
};

export default function CgEnvelopeChart({ totalWeight, totalCg, isWithinLimits }: CgEnvelopeChartProps) {
  const statusColor = isWithinLimits ? 'hsl(var(--chart-1))' : 'hsl(var(--destructive))';

  const chartConfig = {
    envelope: {
      label: "Safe Envelope",
      color: "hsl(var(--chart-1))",
    },
    current: {
      label: "Current CG",
    }
  };

  return (
    <>
      <h3 className="text-lg font-semibold">CG Envelope</h3>
      <p className="text-sm text-muted-foreground mb-4">
        The calculated Center of Gravity must be within the safe envelope.
      </p>
      <div className="h-80">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <AreaChart
            accessibilityLayer
            data={CG_ENVELOPE}
            margin={{
              top: 5,
              right: 10,
              left: 10,
              bottom: 20,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="cg"
              type="number"
              domain={['dataMin - 1', 'dataMax + 1']}
              label={{ value: 'Center of Gravity (in)', position: 'bottom', offset: 10 }}
              tickCount={7}
              tickFormatter={(value) => value.toFixed(1)}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              dataKey="weight"
              type="number"
              domain={[1800, LIMITS.maxWeight + 200]}
              label={{ value: 'Weight (lbs)', angle: -90, position: 'insideLeft', offset: 0 }}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" labelKey="weight" />} />
            <defs>
              <linearGradient id="fillEnvelope" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-envelope)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-envelope)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Area
                dataKey="weight"
                type="natural"
                fill="url(#fillEnvelope)"
                stroke="var(--color-envelope)"
                stackId="a"
            />
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
          </AreaChart>
        </ChartContainer>
      </div>
    </>
  );
}
