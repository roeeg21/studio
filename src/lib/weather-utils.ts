export type FlightCategory = 'VFR' | 'MVFR' | 'IFR' | 'LIFR';

const SM_TO_METERS = 1609.34;

export const getFlightCategory = (weatherString: string): FlightCategory => {
  let visibility = Infinity;
  let ceiling = Infinity;

  // --- Visibility Parsing ---
  const visRegex = /(\d{4}SM|\d{1,2}SM|\d\/\d{1,2}SM|\d{4})/;
  const visMatch = weatherString.match(visRegex);

  if (visMatch) {
    let visStr = visMatch[0];
    if (visStr.endsWith('SM')) {
      visStr = visStr.replace('SM', '');
      if (visStr.includes('/')) {
        const [num, den] = visStr.split('/').map(Number);
        visibility = (num / den) * SM_TO_METERS;
      } else {
        visibility = Number(visStr) * SM_TO_METERS;
      }
    } else if (visStr === '9999') {
      visibility = 10000; // 10km or more
    } else {
      visibility = Number(visStr);
    }
  }
  
  // CAVOK means Ceiling and Visibility OK -> VFR
  if (weatherString.includes('CAVOK')) {
    visibility = 10000;
    ceiling = 10000;
  }
  
  // --- Ceiling Parsing ---
  const cloudRegex = /(BKN|OVC)(\d{3})/g;
  let match;
  while ((match = cloudRegex.exec(weatherString)) !== null) {
    const cloudAltitude = parseInt(match[2], 10) * 100;
    if (cloudAltitude < ceiling) {
      ceiling = cloudAltitude;
    }
  }

  // --- Determine Category ---
  const visMiles = visibility / SM_TO_METERS;
  
  if (visMiles < 1 || ceiling < 500) {
    return 'LIFR';
  }
  if (visMiles < 3 || ceiling < 1000) {
    return 'IFR';
  }
  if (visMiles <= 5 || ceiling <= 3000) {
    return 'MVFR';
  }

  return 'VFR';
};
