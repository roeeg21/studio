// src/lib/constants.ts

export const KG_TO_LB = 2.20462;

export const AIRCRAFT_SPECS = {
  emptyWeight: 2019, // lbs
  emptyCg: 39.42, // inches
  get emptyMoment() {
    return this.emptyWeight * this.emptyCg;
  },
};

export const STATIONS = {
  frontSeats: { arm: 37, label: 'Pilot & Front Passenger' },
  rearSeats: { arm: 73, label: 'Rear Passengers' },
  fuel: { arm: 48, label: 'Fuel (87 gal usable)' }, // Usable fuel
  baggageA: { arm: 95, label: 'Baggage Area A' },
  baggageB: { arm: 108, label: 'Baggage Area B' },
};

export const LIMITS = {
  maxWeight: 3100, // lbs
  baggageAMax: 120, // lbs
  baggageBMax: 50, // lbs
  totalBaggageMax: 120, // lbs
  fuelMaxGal: 87, // gallons usable
  get fuelMaxLbs() {
    return this.fuelMaxGal * 6; // 6 lbs/gal
  },
};

export const CG_ENVELOPE = [
  { weight: 2200, cg: 35.0 },
  { weight: 2950, cg: 40.5 },
  { weight: 3100, cg: 41.5 },
  { weight: 3100, cg: 47.3 },
  { weight: 2200, cg: 47.3 },
  { weight: 2200, cg: 35.0 }, // Close the loop for area chart
];

export const CG_LIMITS_FOR_AI = {
  forwardLimit: 35.0, // Simplification for AI prompt, using the most restrictive limit
  aftLimit: 47.3,
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
  LLIB: {
    name: 'Ben Gurion Airport',
    metar: 'LLIB 121050Z 31015KT 9999 SCT035 BKN100 27/19 Q1011 NOSIG',
    taf: 'LLBG 121100Z 1212/1312 32012KT 9999 SCT030 TEMPO 1215/1219 32018G28KT',
    frequencies: [
      { type: 'Tower', freq: '118.1 MHz / 124.6 MHz' },
      { type: 'Ground', freq: '121.95 MHz' },
      { type: 'Departure', freq: '121.4 MHz' },
    ],
  },
};
