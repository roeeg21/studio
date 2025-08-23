'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { AIRCRAFT_SPECS, STATIONS, LIMITS, KG_TO_LB, GAL_TO_LB } from '@/lib/constants';
import { User, Fuel, Luggage, Save, FolderOpen, AlertCircle, Droplets } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Weights = {
  pilot: number;
  coPilot: number;
  rearSeats: number;
  fuel: number;
  baggageA: number;
  baggageB: number;
  baggageC: number;
};

export type WeightAndBalanceReport = {
  totalWeight: number;
  totalCg: number;
  landingWeight: number;
  landingCg: number;
  weights: Weights;
  isWithinLimits: boolean;
  isLandingWeightOk: boolean;
};

type WeightBalanceCardProps = {
  onUpdate: (report: WeightAndBalanceReport) => void;
};

type Profile = {
  name: string;
  weights: Weights;
};

const isCgWithinEnvelope = (weight: number, cg: number): boolean => {
  if (weight < AIRCRAFT_SPECS.emptyWeight || weight > LIMITS.maxWeight) return false;

  const aftLimit = 46.0;
  if (cg > aftLimit) return false;

  let forwardLimit = 0;
  if (weight <= 2250) {
    forwardLimit = 33.0;
  } else if (weight > 2250 && weight <= 2400) {
    // Linear interpolation between (2250, 33.0) and (2400, 34.0)
    forwardLimit = 33.0 + ((weight - 2250) / (2400 - 2250)) * (34.0 - 33.0);
  } else if (weight > 2400 && weight <= 2700) {
    // Linear interpolation between (2400, 34.0) and (2700, 36.0)
    forwardLimit = 34.0 + ((weight - 2400) / (2700 - 2400)) * (36.0 - 34.0);
  } else if (weight > 2700 && weight <= 3100) {
    // Linear interpolation between (2700, 36.0) and (3100, 41.0)
    forwardLimit = 36.0 + ((weight - 2700) / (3100 - 2700)) * (41.0 - 36.0);
  } else {
    // This case handles weights above maxWeight, which should be caught by the first check.
    return false;
  }

  return cg >= forwardLimit;
};


export default function WeightBalanceCard({ onUpdate }: WeightBalanceCardProps) {
  const [isKg, setIsKg] = useState(false);
  const [weights, setWeights] = useState<Weights>({ pilot: 0, coPilot: 0, rearSeats: 0, fuel: 0, baggageA: 0, baggageB: 0, baggageC: 0 });
  const [fuelGal, setFuelGal] = useState('');
  const [plannedFuelBurnGal, setPlannedFuelBurnGal] = useState('');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileName, setProfileName] = useState('');
  const [isSaveOpen, setSaveOpen] = useState(false);
  const [isLoadOpen, setLoadOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedProfiles = localStorage.getItem('c182t-wb-profiles');
      if (savedProfiles) {
        setProfiles(JSON.parse(savedProfiles));
      }
    } catch (error) {
      console.error("Could not load profiles from localStorage", error);
    }
  }, []);

  const handleWeightChange = (name: keyof Weights, value: string) => {
    const numericValue = parseInt(value, 10) || 0;
    const valueInLbs = isKg ? Math.round(numericValue * KG_TO_LB) : numericValue;
    setWeights(prev => ({ ...prev, [name]: valueInLbs }));
  };
  
  const handleFuelChange = (value: string) => {
    setFuelGal(value);
    const numericValue = parseInt(value, 10) || 0;
    setWeights(prev => ({ ...prev, fuel: Math.round(numericValue * GAL_TO_LB) }));
  };
  
  const handleFuelBurnChange = (value: string) => {
    setPlannedFuelBurnGal(value);
  };

  const getDisplayValue = (lbs: number) => {
    const value = isKg ? Math.round(lbs / KG_TO_LB) : lbs;
    return value > 0 ? value.toString() : '';
  };

  const calculation = useMemo(() => {
    const pilotMoment = weights.pilot * STATIONS.pilot.arm;
    const coPilotMoment = weights.coPilot * STATIONS.coPilot.arm;
    const rearMoment = weights.rearSeats * STATIONS.rearSeats.arm;
    const fuelMoment = weights.fuel * STATIONS.fuel.arm;
    const baggageAMoment = weights.baggageA * STATIONS.baggageA.arm;
    const baggageBMoment = weights.baggageB * STATIONS.baggageB.arm;
    const baggageCMoment = weights.baggageC * STATIONS.baggageC.arm;

    const totalBaggageWeight = weights.baggageA + weights.baggageB + weights.baggageC;

    const totalPayloadWeight = weights.pilot + weights.coPilot + weights.rearSeats + weights.fuel + totalBaggageWeight;
    const totalWeight = AIRCRAFT_SPECS.emptyWeight + totalPayloadWeight;
    const totalMoment = AIRCRAFT_SPECS.emptyMoment + pilotMoment + coPilotMoment + rearMoment + fuelMoment + baggageAMoment + baggageBMoment + baggageCMoment;
    const totalCg = totalWeight > 0 ? totalMoment / totalWeight : AIRCRAFT_SPECS.emptyCg;

    const isWithinLimits = isCgWithinEnvelope(totalWeight, totalCg);

    // Landing Calculation
    const fuelBurnLbs = (parseInt(plannedFuelBurnGal, 10) || 0) * GAL_TO_LB;
    const fuelBurnMoment = fuelBurnLbs * STATIONS.fuel.arm;
    const landingWeight = totalWeight - fuelBurnLbs;
    const landingMoment = totalMoment - fuelBurnMoment;
    const landingCg = landingWeight > 0 ? landingMoment / landingWeight : 0;
    const isLandingWeightOk = landingWeight <= LIMITS.maxLandingWeight;


    return { totalWeight, totalCg, isWithinLimits, totalBaggageWeight, landingWeight, landingCg, isLandingWeightOk };
  }, [weights, plannedFuelBurnGal]);

  useEffect(() => {
    onUpdate({
      totalWeight: calculation.totalWeight,
      totalCg: calculation.totalCg,
      landingWeight: calculation.landingWeight,
      landingCg: calculation.landingCg,
      weights: weights,
      isWithinLimits: calculation.isWithinLimits,
      isLandingWeightOk: calculation.isLandingWeightOk,
    });
  }, [calculation, weights, onUpdate]);

  const saveProfile = () => {
    if (!profileName) {
      toast({ title: "Error", description: "Profile name cannot be empty.", variant: "destructive" });
      return;
    }
    const newProfile: Profile = { name: profileName, weights };
    const updatedProfiles = [...profiles.filter(p => p.name !== profileName), newProfile];
    setProfiles(updatedProfiles);
    localStorage.setItem('c182t-wb-profiles', JSON.stringify(updatedProfiles));
    toast({ title: "Success", description: `Profile "${profileName}" saved.` });
    setProfileName('');
    setSaveOpen(false);
  };

  const loadProfile = (name: string) => {
    const profile = profiles.find(p => p.name === name);
    if (profile) {
      const loadedWeights = {
        pilot: 0,
        coPilot: 0,
        rearSeats: 0,
        fuel: 0,
        baggageA: 0,
        baggageB: 0,
        baggageC: 0,
        ...profile.weights
      };

      if ((profile.weights as any).frontSeats) {
        loadedWeights.pilot = (profile.weights as any).frontSeats;
        loadedWeights.coPilot = 0;
      }

      setWeights(loadedWeights);
      setFuelGal(Math.round(loadedWeights.fuel / GAL_TO_LB).toString());

      toast({ title: "Success", description: `Profile "${name}" loaded.` });
      setLoadOpen(false);
    }
  };

  const unitLabel = isKg ? 'kg' : 'lb';
  const isBaggageOverLimit = calculation.totalBaggageWeight > LIMITS.totalBaggageMax;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Weight & Balance</CardTitle>
          <div className="flex items-center space-x-2">
            <Label htmlFor="unit-switch">KG</Label>
            <Switch id="unit-switch" checked={isKg} onCheckedChange={setIsKg} />
          </div>
        </div>
        <CardDescription>Enter weights for each station to calculate total weight and center of gravity.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Inputs */}
        <WeightInput icon={User} label={STATIONS.pilot.label} value={getDisplayValue(weights.pilot)} onChange={e => handleWeightChange('pilot', e.target.value)} unit={unitLabel} />
        <WeightInput icon={User} label={STATIONS.coPilot.label} value={getDisplayValue(weights.coPilot)} onChange={e => handleWeightChange('coPilot', e.target.value)} unit={unitLabel} />
        <WeightInput icon={User} label={STATIONS.rearSeats.label} value={getDisplayValue(weights.rearSeats)} onChange={e => handleWeightChange('rearSeats', e.target.value)} unit={unitLabel} />
        <WeightInput icon={Fuel} label={STATIONS.fuel.label} value={fuelGal} onChange={e => handleFuelChange(e.target.value)} unit="gal" max={LIMITS.fuelMaxGal} />
        <WeightInput icon={Droplets} label="Fuel Burn" value={plannedFuelBurnGal} onChange={e => handleFuelBurnChange(e.target.value)} unit="gal" />
        <WeightInput icon={Luggage} label={STATIONS.baggageA.label} value={getDisplayValue(weights.baggageA)} onChange={e => handleWeightChange('baggageA', e.target.value)} unit={unitLabel} max={isKg ? Math.round(LIMITS.baggageAMax / KG_TO_LB) : LIMITS.baggageAMax} />
        <WeightInput icon={Luggage} label={STATIONS.baggageB.label} value={getDisplayValue(weights.baggageB)} onChange={e => handleWeightChange('baggageB', e.target.value)} unit={unitLabel} max={isKg ? Math.round(LIMITS.baggageBMax / KG_TO_LB) : LIMITS.baggageBMax}/>
        <WeightInput icon={Luggage} label={STATIONS.baggageC.label} value={getDisplayValue(weights.baggageC)} onChange={e => handleWeightChange('baggageC', e.target.value)} unit={unitLabel} max={isKg ? Math.round(LIMITS.baggageCMax / KG_TO_LB) : LIMITS.baggageCMax}/>
        
        {isBaggageOverLimit && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Total baggage weight exceeds the {LIMITS.totalBaggageMax} lb limit.
            </AlertDescription>
          </Alert>
        )}

        <Separator />

        {/* Totals */}
        <div className="space-y-2 pt-2">
            <div className={`flex justify-between items-center font-medium ${calculation.totalWeight > LIMITS.maxWeight ? 'text-destructive' : ''}`}>
                <p>Total Weight</p>
                <div className="flex items-center gap-2">
                  {calculation.totalWeight > LIMITS.maxWeight && <AlertCircle className="h-4 w-4" />}
                  <p>{calculation.totalWeight.toFixed(2)} lb</p>
                </div>
            </div>
             <div className={`flex justify-between items-center font-medium ${!calculation.isWithinLimits ? 'text-destructive' : ''}`}>
                <p>Center of Gravity</p>
                 <div className="flex items-center gap-2">
                  {!calculation.isWithinLimits && <AlertCircle className="h-4 w-4" />}
                  <p>{calculation.totalCg.toFixed(2)} in</p>
                </div>
            </div>
            <div className={`flex justify-between items-center font-medium text-sm text-muted-foreground ${!calculation.isLandingWeightOk ? 'text-destructive' : ''}`}>
                <p>Landing Weight</p>
                <div className="flex items-center gap-2">
                  {!calculation.isLandingWeightOk && <AlertCircle className="h-4 w-4" />}
                  <p>{calculation.landingWeight.toFixed(2)} lb</p>
                </div>
            </div>
        </div>

      </CardContent>
      <CardFooter className="flex gap-2">
        <Dialog open={isSaveOpen} onOpenChange={setSaveOpen}>
          <DialogTrigger asChild><Button variant="outline" className="w-full"><Save className="mr-2"/> Save Profile</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Save Profile</DialogTitle><DialogDescription>Enter a name for your current weight setup.</DialogDescription></DialogHeader>
            <Input value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="e.g., Two people, full fuel" />
            <DialogFooter><Button onClick={saveProfile}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={isLoadOpen} onOpenChange={setLoadOpen}>
          <DialogTrigger asChild><Button className="w-full" disabled={profiles.length === 0}><FolderOpen className="mr-2"/> Load Profile</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Load Profile</DialogTitle><DialogDescription>Select a saved profile to load.</DialogDescription></DialogHeader>
            <Select onValueChange={loadProfile}>
              <SelectTrigger><SelectValue placeholder="Select a profile" /></SelectTrigger>
              <SelectContent>
                {profiles.map(p => <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}

// Sub-component for inputs
function WeightInput({ icon: Icon, label, value, onChange, unit, max }: { icon: React.ElementType, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, unit: string, max?: number }) {
  const numericValue = parseInt(value, 10);
  const hasWarning = max && !isNaN(numericValue) && numericValue > max;

  return (
    <div className="grid grid-cols-3 items-center gap-4">
      <Label htmlFor={label} className="col-span-1 flex items-center gap-2 text-sm">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {label}
      </Label>
      <div className="col-span-2 relative">
         <Input id={label} type="number" value={value} onChange={onChange} placeholder="0" className={`pr-10 ${hasWarning ? 'border-destructive' : ''}`} step="1" />
         <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">{unit}</span>
      </div>
      {max && (
        <Popover>
          <PopoverTrigger asChild>
            <p className={`col-start-2 col-span-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground ${hasWarning ? 'text-destructive font-semibold' : ''}`}>
              Limit: {max} {unit}
            </p>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2 text-xs">Max allowable {unit === 'gal' ? 'fuel' : 'weight'} for this station.</PopoverContent>
        </Popover>
      )}
    </div>
  );
}
