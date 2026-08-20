import React, { useState } from 'react';
import { ProductionCycleConfig } from '../types';
import { Calendar, Sliders, Shield, AlertTriangle, X, Check } from 'lucide-react';
import { SeasonType } from '../utils/seasonality';

interface CycleManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  cycleConfig: ProductionCycleConfig;
  onSaveCycleConfig: (updated: ProductionCycleConfig) => void;
}

export const CycleManagementModal: React.FC<CycleManagementModalProps> = ({
  isOpen,
  onClose,
  cycleConfig,
  onSaveCycleConfig,
}) => {
  const [name, setName] = useState(cycleConfig.name);
  const [durationMonths, setDurationMonths] = useState(cycleConfig.durationMonths);
  const [season, setSeason] = useState<SeasonType>((cycleConfig.season || 'inicio_ano_escolar') as SeasonType);
  const [startDate, setStartDate] = useState(cycleConfig.startDate);
  const [defaultScrapRatePercent, setDefaultScrapRatePercent] = useState(cycleConfig.defaultScrapRatePercent);
  const [safetyStockDaysDefault, setSafetyStockDaysDefault] = useState(cycleConfig.safetyStockDaysDefault);
  const [leadTimeBufferDays, setLeadTimeBufferDays] = useState(cycleConfig.leadTimeBufferDays || 7);
  const [demandMode, setDemandMode] = useState(cycleConfig.demandMode);
  const [growthRatePercent, setGrowthRatePercent] = useState(cycleConfig.growthRatePercent);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveCycleConfig({
      ...cycleConfig,
      name,
      durationMonths,
      season,
      startDate,
      defaultScrapRatePercent,
      safetyStockDaysDefault,
      leadTimeBufferDays,
      demandMode,
      growthRatePercent,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full border border-[#E6E1D8] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#E6E1D8] flex items-center justify-between bg-[#FCFBF9]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-[#EBF2EC] text-[#3A5A40] rounded-lg border border-[#D4E3D7]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1C211D]">Configuración de Ciclo Productivo</h3>
              <p className="text-xs text-[#5F6B61]">
                Ajuste horizontes de confección, temporadas comerciales de Colombia, mermas y buffers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8F9990] hover:text-[#1C211D] hover:bg-[#F2EEE6] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 text-xs bg-[#FAF8F5]">
          <div>
            <label className="block font-bold text-[#1C211D] mb-1">Nombre de la Campaña / Colección:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-lg font-medium text-[#1C211D] focus:ring-1 focus:ring-[#3A5A40] focus:outline-hidden"
              placeholder="Ej. Campaña Colección Inicio de Año & Escolar 2026"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[#1C211D] mb-1">Horizonte del Ciclo:</label>
              <select
                value={durationMonths}
                onChange={(e) => setDurationMonths(parseInt(e.target.value) || 3)}
                className="w-full p-2.5 border border-[#D5CEC2] rounded-lg font-bold text-[#1C211D] bg-white focus:ring-1 focus:ring-[#3A5A40] focus:outline-hidden"
              >
                <option value={1}>1 Mes (Campaña Flash)</option>
                <option value={2}>2 Meses (Bimestral)</option>
                <option value={3}>3 Meses (Trimestral)</option>
                <option value={6}>6 Meses (Semestral / Temporada)</option>
                <option value={12}>12 Meses (Plan Anual)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#1C211D] mb-1">Temporada Comercial (Colombia):</label>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value as SeasonType)}
                className="w-full p-2.5 border border-[#D5CEC2] rounded-lg font-bold text-[#1C211D] bg-white focus:ring-1 focus:ring-[#3A5A40] focus:outline-hidden"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[#1C211D] mb-1">Fecha de Inicio de Corte:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-lg text-[#1C211D] font-medium focus:ring-1 focus:ring-[#3A5A40] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1C211D] mb-1">
                Modo de Demanda:
              </label>
              <select
                value={demandMode}
                onChange={(e) => setDemandMode(e.target.value as any)}
                className="w-full p-2.5 border border-[#D5CEC2] rounded-lg font-semibold text-[#1C211D] bg-white focus:ring-1 focus:ring-[#3A5A40] focus:outline-hidden"
              >
                <option value="target_driven">Metas Definidas por Prenda</option>
                <option value="history_driven">Proyección Histórica + Temporada</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[#1C211D] mb-1">
                Merma Promedio de Corte (%):
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="25"
                value={defaultScrapRatePercent}
                onChange={(e) => setDefaultScrapRatePercent(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-lg font-bold text-[#1C211D] focus:ring-1 focus:ring-[#3A5A40] focus:outline-hidden"
              />
              <span className="text-[10px] text-[#5F6B61] mt-0.5 block">
                Factor añadido al consumo teórico en tizado
              </span>
            </div>

            <div>
              <label className="block font-bold text-[#1C211D] mb-1">
                Stock de Seguridad Base (Días):
              </label>
              <input
                type="number"
                min="5"
                max="90"
                value={safetyStockDaysDefault}
                onChange={(e) => setSafetyStockDaysDefault(parseInt(e.target.value) || 0)}
                className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-lg font-bold text-[#1C211D] focus:ring-1 focus:ring-[#3A5A40] focus:outline-hidden"
              />
              <span className="text-[10px] text-[#5F6B61] mt-0.5 block">
                Días de cobertura mínima para evitar roturas
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[#1C211D] mb-1">
                Buffer de Lead Time (Días):
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={leadTimeBufferDays}
                onChange={(e) => setLeadTimeBufferDays(parseInt(e.target.value) || 0)}
                className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-lg font-medium text-[#1C211D] focus:ring-1 focus:ring-[#3A5A40] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1C211D] mb-1">
                Crecimiento vs Histórico (%):
              </label>
              <input
                type="number"
                step="1"
                value={growthRatePercent}
                onChange={(e) => setGrowthRatePercent(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-lg font-medium text-[#1C211D] focus:ring-1 focus:ring-[#3A5A40] focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E6E1D8] bg-[#FCFBF9] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#5F6B61] hover:text-[#1C211D] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Check className="w-4 h-4" />
            Aplicar Parámetros al MRP
          </button>
        </div>
      </div>
    </div>
  );
};
