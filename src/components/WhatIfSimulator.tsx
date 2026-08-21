import React, { useState, useMemo } from 'react';
import { ProductionCycleConfig, Garment, RawMaterial } from '../types';
import { MRPSummary, calculateMRP } from '../services/mrpEngine';
import { formatCOP } from '../utils/formatters';
import {
  Sliders,
  TrendingUp,
  RefreshCw,
  X,
  Check,
  Scissors,
  Clock,
  Sparkles,
} from 'lucide-react';

interface WhatIfSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  cycleConfig: ProductionCycleConfig;
  garments: Garment[];
  rawMaterials: RawMaterial[];
  mrpSummary: MRPSummary;
  onApplyScenario: (multiplier: number, scrapRate: number, bufferDays: number) => void;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  isOpen,
  onClose,
  cycleConfig,
  garments,
  rawMaterials,
  mrpSummary: baselineMRP,
  onApplyScenario,
}) => {
  const [demandPercent, setDemandPercent] = useState<number>(
    Math.round(((cycleConfig.scenarioMultiplier || 1.0) - 1) * 100)
  );
  const [scrapRate, setScrapRate] = useState<number>(
    cycleConfig.defaultScrapRatePercent !== undefined ? cycleConfig.defaultScrapRatePercent : 5.0
  );
  const [bufferDays, setBufferDays] = useState<number>(cycleConfig.leadTimeBufferDays || 0);

  const multiplier = 1 + demandPercent / 100;

  // Real-time live simulation calculation of MRP
  const simulatedMRP = useMemo(() => {
    const simulatedConfig: ProductionCycleConfig = {
      ...cycleConfig,
      scenarioMultiplier: multiplier,
      defaultScrapRatePercent: scrapRate,
      leadTimeBufferDays: bufferDays,
    };
    return calculateMRP(garments, rawMaterials, simulatedConfig);
  }, [cycleConfig, multiplier, scrapRate, bufferDays, garments, rawMaterials]);

  // Metric differences
  const diffGarments = simulatedMRP.totalGarmentsPlanned - baselineMRP.totalGarmentsPlanned;
  const diffFabrics = simulatedMRP.totalFabricsMetersNeeded - baselineMRP.totalFabricsMetersNeeded;
  const diffInvestment = simulatedMRP.totalInvestmentUSD - baselineMRP.totalInvestmentUSD;
  const diffCritical = simulatedMRP.criticalItemsCount - baselineMRP.criticalItemsCount;
  const diffReorder = simulatedMRP.reorderItemsCount - baselineMRP.reorderItemsCount;

  const handleApply = () => {
    onApplyScenario(multiplier, scrapRate, bufferDays);
    onClose();
  };

  const handleReset = () => {
    setDemandPercent(0);
    setScrapRate(5.0);
    setBufferDays(0);
    onApplyScenario(1.0, 5.0, 0);
  };

  const applyPreset = (demand: number, scrap: number, buffer: number) => {
    setDemandPercent(demand);
    setScrapRate(scrap);
    setBufferDays(buffer);
  };

  if (!isOpen) return null;

  // Interpretation labels
  const getScrapInterpretation = (rate: number) => {
    if (rate <= 2.5)
      return {
        label: 'Trazado Asistido / Láser Óptimo',
        desc: 'Máximo aprovechamiento de rollos, mínimo desperdicio textil.',
        color: 'text-[#233829] bg-[#EBF2EC] border-[#D4E3D7]',
      };
    if (rate <= 5.5)
      return {
        label: 'Estándar Confección Colombia (5%)',
        desc: 'Merma promedio de tizado y corte manual en la industria.',
        color: 'text-[#3A5A40] bg-[#F4F7EE] border-[#DCE8CB]',
      };
    if (rate <= 8.5)
      return {
        label: 'Merma Moderada-Alta',
        desc: 'Desperdicio por encogimiento o tizado complejo.',
        color: 'text-[#8A5016] bg-[#FCF6E8] border-[#F2DEB0]',
      };
    return {
      label: 'Alta Pérdida Textil (10%+)',
      desc: 'Rollos con fallas o telas con sentido de estampado.',
      color: 'text-[#B33927] bg-[#FDF2F0] border-[#F8D4CF]',
    };
  };

  const getBufferInterpretation = (days: number) => {
    if (days === 0)
      return {
        label: 'Just-In-Time (0 días)',
        desc: 'Sin colchón de seguridad. Mayor riesgo si el proveedor se atrasa.',
        color: 'text-[#5F6B61] bg-[#FAF8F5] border-[#E6E1D8]',
      };
    if (days <= 10)
      return {
        label: 'Buffer Preventivo Ligero (+5 a +10 días)',
        desc: 'Cubre pequeñas demoras locales de tintorería y despachos.',
        color: 'text-[#3A5A40] bg-[#EBF2EC] border-[#D4E3D7]',
      };
    if (days <= 20)
      return {
        label: 'Seguridad Estándar (+15 días)',
        desc: 'Protección recomendada ante atrasos de tejedurías o hilaturas.',
        color: 'text-[#2D4A6E] bg-[#EEF2F6] border-[#D0DCE8]',
      };
    return {
      label: 'Riesgo Importación (+25-30 días)',
      desc: 'Amplio colchón de seguridad para insumos importados.',
      color: 'text-[#8A5016] bg-[#FCF6E8] border-[#F2DEB0]',
    };
  };

  const scrapInfo = getScrapInterpretation(scrapRate);
  const bufferInfo = getBufferInterpretation(bufferDays);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-[#E6E1D8] overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E6E1D8] flex items-center justify-between bg-[#FCFBF9]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#EBF2EC] text-[#3A5A40] rounded-lg">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#1C211D]">
                Simulador de Escenarios What-If
              </h3>
              <p className="text-[11px] text-[#5F6B61]">
                Ajuste la demanda, mermas de corte y buffers de entrega con recálculo MRP en vivo.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8F9990] hover:text-[#1C211D] hover:bg-[#FAF8F5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sliders and Dynamic Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Quick Presets for Colombian Seasons */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-[#5F6B61] uppercase tracking-wider block">
              Escenarios Rápidos de Campaña:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset(25, 4.5, 7)}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#FAF8F5] hover:bg-[#EBF2EC] border border-[#E6E1D8] text-[#1C211D] transition-colors"
              >
                🎒 Escolar (+25%)
              </button>
              <button
                type="button"
                onClick={() => applyPreset(35, 5.0, 10)}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#FAF8F5] hover:bg-[#EBF2EC] border border-[#E6E1D8] text-[#1C211D] transition-colors"
              >
                💐 Madres (+35%)
              </button>
              <button
                type="button"
                onClick={() => applyPreset(20, 5.0, 7)}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#FAF8F5] hover:bg-[#EBF2EC] border border-[#E6E1D8] text-[#1C211D] transition-colors"
              >
                ❤️ Amor & Amistad (+20%)
              </button>
              <button
                type="button"
                onClick={() => applyPreset(50, 6.0, 15)}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#FAF8F5] hover:bg-[#EBF2EC] border border-[#E6E1D8] text-[#1C211D] transition-colors"
              >
                🎄 Fin de Año (+50%)
              </button>
              <button
                type="button"
                onClick={() => applyPreset(0, 5.0, 0)}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#FAF8F5] hover:bg-[#EBF2EC] border border-[#E6E1D8] text-[#5F6B61] transition-colors"
              >
                Plan Base (0%)
              </button>
            </div>
          </div>

          {/* SLIDER 1: Variación de Demanda */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1D8] space-y-2.5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#3A5A40]" />
                <span className="font-bold text-[#1C211D]">1. Variación de Demanda de Ventas:</span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                  demandPercent > 0
                    ? 'bg-[#EBF2EC] text-[#233829] border border-[#D4E3D7]'
                    : demandPercent < 0
                    ? 'bg-[#FDF2F0] text-[#B33927] border border-[#F8D4CF]'
                    : 'bg-white text-[#1C211D] border border-[#D5CEC2]'
                }`}
              >
                {demandPercent > 0
                  ? `+${demandPercent}% (Temporada Alta)`
                  : demandPercent < 0
                  ? `${demandPercent}% (Caída)`
                  : '0% (Plan Base)'}
              </span>
            </div>

            <input
              type="range"
              min="-50"
              max="100"
              step="5"
              value={demandPercent}
              onChange={(e) => setDemandPercent(parseInt(e.target.value))}
              className="w-full h-2 bg-[#E6E1D8] rounded-lg appearance-none cursor-pointer accent-[#3A5A40]"
            />

            <div className="flex justify-between text-[10px] text-[#5F6B61]">
              <span>-50% (Recesión)</span>
              <span className="font-semibold text-[#1C211D]">0% Base</span>
              <span>+50% (Pico)</span>
              <span>+100% (Doble)</span>
            </div>

            <div className="text-[11px] text-[#5F6B61] flex items-center justify-between pt-1 border-t border-[#E6E1D8]">
              <span>Prendas proyectadas:</span>
              <strong className="text-[#1C211D]">
                {simulatedMRP.totalGarmentsPlanned.toLocaleString()} unidades
                {diffGarments !== 0 && (
                  <span className={diffGarments > 0 ? ' text-[#3A5A40] ml-1' : ' text-[#B33927] ml-1'}>
                    ({diffGarments > 0 ? `+${diffGarments.toLocaleString()}` : diffGarments.toLocaleString()} u)
                  </span>
                )}
              </strong>
            </div>
          </div>

          {/* SLIDER 2: Merma de Tizado y Corte Textil */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1D8] space-y-2.5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-[#3A5A40]" />
                <span className="font-bold text-[#1C211D]">2. Merma de Tizado & Corte de Tela:</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#EBF2EC] text-[#3A5A40] border border-[#D4E3D7]">
                {scrapRate}% de Merma
              </span>
            </div>

            <input
              type="range"
              min="1.5"
              max="15"
              step="0.5"
              value={scrapRate}
              onChange={(e) => setScrapRate(parseFloat(e.target.value))}
              className="w-full h-2 bg-[#E6E1D8] rounded-lg appearance-none cursor-pointer accent-[#3A5A40]"
            />

            <div className="flex justify-between text-[10px] text-[#5F6B61]">
              <span>1.5% (Láser)</span>
              <span className="font-semibold text-[#1C211D]">5% (Estándar)</span>
              <span>15% (Alta)</span>
            </div>

            {/* Live Explanation Badge */}
            <div className={`p-2.5 rounded-lg border text-[11px] space-y-0.5 ${scrapInfo.color}`}>
              <div className="font-bold">{scrapInfo.label}</div>
              <p>{scrapInfo.desc}</p>
            </div>

            <div className="text-[11px] text-[#5F6B61] flex items-center justify-between pt-1 border-t border-[#E6E1D8]">
              <span>Requerimiento total de telas:</span>
              <strong className="text-[#1C211D]">
                {simulatedMRP.totalFabricsMetersNeeded.toLocaleString()} metros
                {diffFabrics !== 0 && (
                  <span className={diffFabrics > 0 ? ' text-[#B33927] ml-1' : ' text-[#3A5A40] ml-1'}>
                    ({diffFabrics > 0 ? `+${diffFabrics.toLocaleString()}` : diffFabrics.toLocaleString()} m)
                  </span>
                )}
              </strong>
            </div>
          </div>

          {/* SLIDER 3: Buffer por Retrasos de Proveedores */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1D8] space-y-2.5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#2D4A6E]" />
                <span className="font-bold text-[#1C211D]">3. Colchón Preventivo (Buffer de Entrega):</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#EEF2F6] text-[#2D4A6E] border border-[#D0DCE8]">
                +{bufferDays} días
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={bufferDays}
              onChange={(e) => setBufferDays(parseInt(e.target.value))}
              className="w-full h-2 bg-[#E6E1D8] rounded-lg appearance-none cursor-pointer accent-[#2D4A6E]"
            />

            <div className="flex justify-between text-[10px] text-[#5F6B61]">
              <span>0 días (JIT)</span>
              <span className="font-semibold text-[#1C211D]">+15 días (Seguridad)</span>
              <span>+30 días (Importación)</span>
            </div>

            {/* Live Explanation Badge */}
            <div className={`p-2.5 rounded-lg border text-[11px] space-y-0.5 ${bufferInfo.color}`}>
              <div className="font-bold">{bufferInfo.label}</div>
              <p>{bufferInfo.desc}</p>
            </div>

            <div className="text-[11px] text-[#5F6B61] flex items-center justify-between pt-1 border-t border-[#E6E1D8]">
              <span>Insumos en Reorden/Crítico:</span>
              <strong className="text-[#1C211D]">
                {simulatedMRP.criticalItemsCount + simulatedMRP.reorderItemsCount} insumos
                {diffCritical + diffReorder !== 0 && (
                  <span
                    className={
                      diffCritical + diffReorder > 0 ? ' text-[#8A5016] ml-1' : ' text-[#3A5A40] ml-1'
                    }
                  >
                    ({diffCritical + diffReorder > 0 ? `+${diffCritical + diffReorder}` : diffCritical + diffReorder} vs base)
                  </span>
                )}
              </strong>
            </div>
          </div>

          {/* Real-time Projected Outcome Dashboard */}
          <div className="bg-[#FCFBF9] border border-[#D4E3D7] rounded-xl p-3.5 sm:p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-xs sm:text-sm text-[#1C211D] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#3A5A40]" />
                Resumen del Impacto en Compras y Producción
              </h5>
              <span className="text-[10px] text-[#5F6B61] font-medium bg-[#FAF8F5] border border-[#E6E1D8] px-2 py-0.5 rounded">
                En vivo
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Metric 1 */}
              <div className="p-2.5 bg-white rounded-lg border border-[#E6E1D8]">
                <span className="text-[#5F6B61] text-[10px] block font-semibold uppercase">Demanda Prendas</span>
                <span className="text-xs sm:text-sm font-bold text-[#1C211D] block mt-0.5">
                  {simulatedMRP.totalGarmentsPlanned.toLocaleString()} u
                </span>
                <span className="text-[10px] text-[#5F6B61]">
                  {diffGarments >= 0 ? `+${diffGarments}` : `${diffGarments}`} u vs plan
                </span>
              </div>

              {/* Metric 2 */}
              <div className="p-2.5 bg-white rounded-lg border border-[#E6E1D8]">
                <span className="text-[#5F6B61] text-[10px] block font-semibold uppercase">Telas a Comprar</span>
                <span className="text-xs sm:text-sm font-bold text-[#1C211D] block mt-0.5">
                  {simulatedMRP.totalFabricsMetersNeeded.toLocaleString()} m
                </span>
                <span className="text-[10px] text-[#5F6B61]">
                  {diffFabrics >= 0 ? `+${diffFabrics}` : `${diffFabrics}`} m tela
                </span>
              </div>

              {/* Metric 3 */}
              <div className="p-2.5 bg-white rounded-lg border border-[#E6E1D8]">
                <span className="text-[#5F6B61] text-[10px] block font-semibold uppercase">Insumos en Reorden</span>
                <span className="text-xs sm:text-sm font-bold text-[#8A5016] block mt-0.5">
                  {simulatedMRP.criticalItemsCount + simulatedMRP.reorderItemsCount} ítems
                </span>
                <span className="text-[10px] text-[#5F6B61]">
                  {simulatedMRP.criticalItemsCount} críticos
                </span>
              </div>

              {/* Metric 4 */}
              <div className="p-2.5 bg-white rounded-lg border border-[#E6E1D8]">
                <span className="text-[#5F6B61] text-[10px] block font-semibold uppercase">Presupuesto MRP</span>
                <span className="text-xs sm:text-sm font-bold text-[#3A5A40] block mt-0.5">
                  {formatCOP(simulatedMRP.totalInvestmentUSD)}
                </span>
                <span
                  className={`text-[10px] font-bold ${
                    diffInvestment > 0 ? 'text-[#B33927]' : diffInvestment < 0 ? 'text-[#3A5A40]' : 'text-[#5F6B61]'
                  }`}
                >
                  {diffInvestment > 0
                    ? `+${formatCOP(diffInvestment)}`
                    : diffInvestment < 0
                    ? `-${formatCOP(Math.abs(diffInvestment))}`
                    : '$ 0 COP'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 border-t border-[#E6E1D8] bg-[#FCFBF9] flex items-center justify-between">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-xs text-[#5F6B61] hover:text-[#B33927] font-semibold flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Restablecer
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 sm:px-4 py-2 text-xs font-semibold text-[#5F6B61] hover:text-[#1C211D] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              className="px-4 sm:px-5 py-2 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors active:scale-95"
            >
              <Check className="w-4 h-4" />
              Aplicar Escenario
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
