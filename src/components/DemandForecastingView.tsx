import React, { useState } from 'react';
import { Garment, ProductionCycleConfig, SalesRecord } from '../types';
import {
  Calendar,
  TrendingUp,
  Save,
  Sliders,
  RefreshCw,
  Sun,
  Snowflake,
  Gift,
  GraduationCap,
  Sparkles,
  Layers,
  Percent,
} from 'lucide-react';
import {
  SEASONS_CONFIG,
  SeasonType,
  computeGarmentProjectedDemand,
  getCategorySeasonMultiplier,
} from '../utils/seasonality';

interface DemandForecastingViewProps {
  garments: Garment[];
  salesRecords: SalesRecord[];
  cycleConfig: ProductionCycleConfig;
  onUpdateGarmentTarget: (garmentId: string, newTarget: number) => void;
  onBatchAdjustTargets?: (percentChange: number) => void;
  onUpdateCycleConfig: (updated: Partial<ProductionCycleConfig>) => void;
  onRecalculateAllTargets?: () => void;
  onOpenCycleModal?: () => void;
}

export const DemandForecastingView: React.FC<DemandForecastingViewProps> = ({
  garments,
  salesRecords,
  cycleConfig,
  onUpdateGarmentTarget,
  onBatchAdjustTargets,
  onUpdateCycleConfig,
  onRecalculateAllTargets,
  onOpenCycleModal,
}) => {
  const [editedTargets, setEditedTargets] = useState<Record<string, number>>({});
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  const currentSeason = (cycleConfig.season || 'primavera_verano') as SeasonType;
  const seasonInfo = SEASONS_CONFIG[currentSeason] || SEASONS_CONFIG.general;

  const handleTargetInputChange = (garmentId: string, value: number) => {
    setEditedTargets((prev) => ({
      ...prev,
      [garmentId]: value,
    }));
    setHasChanges(true);
  };

  const handleSaveAllTargets = () => {
    Object.entries(editedTargets).forEach(([id, target]) => {
      onUpdateGarmentTarget(id, target);
    });
    setEditedTargets({});
    setHasChanges(false);
  };

  const handleAutoProjectFromSeasonAndHorizon = () => {
    if (onRecalculateAllTargets) {
      onRecalculateAllTargets();
    } else {
      garments.forEach((g) => {
        const projected = computeGarmentProjectedDemand(
          g,
          cycleConfig.durationMonths,
          currentSeason,
          cycleConfig.growthRatePercent
        );
        onUpdateGarmentTarget(g.id, projected);
      });
    }
    setEditedTargets({});
    setHasChanges(false);
  };

  const totalPlannedUnits = garments.reduce((sum, g) => {
    const currentVal = editedTargets[g.id] !== undefined ? editedTargets[g.id] : g.targetSales;
    return sum + currentVal;
  }, 0);

  const totalNetCuttingUnits = garments.reduce((sum, g) => {
    const target = editedTargets[g.id] !== undefined ? editedTargets[g.id] : g.targetSales;
    return sum + Math.max(0, target - g.finishedGoodsStock - g.productionWIP);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner Control Card */}
      <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 bg-indigo-50 text-[#4F46E5] text-[10px] font-bold rounded-md uppercase tracking-wider border border-indigo-100">
                Ciclo Activo: {cycleConfig.durationMonths} Meses
              </span>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-md border border-amber-200">
                {seasonInfo.badge}
              </span>
              <span className="text-xs text-[#6B7280]">({cycleConfig.name})</span>
            </div>
            <h2 className="text-lg font-bold text-[#111827] mt-1.5">
              Gestión de Metas de Demanda & Temporadas
            </h2>
            <p className="text-xs text-[#6B7280]">
              Al modificar el horizonte de meses o la temporada, las prendas y los requerimientos de materias primas (MRP) se escalan automáticamente.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAutoProjectFromSeasonAndHorizon}
              className="px-3.5 py-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#374151] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Recalcula las metas de todas las prendas multiplicando su demanda mensual histórica por el horizonte y el multiplicador de la temporada"
              id="btn-recalculate-season-demand"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#4F46E5]" />
              <span>Sincronizar con {seasonInfo.name}</span>
            </button>

            {onOpenCycleModal && (
              <button
                onClick={onOpenCycleModal}
                className="px-3.5 py-2 bg-white border border-[#D1D5DB] hover:bg-[#F9FAFB] text-[#374151] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Sliders className="w-3.5 h-3.5 text-[#4F46E5]" />
                <span>Configurar Ciclo</span>
              </button>
            )}

            {hasChanges && (
              <button
                onClick={handleSaveAllTargets}
                className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                id="btn-save-targets"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Cambios</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Horizon & Season Interactive Controls */}
        <div className="pt-3 border-t border-[#F3F4F6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F9FAFB] p-3 rounded-lg border">
          {/* Horizon Selection */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#4B5563] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#4F46E5]" />
              Cambiar Horizonte:
            </span>
            <div className="inline-flex rounded-lg p-0.5 bg-white border border-[#E5E7EB] text-xs shadow-2xs">
              {[1, 3, 6, 12].map((months) => (
                <button
                  key={months}
                  onClick={() =>
                    onUpdateCycleConfig({
                      durationMonths: months,
                      name: `Campaña ${months} Mes${months > 1 ? 'es' : ''} (${seasonInfo.name})`,
                    })
                  }
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                    cycleConfig.durationMonths === months
                      ? 'bg-[#4F46E5] text-white shadow-xs'
                      : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6]'
                  }`}
                  id={`forecasting-horizon-${months}m`}
                >
                  {months} Mes{months > 1 ? 'es' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Season Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#4B5563]">Temporada / Estacionalidad:</span>
            <select
              value={currentSeason}
              onChange={(e) => onUpdateCycleConfig({ season: e.target.value as SeasonType })}
              className="bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1 text-xs font-semibold text-[#111827] shadow-2xs focus:ring-1 focus:ring-[#4F46E5]"
              id="forecasting-select-season"
            >
              <option value="primavera_verano">☀️ Primavera - Verano</option>
              <option value="otono_invierno">❄️ Otoño - Invierno</option>
              <option value="navidad_findeano">🎁 Fin de Año / Alta (+40%)</option>
              <option value="escolar">🎒 Escolar / Dotaciones</option>
              <option value="general">🔄 Línea Continua (Base 1.0x)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Target Management Table */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-[#111827]">
              Metas de Producción por Prenda ({cycleConfig.durationMonths} Meses • {seasonInfo.name})
            </h3>
            <p className="text-[11px] text-[#6B7280]">
              La meta neta de confección descuenta el stock de producto terminado y prendas en proceso (WIP).
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="text-[#6B7280]">
              Meta Total: <span className="text-[#4F46E5] font-bold">{totalPlannedUnits.toLocaleString()} u</span>
            </div>
            <div className="text-[#6B7280]">
              A Cortar Neto: <span className="text-emerald-600 font-bold">{totalNetCuttingUnits.toLocaleString()} u</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#F9FAFB] text-[10px] font-bold uppercase text-[#6B7280] border-b border-[#E5E7EB]">
              <tr>
                <th className="px-4 py-3">Prenda & Referencia</th>
                <th className="px-4 py-3">Colección / Categoría</th>
                <th className="px-4 py-3 text-right">Demanda Histórica Base</th>
                <th className="px-4 py-3 text-center">Factor Temporada</th>
                <th className="px-4 py-3 text-right">Proyección Teórica ({cycleConfig.durationMonths}m)</th>
                <th className="px-4 py-3 text-right">Stock Terminado</th>
                <th className="px-4 py-3 text-right">En Proceso (WIP)</th>
                <th className="px-4 py-3 text-right">Meta de Demanda Planificada</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-[#F3F4F6]">
              {garments.map((garment) => {
                const currentVal =
                  editedTargets[garment.id] !== undefined ? editedTargets[garment.id] : garment.targetSales;
                
                const seasonMultiplier = getCategorySeasonMultiplier(garment.category, currentSeason);
                const theoretical = computeGarmentProjectedDemand(
                  garment,
                  cycleConfig.durationMonths,
                  currentSeason,
                  cycleConfig.growthRatePercent
                );

                const netToCut = Math.max(0, currentVal - garment.finishedGoodsStock - garment.productionWIP);

                const seasonBadgeClass =
                  seasonMultiplier > 1.2
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : seasonMultiplier > 1.0
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : seasonMultiplier < 1.0
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200';

                return (
                  <tr key={garment.id} className="hover:bg-[#F9FAFB]">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-[#111827]">{garment.name}</div>
                      <div className="text-[10px] text-[#9CA3AF] font-mono">SKU: {garment.sku}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-[10px] font-medium bg-[#F3F4F6] text-[#4B5563] px-2 py-0.5 rounded">
                        {garment.category}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono text-[#6B7280]">
                      {garment.historicalMonthlyAverage.toLocaleString()} u/mes
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md border ${seasonBadgeClass}`}
                      >
                        {seasonMultiplier >= 1
                          ? `+${Math.round((seasonMultiplier - 1) * 100)}%`
                          : `${Math.round((seasonMultiplier - 1) * 100)}%`}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono text-[#6B7280]">
                      <span className="font-semibold">{theoretical.toLocaleString()}</span>{' '}
                      <span className="text-[10px] text-[#9CA3AF]">u ({cycleConfig.durationMonths}m)</span>
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono text-[#111827]">
                      {garment.finishedGoodsStock.toLocaleString()} u
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono text-blue-600 font-medium">
                      {garment.productionWIP.toLocaleString()} u
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={currentVal}
                            onChange={(e) => handleTargetInputChange(garment.id, parseInt(e.target.value) || 0)}
                            className="w-28 bg-[#F9FAFB] border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-right font-bold text-xs text-[#111827] focus:ring-1 focus:ring-[#4F46E5] focus:bg-white"
                          />
                          <span className="text-[#6B7280] text-[10px]">u</span>
                        </div>
                        <span className="text-[10px] text-[#6B7280] mt-0.5">
                          Corte neto: <strong className="text-emerald-700">{netToCut.toLocaleString()} u</strong>
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
