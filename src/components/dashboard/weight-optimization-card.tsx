'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getWeightOptimizationSuggestions } from '@/app/actions';
import { Wand2, Loader2 } from 'lucide-react';
import type { WeightAndBalanceReport } from './weight-balance-card';
import { CG_LIMITS_FOR_AI } from '@/lib/constants';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type Props = {
  wbReport: WeightAndBalanceReport;
};

export default function WeightOptimizationCard({ wbReport }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState('');
  const [error, setError] = useState('');

  const handleOptimize = async () => {
    setIsLoading(true);
    setError('');
    setSuggestions('');

    const baggageWeight = (wbReport.weights.baggageA || 0) + (wbReport.weights.baggageB || 0);

    const result = await getWeightOptimizationSuggestions({
      pilotWeight: wbReport.weights.frontSeats || 0,
      passengerWeight: wbReport.weights.rearSeats || 0,
      fuelWeight: wbReport.weights.fuel || 0,
      baggageWeight: baggageWeight,
      currentCG: wbReport.totalCg,
      cgLimits: CG_LIMITS_FOR_AI,
    });

    if (result.error) {
      setError(result.error);
    } else if (result.suggestions) {
      setSuggestions(result.suggestions);
    }
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Weight Optimizer</CardTitle>
        <CardDescription>Get suggestions to optimize your aircraft's weight distribution for safety and performance.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleOptimize} disabled={isLoading} className="w-full">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
          Generate Suggestions
        </Button>
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {suggestions && (
          <Alert>
            <AlertTitle>Optimization Suggestions</AlertTitle>
            <AlertDescription className="whitespace-pre-wrap">{suggestions}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
