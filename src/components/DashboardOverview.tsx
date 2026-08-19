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
        <div className="bg-white border border-red-200 border-l-4 border-l-red-500 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#111827]">
                {mrpSummary.criticalItemsCount} materias primas en estado crítico de desabastecimiento
              </h4>
              <p className="text-xs text-[#6B7280] mt-0.5">
                El stock actual no cubre la demanda planificada para el ciclo de {cycleConfig.durationMonths} meses. Riesgo de retraso en línea de corte.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onFilterStatus('CRITICO')}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors whitespace-nowrap"
              id="btn-view-critical-materials"
            >
              Filtrar Críticos
            </button>
            <button
              onClick={onOpenPOModal}
              className="px-3 py-1.5 bg-white border border-[#D1D5DB] text-[#374151] hover:bg-[#F9FAFB] rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
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
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider mb-1">Demanda del Ciclo</p>
            <div className="w-8 h-8 rounded-lg bg-[#F3F4F6] text-[#4F46E5] flex items-center justify-center">
              <Shirt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#111827] mt-1">
            {mrpSummary.totalGarmentsPlanned.toLocaleString()} <span className="text-sm font-normal text-[#9CA3AF]">prendas</span>
          </p>
          <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#4F46E5] w-[75%] rounded-full"></div>
          </div>
          <p className="text-[10px] text-[#6B7280] mt-2 font-medium">Horizonte: {cycleConfig.durationMonths} meses ({cycleConfig.name})</p>
        </div>

        {/* Card 2: Total Materials Budget */}
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider mb-1">Presupuesto Materia Prima</p>
            <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#111827] mt-1">
            {formatCOP(mrpSummary.totalInvestmentUSD, false)}
            <span className="text-xs font-semibold text-[#6B7280] ml-1">COP</span>
          </p>
          <p className="text-[10px] text-green-600 mt-2 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Ajustado a MOQ de proveedores
          </p>
        </div>

        {/* Card 3: Fabrics Demand (Telas) */}
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider mb-1">Telas a Requerir</p>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#4F46E5] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#111827] mt-1">
            {mrpSummary.totalFabricsMetersNeeded.toLocaleString()}{' '}
            <span className="text-sm font-normal text-[#9CA3AF]">m</span>
            {mrpSummary.totalFabricsKgNeeded > 0 && (
              <span className="text-base font-bold text-[#4B5563] ml-2">
                + {mrpSummary.totalFabricsKgNeeded.toLocaleString()} <span className="text-xs font-normal text-[#9CA3AF]">kg</span>
              </span>
            )}
          </p>
          <p className="text-[10px] text-[#6B7280] mt-2">
            Incluye {cycleConfig.defaultScrapRatePercent}% de merma en tizado
          </p>
        </div>

        {/* Card 4: Trims & Supplies */}
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider mb-1">Avíos & Fornituras</p>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#111827] mt-1">
            {mrpSummary.totalTrimsUnitsNeeded.toLocaleString()}{' '}
            <span className="text-sm font-normal text-[#9CA3AF]">unidades</span>
          </p>
          <p className="text-[10px] text-[#6B7280] mt-2">
            + {mrpSummary.totalThreadConesNeeded} conos de hilo (5.000m)
          </p>
        </div>
      </div>

      {/* Category Cost Breakdown & AI Strategic Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Category Cost Breakdown Bars */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-[#111827]">Distribución de Inversión por Categoría</h3>
              <p className="text-xs text-[#6B7280]">Presupuesto requerido para abastecer el ciclo productivo</p>
            </div>
            <span className="text-xs bg-[#F3F4F6] text-[#374151] font-semibold px-2.5 py-1 rounded-md border border-[#E5E7EB]">
              Total: {formatCOP(mrpSummary.totalInvestmentUSD)}
            </span>
          </div>

          <div className="space-y-4">
            {mrpSummary.categoryCostBreakdown.map((cat) => {
              const colorMap: Record<string, { fill: string }> = {
                Tela: { fill: 'bg-[#4F46E5]' },
                'Avío / Fornitura': { fill: 'bg-purple-600' },
                Hilo: { fill: 'bg-emerald-600' },
                Entretela: { fill: 'bg-amber-500' },
                'Empaque / Etiqueta': { fill: 'bg-slate-600' },
              };
              const colors = colorMap[cat.category] || { fill: 'bg-[#4F46E5]' };

              return (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-medium">
                    <span className="text-[#111827] font-semibold flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${colors.fill}`} />
                      {cat.category} ({cat.itemsCount} materiales)
                    </span>
                    <div className="space-x-2">
                      <span className="text-[#6B7280]">{cat.percentage}%</span>
                      <span className="text-[#111827] font-bold">{formatCOP(cat.totalCost)}</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
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
        <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2 py-0.5 bg-indigo-50 text-[#4F46E5] text-[10px] font-bold rounded-full uppercase tracking-wider border border-indigo-100 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#4F46E5]" />
                Inteligencia Textil
              </span>
              <span className="text-[10px] text-[#9CA3AF] font-medium">Gemini 3.7 Flash</span>
            </div>
            <h4 className="text-sm font-bold text-[#111827] mb-2">
              Auditoría de Cadena de Suministro
            </h4>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Las telas representan el mayor porcentaje del capital de trabajo. Los tejidos teñidos tienen un lead time promedio de 30-45 días.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
            <div className="text-[11px] text-[#6B7280]">
              Estado: <span className="text-green-600 font-semibold">Listo</span>
            </div>
            <button
              onClick={onOpenAIAdvisor}
              className="px-3.5 py-1.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
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
