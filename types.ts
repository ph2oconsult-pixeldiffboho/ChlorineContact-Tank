
export enum ChlorineChemical {
  SODIUM_HYPOCHLORITE = 'Sodium Hypochlorite',
  CHLORINE_GAS = 'Chlorine Gas'
}

export enum TankType {
  PIPE = 'Pipe',
  CIRCULAR = 'Circular Tank',
  RECTANGULAR = 'Rectangular Tank',
  SQUARE = 'Square Tank'
}

export enum TurbidityLevel {
  LOW = '< 0.2 NTU',
  MID = '> 0.2 to < 1 NTU',
  HIGH = '> 1 NTU'
}

export interface TankDimensions {
  length?: number;
  width?: number;
  diameter?: number;
  waterDepth?: number;
}

export interface AppState {
  flowRate: number; // m³ · d⁻¹
  chemical: ChlorineChemical;
  naoclConc: number; // % w/v (e.g., 12.5)
  naoclDoseRate: number; // L · h⁻¹
  gasDoseRate: number; // kg · h⁻¹
  tankType: TankType;
  dimensions: TankDimensions;
  isBaffled: boolean;
  baffleFactor: number;
  pH: number;
  temperature: number; // °C
  alkalinity: number; // g · m⁻³ as CaCO₃
  turbidity: TurbidityLevel;
}

export interface CalculationResults {
  chlorineDose: number; // g · m⁻³ (mg/L)
  volume: number; // m³
  effectiveVolume: number; // m³ (Volume * Baffle Factor)
  retentionTime: number; // min
  t10: number; // min
  ctDose: number; // g · min · m⁻³
  effectiveCt: number; // g · min · m⁻³
  postDosePh: number;
  hoclFraction: number;
  lrvBacteriaApplied: number;
  lrvBacteriaEffective: number;
  lrvVirusApplied: number;
  lrvVirusEffective: number;
}
