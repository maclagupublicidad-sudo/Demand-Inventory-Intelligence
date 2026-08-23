import React, { useState } from 'react';
import { Garment, ProductionCycleConfig, SalesRecord } from '../types';
import {
  Calendar,
  TrendingUp,
  Save,
  Sliders,
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
  Plus,
  Minus,
  Layers,
  Scissors,
  FileSpreadsheet,
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
  onOpenCSVModal?: () => void;
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
  onOpenCSVModal,
}) => {
  const [editedTargets, setEditedTargets] = useState<Record<string, number>>({});
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'auto' | 'cards' | 'table'>('auto');

  const currentSeason = (cycleConfig.season || 'inicio_ano_escolar') as SeasonType;
  const seasonInfo = SEASONS_CONFIG[currentSeason] || SEASONS_CONFIG.general;

  const handleTargetInputChange = (garmentId: string, value: number) => {
    setEditedTargets((prev) => ({
      ...prev,
      [garmentId]: Math.max(0, value),
    }));
    setHasChanges(true);
  };

  const handleAdjustStep = (garmentId: string, currentVal: number, delta: number) => {
    const newVal = Math.max(0, currentVal + delta);
    handleTargetInputChange(garmentId, newVal);
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
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner Control Card */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-[#E6E1D8] shadow-xs space-y-4">
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
            <h2 className="text-base sm:text-lg font-bold text-[#1C211D] mt-1.5">
              Gestión de Metas de Demanda & Temporadas Comerciales
            </h2>
            <p className="text-xs text-[#5F6B61]">
              Proyecciones automáticas sincronizadas con el calendario de moda y comercio colombiano.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAutoProjectFromSeasonAndHorizon}
              className="px-3 py-2 bg-white border border-[#D5CEC2] hover:bg-[#FAF8F5] text-[#1C211D] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs active:scale-95 touch-manipulation"
              title="Recalcula las metas de todas las prendas multiplicando la demanda histórica por la temporada"
              id="btn-recalculate-season-demand"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#3A5A40]" />
              <span>Sincronizar con {seasonInfo.name.split(' ')[0]}</span>
            </button>

            {onOpenCSVModal && (
              <button
                onClick={onOpenCSVModal}
                className="px-3 py-2 bg-white border border-[#D5CEC2] hover:bg-[#FAF8F5] text-[#1C211D] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs active:scale-95 touch-manipulation cursor-pointer"
                title="Cargar y validar histórico de ventas en formato CSV"
                id="btn-demand-import-sales-csv"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#3A5A40]" />
                <span>Cargar Ventas CSV</span>
              </button>
            )}

            {onOpenCycleModal && (
              <button
                onClick={onOpenCycleModal}
                className="px-3 py-2 bg-white border border-[#D5CEC2] hover:bg-[#FAF8F5] text-[#1C211D] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs active:scale-95 touch-manipulation"
              >
                <Sliders className="w-3.5 h-3.5 text-[#3A5A40]" />
                <span className="hidden sm:inline">Configurar Ciclo</span>
              </button>
            )}

            {hasChanges && (
              <button
                onClick={handleSaveAllTargets}
                className="px-4 py-2 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 touch-manipulation animate-pulse"
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
              Horizonte:
            </span>
            <div className="inline-flex rounded-lg p-0.5 bg-white border border-[#E6E1D8] text-xs shadow-2xs">
              {[1, 3, 6, 12].map((months) => (
                <button
                  key={months}
                  onClick={() =>
                    onUpdateCycleConfig({
                      durationMonths: months,
                      name: `Campaña ${months} Mes${months > 1 ? 'es' : ''} (${seasonInfo.name.split(' ')[0]})`,
                    })
                  }
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all touch-manipulation active:scale-95 ${
                    cycleConfig.durationMonths === months
                      ? 'bg-[#3A5A40] text-white shadow-xs'
                      : 'text-[#5F6B61] hover:text-[#1C211D] hover:bg-[#FAF8F5]'
                  }`}
                  id={`forecasting-horizon-${months}m`}
                >
                  {months}m
                </button>
              ))}
            </div>
          </div>

          {/* Season Selector Colombia */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#1C211D] hidden xs:inline">Temporada:</span>
            <select
              value={currentSeason}
              onChange={(e) => onUpdateCycleConfig({ season: e.target.value as SeasonType })}
              className="bg-white border border-[#D5CEC2] rounded-lg px-2.5 py-1 text-xs font-bold text-[#1C211D] shadow-2xs focus:ring-1 focus:ring-[#3A5A40] max-w-full"
              id="forecasting-select-season"
            >
              <option value="inicio_ano_escolar">🎒 Escolar / Dotaciones (Ene-Feb)</option>
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

      {/* Target Management Container */}
      <div className="bg-white rounded-xl border border-[#E6E1D8] shadow-xs overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-[#E6E1D8] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#FCFBF9]">
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-[#1C211D]">
              Metas de Producción por Prenda ({cycleConfig.durationMonths} Meses • {seasonInfo.name})
            </h3>
            <p className="text-[11px] text-[#5F6B61]">
              Ajuste las unidades requeridas o utilice la proyección estacional sugerida.
            </p>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs font-semibold">
            <div className="text-[#5F6B61]">
              Total: <span className="text-[#3A5A40] font-bold">{totalPlannedUnits.toLocaleString()} u</span>
            </div>
            <div className="text-[#5F6B61]">
              Corte Neto: <span className="text-[#3A5A40] font-bold">{totalNetCuttingUnits.toLocaleString()} u</span>
            </div>

            {/* View Mode Toggle */}
            <div className="inline-flex rounded-lg p-0.5 bg-[#FAF8F5] border border-[#E6E1D8]">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1 rounded-md text-xs font-semibold ${
                  viewMode === 'cards' ? 'bg-white text-[#3A5A40] shadow-2xs font-bold' : 'text-[#5F6B61]'
                }`}
                title="Tarjetas"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1 rounded-md text-xs font-semibold ${
                  viewMode === 'table' ? 'bg-white text-[#3A5A40] shadow-2xs font-bold' : 'text-[#5F6B61]'
                }`}
                title="Tabla"
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 1. Mobile Cards View */}
        <div
          className={`${
            viewMode === 'table' ? 'hidden' : viewMode === 'cards' ? 'block' : 'block lg:hidden'
          } p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3`}
        >
          {garments.length === 0 ? (
            <div className="col-span-full py-10 text-center space-y-2">
              <Scissors className="w-8 h-8 text-[#D5CEC2] mx-auto" />
              <div className="text-xs font-bold text-[#1C211D]">No hay prendas registradas para proyectar demanda</div>
              <p className="text-[11px] text-[#5F6B61] max-w-sm mx-auto">
                Registre sus modelos en el catálogo o importe el historial de ventas para ajustar metas comerciales por temporada.
              </p>
            </div>
          ) : (
            garments.map((garment) => {
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

            return (
              <div
                key={garment.id}
                className="p-4 rounded-xl border border-[#E6E1D8] bg-white hover:bg-[#FAF8F5] space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-sm text-[#1C211D]">{garment.name}</div>
                    <div className="text-[11px] text-[#5F6B61] flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-[#1C211D]">SKU: {garment.sku}</span>
                      <span>•</span>
                      <span className="bg-[#F2EEE6] text-[#5F6B61] px-1.5 py-0.2 rounded text-[10px]">
                        {garment.category}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                      seasonMultiplier > 1.2
                        ? 'bg-[#EBF2EC] text-[#233829] border-[#D4E3D7]'
                        : seasonMultiplier > 1.0
                        ? 'bg-[#F4F7EE] text-[#435C2B] border-[#DCE8CB]'
                        : 'bg-[#F2EEE6] text-[#5F6B61] border-[#E6E1D8]'
                    }`}
                  >
                    {seasonMultiplier >= 1
                      ? `+${Math.round((seasonMultiplier - 1) * 100)}%`
                      : `${Math.round((seasonMultiplier - 1) * 100)}%`}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs bg-[#FAF8F5] p-2 rounded-lg border border-[#EAE6DF]">
                  <div>
                    <span className="text-[10px] text-[#5F6B61] block">Histórico Base</span>
                    <span className="font-semibold text-[#1C211D]">{garment.historicalMonthlyAverage} u/m</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#5F6B61] block">Stock Terminado</span>
                    <span className="font-semibold text-[#1C211D]">{garment.finishedGoodsStock} u</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#5F6B61] block">En Proceso WIP</span>
                    <span className="font-semibold text-[#3A5A40]">{garment.productionWIP} u</span>
                  </div>
                </div>

                {/* Target Stepper Input for Mobile */}
                <div className="pt-2 border-t border-[#F2EEE6] flex items-center justify-between gap-2">
                  <div className="text-xs">
                    <span className="text-[10px] text-[#5F6B61] block">Corte Neto Requerido:</span>
                    <strong className="text-sm text-[#3A5A40] font-bold">{netToCut.toLocaleString()} u</strong>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleAdjustStep(garment.id, currentVal, -50)}
                      className="w-8 h-8 rounded-lg bg-[#FAF8F5] hover:bg-[#F2EEE6] border border-[#D5CEC2] flex items-center justify-center text-[#1C211D] font-bold active:scale-95 touch-manipulation"
                      title="-50 unidades"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={currentVal}
                      onChange={(e) => handleTargetInputChange(garment.id, parseInt(e.target.value) || 0)}
                      className="w-20 bg-[#FAF8F5] border border-[#D5CEC2] rounded-lg px-2 py-1.5 text-center font-bold text-xs text-[#1C211D] focus:ring-1 focus:ring-[#3A5A40] focus:bg-white"
                    />
                    <button
                      onClick={() => handleAdjustStep(garment.id, currentVal, 50)}
                      className="w-8 h-8 rounded-lg bg-[#FAF8F5] hover:bg-[#F2EEE6] border border-[#D5CEC2] flex items-center justify-center text-[#1C211D] font-bold active:scale-95 touch-manipulation"
                      title="+50 unidades"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          }))}
        </div>

        {/* 2. Desktop Table View */}
        <div
          className={`${
            viewMode === 'cards' ? 'hidden' : viewMode === 'table' ? 'block' : 'hidden lg:block'
          } overflow-x-auto`}
        >
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#FAF8F5] text-[10px] font-bold uppercase text-[#5F6B61] border-b border-[#E6E1D8]">
              <tr>
                <th className="px-4 py-3">Prenda & Referencia</th>
                <th className="px-4 py-3">Colección / Categoría</th>
                <th className="px-4 py-3 text-right">Demanda Base</th>
                <th className="px-4 py-3 text-center">Temporada</th>
                <th className="px-4 py-3 text-right">Proyección ({cycleConfig.durationMonths}m)</th>
                <th className="px-4 py-3 text-right">Stock Terminado</th>
                <th className="px-4 py-3 text-right">En Proceso (WIP)</th>
                <th className="px-4 py-3 text-right">Meta Planificada</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-[#F2EEE6]">
              {garments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="space-y-2">
                      <Scissors className="w-8 h-8 text-[#D5CEC2] mx-auto" />
                      <div className="text-xs font-bold text-[#1C211D]">No hay prendas registradas para proyectar demanda</div>
                      <p className="text-[11px] text-[#5F6B61] max-w-sm mx-auto">
                        Registre sus modelos en el catálogo o importe el historial de ventas para ajustar metas comerciales por temporada.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                garments.map((garment) => {
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
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md border ${seasonBadgeClass}`}>
                        {seasonMultiplier >= 1
                          ? `+${Math.round((seasonMultiplier - 1) * 100)}%`
                          : `${Math.round((seasonMultiplier - 1) * 100)}%`}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right font-mono text-[#5F6B61]">
                      <span className="font-semibold text-[#1C211D]">{theoretical.toLocaleString()}</span>{' '}
                      <span className="text-[10px] text-[#8F9990]">u</span>
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
                            className="w-24 bg-[#FAF8F5] border border-[#D5CEC2] rounded-lg px-2.5 py-1.5 text-right font-bold text-xs text-[#1C211D] focus:ring-1 focus:ring-[#3A5A40] focus:bg-white"
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
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
