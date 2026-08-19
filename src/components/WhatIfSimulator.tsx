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
  Package,
  DollarSign,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
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

  // Real-time live simulation calculation of MRP (Always called unconditionally at top-level)
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

  if (!isOpen) return null;

  // Interpretation labels
  const getScrapInterpretation = (rate: number) => {
    if (rate <= 2.5) return { label: 'Nesting Láser / CAD Óptimo', desc: 'Máximo aprovechamiento de rollos, mínimo desperdicio textil.', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (rate <= 5.5) return { label: 'Estándar de Confección (5%)', desc: 'Merma promedio de tizado y corte manual en la industria.', color: 'text-[#4F46E5] bg-indigo-50 border-indigo-200' };
    if (rate <= 8.5) return { label: 'Merma Moderada-Alta', desc: 'Desperdicio por encogimiento o tizado complejo.', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { label: 'Alta Pérdida Textil (10%+)', desc: 'Rollos con fallas, telas con sentido o alto desperdicio en tendido.', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  };

  const getBufferInterpretation = (days: number) => {
    if (days === 0) return { label: 'Just-In-Time (0 días)', desc: 'Sin colchón de seguridad. Mayor riesgo si el proveedor se atrasa.', color: 'text-[#6B7280] bg-[#F3F4F6] border-[#E5E7EB]' };
    if (days <= 10) return { label: 'Buffer Preventivo Ligero', desc: 'Cubre pequeñas demoras locales de tintorería y despachos.', color: 'text-[#4F46E5] bg-indigo-50 border-indigo-200' };
    if (days <= 20) return { label: 'Seguridad Estándar (+15 días)', desc: 'Protección recomendada ante atrasos de tejedurías o hilaturas.', color: 'text-purple-700 bg-purple-50 border-purple-200' };
    return { label: 'Riesgo Aduanero/Importación (+25-30 días)', desc: 'Amplio colchón de seguridad para insumos importados por flete marítimo.', color: 'text-amber-800 bg-amber-50 border-amber-200' };
  };

  const scrapInfo = getScrapInterpretation(scrapRate);
  const bufferInfo = getBufferInterpretation(bufferDays);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-[#E5E7EB] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 text-[#4F46E5] rounded-lg">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111827]">
                Simulador de Escenarios What-If
              </h3>
              <p className="text-xs text-[#6B7280]">
                Ajuste la demanda, mermas de corte y buffers de entrega con cálculo interactivo en tiempo real.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F9FAFB] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sliders and Dynamic Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* SLIDER 1: Variación de Demanda */}
          <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#4F46E5]" />
                <span className="font-bold text-[#111827]">1. Variación de Demanda de Ventas:</span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                  demandPercent > 0
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : demandPercent < 0
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-white text-[#374151] border border-[#D1D5DB]'
                }`}
              >
                {demandPercent > 0 ? `+${demandPercent}% (Temporada Alta)` : demandPercent < 0 ? `${demandPercent}% (Caída)` : '0% (Plan Base)'}
              </span>
            </div>

            <input
              type="range"
              min="-50"
              max="100"
              step="5"
              value={demandPercent}
              onChange={(e) => setDemandPercent(parseInt(e.target.value))}
              className="w-full h-2 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-[#4F46E5]"
            />

            <div className="flex justify-between text-[11px] text-[#6B7280]">
              <span>-50% (Recesión)</span>
              <span className="font-semibold text-[#111827]">0% Plan Original</span>
              <span>+50% (Pico Campaña)</span>
              <span>+100% (Duplicar)</span>
            </div>

            <div className="text-[11px] text-[#4B5563] flex items-center justify-between pt-1 border-t border-[#E5E7EB]">
              <span>Prendas a confeccionar proyectadas:</span>
              <strong className="text-[#111827]">
                {simulatedMRP.totalGarmentsPlanned.toLocaleString()} unidades
                {diffGarments !== 0 && (
                  <span className={diffGarments > 0 ? ' text-emerald-600 ml-1' : ' text-rose-600 ml-1'}>
                    ({diffGarments > 0 ? `+${diffGarments.toLocaleString()}` : diffGarments.toLocaleString()} u)
                  </span>
                )}
              </strong>
            </div>
          </div>

          {/* SLIDER 2: Merma de Tizado y Corte Textil */}
          <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-[#111827]">2. Merma de Tizado & Corte de Tela:</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-[#4F46E5] border border-indigo-200">
                {scrapRate}% de Desperdicio
              </span>
            </div>

            <input
              type="range"
              min="1.5"
              max="15"
              step="0.5"
              value={scrapRate}
              onChange={(e) => setScrapRate(parseFloat(e.target.value))}
              className="w-full h-2 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-[#4F46E5]"
            />

            <div className="flex justify-between text-[11px] text-[#6B7280]">
              <span>1.5% (Nesting Láser)</span>
              <span className="font-semibold text-[#111827]">5% (Estándar Confección)</span>
              <span>15% (Alta Merma / Cuadros)</span>
            </div>

            {/* Live Explanation Badge */}
            <div className={`p-2.5 rounded-lg border text-[11px] space-y-0.5 ${scrapInfo.color}`}>
              <div className="font-bold">{scrapInfo.label}</div>
              <p>{scrapInfo.desc}</p>
            </div>

            <div className="text-[11px] text-[#4B5563] flex items-center justify-between pt-1 border-t border-[#E5E7EB]">
              <span>Requerimiento total de telas a comprar:</span>
              <strong className="text-[#111827]">
                {simulatedMRP.totalFabricsMetersNeeded.toLocaleString()} metros
                {diffFabrics !== 0 && (
                  <span className={diffFabrics > 0 ? ' text-rose-600 ml-1' : ' text-emerald-600 ml-1'}>
                    ({diffFabrics > 0 ? `+${diffFabrics.toLocaleString()}` : diffFabrics.toLocaleString()} m)
                  </span>
                )}
              </strong>
            </div>
          </div>

          {/* SLIDER 3: Buffer por Retrasos de Proveedores */}
          <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span className="font-bold text-[#111827]">3. Colchón Preventivo (Buffer de Retrasos):</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                +{bufferDays} días adicionales
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="30"
              step="1"
              value={bufferDays}
              onChange={(e) => setBufferDays(parseInt(e.target.value))}
              className="w-full h-2 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-purple-600"
            />

            <div className="flex justify-between text-[11px] text-[#6B7280]">
              <span>0 días (Just In Time)</span>
              <span className="font-semibold text-[#111827]">+15 días (Seguridad)</span>
              <span>+30 días (Riesgo Aduanero)</span>
            </div>

            {/* Live Explanation Badge */}
            <div className={`p-2.5 rounded-lg border text-[11px] space-y-0.5 ${bufferInfo.color}`}>
              <div className="font-bold">{bufferInfo.label}</div>
              <p>{bufferInfo.desc}</p>
            </div>

            <div className="text-[11px] text-[#4B5563] flex items-center justify-between pt-1 border-t border-[#E5E7EB]">
              <span>Insumos que entran en estado Reorden/Crítico:</span>
              <strong className="text-[#111827]">
                {simulatedMRP.criticalItemsCount + simulatedMRP.reorderItemsCount} materias primas
                {diffCritical + diffReorder !== 0 && (
                  <span className={diffCritical + diffReorder > 0 ? ' text-amber-600 ml-1' : ' text-emerald-600 ml-1'}>
                    ({diffCritical + diffReorder > 0 ? `+${diffCritical + diffReorder}` : diffCritical + diffReorder} vs base)
                  </span>
                )}
              </strong>
            </div>
          </div>

          {/* Real-time Projected Outcome Dashboard */}
          <div className="bg-white border-2 border-indigo-100 rounded-xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-sm text-[#111827] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#4F46E5]" />
                Resumen del Impacto en Compras y Producción
              </h5>
              <span className="text-[10px] text-[#6B7280] font-medium bg-[#F3F4F6] px-2 py-0.5 rounded">
                Cálculo MRP en vivo
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Metric 1 */}
              <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                <span className="text-[#6B7280] text-[10px] block font-semibold uppercase">Demanda Prendas</span>
                <span className="text-sm font-bold text-[#111827] block mt-0.5">
                  {simulatedMRP.totalGarmentsPlanned.toLocaleString()} u
                </span>
                <span className="text-[10px] text-[#6B7280]">
                  {diffGarments >= 0 ? `+${diffGarments}` : `${diffGarments}`} u vs plan
                </span>
              </div>

              {/* Metric 2 */}
              <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                <span className="text-[#6B7280] text-[10px] block font-semibold uppercase">Telas a Comprar</span>
                <span className="text-sm font-bold text-[#111827] block mt-0.5">
                  {simulatedMRP.totalFabricsMetersNeeded.toLocaleString()} m
                </span>
                <span className="text-[10px] text-[#6B7280]">
                  {diffFabrics >= 0 ? `+${diffFabrics}` : `${diffFabrics}`} m tela
                </span>
              </div>

              {/* Metric 3 */}
              <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                <span className="text-[#6B7280] text-[10px] block font-semibold uppercase">Insumos en Reorden</span>
                <span className="text-sm font-bold text-amber-700 block mt-0.5">
                  {simulatedMRP.criticalItemsCount + simulatedMRP.reorderItemsCount} ítems
                </span>
                <span className="text-[10px] text-[#6B7280]">
                  {simulatedMRP.criticalItemsCount} críticos
                </span>
              </div>

              {/* Metric 4 */}
              <div className="p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
                <span className="text-[#6B7280] text-[10px] block font-semibold uppercase">Presupuesto MRP</span>
                <span className="text-sm font-bold text-[#4F46E5] block mt-0.5">
                  {formatCOP(simulatedMRP.totalInvestmentUSD)}
                </span>
                <span
                  className={`text-[10px] font-bold ${
                    diffInvestment > 0 ? 'text-rose-600' : diffInvestment < 0 ? 'text-emerald-600' : 'text-[#6B7280]'
                  }`}
                >
                  {diffInvestment > 0 ? `+${formatCOP(diffInvestment)}` : diffInvestment < 0 ? `-${formatCOP(Math.abs(diffInvestment))}` : '$ 0 COP'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-xs text-[#6B7280] hover:text-red-700 font-semibold flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Restablecer a Base
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#6B7280] hover:text-[#111827] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-4 h-4" />
              Aplicar Escenario al MRP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
