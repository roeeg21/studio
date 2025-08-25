'use client';

import { useState } from 'react';
import type { WeightAndBalanceReport } from '@/components/dashboard/weight-balance-card';
import WeightBalanceCard from '@/components/dashboard/weight-balance-card';
import CgEnvelopeChart from '@/components/dashboard/cg-envelope-chart';
import AeroDataCard from '@/components/dashboard/aero-data-card';
import { AIRCRAFT_SPECS } from '@/lib/constants';

const initialWbReport: WeightAndBalanceReport = {
  totalWeight: AIRCRAFT_SPECS.emptyWeight,
  totalCg: AIRCRAFT_SPECS.emptyCg,
  landingWeight: 0,
  landingCg: 0,
  zeroFuelWeight: 0,
  zeroFuelCg: 0,
  weights: {
    pilot: 0,
    coPilot: 0,
    rearSeats: 0,
    fuel: 0,
    baggageA: 0,
    baggageB: 0,
    baggageC: 0,
  },
  isWithinLimits: true,
  isLandingWeightOk: true,
};

export default function DashboardClient() {
  const [wbReport, setWbReport] = useState<WeightAndBalanceReport>(initialWbReport);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <WeightBalanceCard onUpdate={setWbReport} />
      </div>
      <div className="flex flex-col gap-4 md:gap-8 lg:col-span-2">
        <div className="rounded-xl bg-card p-4 shadow-sm">
          <CgEnvelopeChart
            totalWeight={wbReport.totalWeight}
            totalCg={wbReport.totalCg}
            zeroFuelWeight={wbReport.zeroFuelWeight}
            zeroFuelCg={wbReport.zeroFuelCg}
            isWithinLimits={wbReport.isWithinLimits}
          />
        </div>
        <AeroDataCard />
      </div>
    </div>
  );
}
