import React, { useState, useMemo } from 'react';
import {
  Factory,
  Layers,
  Scissors,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingDown,
  TrendingUp,
  Activity,
  Plus,
  Play,
  Filter,
  Search,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Calendar,
  AlertCircle,
  Truck,
  ShieldCheck,
  Zap,
  DollarSign,
  ArrowUpRight,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ProductionOrder,
  ProductionOrderStatus,
  Garment,
  RawMaterial,
  PurchaseOrder,
  ProductionCycleConfig,
  MaterialScrapLog,
} from '../types';
import {
  calculateExecutionDashboardMetrics,
  detectLiveBottlenecks,
  generateTimeSeriesProjection,
  calculateSupplierPerformance,
} from '../services/productionExecutionEngine';

interface ProductionExecutionViewProps {
  productionOrders: ProductionOrder[];
  garments: Garment[];
  rawMaterials: RawMaterial[];
  purchaseOrders: PurchaseOrder[];
  cycleConfig: ProductionCycleConfig;
  onOpenNewOrderModal: () => void;
  onOpenRecordStageModal: (orderId?: string) => void;
  onUpdateOrderStatus: (orderId: string, newStatus: ProductionOrderStatus) => void;
  canManageOrders: boolean;
}

export const ProductionExecutionView: React.FC<ProductionExecutionViewProps> = ({
  productionOrders,
  garments,
  rawMaterials,
  purchaseOrders,
  cycleConfig,
  onOpenNewOrderModal,
  onOpenRecordStageModal,
  onUpdateOrderStatus,
  canManageOrders,
}) => {
  // Subtab Navigation
  const [activeSubTab, setActiveSubTab] = useState<
    'orders' | 'scrap_audit' | 'time_series' | 'suppliers' | 'alerts'
  >('orders');

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(
    productionOrders.length > 0 ? productionOrders[0].id : null
  );

  // Time Series Horizon
  const [horizonDays, setHorizonDays] = useState<number>(60);

  // Compute Metrics & Time-Series Analytics
  const metrics = useMemo(
    () => calculateExecutionDashboardMetrics(productionOrders, rawMaterials, purchaseOrders),
    [productionOrders, rawMaterials, purchaseOrders]
  );

  const bottlenecks = useMemo(
    () => detectLiveBottlenecks(productionOrders, rawMaterials, purchaseOrders),
    [productionOrders, rawMaterials, purchaseOrders]
  );

  const timeSeriesPoints = useMemo(
    () => generateTimeSeriesProjection(garments, rawMaterials, productionOrders, cycleConfig, horizonDays),
    [garments, rawMaterials, productionOrders, cycleConfig, horizonDays]
  );

  const supplierMetrics = useMemo(
    () => calculateSupplierPerformance(purchaseOrders, rawMaterials),
    [purchaseOrders, rawMaterials]
  );

  // Flatten all scrap logs
  const allScrapLogs = useMemo(
    () => productionOrders.flatMap((o) => o.scrapLogs || []),
    [productionOrders]
  );

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return productionOrders.filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.garmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.batchLotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.assignedPlant.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [productionOrders, searchTerm, statusFilter]);

  const getStatusBadge = (status: ProductionOrderStatus) => {
    switch (status) {
      case 'Programada':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'En Corte':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'En Confección':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'En Terminación':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Control Calidad':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Completada':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Detenida':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-stone-50 text-stone-700 border-stone-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Live Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E6E1D8] shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
            </span>
            <span className="text-[11px] font-bold tracking-wider text-emerald-700 uppercase">
              Motor de Ejecución en Tiempo Real (MES & Time-Series)
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#1C211D]">
            Ejecución en Planta & Analítica Temporal
          </h2>
          <p className="text-xs text-[#5F6B61]">
            Control de piso, trazabilidad de lotes, auditoría de mermas reales y curvas de proyección en el tiempo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManageOrders && (
            <>
              <button
                onClick={() => onOpenRecordStageModal()}
                disabled={productionOrders.length === 0}
                className="px-3.5 py-2 bg-[#FAF8F5] hover:bg-[#F2EEE6] text-[#1C211D] border border-[#D5CEC2] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Activity className="w-4 h-4 text-[#3A5A40]" />
                Registrar Avance / Merma
              </button>

              <button
                onClick={onOpenNewOrderModal}
                disabled={garments.length === 0}
                className="px-4 py-2 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Lanzar Orden (OP)
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Live KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Rendimiento / Yield */}
        <div className="bg-white p-4 rounded-xl border border-[#E6E1D8] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#5F6B61]">
            <span className="text-[11px] font-medium">Rendimiento Operativo (Yield)</span>
            <ShieldCheck className="w-4 h-4 text-[#3A5A40]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#1C211D]">
            {metrics.overallYieldPercent.toFixed(1)}%
          </div>
          <div className="text-[11px] text-[#5F6B61]">
            {metrics.totalUnitsCompleted} u terminadas de 1ra calidad
          </div>
        </div>

        {/* KPI 2: Merma Real vs BOM */}
        <div className="bg-white p-4 rounded-xl border border-[#E6E1D8] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#5F6B61]">
            <span className="text-[11px] font-medium">Merma Real en Corte</span>
            <Scissors className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#1C211D] flex items-center gap-1.5">
            {metrics.averageActualScrapPercent.toFixed(1)}%
            <span className="text-[10px] text-[#5F6B61] font-normal">
              (BOM: {metrics.theoreticalScrapPercent.toFixed(1)}%)
            </span>
          </div>
          <div className="text-[11px] text-[#5F6B61]">
            {metrics.scrapCostVarianceCOP > 0 ? (
              <span className="text-rose-600 font-semibold">
                +${metrics.scrapCostVarianceCOP.toLocaleString('es-CO')} COP sobrecosto
              </span>
            ) : (
              <span className="text-emerald-700 font-semibold">Consumo dentro de tolerancia</span>
            )}
          </div>
        </div>

        {/* KPI 3: Desempeño OTIF Proveedores */}
        <div className="bg-white p-4 rounded-xl border border-[#E6E1D8] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#5F6B61]">
            <span className="text-[11px] font-medium">Cumplimiento Proveedores (OTIF)</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#1C211D]">
            {metrics.overallOTIFPercent.toFixed(0)}%
          </div>
          <div className="text-[11px] text-[#5F6B61]">
            Puntualidad en despacho de insumos
          </div>
        </div>

        {/* KPI 4: Cuellos de Botella Activos */}
        <div className="bg-white p-4 rounded-xl border border-[#E6E1D8] shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[#5F6B61]">
            <span className="text-[11px] font-medium">Riesgos / Cuellos de Botella</span>
            <AlertTriangle
              className={`w-4 h-4 ${
                metrics.criticalBottlenecksCount > 0 ? 'text-rose-600 animate-pulse' : 'text-emerald-600'
              }`}
            />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#1C211D]">
            {metrics.criticalBottlenecksCount} Críticos
          </div>
          <div className="text-[11px] text-[#5F6B61]">
            {bottlenecks.length} alertas detectadas en vivo
          </div>
        </div>
      </div>

      {/* 3. Sub-Navigation Bar */}
      <div className="flex items-center gap-1 border-b border-[#E6E1D8] pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('orders')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'orders'
              ? 'bg-[#3A5A40] text-white shadow-xs'
              : 'text-[#5F6B61] hover:text-[#1C211D] hover:bg-[#FAF8F5]'
          }`}
        >
          <Factory className="w-3.5 h-3.5" />
          Órdenes de Producción ({productionOrders.length})
        </button>

        <button
          onClick={() => setActiveSubTab('scrap_audit')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'scrap_audit'
              ? 'bg-[#3A5A40] text-white shadow-xs'
              : 'text-[#5F6B61] hover:text-[#1C211D] hover:bg-[#FAF8F5]'
          }`}
        >
          <Scissors className="w-3.5 h-3.5" />
          Auditoría de Mermas Reales ({allScrapLogs.length})
        </button>

        <button
          onClick={() => setActiveSubTab('time_series')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'time_series'
              ? 'bg-[#3A5A40] text-white shadow-xs'
              : 'text-[#5F6B61] hover:text-[#1C211D] hover:bg-[#FAF8F5]'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Curvas Temporales & Agotamiento
        </button>

        <button
          onClick={() => setActiveSubTab('suppliers')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'suppliers'
              ? 'bg-[#3A5A40] text-white shadow-xs'
              : 'text-[#5F6B61] hover:text-[#1C211D] hover:bg-[#FAF8F5]'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          Desempeño de Proveedores (OTIF)
        </button>

        <button
          onClick={() => setActiveSubTab('alerts')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'alerts'
              ? 'bg-[#3A5A40] text-white shadow-xs'
              : 'text-[#5F6B61] hover:text-[#1C211D] hover:bg-[#FAF8F5]'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Alertas & Cuellos de Botella ({bottlenecks.length})
        </button>
      </div>

      {/* 4. Tab 1: Órdenes de Producción (MES & Shopfloor) */}
      {activeSubTab === 'orders' && (
        <div className="space-y-4">
          {/* Controls: Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#5F6B61] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por OP, modelo, lote o taller..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#D5CEC2] rounded-xl text-xs text-[#1C211D] placeholder-[#5F6B61] focus:outline-hidden focus:border-[#3A5A40]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-[#5F6B61]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-[#D5CEC2] rounded-xl px-3 py-2 text-xs font-semibold text-[#1C211D] focus:outline-hidden focus:border-[#3A5A40]"
              >
                <option value="ALL">Todos los Estados ({productionOrders.length})</option>
                <option value="Programada">Programada</option>
                <option value="En Corte">En Corte</option>
                <option value="En Confección">En Confección</option>
                <option value="En Terminación">En Terminación</option>
                <option value="Control Calidad">Control Calidad</option>
                <option value="Completada">Completada</option>
              </select>
            </div>
          </div>

          {/* List of Orders */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E6E1D8] p-12 text-center space-y-3">
              <Factory className="w-10 h-10 text-[#D5CEC2] mx-auto" />
              <div className="text-sm font-bold text-[#1C211D]">
                No hay órdenes de producción activas
              </div>
              <p className="text-xs text-[#5F6B61] max-w-md mx-auto">
                Lance su primera orden de producción para comenzar el seguimiento en tiempo real de corte, costura y mermas.
              </p>
              {canManageOrders && garments.length > 0 && (
                <button
                  onClick={onOpenNewOrderModal}
                  className="px-4 py-2 bg-[#3A5A40] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Lanzar Primera OP
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                const progressPercent =
                  order.unitsTarget > 0
                    ? Math.min(100, Math.round((order.unitsFinished / order.unitsTarget) * 100))
                    : 0;

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-xl border border-[#E6E1D8] shadow-xs overflow-hidden transition-all hover:border-[#D5CEC2]"
                  >
                    {/* Main Row */}
                    <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <button
                          onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                          className="p-1 rounded-lg hover:bg-[#FAF8F5] text-[#5F6B61] cursor-pointer mt-0.5"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#1C211D]">
                              {order.orderNumber}
                            </span>
                            <span className="text-xs font-bold text-[#1C211D]">
                              {order.garmentName}
                            </span>
                            <span className="font-mono text-[11px] px-2 py-0.5 bg-[#FAF8F5] border border-[#E6E1D8] rounded-md text-[#5F6B61]">
                              {order.batchLotNumber}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getStatusBadge(
                                order.status
                              )}`}
                            >
                              {order.status}
                            </span>
                            {order.priority === 'Urgente' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700">
                                Urgente
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-[#5F6B61] flex flex-wrap items-center gap-3">
                            <span>Taller: <strong>{order.assignedPlant}</strong></span>
                            <span>•</span>
                            <span>Inicio: {order.startDate}</span>
                            <span>•</span>
                            <span>Meta: {order.targetCompletionDate}</span>
                          </div>
                        </div>
                      </div>

                      {/* Progress Metrics & Action Buttons */}
                      <div className="flex items-center gap-4 pl-8 lg:pl-0">
                        <div className="w-40 sm:w-52 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[#5F6B61] font-medium">Avance</span>
                            <span className="font-bold text-[#1C211D]">
                              {order.unitsFinished} / {order.unitsTarget} u ({progressPercent}%)
                            </span>
                          </div>
                          <div className="w-full bg-[#F2EEE6] rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-[#3A5A40] h-2 rounded-full transition-all duration-500"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>

                        {canManageOrders && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => onOpenRecordStageModal(order.id)}
                              className="px-3 py-1.5 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Activity className="w-3.5 h-3.5" />
                              Reportar
                            </button>

                            <select
                              value={order.status}
                              onChange={(e) =>
                                onUpdateOrderStatus(order.id, e.target.value as ProductionOrderStatus)
                              }
                              className="bg-[#FAF8F5] border border-[#D5CEC2] rounded-lg px-2 py-1.5 text-[11px] font-semibold text-[#1C211D] focus:outline-hidden"
                            >
                              <option value="Programada">Programada</option>
                              <option value="En Corte">En Corte</option>
                              <option value="En Confección">En Confección</option>
                              <option value="En Terminación">En Terminación</option>
                              <option value="Control Calidad">Control Calidad</option>
                              <option value="Completada">Completada</option>
                              <option value="Detenida">Detenida</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expanded Detail Panel */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 bg-[#FAF8F5]/60 border-t border-[#E6E1D8] space-y-4">
                        {/* Status Progression Bar */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center text-xs">
                          <div className="p-2.5 bg-white rounded-lg border border-[#E6E1D8]">
                            <div className="text-[10px] text-[#5F6B61]">1. Corte</div>
                            <div className="font-bold text-[#1C211D]">{order.unitsCut} u cortadas</div>
                          </div>
                          <div className="p-2.5 bg-white rounded-lg border border-[#E6E1D8]">
                            <div className="text-[10px] text-[#5F6B61]">2. Confección</div>
                            <div className="font-bold text-[#1C211D]">{order.unitsSewn} u costuradas</div>
                          </div>
                          <div className="p-2.5 bg-white rounded-lg border border-[#E6E1D8]">
                            <div className="text-[10px] text-[#5F6B61]">3. Terminadas (1ra)</div>
                            <div className="font-bold text-emerald-700">{order.unitsFinished} u listas</div>
                          </div>
                          <div className="p-2.5 bg-white rounded-lg border border-[#E6E1D8]">
                            <div className="text-[10px] text-[#5F6B61]">4. Defectos (2das)</div>
                            <div className="font-bold text-rose-600">{order.unitsDefective || 0} u segundas</div>
                          </div>
                        </div>

                        {/* Stage Event Logs Timeline */}
                        <div className="space-y-2">
                          <div className="text-xs font-bold text-[#1C211D] flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#3A5A40]" />
                            Trazabilidad y Eventos Registrados en Vivo
                          </div>

                          {order.stageLogs && order.stageLogs.length > 0 ? (
                            <div className="space-y-1.5">
                              {order.stageLogs.map((log) => (
                                <div
                                  key={log.id}
                                  className="p-2.5 bg-white rounded-lg border border-[#E6E1D8] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                >
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-[#1C211D]">{log.stage}</span>
                                      <span className="text-[#5F6B61]">({log.unitsProcessed} u)</span>
                                      <span className="text-[10px] px-1.5 py-0.5 bg-[#F2EEE6] rounded text-[#1C211D]">
                                        {log.operatorOrWorkshop}
                                      </span>
                                    </div>
                                    {log.notes && (
                                      <p className="text-[11px] text-[#5F6B61]">{log.notes}</p>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-[#5F6B61] font-mono whitespace-nowrap">
                                    {new Date(log.timestamp).toLocaleString('es-CO')}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-[#5F6B61] italic">
                              No hay eventos de etapa registrados aún.
                            </div>
                          )}
                        </div>

                        {/* Scrap Logs for this order */}
                        {order.scrapLogs && order.scrapLogs.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-xs font-bold text-[#1C211D] flex items-center gap-1.5">
                              <Scissors className="w-3.5 h-3.5 text-amber-600" />
                              Consumos Reales de Tela Registrados en este Lote
                            </div>
                            <div className="space-y-1.5">
                              {order.scrapLogs.map((scrap) => (
                                <div
                                  key={scrap.id}
                                  className="p-2.5 bg-white rounded-lg border border-[#E6E1D8] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                >
                                  <div>
                                    <div className="font-bold text-[#1C211D]">
                                      {scrap.rawMaterialName} — {scrap.actualConsumption} {scrap.unit} consumidos (Teórico: {scrap.theoreticalConsumption} {scrap.unit})
                                    </div>
                                    <div className="text-[11px] text-[#5F6B61]">
                                      Merma Real: <strong>{scrap.actualScrapPercent.toFixed(1)}%</strong> vs Teórica: <strong>{scrap.standardScrapPercent.toFixed(1)}%</strong> • Causa: {scrap.reason}
                                    </div>
                                  </div>
                                  <div
                                    className={`font-bold text-xs ${
                                      scrap.varianceCostCOP > 0 ? 'text-rose-600' : 'text-emerald-700'
                                    }`}
                                  >
                                    {scrap.varianceCostCOP > 0 ? '+' : ''}${scrap.varianceCostCOP.toLocaleString('es-CO')} COP
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. Tab 2: Auditoría de Mermas Reales */}
      {activeSubTab === 'scrap_audit' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-[#E6E1D8] shadow-xs space-y-2">
            <h3 className="text-sm sm:text-base font-bold text-[#1C211D] flex items-center gap-2">
              <Scissors className="w-4 h-4 text-[#3A5A40]" />
              Auditoría Comparativa: Consumo Teórico (BOM) vs Consumo Real en Mesa de Corte
            </h3>
            <p className="text-xs text-[#5F6B61]">
              Monitoreo continuo del desperdicio de tela, desviaciones de tizada y sobrecostos directos por lote.
            </p>
          </div>

          {allScrapLogs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E6E1D8] p-12 text-center space-y-3">
              <Scissors className="w-10 h-10 text-[#D5CEC2] mx-auto" />
              <div className="text-sm font-bold text-[#1C211D]">
                No hay registros de consumo real de corte
              </div>
              <p className="text-xs text-[#5F6B61] max-w-md mx-auto">
                Utilice el botón "Registrar Avance / Merma" para reportar los metros de tela consumidos en un lote y contrastarlos con la ficha técnica.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E6E1D8] overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E6E1D8] bg-[#FAF8F5] text-[11px] font-bold text-[#5F6B61] uppercase tracking-wider">
                    <th className="p-3.5">Lote / Fecha</th>
                    <th className="p-3.5">Material</th>
                    <th className="p-3.5 text-right">Teórico</th>
                    <th className="p-3.5 text-right">Real Medido</th>
                    <th className="p-3.5 text-center">Merma Real</th>
                    <th className="p-3.5 text-right">Desviación (COP)</th>
                    <th className="p-3.5">Causa Raíz</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EEE6] text-xs">
                  {allScrapLogs.map((scrap) => (
                    <tr key={scrap.id} className="hover:bg-[#FAF8F5]">
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-[#1C211D]">{scrap.lotNumber || 'N/A'}</div>
                        <div className="text-[10px] text-[#5F6B61]">
                          {new Date(scrap.recordedAt).toLocaleDateString('es-CO')}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-[#1C211D]">{scrap.rawMaterialName}</div>
                        <div className="text-[10px] text-[#5F6B61] font-mono">{scrap.rawMaterialSku}</div>
                      </td>
                      <td className="p-3.5 text-right font-mono text-[#5F6B61]">
                        {scrap.theoreticalConsumption} {scrap.unit}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-[#1C211D]">
                        {scrap.actualConsumption} {scrap.unit}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                            scrap.actualScrapPercent > scrap.standardScrapPercent + 1
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {scrap.actualScrapPercent.toFixed(1)}%
                        </span>
                      </td>
                      <td
                        className={`p-3.5 text-right font-bold ${
                          scrap.varianceCostCOP > 0 ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {scrap.varianceCostCOP > 0 ? '+' : ''}${scrap.varianceCostCOP.toLocaleString('es-CO')}
                      </td>
                      <td className="p-3.5 text-[#5F6B61] max-w-xs truncate">
                        {scrap.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 6. Tab 3: Curvas Temporales & Proyección Time-Series */}
      {activeSubTab === 'time_series' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-[#E6E1D8] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-[#1C211D] flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#3A5A40]" />
                Proyección Dinámica en el Tiempo (Time-Series Simulation)
              </h3>
              <p className="text-xs text-[#5F6B61]">
                Curva de Demanda Acumulada vs Capacidad de Producción y Agotamiento Diario de Telas.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#5F6B61] font-semibold">Horizonte:</span>
              <select
                value={horizonDays}
                onChange={(e) => setHorizonDays(Number(e.target.value))}
                className="bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl px-3 py-1.5 font-bold text-[#1C211D]"
              >
                <option value={30}>30 Días</option>
                <option value={60}>60 Días</option>
                <option value={90}>90 Días</option>
              </select>
            </div>
          </div>

          {/* Time Series Data Visualization Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Simulation Trajectory */}
            <div className="bg-white p-5 rounded-xl border border-[#E6E1D8] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#1C211D] uppercase tracking-wider">
                  Ritmo Acumulado: Demanda vs Producción
                </h4>
                <span className="text-[11px] text-[#5F6B61]">Prendas Totales</span>
              </div>

              <div className="space-y-2 pt-2">
                {timeSeriesPoints.slice(0, 8).map((pt) => (
                  <div key={pt.dayIndex} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#1C211D]">{pt.dayLabel} ({pt.date})</span>
                      <span className="text-[#5F6B61]">
                        Meta: <strong>{pt.projectedDemandCum} u</strong> • Prod: <strong>{pt.actualProductionCum} u</strong>
                      </span>
                    </div>
                    <div className="w-full bg-[#F2EEE6] rounded-full h-2 flex overflow-hidden">
                      <div
                        className="bg-[#3A5A40] h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (pt.actualProductionCum / (pt.projectedDemandCum || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fabric Burn-down */}
            <div className="bg-white p-5 rounded-xl border border-[#E6E1D8] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#1C211D] uppercase tracking-wider">
                  Curva de Agotamiento de Tela (Burn-down)
                </h4>
                <span className="text-[11px] text-[#5F6B61]">Metros Proyectados</span>
              </div>

              <div className="space-y-2 pt-2">
                {timeSeriesPoints.slice(0, 8).map((pt) => (
                  <div key={pt.dayIndex} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-[#1C211D]">{pt.dayLabel}</span>
                      <span
                        className={`font-bold ${
                          pt.fabricStockProjected < 300 ? 'text-rose-600' : 'text-[#3A5A40]'
                        }`}
                      >
                        {pt.fabricStockProjected} m remanentes
                      </span>
                    </div>
                    <div className="w-full bg-[#F2EEE6] rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          pt.fabricStockProjected < 300 ? 'bg-rose-500' : 'bg-blue-600'
                        }`}
                        style={{
                          width: `${Math.max(5, Math.min(100, (pt.fabricStockProjected / 1200) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Tab 4: Desempeño de Proveedores */}
      {activeSubTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-[#E6E1D8] shadow-xs space-y-2">
            <h3 className="text-sm sm:text-base font-bold text-[#1C211D] flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#3A5A40]" />
              Matriz de Confiabilidad y Desempeño de Proveedores (OTIF)
            </h3>
            <p className="text-xs text-[#5F6B61]">
              Puntualidad en Lead Times pactados vs reales, cumplimiento de cantidades y calidad de insumos entregados.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supplierMetrics.map((sup) => (
              <div
                key={sup.supplierName}
                className="bg-white p-5 rounded-xl border border-[#E6E1D8] shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#1C211D]">{sup.supplierName}</h4>
                    <span className="text-[10px] text-[#5F6B61]">{sup.category}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      sup.status === 'Excelente'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : sup.status === 'Aceptable'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {sup.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs pt-1">
                  <div className="p-2 bg-[#FAF8F5] rounded-lg border border-[#E6E1D8]">
                    <div className="text-[10px] text-[#5F6B61]">Score OTIF</div>
                    <div className="font-bold text-[#1C211D]">{sup.otifScorePercent}%</div>
                  </div>
                  <div className="p-2 bg-[#FAF8F5] rounded-lg border border-[#E6E1D8]">
                    <div className="text-[10px] text-[#5F6B61]">Lead Time Real</div>
                    <div className="font-bold text-[#1C211D]">{sup.averageLeadTimeDays} días</div>
                  </div>
                </div>

                <div className="text-[11px] text-[#5F6B61] space-y-1">
                  <div className="flex justify-between">
                    <span>Lead Time Prometido:</span>
                    <span className="font-semibold text-[#1C211D]">{sup.promisedLeadTimeDays} días</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Desviación Promedio:</span>
                    <span
                      className={`font-semibold ${
                        sup.leadTimeVarianceDays > 0 ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {sup.leadTimeVarianceDays > 0 ? `+${sup.leadTimeVarianceDays}` : sup.leadTimeVarianceDays} días
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. Tab 5: Alertas y Cuellos de Botella en Vivo */}
      {activeSubTab === 'alerts' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-[#E6E1D8] shadow-xs space-y-2">
            <h3 className="text-sm sm:text-base font-bold text-[#1C211D] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#3A5A40]" />
              Motor de Detección Automática de Cuellos de Botella
            </h3>
            <p className="text-xs text-[#5F6B61]">
              Detección anticipada de desabastecimiento, retrasos de proveedores y desviaciones críticas de calidad.
            </p>
          </div>

          <div className="space-y-3">
            {bottlenecks.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border transition-all ${
                  alert.severity === 'Crítico'
                    ? 'bg-rose-50/50 border-rose-200'
                    : alert.severity === 'Alerta'
                    ? 'bg-amber-50/50 border-amber-200'
                    : 'bg-[#FAF8F5] border-[#E6E1D8]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg mt-0.5 ${
                      alert.severity === 'Crítico'
                        ? 'bg-rose-100 text-rose-700'
                        : alert.severity === 'Alerta'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-[#EBF2EC] text-[#3A5A40]'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4" />
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1C211D]">{alert.title}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            alert.severity === 'Crítico'
                              ? 'bg-rose-100 text-rose-800'
                              : alert.severity === 'Alerta'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-white border border-[#E6E1D8] rounded text-[#5F6B61]">
                          Área: {alert.impactArea}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-[#5F6B61]">{alert.description}</p>

                    <div className="pt-2 text-xs">
                      <span className="font-bold text-[#1C211D]">Acción Recomendada: </span>
                      <span className="text-[#3A5A40] font-medium">{alert.recommendedAction}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
