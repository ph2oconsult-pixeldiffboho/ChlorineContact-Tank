
import { AppState, ChlorineChemical, TankType, CalculationResults, TurbidityLevel } from '../types';
import { KEEGAN_K_BACTERIA, KEEGAN_THETA, TURBIDITY_SHIELDING_FACTORS } from '../constants';

/**
 * Piecewise linear interpolation for Virus LRV based on Table 3 benchmarks
 * provided by the user for Enterovirus at 20°C:
 * Ct 1.0 -> 2.0 LRV
 * Ct 2.0 -> 3.0 LRV
 * Ct 3.0 -> 4.0 LRV
 */
const lookupVirusLrv = (ct20: number): number => {
  if (ct20 <= 0) return 0;
  
  if (ct20 <= 1.0) {
    // Linear from (0,0) to (1.0, 2.0)
    // Slope = 2.0
    return 2.0 * ct20;
  }
  
  if (ct20 <= 2.0) {
    // Linear from (1.0, 2.0) to (2.0, 3.0)
    // Slope = 1.0
    return 2.0 + (ct20 - 1.0) * 1.0;
  }
  
  if (ct20 <= 3.0) {
    // Linear from (2.0, 3.0) to (3.0, 4.0)
    // Slope = 1.0
    return 3.0 + (ct20 - 2.0) * 1.0;
  }
  
  // Beyond 3.0 Ct, continue with slope 1.0 or cap at 4.0 elsewhere
  return 4.0 + (ct20 - 3.0) * 1.0;
};

/**
 * Calculates chlorine disinfection parameters using logic from
 * Keegan et al. (2012) / Report 2114 and user-defined mass balance.
 */
export const calculateResults = (state: AppState): CalculationResults => {
  const { 
    flowRate, chemical, naOClConc, naOClDoseRate, gasDoseRate, 
    tankType, dimensions, isBaffled, baffleFactor, pH, temperature, alkalinity,
    turbidity
  } = state;

  // 1. Calculate Chlorine Dose (mg/L)
  // Input flowRate is in m3/d.
  // 1 kg/m3 = 1 g/L = 1000 mg/L.
  // mg/L (g/m3) = (kg/h * 24 h/d * 1000 g/kg) / (m3/d)
  let dose_mgL = 0;
  if (chemical === ChlorineChemical.SODIUM_HYPOCHLORITE) {
    const massRate_kgh = (naOClDoseRate * naOClConc) / 100;
    dose_mgL = flowRate > 0 ? (massRate_kgh * 24 * 1000) / flowRate : 0;
  } else {
    dose_mgL = flowRate > 0 ? (gasDoseRate * 24 * 1000) / flowRate : 0;
  }

  // 2. Calculate Volume (m³)
  let vol = 0;
  const { length = 0, width = 0, diameter = 0, waterDepth = 0 } = dimensions;

  switch (tankType) {
    case TankType.PIPE:
      vol = Math.PI * Math.pow(Math.max(0, diameter) / 2, 2) * Math.max(0, length);
      break;
    case TankType.CIRCULAR:
      vol = Math.PI * Math.pow(Math.max(0, diameter) / 2, 2) * Math.max(0, waterDepth);
      break;
    case TankType.RECTANGULAR:
    case TankType.SQUARE:
      vol = Math.max(0, length) * Math.max(0, width) * Math.max(0, waterDepth);
      break;
  }

  // 3. Retention Time & T10 (min)
  // FlowRate is already m3/d, convert to m3/h for T calculation
  const q_m3h = flowRate / 24;
  const t_min = vol > 0 && q_m3h > 0 ? (vol / q_m3h) * 60 : 0;
  const bf = isBaffled ? Math.max(0, baffleFactor) : 0.1;
  const t10 = t_min * bf;
  const effectiveVol = vol * bf;

  // 4. Calculate Post-Dose pH
  let postDosePh = pH;
  const bufferFactor = Math.max(alkalinity, 10);
  if (chemical === ChlorineChemical.CHLORINE_GAS) {
    postDosePh = pH - (2.5 * dose_mgL / bufferFactor);
  } else {
    postDosePh = pH + (1.8 * dose_mgL / bufferFactor);
  }
  postDosePh = Math.max(2, Math.min(12, postDosePh));

  // 5. HOCl Fraction (Morris 1966 dissociation model)
  const tKelvin = temperature + 273.15;
  const pKa = (3000 / tKelvin) - 10.0686 + (0.0253 * tKelvin);
  const hoClFraction = 1 / (1 + Math.pow(10, postDosePh - pKa));

  // 6. Ct Values (mg · min / L)
  const ctDose = Math.max(0, dose_mgL * t10);
  const effectiveCt = Math.max(0, (dose_mgL * hoClFraction) * t10);

  // 7. Corrections
  const tempCorrection = Math.pow(KEEGAN_THETA, temperature - 20);
  const turbidityFactor = TURBIDITY_SHIELDING_FACTORS[turbidity];

  // 8. Inactivation Logic
  let lrvBacteriaApplied = 0;
  let lrvBacteriaEffective = 0;
  let lrvVirusApplied = 0;
  let lrvVirusEffective = 0;

  if (turbidity !== TurbidityLevel.HIGH) {
    // Bacteria Inactivation
    const lrvBacteriaAppliedRaw = (KEEGAN_K_BACTERIA * tempCorrection * turbidityFactor) * ctDose;
    const lrvBacteriaEffectiveRaw = (KEEGAN_K_BACTERIA * tempCorrection * turbidityFactor) * effectiveCt;

    // Virus Inactivation (Table 3 in Keegan et al (2012) - Enterovirus)
    // Calculate for both Applied Ct and Effective Ct independently using user-provided benchmarks.
    const ctDose20 = ctDose * tempCorrection;
    const ctEffective20 = effectiveCt * tempCorrection;
    
    const lrvVirusAppliedRaw = lookupVirusLrv(ctDose20);
    const lrvVirusEffectiveRaw = lookupVirusLrv(ctEffective20);

    const MAX_LRV = 4.0;
    lrvBacteriaApplied = Math.max(0, Math.min(MAX_LRV, lrvBacteriaAppliedRaw));
    lrvBacteriaEffective = Math.max(0, Math.min(MAX_LRV, lrvBacteriaEffectiveRaw));
    
    lrvVirusApplied = Math.max(0, Math.min(MAX_LRV, lrvVirusAppliedRaw));
    lrvVirusEffective = Math.max(0, Math.min(MAX_LRV, lrvVirusEffectiveRaw));
  }

  return {
    chlorineDose: dose_mgL,
    volume: vol,
    effectiveVolume: effectiveVol,
    retentionTime: t_min,
    t10: t10,
    ctDose: ctDose,
    effectiveCt: effectiveCt,
    postDosePh: postDosePh,
    hoClFraction: hoClFraction,
    lrvBacteriaApplied,
    lrvBacteriaEffective,
    lrvVirusApplied,
    lrvVirusEffective,
  };
};
