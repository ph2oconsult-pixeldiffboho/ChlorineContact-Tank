
import React, { useState, useMemo } from 'react';
import { 
  Droplets, 
  Settings2, 
  Boxes, 
  Activity, 
  Info, 
  AlertTriangle,
  FlaskConical,
  Ruler,
  Thermometer,
  Zap,
  CheckCircle2,
  Wind,
  BookOpen,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { ChlorineChemical, TankType, AppState, TurbidityLevel } from './types';
import { BaffleFactors } from './constants';
import { calculateResults } from './utils/calculations';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    flowRate: 10000, // 10,000 m³/d
    chemical: ChlorineChemical.SODIUM_HYPOCHLORITE,
    naOClConc: 12.5, // 12.5% w/v
    naOClDoseRate: 5, 
    gasDoseRate: 2, 
    tankType: TankType.RECTANGULAR,
    dimensions: { length: 20, width: 5, waterDepth: 3 },
    isBaffled: true,
    baffleFactor: 0.5,
    pH: 7.5,
    temperature: 20,
    alkalinity: 100,
    turbidity: TurbidityLevel.LOW
  });

  const results = useMemo(() => calculateResults(state), [state]);

  // Helper to prevent typing negative signs or 'e' (scientific notation)
  const preventInvalidKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '-' || e.key === 'e' || e.key === 'E') {
      e.preventDefault();
    }
  };

  const handleInputChange = (field: keyof AppState, value: any) => {
    let processedValue = value;
    
    // Ensure numeric inputs are never less than zero
    if (typeof value === 'number') {
      processedValue = Math.max(0, isNaN(value) ? 0 : value);
    }

    setState(prev => {
      const newState = { ...prev, [field]: processedValue };
      
      // Automatic logic for Pipes: lock to 0.9
      if (field === 'tankType' && processedValue === TankType.PIPE) {
        newState.baffleFactor = 0.9;
        newState.isBaffled = true;
      }
      
      return newState;
    });
  };

  const handleDimensionChange = (field: keyof AppState['dimensions'], value: number) => {
    setState(prev => ({
      ...prev,
      dimensions: { 
        ...prev.dimensions, 
        [field]: Math.max(0, isNaN(value) ? 0 : value) 
      }
    }));
  };

  const MAX_DISPLAY_LOG = 4.0;
  const isPipe = state.tankType === TankType.PIPE;
  const CT_BENCHMARK = 15;
  const isTurbidityTooHigh = state.turbidity === TurbidityLevel.HIGH;
  const isTurbidityMid = state.turbidity === TurbidityLevel.MID;

  return (
    <div className="min-h-screen bg-slate-50 pb-12 text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Droplets className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">ChloriSafe Ct</h1>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm text-slate-500 font-medium">
            <span>Compliance Assessment Tool</span>
            <div className="w-1 h-1 bg-slate-300 rounded-full" />
            <span className="text-blue-600 font-semibold italic text-xs uppercase tracking-wider">Engineering Professional</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Input Panel */}
        <div className="lg:col-span-5 space-y-6">
          
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-slate-800 text-xs tracking-wider">Flow and dosing</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Flow rate <span className="lowercase font-normal text-slate-400">(m³ · d⁻¹)</span>
                </label>
                <input 
                  type="number" 
                  min="0"
                  step="any"
                  onKeyDown={preventInvalidKeys}
                  value={state.flowRate} 
                  onChange={e => handleInputChange('flowRate', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 tracking-tight">Disinfectant agent</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                  <button 
                    onClick={() => handleInputChange('chemical', ChlorineChemical.SODIUM_HYPOCHLORITE)}
                    className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${state.chemical === ChlorineChemical.SODIUM_HYPOCHLORITE ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    NaOCl
                  </button>
                  <button 
                    onClick={() => handleInputChange('chemical', ChlorineChemical.CHLORINE_GAS)}
                    className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${state.chemical === ChlorineChemical.CHLORINE_GAS ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Cl<sub>2</sub> gas
                  </button>
                </div>
              </div>

              {state.chemical === ChlorineChemical.SODIUM_HYPOCHLORITE ? (
                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Conc. <span className="lowercase font-normal text-slate-400">(% w/v)</span>
                    </label>
                    <input 
                      type="number" 
                      min="0"
                      step="any"
                      onKeyDown={preventInvalidKeys}
                      value={state.naOClConc} 
                      onChange={e => handleInputChange('naOClConc', parseFloat(e.target.value))}
                      className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1 italic">Typical: 12.5% w/v</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Rate <span className="lowercase font-normal text-slate-400">(L · h⁻¹)</span>
                    </label>
                    <input 
                      type="number" 
                      min="0"
                      step="0.1"
                      onKeyDown={preventInvalidKeys}
                      value={state.naOClDoseRate} 
                      onChange={e => handleInputChange('naOClDoseRate', parseFloat(e.target.value))}
                      className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Feed rate <span className="lowercase font-normal text-slate-400">(kg · h⁻¹)</span>
                  </label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.1"
                    onKeyDown={preventInvalidKeys}
                    value={state.gasDoseRate} 
                    onChange={e => handleInputChange('gasDoseRate', parseFloat(e.target.value))}
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <Boxes className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-slate-800 text-xs tracking-wider">
                Geometry <span className="lowercase font-normal text-slate-400">(m)</span>
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Tank shape</label>
                <select 
                  value={state.tankType}
                  onChange={e => handleInputChange('tankType', e.target.value as TankType)}
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.values(TankType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {(state.tankType === TankType.RECTANGULAR || state.tankType === TankType.SQUARE || state.tankType === TankType.PIPE) && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Length <span className="lowercase font-normal text-slate-400">(m)</span>
                    </label>
                    <input 
                      type="number" 
                      min="0"
                      step="any"
                      onKeyDown={preventInvalidKeys}
                      value={state.dimensions.length} 
                      onChange={e => handleDimensionChange('length', parseFloat(e.target.value))}
                      className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
                {(state.tankType === TankType.RECTANGULAR) && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Width <span className="lowercase font-normal text-slate-400">(m)</span>
                    </label>
                    <input 
                      type="number" 
                      min="0"
                      step="any"
                      onKeyDown={preventInvalidKeys}
                      value={state.dimensions.width} 
                      onChange={e => handleDimensionChange('width', parseFloat(e.target.value))}
                      className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
                {(state.tankType === TankType.PIPE || state.tankType === TankType.CIRCULAR) && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Diameter <span className="lowercase font-normal text-slate-400">(m)</span>
                    </label>
                    <input 
                      type="number" 
                      min="0"
                      step="any"
                      onKeyDown={preventInvalidKeys}
                      value={state.dimensions.diameter} 
                      onChange={e => handleDimensionChange('diameter', parseFloat(e.target.value))}
                      className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
                {(state.tankType !== TankType.PIPE) && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Water Depth <span className="lowercase font-normal text-slate-400">(m)</span>
                    </label>
                    <input 
                      type="number" 
                      min="0"
                      step="any"
                      onKeyDown={preventInvalidKeys}
                      value={state.dimensions.waterDepth} 
                      onChange={e => handleDimensionChange('waterDepth', parseFloat(e.target.value))}
                      className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2">
                <div className={`flex items-center justify-between mb-2 ${isPipe ? 'opacity-60' : ''}`}>
                  <label className="text-xs font-bold text-slate-500 tracking-tight">Is tank baffled?</label>
                  <label className={`relative inline-flex items-center ${isPipe ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={state.isBaffled}
                      disabled={isPipe}
                      onChange={e => handleInputChange('isBaffled', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                {state.isBaffled && (
                  <select 
                    value={state.baffleFactor}
                    disabled={isPipe}
                    onChange={e => handleInputChange('baffleFactor', parseFloat(e.target.value))}
                    className={`w-full px-4 py-2 border rounded-lg text-sm appearance-none outline-none transition-colors ${isPipe ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-50 border-slate-300 focus:ring-2 focus:ring-blue-500'}`}
                  >
                    {BaffleFactors.map(bf => (
                      <option key={bf.value} value={bf.value}>{bf.label} (BF={bf.value})</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-slate-800 text-xs tracking-wider">Water chemistry</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 tracking-tight">
                    Initial pH
                  </label>
                  <input 
                    type="number" 
                    min="0"
                    max="14"
                    step="0.1"
                    onKeyDown={preventInvalidKeys}
                    value={state.pH} 
                    onChange={e => handleInputChange('pH', parseFloat(e.target.value))}
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 tracking-tight">Temp (°C)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="any"
                    onKeyDown={preventInvalidKeys}
                    value={state.temperature} 
                    onChange={e => handleInputChange('temperature', parseFloat(e.target.value))}
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Alkalinity <span className="font-normal text-slate-400 text-[10px]">(g · m⁻³)</span>
                  </label>
                  <input 
                    type="number" 
                    min="0"
                    step="any"
                    onKeyDown={preventInvalidKeys}
                    value={state.alkalinity} 
                    onChange={e => handleInputChange('alkalinity', parseFloat(e.target.value))}
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Turbidity
                  </label>
                  <select 
                    value={state.turbidity}
                    onChange={e => handleInputChange('turbidity', e.target.value as TurbidityLevel)}
                    className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 transition-all ${isTurbidityTooHigh ? 'bg-red-50 border-red-300 focus:ring-red-500 text-red-700' : isTurbidityMid ? 'bg-amber-50 border-amber-300 focus:ring-amber-500 text-amber-800' : 'bg-white border-slate-300 focus:ring-blue-500 text-xs'}`}
                  >
                    {Object.values(TurbidityLevel).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {isTurbidityTooHigh && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in zoom-in duration-200">
                  <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-red-800 uppercase tracking-tight">Regulatory Alert</p>
                    <p className="text-[11px] text-red-700 leading-tight mt-1 font-medium">No LRV Credits can be claimed when turbidity exceeds 1 NTU.</p>
                  </div>
                </div>
              )}

              {isTurbidityMid && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 animate-in fade-in zoom-in duration-200">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-tight">Public Health Caution</p>
                    <p className="text-[11px] text-amber-700 leading-tight mt-1 font-medium italic">
                      Although Ct is not impacted at these turbidity values it is an indication of less effective media filtration and other pathogens may present a risk to Public Health.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Total free chlorine dose</span>
                <div className="text-3xl font-bold text-slate-800 mt-1">
                  {results.chlorineDose.toFixed(2)} <span className="text-sm font-normal text-slate-400 lowercase">mg · L⁻¹</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-50">
                <span className="text-blue-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                  <Zap className="w-3 h-3" /> CALCULATED <span className="normal-case">HOCl</span> DOSE
                </span>
                <div className="text-2xl font-bold text-blue-600 mt-1">
                  {(results.chlorineDose * results.hoClFraction).toFixed(2)} <span className="text-xs font-normal text-blue-400 lowercase">mg · L⁻¹</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">POST-DOSE WATER <span className="normal-case">pH</span></span>
              <div className="text-4xl font-bold text-emerald-600 mt-2">{results.postDosePh.toFixed(2)}</div>
              <p className="text-[10px] text-slate-400 mt-1 font-medium italic">Adjusted for alkalinity buffering</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Ruler className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 tracking-tight">Retention & contact time</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-center">
                <div>
                  <p className="text-xs font-bold text-slate-400 tracking-tight mb-1">Volume (m³)</p>
                  <p className="text-xl font-mono text-slate-800">{results.volume.toFixed(1)}</p>
                </div>
                <div className="border-x border-slate-100 px-2">
                  <p className="text-xs font-bold text-blue-400 tracking-tight mb-1">Effective volume (m³)</p>
                  <p className="text-xl font-mono text-blue-600 font-bold">{results.effectiveVolume.toFixed(1)}</p>
                </div>
                <div className="px-2">
                  <p className="text-xs font-bold text-slate-400 tracking-tight mb-1">Theoretical T (min)</p>
                  <p className="text-xl font-mono text-slate-800">{results.retentionTime.toFixed(1)}</p>
                </div>
                <div className="border-l border-slate-100 px-2">
                  <p className="text-xs font-bold text-blue-400 tracking-tight mb-1">Effective T₁₀ (min)</p>
                  <p className="text-xl font-mono text-blue-600 font-bold">{results.t10.toFixed(1)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-semibold text-slate-800 text-sm tracking-tight">Applied Ct</h4>
                  <p className="text-[10px] text-slate-500 mb-2 font-medium">Free Cl<sub>2</sub> dose × T₁₀</p>
                  <div className={`text-xl font-bold transition-colors duration-300 ${results.ctDose < CT_BENCHMARK ? 'text-rose-600' : 'text-slate-700'}`}>
                    {results.ctDose.toFixed(2)} <span className="text-xs font-normal text-slate-400 lowercase">mg · min · L⁻¹</span>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-blue-600" />
                    <h4 className="font-semibold text-blue-800 text-sm tracking-tight">Effective Ct</h4>
                  </div>
                  <p className="text-[10px] text-blue-600/80 mb-2 font-medium italic">
                    HOCl only ({(results.hoClFraction * 100).toFixed(1)}% of dose)
                  </p>
                  <div className={`text-xl font-bold transition-colors duration-300 ${results.effectiveCt < CT_BENCHMARK ? 'text-rose-600' : 'text-blue-700'}`}>
                    {results.effectiveCt.toFixed(2)} <span className="text-xs font-normal text-blue-600/60 lowercase">mg · min · L⁻¹</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* LRV Display */}
          <div className={`bg-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden transition-all duration-500 ${isTurbidityTooHigh ? 'opacity-80 scale-[0.98]' : ''}`}>
            {isTurbidityTooHigh && (
              <div className="absolute inset-0 bg-red-950/40 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center text-center p-6 border-4 border-red-600/30 rounded-3xl">
                <XCircle className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
                <h3 className="text-2xl font-black uppercase tracking-tighter text-red-400 mb-2">No LRV Credits Possible</h3>
                <p className="text-sm text-red-200/80 font-medium max-w-xs">Regulatory compliance requires turbidity to be ≤ 1 NTU for disinfection credits.</p>
              </div>
            )}
            
            <div className="relative z-10 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg tracking-wider text-blue-100 flex items-center gap-2 uppercase">
                  <CheckCircle2 className="w-5 h-5 text-blue-400" />
                  Log reduction values (LRV)
                </h3>
              </div>
              
              <div className="grid grid-cols-1 gap-10">
                {/* Bacteria Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <p className="text-slate-400 text-xs font-bold tracking-widest min-w-[100px] uppercase">Bacteria</p>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">Applied LRV</span>
                        <span className="text-2xl font-bold text-emerald-400/70">{results.lrvBacteriaApplied.toFixed(2)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400/30" style={{ width: `${Math.min(100, (results.lrvBacteriaApplied / MAX_DISPLAY_LOG) * 100)}%` }} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] text-blue-400 font-bold tracking-wider uppercase">Effective LRV</span>
                        <span className="text-3xl font-bold text-emerald-400">{results.lrvBacteriaEffective.toFixed(2)}</span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400" style={{ width: `${Math.min(100, (results.lrvBacteriaEffective / MAX_DISPLAY_LOG) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Virus Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <p className="text-slate-400 text-xs font-bold tracking-widest min-w-[100px] uppercase">Viruses</p>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">Applied LRV</span>
                        <span className="text-2xl font-bold text-blue-400/50">{results.lrvVirusApplied.toFixed(2)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400/30" style={{ width: `${Math.min(100, (results.lrvVirusApplied / MAX_DISPLAY_LOG) * 100)}%` }} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] text-blue-400 font-bold tracking-wider uppercase">Effective LRV</span>
                        <span className="text-3xl font-bold text-blue-400">{results.lrvVirusEffective.toFixed(2)}</span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400" style={{ width: `${Math.min(100, (results.lrvVirusEffective / MAX_DISPLAY_LOG) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
          </div>

          {/* Footnotes and Scientific References */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <BookOpen className="w-4 h-4 text-slate-400" />
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Scientific References & Footnotes</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-1"><Info className="w-4 h-4 text-blue-500" /></div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  <span className="font-bold text-slate-700">Bacteria Model:</span> Based on <span className="italic">E. coli</span> inactivation kinetics from the <span className="font-semibold text-slate-600">WaterVal Validation Protocol</span> (Keegan et al., 2012). Results are capped at 4.0 LRV for regulatory conservatism.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-1"><Info className="w-4 h-4 text-blue-500" /></div>
                <div className="text-[11px] text-slate-500 leading-relaxed">
                  <span className="font-bold text-slate-700">Virus Model:</span> 
                  {' '}Design CT values derived from 
                  {' '}<span className="font-semibold text-slate-600 underline decoration-slate-300">Table 3</span> of the 
                  {' '}<span className="italic">"Chlorine disinfection of human pathogenic viruses"</span> (Project 62M-2114) by 
                  {' '}<span className="font-semibold">Keegan et al. (2012)</span>. 
                  <a 
                    href="https://water360.com.au/wp-content/uploads/2022/02/62m-2114-chlorine-disinfection-of-human-pathogenic-viruses-_final_report.pdf" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 ml-1 text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    View Report <ExternalLink className="w-3 h-3" />
                  </a>
                  <p className="mt-1 opacity-80 font-medium text-slate-600">Benchmarks (20°C): Ct 1.0 = 2-log, Ct 2.0 = 3-log, Ct 3.0 = 4-log.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-1"><Info className="w-4 h-4 text-blue-500" /></div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  <span className="font-bold text-slate-700">Turbidity Adjustment:</span> When selected, an inactivation adjustment is applied directly to the <span className="font-bold text-slate-700">Bacteria</span> inactivation kinetics. Ranges: <span className="italic">LOW (&lt; 0.2)</span>, <span className="italic">MID (&gt; 0.2 to &lt; 1)</span>, <span className="italic">HIGH (&gt; 1)</span>. Note: Turbidity adjustment has been removed from virus calculations per user selection.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-1"><Info className="w-4 h-4 text-blue-500" /></div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  <span className="font-bold text-slate-700">Effective vs. Applied:</span> Applied LRV utilizes total free chlorine concentration. <span className="font-bold text-blue-600">Effective LRV</span> accounts for the pH-dependent fraction of <span className="italic">Hypochlorous Acid (HOCl)</span>, the primary biocidal species.
                </p>
              </div>
              {state.turbidity !== TurbidityLevel.LOW && (
                <div className={`flex items-start gap-3 p-2 rounded-lg border transition-colors ${isTurbidityTooHigh ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                  <div className="shrink-0 mt-0.5"><AlertTriangle className={`w-4 h-4 ${isTurbidityTooHigh ? 'text-red-600' : 'text-amber-600'}`} /></div>
                  <p className={`text-[10px] font-medium italic ${isTurbidityTooHigh ? 'text-red-800' : 'text-amber-800'}`}>
                    {isTurbidityTooHigh ? 'Regulatory threshold exceeded. Disinfection credits invalidated.' : `Bacteria inactivation adjustment applied (Factor: ${state.turbidity === TurbidityLevel.MID ? '20%' : '50%'} reduction in kinetic rates).`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
