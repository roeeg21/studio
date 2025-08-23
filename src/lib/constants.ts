// src/lib/constants.ts

export const KG_TO_LB = 2.20462;
export const GAL_TO_LB = 6;

// Standard Empty Weight for a 2000 Cessna 182T (non-turbo).
// Using a sample value based on the POH.
export const AIRCRAFT_SPECS = {
  emptyWeight: 1924, // lbs - Sample Basic Empty Weight from POH
  emptyCg: 41.5, // inches - Sample BEW CG from POH
  get emptyMoment() {
    return this.emptyWeight * this.emptyCg;
  },
};

// Station arms updated per the 2000 C182T POH.
export const STATIONS = {
  pilot: { arm: 37, label: 'Pilot' },
  coPilot: { arm: 37, label: 'Co-pilot' },
  rearSeats: { arm: 73, label: 'Rear Passengers' },
  fuel: { arm: 48, label: 'Fuel' },
  baggageA: { arm: 95, label: 'Baggage Area A' }, // Forward baggage
  baggageB: { arm: 108, label: 'Baggage Area B' }, // Aft baggage
  baggageC: { arm: 123, label: 'Baggage Area C' }, // Extended aft baggage
};

// Limits updated per the 2000 C182T POH.
export const LIMITS = {
  maxWeight: 3100, // lbs (Maximum Ramp and Takeoff Weight)
  maxLandingWeight: 2950, // lbs
  baggageAMax: 120, // lbs
  baggageBMax: 80,  // lbs in Area B
  baggageCMax: 80,  // lbs in Area C
  totalBaggageMax: 200, // lbs (Combined A+B+C)
  fuelMaxGal: 87, // gallons usable
  get fuelMaxLbs() {
    return this.fuelMaxGal * GAL_TO_LB;
  },
};

// CG Envelope for Normal Category, updated per 2000 C182T POH, Section 6.
export const CG_ENVELOPE = [
  // Forward limit points
  { weight: 1950, cg: 35.0 },
  { weight: 2300, cg: 35.0 },
  { weight: 3100, cg: 40.5 },
  // Aft limit points
  { weight: 3100, cg: 47.0 },
  { weight: 1950, cg: 47.0 },
  // Close the loop
  { weight: 1950, cg: 35.0 },
];


export const CG_LIMITS_FOR_AI = {
  forwardLimit: 35.0, 
  aftLimit: 47.0,
};

export type AirportData = {
  name: string;
  frequencies: { type: string; freq: string }[];
};

export const AIRPORT_DATA: Record<string, AirportData> = {
  LLHA: {
    name: 'Haifa Airport',
    frequencies: [
      { type: 'Tower', freq: '122.7 MHz' },
      { type: 'Ground', freq: '121.9 MHz' },
      { type: 'Approach', freq: '120.3 MHz' },
    ],
  },
  LLHZ: {
    name: 'Herzliya Airport',
    frequencies: [
      { type: 'Tower', freq: '123.5 MHz' },
      { type: 'Ground', freq: '121.8 MHz' },
      { type: 'ATIS', freq: '128.8 MHz' },
    ],
  },
  LLIB: {
    name: 'Rosh Pina Airport',
    frequencies: [
      { type: 'Tower', freq: '122.1 MHz' },
      { type: 'Approach', freq: '120.3 MHz' },
    ],
  },
};
