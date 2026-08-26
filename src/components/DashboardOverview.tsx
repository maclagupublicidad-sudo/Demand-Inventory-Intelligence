import React from 'react';
import { MRPSummary } from '../services/mrpEngine';
import { ProductionCycleConfig, ProductionOrder } from '../types';
import { Shirt, DollarSign, AlertTriangle, CheckCircle2, Package, Sparkles, ArrowUpRight, Plus, Upload, Factory, Activity, ChevronRight } from 'lucide-react';
import { formatCOP } from '../utils/formatters';
import { TechTermTooltip } from './TechTermTooltip';

interface DashboardOverviewProps {
  mrpSummary: MRPSummary;
  cycleConfig: ProductionCycleConfig;
  productionOrders?: ProductionOrder[];
  onFilterStatus: (status: string) => void;
  onOpenAIAdvisor: () => void;
  onOpenPOModal: () => void;
  onOpenNewGarment?: () => void;
  onOpenNewMaterial?: () => void;
  onOpenCSVModal?: () => void;
  onNavigateToExecution?: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  mrpSummary,
  cycleConfig,
  productionOrders = [],
  onFilterStatus,
  onOpenAIAdvisor,
  onOpenPOModal,
  onOpenNewGarment,
  onOpenNewMaterial,
  onOpenCSVModal,
  onNavigateToExecution,
}) => {
  const isCleanInitialState = mrpSummary.items.length === 0 && mrpSummary.totalGarmentsPlanned === 0;
  const activeOPs = productionOrders.filter((o) => o.status !== 'Terminada' && o.status !== 'Cancelada');
  const totalUnitsInFloor = activeOPs.reduce((sum, o) => sum + o.unitsTarget, 0);
  const totalUnitsFinishedInFloor = activeOPs.reduce((sum, o) => sum + (o.unitsFinished || 0), 0);
  const floorProgress = totalUnitsInFloor > 0 ? Math.round((totalUnitsFinishedInFloor / totalUnitsInFloor) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Onboarding Welcome Banner for Fresh Production Setup */}
      {isCleanInitialState && (
        <div className="bg-white border border-[#D4E3D7] bg-linear-to-r from-white via-[#FCFBF9] to-[#EBF2EC]/40 p-6 sm:p-8 rounded-2xl shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#3A5A40] text-white flex items-center justify-center shadow-xs shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-[#1C211D]">
                    ¡Bienvenido a TEXORA! Inteligencia para la producción textil
                  </h3>
                  <span className="px-2 py-0.5 bg-[#EBF2EC] text-[#3A5A40] text-[10px] font-bold rounded-full border border-[#D4E3D7]">
                    Planifica • Compra • Produce • Controla
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#5F6B61] max-w-2xl leading-relaxed">
                  Los datos de prueba han sido eliminados. Puede comenzar registrando sus referencias de prendas con fichas técnicas (BOM), su maestro de inventario de materias primas o importando sus catálogos en lote mediante archivos CSV de Excel.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-[#E6E1D8]">
            {onOpenNewGarment && (
              <button
                onClick={onOpenNewGarment}
                className="px-4 py-2 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                id="btn-onboarding-new-garment"
              >
                <Plus className="w-4 h-4" />
                Registrar Primera Prenda (BOM)
              </button>
            )}
            {onOpenNewMaterial && (
              <button
                onClick={onOpenNewMaterial}
                className="px-4 py-2 bg-white border border-[#3A5A40] text-[#3A5A40] hover:bg-[#EBF2EC] rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                id="btn-onboarding-new-material"
              >
                <Package className="w-4 h-4" />
                Registrar Materia Prima
              </button>
            )}
            {onOpenCSVModal && (
              <button
                onClick={onOpenCSVModal}
                className="px-4 py-2 bg-white border border-[#D5CEC2] hover:bg-[#FAF8F5] text-[#1C211D] rounded-xl text-xs font-semibold shadow-2xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                id="btn-onboarding-import-csv"
              >
                <Upload className="w-4 h-4 text-[#5F6B61]" />
                Importar Plantillas CSV
              </button>
            )}
          </div>
        </div>
      )}

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
            <div className="text-[10px] text-[#5F6B61] font-bold uppercase tracking-wider mb-1">
              <TechTermTooltip termKey="mrp">Demanda del Ciclo</TechTermTooltip>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#EBF2EC] text-[#3A5A40] flex items-center justify-center">
              <Shirt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#1C211D] mt-1">
            {mrpSummary.totalGarmentsPlanned.toLocaleString()} <span className="text-sm font-normal text-[#8F9990]">prendas</span>
          </p>
          <div className="mt-3 h-1.5 w-full bg-[#F2EEE6] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#3A5A40] rounded-full transition-all"
              style={{ width: mrpSummary.totalGarmentsPlanned > 0 ? '100%' : '0%' }}
            />
          </div>
          <p className="text-[10px] text-[#5F6B61] mt-2 font-medium">Horizonte: {cycleConfig.durationMonths} meses ({cycleConfig.name})</p>
        </div>

        {/* Card 2: Total Materials Budget */}
        <div className="bg-white p-5 rounded-xl border border-[#E6E1D8] shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-[10px] text-[#5F6B61] font-bold uppercase tracking-wider mb-1">
              <TechTermTooltip termKey="bom">Presupuesto Materia Prima</TechTermTooltip>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#EBF2EC] text-[#3A5A40] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#1C211D] mt-1">
            {formatCOP(mrpSummary.totalInvestmentUSD, false)}
            <span className="text-xs font-semibold text-[#5F6B61] ml-1">COP</span>
          </p>
          <p className="text-[10px] text-[#3A5A40] mt-2 font-medium flex items-center gap-1">
            {mrpSummary.items.length} insumos totales en MRP
          </p>
        </div>

        {/* Card 3: Deficit vs Critical Count */}
        <div className="bg-white p-5 rounded-xl border border-[#E6E1D8] shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-[10px] text-[#5F6B61] font-bold uppercase tracking-wider mb-1">
              <TechTermTooltip termKey="requerimientoNeto">Insumos Críticos / Déficit</TechTermTooltip>
            </div>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              mrpSummary.criticalItemsCount > 0 ? 'bg-[#FDF2F0] text-[#B33927]' : 'bg-[#EBF2EC] text-[#3A5A40]'
            }`}>
              {mrpSummary.criticalItemsCount > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            </div>
          </div>
          <p className="text-2xl font-bold text-[#1C211D] mt-1">
            {mrpSummary.criticalItemsCount} <span className="text-sm font-normal text-[#8F9990]">críticos</span>
          </p>
          <p className="text-[10px] text-[#5F6B61] mt-2">
            {mrpSummary.warningItemsCount} en alerta preventiva
          </p>
        </div>

        {/* Card 4: Orders in Pipeline */}
        <div className="bg-white p-5 rounded-xl border border-[#E6E1D8] shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-[10px] text-[#5F6B61] font-bold uppercase tracking-wider mb-1">
              <TechTermTooltip termKey="cobertura">Insumos Abastecidos</TechTermTooltip>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#EBF2EC] text-[#3A5A40] flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#1C211D] mt-1">
            {mrpSummary.okItemsCount} <span className="text-sm font-normal text-[#8F9990]">óptimos</span>
          </p>
          <p className="text-[10px] text-[#5F6B61] mt-2">
            Stock y tránsitos cubren el ciclo
          </p>
        </div>
      </div>

      {/* Real-time Shopfloor Execution & Time-Series Live Pulse Banner */}
      <div className="bg-linear-to-r from-[#1C211D] via-[#2A342C] to-[#1C211D] text-white p-5 sm:p-6 rounded-2xl shadow-md border border-[#3A4A3E] flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
            <Factory className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
              </span>
              <h4 className="text-sm sm:text-base font-bold tracking-tight text-white">
                MES en Planta & Analítica Temporal en Tiempo Real
              </h4>
              <span className="px-2 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 text-[10px] font-bold rounded-full">
                {activeOPs.length} OPs Activas en Taller
              </span>
            </div>
            <p className="text-xs text-stone-300 max-w-2xl leading-relaxed">
              Monitoreo continuo de avance por etapa (Corte, Confección, Calidad), auditoría de merma y desperdicio vs BOM teórico, proyección de ritmo de quemado de tela y detección proactiva de cuellos de botella.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end shrink-0 border-t md:border-t-0 border-stone-700 pt-3 md:pt-0">
          <div className="text-right">
            <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">Unidades en Planta</p>
            <p className="text-sm sm:text-base font-bold text-emerald-300">
              {totalUnitsFinishedInFloor.toLocaleString()} / {totalUnitsInFloor.toLocaleString()} <span className="text-xs font-normal text-stone-400">({floorProgress}%)</span>
            </p>
          </div>

          {onNavigateToExecution && (
            <button
              onClick={onNavigateToExecution}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              id="btn-goto-execution-dashboard"
            >
              <Activity className="w-3.5 h-3.5" />
              Abrir MES
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Category Cost Distribution */}
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

          {mrpSummary.categoryCostBreakdown.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#8F9990] space-y-1">
              <Package className="w-8 h-8 mx-auto text-[#D5CEC2]" />
              <p>Sin insumos calculados aún en el MRP.</p>
            </div>
          ) : (
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
          )}
        </div>

        {/* Right: AI Intelligence Quick Advisor */}
        <div className="bg-white p-6 rounded-xl border border-[#E6E1D8] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2 py-0.5 bg-[#EBF2EC] text-[#3A5A40] text-[10px] font-bold rounded-full uppercase tracking-wider border border-[#D4E3D7] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#3A5A40]" />
                Inteligencia Textil
              </span>
              <span className="text-[10px] text-[#8F9990] font-medium">Gemini AI</span>
            </div>
            <h4 className="text-sm font-bold text-[#1C211D] mb-2">
              Auditoría de Cadena de Suministro
            </h4>
            <p className="text-xs text-[#5F6B61] leading-relaxed">
              {isCleanInitialState
                ? 'El motor de inteligencia artificial de TextilIQ analizará sus tiempos de entrega, holguras de stock de seguridad y cuellos de botella una vez ingrese sus referencias.'
                : 'Auditoría automática de tiempos de entrega de proveedores, riesgos de abastecimiento de tejidos y optimización de lotes mínimos de compra (MOQ).'}
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-[#E6E1D8] flex items-center justify-between">
            <div className="text-[11px] text-[#5F6B61]">
              Estado: <span className="text-[#3A5A40] font-semibold">{isCleanInitialState ? 'Esperando Datos' : 'Listo'}</span>
            </div>
            <button
              onClick={onOpenAIAdvisor}
              className="px-3.5 py-1.5 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
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
