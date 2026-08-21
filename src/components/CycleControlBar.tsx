import React from 'react';
import { Calendar, ShieldAlert, RefreshCw, Layers, Sliders, Scissors, AlertTriangle } from 'lucide-react';
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
    <div className="bg-[#FCFBF9] border-b border-[#E6E1D8] px-3 py-2.5 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Left: Quick Cycle Presets & Season Selector */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Horizon Presets */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] font-bold text-[#5F6B61] uppercase tracking-wider flex items-center gap-1 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-[#3A5A40]" />
              <span className="hidden xs:inline">Horizonte:</span>
            </span>

            <div className="inline-flex rounded-lg p-0.5 bg-[#F2EEE6] border border-[#E6E1D8] text-xs">
              {[1, 3, 6, 12].map((m) => (
                <button
                  key={m}
                  onClick={() =>
                    onUpdateCycleConfig({
                      durationMonths: m,
                      name: `Campaña ${m} Mes${m > 1 ? 'es' : ''} (${seasonInfo.name.split(' ')[0]})`,
                    })
                  }
                  className={`px-2 sm:px-2.5 py-1 rounded-md font-medium text-xs transition-all touch-manipulation active:scale-95 ${
                    cycleConfig.durationMonths === m
                      ? 'bg-white text-[#3A5A40] font-bold shadow-2xs'
                      : 'text-[#5F6B61] hover:text-[#1C211D]'
                  }`}
                  id={`cycle-duration-${m}m`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>

          {/* Season / Temporada Selector Colombia */}
          <div className="flex items-center text-xs bg-white border border-[#E6E1D8] rounded-lg px-2 sm:px-2.5 py-1 shadow-2xs max-w-full">
            <span className="text-[#5F6B61] mr-1.5 font-medium hidden sm:inline shrink-0">
              Temporada (Colombia):
            </span>
            <select
              value={currentSeason}
              onChange={(e) => onUpdateCycleConfig({ season: e.target.value as any })}
              className="bg-transparent font-bold text-[#1C211D] text-xs focus:outline-hidden cursor-pointer truncate"
              id="select-season-mode"
            >
              <option value="inicio_ano_escolar">🎒 Escolar / Dotaciones (Ene-Feb)</option>
              <option value="dia_mujer">🌸 Día de la Mujer (Mar)</option>
              <option value="dia_madre">💐 Día de la Madre (May)</option>
              <option value="dia_padre">👔 Día del Padre (Jun)</option>
              <option value="amor_amistad">❤️ Amor y Amistad (Sep)</option>
              <option value="fin_de_ano">🎄 Fin de Año & Navidad (Nov-Dic)</option>
              <option value="general">🔄 Línea Continua / Todo el Año</option>
            </select>
          </div>
        </div>

        {/* Right: Key Parameters Tuning & Quick Stats */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Mode Switch */}
          <div className="flex items-center text-xs bg-white border border-[#E6E1D8] rounded-lg px-2 sm:px-2.5 py-1 shadow-2xs">
            <span className="text-[#5F6B61] mr-1.5 font-medium hidden sm:inline">Demanda:</span>
            <select
              value={cycleConfig.demandMode}
              onChange={(e) => onUpdateCycleConfig({ demandMode: e.target.value as any })}
              className="bg-transparent font-semibold text-[#1C211D] text-xs focus:outline-hidden cursor-pointer"
              id="select-demand-mode"
            >
              <option value="target_driven">Metas Escaladas ({cycleConfig.durationMonths}m)</option>
              <option value="history_driven">Histórico + Temporada ({cycleConfig.durationMonths}m)</option>
            </select>
          </div>

          {/* Merma de corte */}
          <div className="flex items-center text-xs bg-white border border-[#E6E1D8] rounded-lg px-2 py-1 shadow-2xs">
            <span className="text-[#5F6B61] mr-1 font-medium">Merma:</span>
            <input
              type="number"
              min="0"
              max="25"
              step="0.5"
              value={cycleConfig.defaultScrapRatePercent}
              onChange={(e) => onUpdateCycleConfig({ defaultScrapRatePercent: parseFloat(e.target.value) || 0 })}
              className="w-10 bg-[#FAF8F5] border border-[#D5CEC2] rounded px-1 py-0.5 text-center font-bold text-[#1C211D] text-xs focus:ring-1 focus:ring-[#3A5A40]"
              id="input-scrap-rate"
            />
            <span className="text-[#5F6B61] ml-1 font-semibold">%</span>
          </div>

          {/* Buffer de Stock de Seguridad */}
          <div className="flex items-center text-xs bg-white border border-[#E6E1D8] rounded-lg px-2 py-1 shadow-2xs">
            <ShieldAlert className="w-3.5 h-3.5 text-[#3A5A40] mr-1 shrink-0" />
            <span className="text-[#5F6B61] mr-1 font-medium hidden xs:inline">Buffer:</span>
            <input
              type="number"
              min="5"
              max="90"
              value={cycleConfig.safetyStockDaysDefault}
              onChange={(e) => onUpdateCycleConfig({ safetyStockDaysDefault: parseInt(e.target.value) || 0 })}
              className="w-10 bg-[#FAF8F5] border border-[#D5CEC2] rounded px-1 py-0.5 text-center font-bold text-[#1C211D] text-xs focus:ring-1 focus:ring-[#3A5A40]"
              id="input-safety-days"
            />
            <span className="text-[#5F6B61] ml-0.5">d</span>
          </div>

          {/* Active Scenario Multiplier indicator */}
          {cycleConfig.scenarioMultiplier !== 1.0 && (
            <div className="flex items-center gap-1.5 bg-[#FDF8EE] border border-[#F7E4BF] text-[#82530C] px-2 py-1 rounded-lg text-xs font-semibold">
              <span className="text-[11px]">
                Sim: {Math.round((cycleConfig.scenarioMultiplier - 1) * 100) > 0 ? `+${Math.round((cycleConfig.scenarioMultiplier - 1) * 100)}%` : `${Math.round((cycleConfig.scenarioMultiplier - 1) * 100)}%`}
              </span>
              <button
                onClick={() => onUpdateCycleConfig({ scenarioMultiplier: 1.0 })}
                className="text-[#82530C] hover:text-[#B33927] p-0.5"
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
