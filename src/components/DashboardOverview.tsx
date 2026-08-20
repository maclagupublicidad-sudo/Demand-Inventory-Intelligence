import React from 'react';
import { MRPSummary } from '../services/mrpEngine';
import { ProductionCycleConfig } from '../types';
import { Shirt, DollarSign, AlertTriangle, CheckCircle2, Package, Sparkles, ArrowUpRight, Layers } from 'lucide-react';
import { formatCOP } from '../utils/formatters';

interface DashboardOverviewProps {
  mrpSummary: MRPSummary;
  cycleConfig: ProductionCycleConfig;
  onFilterStatus: (status: string) => void;
  onOpenAIAdvisor: () => void;
  onOpenPOModal: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  mrpSummary,
  cycleConfig,
  onFilterStatus,
  onOpenAIAdvisor,
  onOpenPOModal,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner Alert (if critical items) */}
      {mrpSummary.criticalItemsCount > 0 && (
        <div className="bg-white border border-[#F0D5D0] border-l-4 border-l-[#B33927] p-4 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 bg-[#FDF2F0] rounded-lg text-[#B33927]">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#1C211D]">
                {mrpSummary.criticalItemsCount} materias primas en estado crítico de desabastecimiento
              </h4>
              <p className="text-xs text-[#5F6B61] mt-0.5">
                El stock actual no cubre la demanda planificada para el ciclo de {cycleConfig.durationMonths} meses. Riesgo de retraso en línea de corte.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onFilterStatus('CRITICO')}
              className="px-3 py-1.5 bg-[#B33927] hover:bg-[#962F20] text-white rounded-lg text-xs font-bold shadow-xs transition-colors whitespace-nowrap"
              id="btn-view-critical-materials"
            >
              Filtrar Críticos
            </button>
            <button
              onClick={onOpenPOModal}
              className="px-3 py-1.5 bg-white border border-[#D5CEC2] text-[#1C211D] hover:bg-[#FAF8F5] rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
              id="btn-auto-generate-pos"
            >
              Generar OC
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Sales / Production Target */}
        <div className="bg-white p-5 rounded-xl border border-[#E6E1D8] shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-[#5F6B61] font-bold uppercase tracking-wider mb-1">Demanda del Ciclo</p>
            <div className="w-8 h-8 rounded-lg bg-[#EBF2EC] text-[#3A5A40] flex items-center justify-center">
              <Shirt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#1C211D] mt-1">
            {mrpSummary.totalGarmentsPlanned.toLocaleString()} <span className="text-sm font-normal text-[#8F9990]">prendas</span>
          </p>
          <div className="mt-3 h-1.5 w-full bg-[#F2EEE6] rounded-full overflow-hidden">
            <div className="h-full bg-[#3A5A40] w-[75%] rounded-full"></div>
          </div>
          <p className="text-[10px] text-[#5F6B61] mt-2 font-medium">Horizonte: {cycleConfig.durationMonths} meses ({cycleConfig.name})</p>
        </div>

        {/* Card 2: Total Materials Budget */}
        <div className="bg-white p-5 rounded-xl border border-[#E6E1D8] shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-[#5F6B61] font-bold uppercase tracking-wider mb-1">Presupuesto Materia Prima</p>
            <div className="w-8 h-8 rounded-lg bg-[#EBF2EC] text-[#3A5A40] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#1C211D] mt-1">
            {formatCOP(mrpSummary.totalInvestmentUSD, false)}
            <span className="text-xs font-semibold text-[#5F6B61] ml-1">COP</span>
          </p>
          <p className="text-[10px] text-[#3A5A40] mt-2 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Ajustado a MOQ de proveedores
          </p>
        </div>

        {/* Card 3: Fabrics Demand (Telas) */}
        <div className="bg-white p-5 rounded-xl border border-[#E6E1D8] shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-[#5F6B61] font-bold uppercase tracking-wider mb-1">Telas a Requerir</p>
            <div className="w-8 h-8 rounded-lg bg-[#EBF2EC] text-[#3A5A40] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#1C211D] mt-1">
            {mrpSummary.totalFabricsMetersNeeded.toLocaleString()}{' '}
            <span className="text-sm font-normal text-[#8F9990]">m</span>
            {mrpSummary.totalFabricsKgNeeded > 0 && (
              <span className="text-base font-bold text-[#5F6B61] ml-2">
                + {mrpSummary.totalFabricsKgNeeded.toLocaleString()} <span className="text-xs font-normal text-[#8F9990]">kg</span>
              </span>
            )}
          </p>
          <p className="text-[10px] text-[#5F6B61] mt-2">
            Incluye {cycleConfig.defaultScrapRatePercent}% de merma en tizado
          </p>
        </div>

        {/* Card 4: Trims & Supplies */}
        <div className="bg-white p-5 rounded-xl border border-[#E6E1D8] shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-[#5F6B61] font-bold uppercase tracking-wider mb-1">Avíos & Fornituras</p>
            <div className="w-8 h-8 rounded-lg bg-[#F2EEE6] text-[#5F6B61] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#1C211D] mt-1">
            {mrpSummary.totalTrimsUnitsNeeded.toLocaleString()}{' '}
            <span className="text-sm font-normal text-[#8F9990]">unidades</span>
          </p>
          <p className="text-[10px] text-[#5F6B61] mt-2">
            + {mrpSummary.totalThreadConesNeeded} conos de hilo (5.000m)
          </p>
        </div>
      </div>

      {/* Category Cost Breakdown & AI Strategic Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Category Cost Breakdown Bars */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-[#E6E1D8] shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-[#1C211D]">Distribución de Inversión por Categoría</h3>
              <p className="text-xs text-[#5F6B61]">Presupuesto requerido para abastecer el ciclo productivo</p>
            </div>
            <span className="text-xs bg-[#FAF8F5] text-[#1C211D] font-semibold px-2.5 py-1 rounded-md border border-[#E6E1D8]">
              Total: {formatCOP(mrpSummary.totalInvestmentUSD)}
            </span>
          </div>

          <div className="space-y-4">
            {mrpSummary.categoryCostBreakdown.map((cat) => {
              const colorMap: Record<string, { fill: string }> = {
                Tela: { fill: 'bg-[#3A5A40]' },
                'Avío / Fornitura': { fill: 'bg-[#6A7B6E]' },
                Hilo: { fill: 'bg-[#435C2B]' },
                Entretela: { fill: 'bg-[#A37B3C]' },
                'Empaque / Etiqueta': { fill: 'bg-[#8F9990]' },
              };
              const colors = colorMap[cat.category] || { fill: 'bg-[#3A5A40]' };

              return (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-medium">
                    <span className="text-[#1C211D] font-semibold flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${colors.fill}`} />
                      {cat.category} ({cat.itemsCount} materiales)
                    </span>
                    <div className="space-x-2">
                      <span className="text-[#5F6B61]">{cat.percentage}%</span>
                      <span className="text-[#1C211D] font-bold">{formatCOP(cat.totalCost)}</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#F2EEE6] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors.fill} transition-all duration-500`}
                      style={{ width: `${Math.max(cat.percentage, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: AI Intelligence Quick Advisor */}
        <div className="bg-white p-6 rounded-xl border border-[#E6E1D8] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2 py-0.5 bg-[#EBF2EC] text-[#3A5A40] text-[10px] font-bold rounded-full uppercase tracking-wider border border-[#D4E3D7] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#3A5A40]" />
                Inteligencia Textil
              </span>
              <span className="text-[10px] text-[#8F9990] font-medium">Gemini 3.7 Flash</span>
            </div>
            <h4 className="text-sm font-bold text-[#1C211D] mb-2">
              Auditoría de Cadena de Suministro
            </h4>
            <p className="text-xs text-[#5F6B61] leading-relaxed">
              Las telas representan el mayor porcentaje del capital de trabajo. Los tejidos teñidos tienen un lead time promedio de 30-45 días.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-[#E6E1D8] flex items-center justify-between">
            <div className="text-[11px] text-[#5F6B61]">
              Estado: <span className="text-[#3A5A40] font-semibold">Listo</span>
            </div>
            <button
              onClick={onOpenAIAdvisor}
              className="px-3.5 py-1.5 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
              id="btn-dashboard-ai-advisor"
            >
              Consultar IA
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
