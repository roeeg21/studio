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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
  zeroFuelWeight: number;
  zeroFuelCg: number;
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

// This function now correctly reflects the sloped forward limit from the 2000 POH.
const isCgWithinEnvelope = (weight: number, cg: number): boolean => {
  if (weight < AIRCRAFT_SPECS.emptyWeight || weight > LIMITS.maxWeight) return false;

  const aftLimit = 47.0;
  if (cg > aftLimit) return false;

  let forwardLimit = 0;
  if (weight <= 2300) {
    forwardLimit = 35.0;
  } else if (weight > 2300 && weight <= 3100) {
    // Linear interpolation between (2300, 35.0) and (3100, 40.5)
    forwardLimit = 35.0 + ((weight - 2300) / (3100 - 2300)) * (40.5 - 35.0);
  } else {
    // This case handles weights above maxWeight, which should be caught by the first check.
    return false;
  }

  return cg >= forwardLimit;
};

const CessnaDiagram = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 300 300"
      className="w-full h-auto rounded-md bg-muted"
      aria-labelledby="cessnaTitle cessnaDesc"
    >
      <title id="cessnaTitle">Cessna 182T Top-Down Diagram</title>
      <desc id="cessnaDesc">A line drawing of a Cessna 182T aircraft from a top-down perspective.</desc>
      <g stroke="hsl(var(--foreground))" strokeWidth="1" fill="none">
        {/* Fuselage */}
        <path d="M 150,20 L 150,250" />
        <path d="M 140,40 C 140,20 160,20 160,40 L 160,110 L 155,250 L 145,250 L 140,110 Z" fill="hsl(var(--card))" />
        
        {/* Propeller */}
        <path d="M 150,20 C 145,15 155,15 150,20 Z" fill="hsl(var(--foreground))" />
        <path d="M 148,25 L 142,15" strokeWidth="2" />
        <path d="M 152,25 L 158,15" strokeWidth="2" />

        {/* Wings */}
        <path d="M 40,80 L 140,80 L 140,95 L 50,95 Q 40,95 40,85 Z" fill="hsl(var(--card))" />
        <path d="M 160,80 L 260,80 Q 270,85 260,95 L 160,95 Z" fill="hsl(var(--card))" />
        
        {/* Fuel Caps */}
        <circle cx="120" cy="88" r="3" strokeWidth="0.5" />
        <circle cx="180" cy="88" r="3" strokeWidth="0.5" />

        {/* Tail */}
        <path d="M 120,250 L 180,250 L 185,265 L 115,265 Z" fill="hsl(var(--card))" />
        <path d="M 145,250 L 140,270 L 150,280 L 150,250" fill="hsl(var(--card))" />
        <path d="M 155,250 L 160,270 L 150,280 L 150,250" fill="hsl(var(--card))" />
        
        {/* Cockpit Windows */}
        <path d="M 142,45 C 140,55 160,55 158,45" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity="0.3" />
        <path d="M 142,98 L 142,110 L 158,110 L 158,98" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity="0.3" />
      </g>
    </svg>
);


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

    // Zero Fuel Calculation
    const zeroFuelWeight = totalWeight - weights.fuel;
    const zeroFuelMoment = totalMoment - fuelMoment;
    const zeroFuelCg = zeroFuelWeight > 0 ? zeroFuelMoment / zeroFuelWeight : 0;


    return { 
        totalWeight, totalCg, isWithinLimits, totalBaggageWeight, landingWeight, landingCg, isLandingWeightOk, zeroFuelWeight, zeroFuelCg,
        moments: {
            pilot: pilotMoment,
            coPilot: coPilotMoment,
            rearSeats: rearMoment,
            fuel: fuelMoment,
            baggageA: baggageAMoment,
            baggageB: baggageBMoment,
            baggageC: baggageCMoment,
            total: totalMoment,
        }
    };
  }, [weights, plannedFuelBurnGal]);

  useEffect(() => {
    onUpdate({
      totalWeight: calculation.totalWeight,
      totalCg: calculation.totalCg,
      landingWeight: calculation.landingWeight,
      landingCg: calculation.landingCg,
      zeroFuelWeight: calculation.zeroFuelWeight,
      zeroFuelCg: calculation.zeroFuelCg,
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
          <CardTitle>Weight &amp; Balance</CardTitle>
          <div className="flex items-center space-x-2">
            <Label htmlFor="unit-switch">KG</Label>
            <Switch id="unit-switch" checked={isKg} onCheckedChange={setIsKg} />
          </div>
        </div>
        <CardDescription>Enter weights for each station to calculate total weight and center of gravity.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Visualizer */}
        <div className="relative w-full max-w-sm mx-auto">
          <CessnaDiagram />
          <WeightDisplay value={getDisplayValue(weights.pilot)} unit={unitLabel} className="top-[32%] left-[24%]" />
          <WeightDisplay value={getDisplayValue(weights.coPilot)} unit={unitLabel} className="top-[32%] right-[24%]" />
          <WeightDisplay value={getDisplayValue(weights.rearSeats)} unit={unitLabel} className="top-[49%] left-1/2" />
          <WeightDisplay value={getDisplayValue(Number(fuelGal))} unit="gal" className="top-[42%] left-[10%]" />
          <WeightDisplay value={getDisplayValue(Number(fuelGal))} unit="gal" className="top-[42%] right-[10%]" />
          <WeightDisplay value={getDisplayValue(weights.baggageA)} unit={unitLabel} className="top-[64%] left-1/2" />
          <WeightDisplay value={getDisplayValue(weights.baggageB)} unit={unitLabel} className="top-[73%] left-1/2" />
          <WeightDisplay value={getDisplayValue(weights.baggageC)} unit={unitLabel} className="top-[82%] left-1/2" />
        </div>

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

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-sm font-medium">Show Calculations</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2 text-sm text-muted-foreground">
                 <CalculationRow label="Empty Weight Moment" value={AIRCRAFT_SPECS.emptyMoment.toFixed(2)} />
                 <CalculationRow label="Pilot Moment" value={calculation.moments.pilot.toFixed(2)} />
                 <CalculationRow label="Co-Pilot Moment" value={calculation.moments.coPilot.toFixed(2)} />
                 <CalculationRow label="Rear Passengers Moment" value={calculation.moments.rearSeats.toFixed(2)} />
                 <CalculationRow label="Fuel Moment" value={calculation.moments.fuel.toFixed(2)} />
                 <CalculationRow label="Baggage A Moment" value={calculation.moments.baggageA.toFixed(2)} />
                 <CalculationRow label="Baggage B Moment" value={calculation.moments.baggageB.toFixed(2)} />
                 <CalculationRow label="Baggage C Moment" value={calculation.moments.baggageC.toFixed(2)} />
                 <Separator className="my-2"/>
                 <CalculationRow label="Total Moment" value={calculation.moments.total.toFixed(2)} isBold={true} />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

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

// Sub-component for overlaying weight on the image
function WeightDisplay({ value, unit, className }: { value: string; unit: string; className?: string }) {
  if (!value || Number(value) === 0) return null;
  return (
    <div className={`absolute -translate-x-1/2 transform bg-background/80 text-foreground text-xs font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm ${className}`}>
      {value} {unit}
    </div>
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

// Sub-component for calculation rows
function CalculationRow({ label, value, isBold = false }: { label: string, value: string, isBold?: boolean }) {
  return (
    <div className={`flex justify-between items-center ${isBold ? 'font-semibold text-foreground' : ''}`}>
      <p>{label}</p>
      <p>{value} lb-in</p>
    </div>
  );
}
