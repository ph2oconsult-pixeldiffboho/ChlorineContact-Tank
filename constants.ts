
import { TurbidityLevel } from './types';

export const BaffleFactors = [
  { label: 'Unbaffled (Mixed)', value: 0.1 },
  { label: 'Poor Baffling', value: 0.3 },
  { label: 'Average Baffling', value: 0.5 },
  { label: 'Superior Baffling', value: 0.7 },
  { label: 'Perfect Baffling (Plug Flow)', value: 1.0 }
];

/**
 * Disinfection Kinetic Constants (k) from Keegan et al. (2012)
 * Based on the WaterVal Validation Protocol for Chlorine Disinfection.
 * Units: L / (mg · min) at 20°C
 */
export const KEEGAN_K_BACTERIA = 4.6; // E. coli benchmark
export const KEEGAN_K_VIRUS = 0.126;    // Adenovirus 2 benchmark (conservative)

/**
 * Temperature correction factor (theta)
 * Standard Arrhenius-type correction used in WaterVal/Keegan models.
 */
export const KEEGAN_THETA = 1.07;

/**
 * Turbidity shielding factors
 * Higher turbidity provides niches for pathogens, reducing effective inactivation rates.
 */
export const TURBIDITY_SHIELDING_FACTORS: Record<TurbidityLevel, number> = {
  [TurbidityLevel.LOW]: 1.0,   // No penalty
  [TurbidityLevel.MID]: 0.8,   // 20% reduction in k
  [TurbidityLevel.HIGH]: 0.5   // 50% reduction in k (high shielding risk)
};
