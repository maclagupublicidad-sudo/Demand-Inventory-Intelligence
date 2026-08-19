import React from 'react';
import { Calendar, ShieldAlert, RefreshCw, Sun, Snowflake, Gift, GraduationCap, Layers } from 'lucide-react';
import { ProductionCycleConfig } from '../types';
import { SEASONS_CONFIG, SeasonType } from '../utils/seasonality';

interface CycleControlBarProps {
  cycleConfig: ProductionCycleConfig;
  onUpdateCycleConfig: (updated: Partial<ProductionCycleConfig>) => void;
  totalGarmentsPlanned: number;
  totalInvestmentUSD: number;
}

export const CycleControlBar: React.FC<CycleControlBarProps> = ({
  cycleConfig,
  onUpdateCycleConfig,
  totalGarmentsPlanned,
  totalInvestmentUSD,
}) => {
  const currentSeason = cycleConfig.season || 'primavera_verano';
  const seasonInfo = SEASONS_CONFIG[currentSeason as SeasonType] || SEASONS_CONFIG.general;

  return (
    <div className="bg-white border-b border-[#E5E7EB] px-4 py-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Quick Cycle Presets & Season Selector */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Horizon Presets */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider flex items-center gap-1 mr-0.5">
              <Calendar className="w-3.5 h-3.5 text-[#4F46E5]" />
              Horizonte:
            </span>

            <div className="inline-flex rounded-lg p-0.5 bg-[#F3F4F6] border border-[#E5E7EB] text-xs">
              <button
                onClick={() => onUpdateCycleConfig({ durationMonths: 1, name: `Campaña Flash (1 Mes) - ${seasonInfo.name}` })}
                className={`px-2.5 py-1 rounded-md font-medium text-xs transition-all ${
                  cycleConfig.durationMonths === 1
                    ? 'bg-white text-[#4F46E5] font-bold shadow-2xs'
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
                id="cycle-duration-1m"
              >
                1 Mes
              </button>
              <button
                onClick={() => onUpdateCycleConfig({ durationMonths: 3, name: `Campaña Trimestral (3 Meses) - ${seasonInfo.name}` })}
                className={`px-2.5 py-1 rounded-md font-medium text-xs transition-all ${
                  cycleConfig.durationMonths === 3
                    ? 'bg-white text-[#4F46E5] font-bold shadow-2xs'
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
                id="cycle-duration-3m"
              >
                3 Meses
              </button>
              <button
                onClick={() => onUpdateCycleConfig({ durationMonths: 6, name: `Colección Temporada (6 Meses) - ${seasonInfo.name}` })}
                className={`px-2.5 py-1 rounded-md font-medium text-xs transition-all ${
                  cycleConfig.durationMonths === 6
                    ? 'bg-white text-[#4F46E5] font-bold shadow-2xs'
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
                id="cycle-duration-6m"
              >
                6 Meses
              </button>
              <button
                onClick={() => onUpdateCycleConfig({ durationMonths: 12, name: `Plan Anual (12 Meses) - ${seasonInfo.name}` })}
                className={`px-2.5 py-1 rounded-md font-medium text-xs transition-all ${
                  cycleConfig.durationMonths === 12
                    ? 'bg-white text-[#4F46E5] font-bold shadow-2xs'
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
                id="cycle-duration-12m"
              >
                12 Meses
              </button>
            </div>
          </div>

          {/* Season / Temporada Selector */}
          <div className="flex items-center text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-2.5 py-1">
            <span className="text-[#6B7280] mr-1.5 font-medium flex items-center gap-1">
              <span>Temporada:</span>
            </span>
            <select
              value={currentSeason}
              onChange={(e) => onUpdateCycleConfig({ season: e.target.value as any })}
              className="bg-transparent font-semibold text-[#111827] focus:outline-hidden cursor-pointer"
              id="select-season-mode"
            >
              <option value="primavera_verano">☀️ Primavera - Verano</option>
              <option value="otono_invierno">❄️ Otoño - Invierno</option>
              <option value="navidad_findeano">🎁 Fin de Año / Alta</option>
              <option value="escolar">🎒 Escolar / Dotaciones</option>
              <option value="general">🔄 Línea Continua (Base 1.0x)</option>
            </select>
          </div>
        </div>

        {/* Right: Key Parameters Tuning & Quick Stats */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mode Switch */}
          <div className="flex items-center text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-2.5 py-1">
            <span className="text-[#6B7280] mr-2 font-medium">Demanda:</span>
            <select
              value={cycleConfig.demandMode}
              onChange={(e) => onUpdateCycleConfig({ demandMode: e.target.value as any })}
              className="bg-transparent font-semibold text-[#111827] focus:outline-hidden cursor-pointer"
              id="select-demand-mode"
            >
              <option value="target_driven">Metas Escaladas ({cycleConfig.durationMonths}m)</option>
              <option value="history_driven">Histórico + Temporada ({cycleConfig.durationMonths}m)</option>
            </select>
          </div>

          {/* Merma de corte */}
          <div className="flex items-center text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-2.5 py-1">
            <span className="text-[#6B7280] mr-1.5 font-medium">Merma Tizado:</span>
            <input
              type="number"
              min="0"
              max="25"
              step="0.5"
              value={cycleConfig.defaultScrapRatePercent}
              onChange={(e) => onUpdateCycleConfig({ defaultScrapRatePercent: parseFloat(e.target.value) || 0 })}
              className="w-11 bg-white border border-[#D1D5DB] rounded px-1.5 py-0.5 text-center font-bold text-[#111827] text-xs focus:ring-1 focus:ring-indigo-500"
              id="input-scrap-rate"
            />
            <span className="text-[#6B7280] ml-1 font-semibold">%</span>
          </div>

          {/* Buffer de Stock de Seguridad */}
          <div className="flex items-center text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-2.5 py-1">
            <ShieldAlert className="w-3.5 h-3.5 text-[#4F46E5] mr-1.5" />
            <span className="text-[#6B7280] mr-1.5 font-medium">Buffer:</span>
            <input
              type="number"
              min="5"
              max="90"
              value={cycleConfig.safetyStockDaysDefault}
              onChange={(e) => onUpdateCycleConfig({ safetyStockDaysDefault: parseInt(e.target.value) || 0 })}
              className="w-11 bg-white border border-[#D1D5DB] rounded px-1.5 py-0.5 text-center font-bold text-[#111827] text-xs focus:ring-1 focus:ring-indigo-500"
              id="input-safety-days"
            />
            <span className="text-[#6B7280] ml-1">días</span>
          </div>

          {/* Active Scenario Multiplier indicator */}
          {cycleConfig.scenarioMultiplier !== 1.0 && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1 rounded-lg text-xs font-semibold">
              <span>Simulación: {Math.round((cycleConfig.scenarioMultiplier - 1) * 100) > 0 ? `+${Math.round((cycleConfig.scenarioMultiplier - 1) * 100)}%` : `${Math.round((cycleConfig.scenarioMultiplier - 1) * 100)}%`}</span>
              <button
                onClick={() => onUpdateCycleConfig({ scenarioMultiplier: 1.0 })}
                className="text-amber-900 hover:text-red-700 ml-1"
                title="Restablecer a demanda base"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
