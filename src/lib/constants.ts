// src/lib/constants.ts

export const KG_TO_LB = 2.20462;
export const GAL_TO_LB = 6;

// Standard Empty Weight for a 2000 Cessna 182T is typically higher.
// Using a sample value based on the POH.
export const AIRCRAFT_SPECS = {
  emptyWeight: 2020, // lbs - Sample Basic Empty Weight from POH
  emptyCg: 38.5, // inches - Sample BEW CG from POH
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
  baggageBMax: 50,  // lbs in Area B
  baggageCMax: 30,  // lbs in Area C
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

export const AIRPORT_DATA = {
  LLHA: {
    name: 'Haifa Airport',
    metar: 'LLHA 121050Z 29010KT 9999 SCT030 28/18 Q1012 NOSIG',
    taf: 'LLHA 120500Z 1206/1218 28012KT 9999 SCT025 BECMG 1210/1212 32008KT',
    frequencies: [
      { type: 'Tower', freq: '122.7 MHz' },
      { type: 'Ground', freq: '121.9 MHz' },
      { type: 'Approach', freq: '120.3 MHz' },
    ],
  },
  LLHZ: {
    name: 'Herzliya Airport',
    metar: 'LLHZ 121050Z 27008KT 9999 FEW025 29/17 Q1013 NOSIG',
    taf: 'LLHZ 120500Z 1206/1218 26010KT 9999 FEW020 BECMG 1209/1211 30007KT',
    frequencies: [
      { type: 'Tower', freq: '123.5 MHz' },
      { type: 'Ground', freq: '121.8 MHz' },
      { type: 'ATIS', freq: '128.8 MHz' },
    ],
  },
  LLBG: {
    name: 'Ben Gurion Airport',
    metar: 'LLBG 121050Z 31015KT 9999 SCT035 BKN100 27/19 Q1011 NOSIG',
    taf: 'LLBG 121100Z 1212/1312 32012KT 9999 SCT030 TEMPO 1215/1219 32018G28KT',
    frequencies: [
      { type: 'Tower', freq: '118.1 MHz / 124.6 MHz' },
      { type: 'Ground', freq: '121.95 MHz' },
      { type: 'Departure', freq: '121.4 MHz' },
    ],
  },
};
