import React from 'react';
import { Calendar, ShieldAlert, RefreshCw, Layers } from 'lucide-react';
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
  const currentSeason = cycleConfig.season || 'inicio_ano_escolar';
  const seasonInfo = SEASONS_CONFIG[currentSeason as SeasonType] || SEASONS_CONFIG.general;

  return (
    <div className="bg-[#FCFBF9] border-b border-[#E6E1D8] px-4 py-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Quick Cycle Presets & Season Selector */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Horizon Presets */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#5F6B61] uppercase tracking-wider flex items-center gap-1 mr-0.5">
              <Calendar className="w-3.5 h-3.5 text-[#3A5A40]" />
              Horizonte:
            </span>

            <div className="inline-flex rounded-lg p-0.5 bg-[#F2EEE6] border border-[#E6E1D8] text-xs">
              <button
                onClick={() => onUpdateCycleConfig({ durationMonths: 1, name: `Campaña Flash (1 Mes) - ${seasonInfo.name}` })}
                className={`px-2.5 py-1 rounded-md font-medium text-xs transition-all ${
                  cycleConfig.durationMonths === 1
                    ? 'bg-white text-[#3A5A40] font-bold shadow-2xs'
                    : 'text-[#5F6B61] hover:text-[#1C211D]'
                }`}
                id="cycle-duration-1m"
              >
                1 Mes
              </button>
              <button
                onClick={() => onUpdateCycleConfig({ durationMonths: 3, name: `Campaña Trimestral (3 Meses) - ${seasonInfo.name}` })}
                className={`px-2.5 py-1 rounded-md font-medium text-xs transition-all ${
                  cycleConfig.durationMonths === 3
                    ? 'bg-white text-[#3A5A40] font-bold shadow-2xs'
                    : 'text-[#5F6B61] hover:text-[#1C211D]'
                }`}
                id="cycle-duration-3m"
              >
                3 Meses
              </button>
              <button
                onClick={() => onUpdateCycleConfig({ durationMonths: 6, name: `Colección Temporada (6 Meses) - ${seasonInfo.name}` })}
                className={`px-2.5 py-1 rounded-md font-medium text-xs transition-all ${
                  cycleConfig.durationMonths === 6
                    ? 'bg-white text-[#3A5A40] font-bold shadow-2xs'
                    : 'text-[#5F6B61] hover:text-[#1C211D]'
                }`}
                id="cycle-duration-6m"
              >
                6 Meses
              </button>
              <button
                onClick={() => onUpdateCycleConfig({ durationMonths: 12, name: `Plan Anual (12 Meses) - ${seasonInfo.name}` })}
                className={`px-2.5 py-1 rounded-md font-medium text-xs transition-all ${
                  cycleConfig.durationMonths === 12
                    ? 'bg-white text-[#3A5A40] font-bold shadow-2xs'
                    : 'text-[#5F6B61] hover:text-[#1C211D]'
                }`}
                id="cycle-duration-12m"
              >
                12 Meses
              </button>
            </div>
          </div>

          {/* Season / Temporada Selector Colombia */}
          <div className="flex items-center text-xs bg-white border border-[#E6E1D8] rounded-lg px-2.5 py-1 shadow-2xs">
            <span className="text-[#5F6B61] mr-1.5 font-medium flex items-center gap-1">
              <span>Temporada (Colombia):</span>
            </span>
            <select
              value={currentSeason}
              onChange={(e) => onUpdateCycleConfig({ season: e.target.value as any })}
              className="bg-transparent font-bold text-[#1C211D] focus:outline-hidden cursor-pointer"
              id="select-season-mode"
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

        {/* Right: Key Parameters Tuning & Quick Stats */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mode Switch */}
          <div className="flex items-center text-xs bg-white border border-[#E6E1D8] rounded-lg px-2.5 py-1 shadow-2xs">
            <span className="text-[#5F6B61] mr-2 font-medium">Demanda:</span>
            <select
              value={cycleConfig.demandMode}
              onChange={(e) => onUpdateCycleConfig({ demandMode: e.target.value as any })}
              className="bg-transparent font-semibold text-[#1C211D] focus:outline-hidden cursor-pointer"
              id="select-demand-mode"
            >
              <option value="target_driven">Metas Escaladas ({cycleConfig.durationMonths}m)</option>
              <option value="history_driven">Histórico + Temporada ({cycleConfig.durationMonths}m)</option>
            </select>
          </div>

          {/* Merma de corte */}
          <div className="flex items-center text-xs bg-white border border-[#E6E1D8] rounded-lg px-2.5 py-1 shadow-2xs">
            <span className="text-[#5F6B61] mr-1.5 font-medium">Merma Tizado:</span>
            <input
              type="number"
              min="0"
              max="25"
              step="0.5"
              value={cycleConfig.defaultScrapRatePercent}
              onChange={(e) => onUpdateCycleConfig({ defaultScrapRatePercent: parseFloat(e.target.value) || 0 })}
              className="w-11 bg-[#FAF8F5] border border-[#D5CEC2] rounded px-1.5 py-0.5 text-center font-bold text-[#1C211D] text-xs focus:ring-1 focus:ring-[#3A5A40]"
              id="input-scrap-rate"
            />
            <span className="text-[#5F6B61] ml-1 font-semibold">%</span>
          </div>

          {/* Buffer de Stock de Seguridad */}
          <div className="flex items-center text-xs bg-white border border-[#E6E1D8] rounded-lg px-2.5 py-1 shadow-2xs">
            <ShieldAlert className="w-3.5 h-3.5 text-[#3A5A40] mr-1.5" />
            <span className="text-[#5F6B61] mr-1.5 font-medium">Buffer:</span>
            <input
              type="number"
              min="5"
              max="90"
              value={cycleConfig.safetyStockDaysDefault}
              onChange={(e) => onUpdateCycleConfig({ safetyStockDaysDefault: parseInt(e.target.value) || 0 })}
              className="w-11 bg-[#FAF8F5] border border-[#D5CEC2] rounded px-1.5 py-0.5 text-center font-bold text-[#1C211D] text-xs focus:ring-1 focus:ring-[#3A5A40]"
              id="input-safety-days"
            />
            <span className="text-[#5F6B61] ml-1">días</span>
          </div>

          {/* Active Scenario Multiplier indicator */}
          {cycleConfig.scenarioMultiplier !== 1.0 && (
            <div className="flex items-center gap-1.5 bg-[#FDF8EE] border border-[#F7E4BF] text-[#82530C] px-2.5 py-1 rounded-lg text-xs font-semibold">
              <span>Simulación: {Math.round((cycleConfig.scenarioMultiplier - 1) * 100) > 0 ? `+${Math.round((cycleConfig.scenarioMultiplier - 1) * 100)}%` : `${Math.round((cycleConfig.scenarioMultiplier - 1) * 100)}%`}</span>
              <button
                onClick={() => onUpdateCycleConfig({ scenarioMultiplier: 1.0 })}
                className="text-[#82530C] hover:text-[#B33927] ml-1"
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
