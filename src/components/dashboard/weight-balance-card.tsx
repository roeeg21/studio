'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { AIRCRAFT_SPECS, STATIONS, LIMITS, KG_TO_LB, CG_ENVELOPE } from '@/lib/constants';
import { User, Fuel, Luggage, Save, FolderOpen, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type Weights = {
  frontSeats: number;
  rearSeats: number;
  fuel: number;
  baggageA: number;
  baggageB: number;
};

export type WeightAndBalanceReport = {
  totalWeight: number;
  totalCg: number;
  weights: Weights;
  isWithinLimits: boolean;
};

type WeightBalanceCardProps = {
  onUpdate: (report: WeightAndBalanceReport) => void;
};

type Profile = {
  name: string;
  weights: Weights;
};

const isCgWithinEnvelope = (weight: number, cg: number): boolean => {
  if (weight < CG_ENVELOPE[0].weight || weight > LIMITS.maxWeight) return false;
  
  const aftLimit = CG_ENVELOPE[3].cg;
  if (cg > aftLimit) return false;

  // Interpolate forward limit
  let forwardLimit = CG_ENVELOPE[0].cg;
  for (let i = 0; i < CG_ENVELOPE.length - 1; i++) {
    const p1 = CG_ENVELOPE[i];
    const p2 = CG_ENVELOPE[i+1];
    if (weight >= p1.weight && weight <= p2.weight) {
      forwardLimit = p1.cg + ((weight - p1.weight) * (p2.cg - p1.cg)) / (p2.weight - p1.weight);
      break;
    }
  }
  return cg >= forwardLimit;
};


export default function WeightBalanceCard({ onUpdate }: WeightBalanceCardProps) {
  const [isKg, setIsKg] = useState(false);
  const [weights, setWeights] = useState<Weights>({ frontSeats: 0, rearSeats: 0, fuel: 0, baggageA: 0, baggageB: 0 });
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
    const numericValue = parseFloat(value) || 0;
    const valueInLbs = isKg ? numericValue * KG_TO_LB : numericValue;
    setWeights(prev => ({ ...prev, [name]: valueInLbs }));
  };

  const getDisplayValue = (lbs: number) => {
    const value = isKg ? lbs / KG_TO_LB : lbs;
    return value > 0 ? value.toFixed(1) : '';
  };

  const calculation = useMemo(() => {
    const frontMoment = weights.frontSeats * STATIONS.frontSeats.arm;
    const rearMoment = weights.rearSeats * STATIONS.rearSeats.arm;
    const fuelMoment = weights.fuel * STATIONS.fuel.arm;
    const baggageAMoment = weights.baggageA * STATIONS.baggageA.arm;
    const baggageBMoment = weights.baggageB * STATIONS.baggageB.arm;

    const totalPayloadWeight = weights.frontSeats + weights.rearSeats + weights.fuel + weights.baggageA + weights.baggageB;
    const totalWeight = AIRCRAFT_SPECS.emptyWeight + totalPayloadWeight;
    const totalMoment = AIRCRAFT_SPECS.emptyMoment + frontMoment + rearMoment + fuelMoment + baggageAMoment + baggageBMoment;
    const totalCg = totalWeight > 0 ? totalMoment / totalWeight : AIRCRAFT_SPECS.emptyCg;

    const isWithinLimits = isCgWithinEnvelope(totalWeight, totalCg);

    return { totalWeight, totalCg, isWithinLimits };
  }, [weights]);

  useEffect(() => {
    onUpdate({ ...calculation, weights });
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
      setWeights(profile.weights);
      toast({ title: "Success", description: `Profile "${name}" loaded.` });
      setLoadOpen(false);
    }
  };

  const unitLabel = isKg ? 'kg' : 'lb';

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
        <WeightInput icon={User} label={STATIONS.frontSeats.label} value={getDisplayValue(weights.frontSeats)} onChange={e => handleWeightChange('frontSeats', e.target.value)} unit={unitLabel} />
        <WeightInput icon={User} label={STATIONS.rearSeats.label} value={getDisplayValue(weights.rearSeats)} onChange={e => handleWeightChange('rearSeats', e.target.value)} unit={unitLabel} />
        <WeightInput icon={Fuel} label={STATIONS.fuel.label} value={getDisplayValue(weights.fuel)} onChange={e => handleWeightChange('fuel', e.target.value)} unit={unitLabel} max={LIMITS.fuelMaxLbs} isKg={isKg} />
        <WeightInput icon={Luggage} label={STATIONS.baggageA.label} value={getDisplayValue(weights.baggageA)} onChange={e => handleWeightChange('baggageA', e.target.value)} unit={unitLabel} max={LIMITS.baggageAMax} isKg={isKg} />
        <WeightInput icon={Luggage} label={STATIONS.baggageB.label} value={getDisplayValue(weights.baggageB)} onChange={e => handleWeightChange('baggageB', e.target.value)} unit={unitLabel} max={LIMITS.baggageBMax} isKg={isKg} />
        
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
function WeightInput({ icon: Icon, label, value, onChange, unit, max, isKg }: { icon: React.ElementType, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, unit: string, max?: number, isKg?: boolean }) {
  const displayMax = max && (isKg ? max / KG_TO_LB : max).toFixed(1);
  const hasWarning = max && parseFloat(value) > parseFloat(displayMax || '0');

  return (
    <div className="grid grid-cols-3 items-center gap-4">
      <Label htmlFor={label} className="col-span-1 flex items-center gap-2 text-sm">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {label}
      </Label>
      <div className="col-span-2 relative">
         <Input id={label} type="number" value={value} onChange={onChange} placeholder="0.0" className={`pr-10 ${hasWarning ? 'border-destructive' : ''}`} />
         <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">{unit}</span>
      </div>
      {max && (
        <Popover>
          <PopoverTrigger asChild>
            <p className={`col-start-2 col-span-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground ${hasWarning ? 'text-destructive font-semibold' : ''}`}>
              Limit: {displayMax} {unit}
            </p>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2 text-xs">Max allowable weight for this station.</PopoverContent>
        </Popover>
      )}
    </div>
  );
}
