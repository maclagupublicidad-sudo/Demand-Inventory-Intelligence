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
      <div className="bg-white p-6 rounded-xl border border-[#E6E1D8] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 bg-[#EBF2EC] text-[#3A5A40] text-[10px] font-bold rounded-md uppercase tracking-wider border border-[#D4E3D7]">
                Ciclo Activo: {cycleConfig.durationMonths} Meses
              </span>
              <span className="px-2 py-0.5 bg-[#FDF8EE] text-[#82530C] text-[10px] font-bold rounded-md border border-[#F7E4BF]">
                {seasonInfo.badge}
              </span>
              <span className="text-xs text-[#5F6B61]">({seasonInfo.dates})</span>
            </div>
            <h2 className="text-lg font-bold text-[#1C211D] mt-1.5">
              Gestión de Metas de Demanda & Temporadas Comerciales
            </h2>
            <p className="text-xs text-[#5F6B61]">
              Al modificar el horizonte o la temporada del calendario colombiano, las metas por prenda y los requerimientos de materias primas (MRP) se calculan con base en el histórico y factores de estacionalidad.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAutoProjectFromSeasonAndHorizon}
              className="px-3.5 py-2 bg-white border border-[#D5CEC2] hover:bg-[#FAF8F5] text-[#1C211D] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Recalcula las metas de todas las prendas multiplicando su demanda mensual histórica por el horizonte y el multiplicador de la temporada"
              id="btn-recalculate-season-demand"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#3A5A40]" />
              <span>Sincronizar con {seasonInfo.name}</span>
            </button>

            {onOpenCycleModal && (
              <button
                onClick={onOpenCycleModal}
                className="px-3.5 py-2 bg-white border border-[#D5CEC2] hover:bg-[#FAF8F5] text-[#1C211D] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Sliders className="w-3.5 h-3.5 text-[#3A5A40]" />
                <span>Configurar Ciclo</span>
              </button>
            )}

            {hasChanges && (
              <button
                onClick={handleSaveAllTargets}
                className="px-4 py-2 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                id="btn-save-targets"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Cambios</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Horizon & Season Interactive Controls */}
        <div className="pt-3 border-t border-[#E6E1D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FCFBF9] p-3 rounded-lg border border-[#EAE6DF]">
          {/* Horizon Selection */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#1C211D] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#3A5A40]" />
              Cambiar Horizonte:
            </span>
            <div className="inline-flex rounded-lg p-0.5 bg-white border border-[#E6E1D8] text-xs shadow-2xs">
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
                      ? 'bg-[#3A5A40] text-white shadow-xs'
                      : 'text-[#5F6B61] hover:text-[#1C211D] hover:bg-[#FAF8F5]'
                  }`}
                  id={`forecasting-horizon-${months}m`}
                >
                  {months} Mes{months > 1 ? 'es' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Season Selector Colombia */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#1C211D]">Temporada (Colombia):</span>
            <select
              value={currentSeason}
              onChange={(e) => onUpdateCycleConfig({ season: e.target.value as SeasonType })}
              className="bg-white border border-[#D5CEC2] rounded-lg px-2.5 py-1 text-xs font-bold text-[#1C211D] shadow-2xs focus:ring-1 focus:ring-[#3A5A40]"
              id="forecasting-select-season"
            >
              <option value="inicio_ano_escolar">🎒 Inicio de Año / Escolar (Ene-Feb)</option>
              <option value="dia_mujer">🌸 Día de la Mujer (Marzo)</option>
              <option value="dia_madre">💐 Día de la Madre (Mayo)</option>
              <option value="dia_padre">👔 Día del Padre (Junio)</option>
              <option value="amor_amistad">❤️ Amor y Amistad (Septiembre)</option>
              <option value="fin_de_ano">🎄 Fin de Año & Navidad (Nov-Dic)</option>
              <option value="general">🔄 Línea Continua / Todo el Año (1.0x)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Target Management Table */}
      <div className="bg-white rounded-xl border border-[#E6E1D8] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E6E1D8] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#FCFBF9]">
          <div>
            <h3 className="font-bold text-sm text-[#1C211D]">
              Metas de Producción por Prenda ({cycleConfig.durationMonths} Meses • {seasonInfo.name})
            </h3>
            <p className="text-[11px] text-[#5F6B61]">
              La meta neta de confección descuenta el stock de producto terminado y prendas en proceso (WIP).
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="text-[#5F6B61]">
              Meta Total: <span className="text-[#3A5A40] font-bold">{totalPlannedUnits.toLocaleString()} u</span>
            </div>
            <div className="text-[#5F6B61]">
              A Cortar Neto: <span className="text-[#3A5A40] font-bold">{totalNetCuttingUnits.toLocaleString()} u</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#FAF8F5] text-[10px] font-bold uppercase text-[#5F6B61] border-b border-[#E6E1D8]">
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
            <tbody className="text-xs divide-y divide-[#F2EEE6]">
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
                    ? 'bg-[#EBF2EC] text-[#233829] border-[#D4E3D7]'
                    : seasonMultiplier > 1.0
                    ? 'bg-[#F4F7EE] text-[#435C2B] border-[#DCE8CB]'
                    : seasonMultiplier < 1.0
                    ? 'bg-[#FDF8EE] text-[#82530C] border-[#F7E4BF]'
                    : 'bg-[#F2EEE6] text-[#5F6B61] border-[#E6E1D8]';

                return (
                  <tr key={garment.id} className="hover:bg-[#FAF8F5]">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-[#1C211D]">{garment.name}</div>
                      <div className="text-[10px] text-[#8F9990] font-mono">SKU: {garment.sku}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-[10px] font-medium bg-[#F2EEE6] text-[#5F6B61] px-2 py-0.5 rounded">
                        {garment.category}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono text-[#5F6B61]">
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

                    <td className="px-4 py-3.5 text-right font-mono text-[#5F6B61]">
                      <span className="font-semibold text-[#1C211D]">{theoretical.toLocaleString()}</span>{' '}
                      <span className="text-[10px] text-[#8F9990]">u ({cycleConfig.durationMonths}m)</span>
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono text-[#1C211D]">
                      {garment.finishedGoodsStock.toLocaleString()} u
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono text-[#3A5A40] font-medium">
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
                            className="w-28 bg-[#FAF8F5] border border-[#D5CEC2] rounded-lg px-2.5 py-1.5 text-right font-bold text-xs text-[#1C211D] focus:ring-1 focus:ring-[#3A5A40] focus:bg-white"
                          />
                          <span className="text-[#5F6B61] text-[10px]">u</span>
                        </div>
                        <span className="text-[10px] text-[#5F6B61] mt-0.5">
                          Corte neto: <strong className="text-[#3A5A40] font-bold">{netToCut.toLocaleString()} u</strong>
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
