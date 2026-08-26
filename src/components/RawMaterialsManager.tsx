import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Clock,
  DollarSign,
  Layers,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Info,
  CheckCircle2,
  XCircle,
  Eye,
  Scissors,
  Check,
  Tag,
  ShieldCheck,
  ArrowRightLeft,
  Truck,
  TrendingDown,
  History,
  AlertOctagon,
  ShieldAlert,
} from 'lucide-react';
import { RawMaterial, Garment, MaterialCategory } from '../types';
import { formatCOP } from '../utils/formatters';
import { MaterialModal } from './MaterialModal';
import { InventoryMovementModal, StockMovementRecord } from './InventoryMovementModal';
import { TechTermTooltip } from './TechTermTooltip';

interface RawMaterialsManagerProps {
  materials: RawMaterial[];
  garments: Garment[];
  onAddMaterial: (material: RawMaterial) => void;
  onUpdateMaterial: (material: RawMaterial) => void;
  onToggleMaterialActive: (materialId: string) => void;
  onDeleteMaterial: (materialId: string) => void;
  onUpdateStock?: (materialId: string, currentStock: number, inTransit: number) => void;
  onOpenCSVModal?: () => void;
}

export const RawMaterialsManager: React.FC<RawMaterialsManagerProps> = ({
  materials,
  garments,
  onAddMaterial,
  onUpdateMaterial,
  onToggleMaterialActive,
  onDeleteMaterial,
  onUpdateStock,
  onOpenCSVModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [stockLevelFilter, setStockLevelFilter] = useState<
    'ALL' | 'CRITICAL' | 'SAFETY_ALERT' | 'IN_TRANSIT' | 'OPTIMAL'
  >('ALL');

  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [movementMaterial, setMovementMaterial] = useState<RawMaterial | null>(null);
  const [selectedMaterialForUsage, setSelectedMaterialForUsage] = useState<RawMaterial | null>(null);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);

  // In-memory movement audit logs
  const [movementLogs, setMovementLogs] = useState<StockMovementRecord[]>(() => {
    const saved = localStorage.getItem('textiliq_stock_movements');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  // Calculate daily consumption rate from BOM and sales to determine theoretical safety stock in units
  const safetyStockMap = useMemo(() => {
    const dailyMap: Record<string, number> = {};
    garments.forEach((g) => {
      const activeMonthly = g.targetSales > 0 ? g.targetSales / 3 : g.historicalMonthlyAverage || 500;
      const dailyGarments = activeMonthly / 30;

      g.bom.forEach((b) => {
        const matKey = b.rawMaterialId.toUpperCase();
        const matWasteFactor = 1 + (b.wastePercent || 5) / 100;
        const dailyReq = dailyGarments * b.quantityPerGarment * matWasteFactor;
        dailyMap[matKey] = (dailyMap[matKey] || 0) + dailyReq;
      });
    });
    return dailyMap;
  }, [garments]);

  // Category counts
  const categoriesList: { key: string; label: string; count: number }[] = useMemo(() => {
    const counts: Record<string, number> = {};
    materials.forEach((m) => {
      counts[m.category] = (counts[m.category] || 0) + 1;
    });

    return [
      { key: 'ALL', label: 'Todas las Categorías', count: materials.length },
      { key: 'Tela', label: 'Telas / Tejidos', count: counts['Tela'] || 0 },
      { key: 'Hilo', label: 'Hilos / Hilados', count: counts['Hilo'] || 0 },
      { key: 'Empaque / Etiqueta', label: 'Empaque / Etiquetas', count: counts['Empaque / Etiqueta'] || 0 },
      { key: 'Avío / Fornitura', label: 'Avíos / Fornituras', count: counts['Avío / Fornitura'] || 0 },
      { key: 'Botón / Broche', label: 'Botones / Broches', count: counts['Botón / Broche'] || 0 },
      { key: 'Cremallera', label: 'Cremalleras / Cierres', count: counts['Cremallera'] || 0 },
      { key: 'Entretela', label: 'Entretelas', count: counts['Entretela'] || 0 },
    ];
  }, [materials]);

  // Helper for computing minimum safety stock units
  const getSafetyStockQty = (m: RawMaterial): number => {
    const daily = safetyStockMap[m.id.toUpperCase()] || safetyStockMap[m.sku.toUpperCase()] || 0;
    if (daily > 0) {
      return Math.ceil(daily * (m.safetyStockDays || 15));
    }
    // Fallback: standard fraction of MOQ or 10% of standard batch
    return Math.max(10, Math.round((m.minOrderQuantity || 100) * 0.3));
  };

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const isAct = m.isActive !== false;
      if (statusFilter === 'ACTIVE' && !isAct) return false;
      if (statusFilter === 'INACTIVE' && isAct) return false;

      if (categoryFilter !== 'ALL' && m.category !== categoryFilter) return false;

      const safetyQty = getSafetyStockQty(m);
      if (stockLevelFilter === 'CRITICAL' && m.currentStock > 0) return false;
      if (stockLevelFilter === 'SAFETY_ALERT' && m.currentStock >= safetyQty) return false;
      if (stockLevelFilter === 'IN_TRANSIT' && (!m.inTransitStock || m.inTransitStock <= 0)) return false;
      if (stockLevelFilter === 'OPTIMAL' && m.currentStock < safetyQty) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchSku = m.sku.toLowerCase().includes(query);
        const matchName = m.name.toLowerCase().includes(query);
        const matchSup = m.supplierName?.toLowerCase().includes(query);
        const matchColor = m.color?.toLowerCase().includes(query);
        if (!matchSku && !matchName && !matchSup && !matchColor) return false;
      }

      return true;
    });
  }, [materials, searchTerm, categoryFilter, statusFilter, stockLevelFilter, safetyStockMap]);

  // Comprehensive Statistics
  const totalValuation = useMemo(() => {
    return materials.reduce((acc, m) => acc + m.currentStock * m.unitCost, 0);
  }, [materials]);

  const totalInTransitValuation = useMemo(() => {
    return materials.reduce((acc, m) => acc + (m.inTransitStock || 0) * m.unitCost, 0);
  }, [materials]);

  const safetyAlertCount = useMemo(() => {
    return materials.filter((m) => m.isActive !== false && m.currentStock < getSafetyStockQty(m)).length;
  }, [materials, safetyStockMap]);

  const inTransitCount = useMemo(() => {
    return materials.filter((m) => (m.inTransitStock || 0) > 0).length;
  }, [materials]);

  const activeCount = useMemo(() => {
    return materials.filter((m) => m.isActive !== false).length;
  }, [materials]);

  const inactiveCount = materials.length - activeCount;

  // Garment usage map
  const getGarmentsUsingMaterial = (materialId: string) => {
    const mat = materials.find((m) => m.id === materialId);
    return garments.filter((g) =>
      g.bom.some(
        (b) =>
          b.rawMaterialId.toLowerCase() === materialId.toLowerCase() ||
          b.rawMaterialId.toLowerCase() === mat?.sku.toLowerCase() ||
          b.rawMaterialName.toLowerCase() === mat?.name.toLowerCase()
      )
    );
  };

  const handleOpenCreate = () => {
    setEditingMaterial(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (mat: RawMaterial) => {
    setEditingMaterial(mat);
    setIsModalOpen(true);
  };

  const handleOpenMovement = (mat: RawMaterial) => {
    setMovementMaterial(mat);
  };

  const handleSave = (material: RawMaterial) => {
    if (editingMaterial) {
      onUpdateMaterial(material);
    } else {
      onAddMaterial(material);
    }
  };

  const handleApplyStockMovement = (
    materialId: string,
    newCurrentStock: number,
    newInTransitStock: number,
    movementLog: StockMovementRecord
  ) => {
    // 1. Update material state
    if (onUpdateStock) {
      onUpdateStock(materialId, newCurrentStock, newInTransitStock);
    } else {
      const targetMat = materials.find((m) => m.id === materialId);
      if (targetMat) {
        onUpdateMaterial({
          ...targetMat,
          currentStock: newCurrentStock,
          inTransitStock: newInTransitStock,
        });
      }
    }

    // 2. Record movement audit log
    setMovementLogs((prev) => {
      const updated = [movementLog, ...prev].slice(0, 100);
      localStorage.setItem('textiliq_stock_movements', JSON.stringify(updated));
      return updated;
    });
  };

  const exportCSV = () => {
    const headers = [
      'SKU',
      'Nombre',
      'Categoria',
      'Unidad',
      'Stock Actual Disponible',
      'En Transito',
      'Stock Total Proyectado',
      'Stock Seguridad Dias',
      'Stock Seguridad Unidades',
      'MOQ Lote Minimo',
      'Costo Unitario COP',
      'Proveedor',
      'Lead Time Dias',
      'Color',
      'Ancho Metros',
      'Gramaje GSM',
      'Estado',
    ];

    const rows = materials.map((m) => [
      `"${m.sku}"`,
      `"${m.name}"`,
      `"${m.category}"`,
      `"${m.unit}"`,
      m.currentStock,
      m.inTransitStock || 0,
      m.currentStock + (m.inTransitStock || 0),
      m.safetyStockDays || 15,
      getSafetyStockQty(m),
      m.minOrderQuantity,
      m.unitCost,
      `"${m.supplierName}"`,
      m.leadTimeDays,
      `"${m.color || ''}"`,
      m.widthMeters || '',
      m.weightGsm || '',
      m.isActive !== false ? 'Activo' : 'Desactivado',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Inventario_Materias_Primas_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Banner & KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Insumos */}
        <div className="bg-white p-4 rounded-xl border border-[#E6E1D8] shadow-2xs">
          <div className="flex items-center justify-between text-[#5F6B61] text-xs font-semibold mb-1">
            <span>Total Materias Primas</span>
            <Package className="w-4 h-4 text-[#3A5A40]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#1C211D]">
            {materials.length}
          </div>
          <div className="text-[11px] text-[#5F6B61] mt-0.5 flex items-center gap-1.5">
            <span className="text-emerald-700 font-bold">{activeCount} activos</span>
            {inactiveCount > 0 && <span className="text-stone-500">• {inactiveCount} inactivos</span>}
          </div>
        </div>

        {/* Card 2: Valoración Disponible */}
        <div className="bg-white p-4 rounded-xl border border-[#E6E1D8] shadow-2xs">
          <div className="flex items-center justify-between text-[#5F6B61] text-xs font-semibold mb-1">
            <span>Stock Disponible (Físico)</span>
            <DollarSign className="w-4 h-4 text-[#3A5A40]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#1C211D] truncate font-mono">
            {formatCOP(totalValuation, false)}
          </div>
          <div className="text-[11px] text-[#5F6B61] mt-0.5">
            Valoración real en bodega COP
          </div>
        </div>

        {/* Card 3: En Tránsito (Comprado pendiente) */}
        <div className="bg-white p-4 rounded-xl border border-[#E6E1D8] shadow-2xs">
          <div className="flex items-center justify-between text-[#5F6B61] text-xs font-semibold mb-1">
            <span>En Tránsito (Comprado)</span>
            <Truck className="w-4 h-4 text-[#3A5A40]" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#1C211D]">
            {inTransitCount}{' '}
            <span className="text-xs font-normal text-[#5F6B61]">insumos con OCs</span>
          </div>
          <div className="text-[11px] text-[#3A5A40] font-bold mt-0.5 font-mono">
            +{formatCOP(totalInTransitValuation, false)} por llegar
          </div>
        </div>

        {/* Card 4: Alertas de Stock de Seguridad */}
        <div
          className={`p-4 rounded-xl border shadow-2xs transition-all ${
            safetyAlertCount > 0
              ? 'bg-amber-50/70 border-amber-300'
              : 'bg-white border-[#E6E1D8]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold mb-1">
            <span className={safetyAlertCount > 0 ? 'text-amber-900' : 'text-[#5F6B61]'}>
              Riesgo Stock Seguridad
            </span>
            <ShieldAlert
              className={`w-4 h-4 ${safetyAlertCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}
            />
          </div>
          <div
            className={`text-xl sm:text-2xl font-bold ${
              safetyAlertCount > 0 ? 'text-amber-900' : 'text-emerald-800'
            }`}
          >
            {safetyAlertCount}{' '}
            <span className="text-xs font-normal">
              {safetyAlertCount === 1 ? 'insumo en riesgo' : 'insumos en riesgo'}
            </span>
          </div>
          <div className="text-[11px] text-[#5F6B61] mt-0.5">
            {safetyAlertCount > 0 ? 'Disponible < Cantidad Mínima' : 'Existencias sobre margen seguro'}
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-[#E6E1D8] shadow-xs overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-[#E6E1D8] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#FCFBF9]">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#3A5A40]" />
              <h3 className="text-base font-bold text-[#1C211D]">
                Gestión & Control de Inventario de Materias Primas
              </h3>
            </div>
            <p className="text-xs text-[#5F6B61] mt-0.5">
              Consulte existencias físicas en bodega, compras en tránsito, stock de seguridad, MOQ por proveedor y registre ajustes rápidos.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
              className={`px-3 py-2 border rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors ${
                showHistoryDrawer
                  ? 'bg-[#3A5A40] text-white border-[#3A5A40]'
                  : 'bg-white hover:bg-[#FAF8F5] text-[#1C211D] border-[#D5CEC2]'
              }`}
              title="Ver registro de movimientos de inventario"
            >
              <History className="w-4 h-4" />
              <span>Historial ({movementLogs.length})</span>
            </button>

            {onOpenCSVModal && (
              <button
                onClick={onOpenCSVModal}
                className="px-3 py-2 bg-white hover:bg-[#FAF8F5] text-[#1C211D] border border-[#D5CEC2] rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors"
                id="btn-materials-import-csv"
                title="Cargar, revisar y validar archivo CSV"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#3A5A40]" />
                <span>Importar CSV</span>
              </button>
            )}

            <button
              onClick={exportCSV}
              className="px-3 py-2 bg-white hover:bg-[#FAF8F5] text-[#1C211D] border border-[#D5CEC2] rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors"
              title="Descargar reporte completo en CSV"
            >
              <Download className="w-4 h-4 text-[#5F6B61]" />
              <span>Exportar</span>
            </button>

            <button
              onClick={handleOpenCreate}
              className="px-3.5 py-2 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              id="btn-add-raw-material-action"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Insumo</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 bg-[#FAF8F5] border-b border-[#E6E1D8] flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#8F9990] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por SKU, nombre, proveedor o color..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-[#D5CEC2] rounded-lg text-xs text-[#1C211D] placeholder-[#8F9990] focus:ring-2 focus:ring-[#3A5A40]/20 focus:border-[#3A5A40]"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Stock Level Alert Filter */}
            <select
              value={stockLevelFilter}
              onChange={(e) => setStockLevelFilter(e.target.value as any)}
              className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition-all ${
                stockLevelFilter !== 'ALL'
                  ? 'bg-amber-50 border-amber-400 text-amber-950'
                  : 'bg-white border-[#D5CEC2] text-[#1C211D]'
              }`}
            >
              <option value="ALL">Todos los Niveles de Stock</option>
              <option value="SAFETY_ALERT">⚠️ Bajo Stock de Seguridad</option>
              <option value="CRITICAL">🚨 Stock Crítico (Cero Existencias)</option>
              <option value="IN_TRANSIT">🚚 Con Pedidos En Tránsito</option>
              <option value="OPTIMAL">✓ Nivel Óptimo Seguro</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-[#D5CEC2] rounded-lg text-xs font-medium text-[#1C211D] focus:ring-1 focus:ring-[#3A5A40]"
            >
              {categoriesList.map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.label} ({cat.count})
                </option>
              ))}
            </select>

            {/* Active Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-white border border-[#D5CEC2] rounded-lg text-xs font-medium text-[#1C211D] focus:ring-1 focus:ring-[#3A5A40]"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="ACTIVE">Solo Activos</option>
              <option value="INACTIVE">Solo Desactivados</option>
            </select>
          </div>
        </div>

        {/* Audit Log Drawer if toggled */}
        {showHistoryDrawer && (
          <div className="p-4 bg-[#FCFBF9] border-b border-[#E6E1D8] animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#3A5A40]" />
                <h4 className="text-xs font-bold text-[#1C211D]">
                  Registro Histórico de Movimientos de Inventario
                </h4>
              </div>
              <span className="text-[10px] text-[#5F6B61]">
                Últimos movimientos registrados en esta sesión
              </span>
            </div>

            {movementLogs.length === 0 ? (
              <p className="text-xs text-[#8F9990] py-3 text-center bg-white rounded-lg border border-[#E6E1D8]">
                No se han registrado movimientos de inventario todavía. Use el botón "Ajustar Stock" en cualquier insumo.
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-[#E6E1D8] rounded-lg bg-white">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-[#FAF8F5] text-[#5F6B61] font-bold border-b border-[#E6E1D8] sticky top-0">
                    <tr>
                      <th className="p-2">Fecha / Hora</th>
                      <th className="p-2">Insumo</th>
                      <th className="p-2">Tipo Movimiento</th>
                      <th className="p-2 text-right">Cantidad</th>
                      <th className="p-2 text-right">Stock Anterior → Nuevo</th>
                      <th className="p-2">Documento / Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2EEE6]">
                    {movementLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#FAF8F5]">
                        <td className="p-2 text-[#5F6B61] whitespace-nowrap">
                          {new Date(log.date).toLocaleString('es-CO', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="p-2 font-bold text-[#1C211D]">
                          <span className="font-mono text-[#3A5A40] text-[10px] block">
                            {log.materialSku}
                          </span>
                          {log.materialName}
                        </td>
                        <td className="p-2">
                          {log.type === 'INFLOW_RECEIPT' && (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                              Recepción / Entrada
                            </span>
                          )}
                          {log.type === 'OUTFLOW_PRODUCTION' && (
                            <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">
                              Consumo / Salida
                            </span>
                          )}
                          {log.type === 'PHYSICAL_ADJUSTMENT' && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded font-bold text-[10px]">
                              Conteo Físico
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-[#1C211D]">
                          {log.quantity.toLocaleString()}
                        </td>
                        <td className="p-2 text-right font-mono text-[#5F6B61]">
                          {log.previousStock} → <span className="font-bold text-[#1C211D]">{log.newStock}</span>
                        </td>
                        <td className="p-2 text-[#5F6B61]">
                          {log.referenceDoc && (
                            <span className="font-semibold text-[#1C211D] block">
                              Doc: {log.referenceDoc}
                            </span>
                          )}
                          {log.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Materials Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#5F6B61] font-bold border-b border-[#E6E1D8] text-[10px] uppercase tracking-wider">
              <tr>
                <th className="p-3.5">SKU / Insumo</th>
                <th className="p-3.5">Categoría & Rendimiento</th>
                <th className="p-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span>Stock Disponible (Físico)</span>
                    <Info className="w-3 h-3 text-[#8F9990]" title="Existencias reales en bodega" />
                  </div>
                </th>
                <th className="p-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span>En Tránsito</span>
                    <Truck className="w-3 h-3 text-[#3A5A40]" title="Órdenes de compra emitidas pendientes" />
                  </div>
                </th>
                <th className="p-3.5 text-right">Total Proyectado</th>
                <th className="p-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <TechTermTooltip termKey="stock_seguridad">Stock Seguridad</TechTermTooltip>
                  </div>
                </th>
                <th className="p-3.5 text-right">
                  <TechTermTooltip termKey="moq">MOQ</TechTermTooltip> & Costo
                </th>
                <th className="p-3.5">
                  Proveedor & <TechTermTooltip termKey="lead_time">Lead Time</TechTermTooltip>
                </th>
                <th className="p-3.5 text-center">Estado</th>
                <th className="p-3.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EEE6]">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-10 text-center">
                    <div className="space-y-2.5 max-w-sm mx-auto">
                      <Package className="w-10 h-10 text-[#D5CEC2] mx-auto" />
                      <div className="text-sm font-bold text-[#1C211D]">
                        No se encontraron materias primas
                      </div>
                      <p className="text-xs text-[#5F6B61]">
                        {searchTerm || categoryFilter !== 'ALL' || statusFilter !== 'ALL' || stockLevelFilter !== 'ALL'
                          ? 'Pruebe ajustando los filtros de búsqueda o categoría.'
                          : 'Comience registrando telas, hilos, etiquetas y botones para su producción.'}
                      </p>
                      <button
                        onClick={handleOpenCreate}
                        className="px-3.5 py-1.5 bg-[#3A5A40] text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 mt-2"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Registrar Insumo
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((mat) => {
                  const isActive = mat.isActive !== false;
                  const usingGarments = getGarmentsUsingMaterial(mat.id);
                  const safetyQty = getSafetyStockQty(mat);
                  const isBelowSafety = mat.currentStock < safetyQty;
                  const isZeroStock = mat.currentStock <= 0;
                  const totalProjected = mat.currentStock + (mat.inTransitStock || 0);
                  const hasYieldConversion = Boolean(
                    (mat.yieldFactor && mat.yieldFactor !== 1.0) ||
                    (mat.purchaseUnit && mat.usageUnit && mat.purchaseUnit !== mat.usageUnit)
                  );
                  const pUnit = mat.purchaseUnit || mat.unit;
                  const uUnit = mat.usageUnit || mat.unit;
                  const yFactor = mat.yieldFactor || 1.0;

                  return (
                    <tr
                      key={mat.id}
                      className={`hover:bg-[#FAF8F5] transition-colors ${
                        !isActive ? 'bg-stone-50/60 opacity-75' : ''
                      }`}
                    >
                      {/* SKU & Name */}
                      <td className="p-3.5">
                        <div className="font-mono text-[11px] font-bold text-[#3A5A40] uppercase">
                          {mat.sku}
                        </div>
                        <div className="font-bold text-[#1C211D] text-xs mt-0.5">
                          {mat.name}
                        </div>
                        {mat.color && (
                          <div className="text-[10px] text-[#5F6B61] flex items-center gap-1 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-[#8F9990]"></span>
                            Color/Tono: {mat.color}
                          </div>
                        )}
                        {usingGarments.length > 0 && (
                          <div className="text-[10px] text-[#3A5A40] font-medium mt-1">
                            Usado en {usingGarments.length} prenda{usingGarments.length > 1 ? 's' : ''}
                          </div>
                        )}
                      </td>

                      {/* Category & Textile Specifics & Yield */}
                      <td className="p-3.5">
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="px-2 py-0.5 bg-[#F2EEE6] text-[#5F6B61] rounded text-[10px] font-semibold">
                            {mat.category}
                          </span>
                          {hasYieldConversion && (
                            <span className="px-1.5 py-0.5 bg-[#EBF2EC] text-[#3A5A40] border border-[#D4E3D7] rounded text-[9px] font-bold flex items-center gap-1" title={mat.yieldDescription || `1 ${pUnit} = ${yFactor} ${uUnit}`}>
                              <ArrowRightLeft className="w-2.5 h-2.5" />
                              1 {pUnit} = {yFactor} {uUnit}
                            </span>
                          )}
                        </div>
                        {mat.widthMeters && (
                          <div className="text-[10px] text-[#8F9990] mt-0.5">
                            Ancho: {mat.widthMeters}m
                          </div>
                        )}
                        {mat.weightGsm && (
                          <div className="text-[10px] text-[#8F9990]">
                            Gramaje: {mat.weightGsm} g/m²
                          </div>
                        )}
                      </td>

                      {/* Stock Actual Disponible (Físico) */}
                      <td className="p-3.5 text-right font-bold text-[#1C211D]">
                        <div className="flex items-center justify-end gap-1.5">
                          {isZeroStock ? (
                            <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded font-bold text-[9px] uppercase">
                              Sin Stock
                            </span>
                          ) : isBelowSafety ? (
                            <span
                              className="px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded font-bold text-[9px] uppercase"
                              title="Por debajo del Stock de Seguridad"
                            >
                              ⚠️ Bajo Margen
                            </span>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Nivel Óptimo"></span>
                          )}
                          <span className="text-xs font-mono">
                            {mat.currentStock.toLocaleString()}{' '}
                            <span className="text-[10px] font-normal text-[#5F6B61]">{pUnit}</span>
                          </span>
                        </div>
                        {hasYieldConversion && (
                          <div className="text-[10px] text-[#3A5A40] font-mono">
                            ≈ {(mat.currentStock * yFactor).toLocaleString()} {uUnit}
                          </div>
                        )}
                        <div className="text-[10px] text-[#8F9990] font-mono font-normal">
                          {formatCOP(mat.currentStock * mat.unitCost, false)}
                        </div>
                      </td>

                      {/* En Tránsito (Comprado) */}
                      <td className="p-3.5 text-right">
                        {(mat.inTransitStock || 0) > 0 ? (
                          <div>
                            <div className="text-xs font-bold text-[#3A5A40] font-mono">
                              +{mat.inTransitStock.toLocaleString()} {pUnit}
                            </div>
                            <div className="text-[10px] text-[#5F6B61] font-mono font-normal">
                              {formatCOP((mat.inTransitStock || 0) * mat.unitCost, false)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#8F9990] font-mono">-</span>
                        )}
                      </td>

                      {/* Total Proyectado */}
                      <td className="p-3.5 text-right font-mono font-bold text-[#1C211D]">
                        <div className="text-xs">
                          {totalProjected.toLocaleString()} <span className="text-[10px] font-normal text-[#5F6B61]">{pUnit}</span>
                        </div>
                        <div className="text-[10px] text-[#8F9990] font-normal">
                          {formatCOP(totalProjected * mat.unitCost, false)}
                        </div>
                      </td>

                      {/* Stock de Seguridad */}
                      <td className="p-3.5 text-right text-[#5F6B61]">
                        <div className="font-bold text-[#1C211D] font-mono text-xs">
                          {safetyQty.toLocaleString()} {pUnit}
                        </div>
                        <div className="text-[10px] text-[#8F9990] flex items-center justify-end gap-1 mt-0.5">
                          <ShieldCheck className="w-3 h-3 text-[#3A5A40]" />
                          <span>{mat.safetyStockDays || 15} días cobertura</span>
                        </div>
                      </td>

                      {/* MOQ & Cost */}
                      <td className="p-3.5 text-right">
                        <div className="font-bold text-[#1C211D] font-mono">
                          {formatCOP(mat.unitCost, false)}
                        </div>
                        <div className="text-[10px] text-[#5F6B61]">
                          MOQ: <span className="font-semibold text-[#1C211D]">{mat.minOrderQuantity}</span> {pUnit}
                        </div>
                      </td>

                      {/* Supplier & Lead Time */}
                      <td className="p-3.5">
                        <div className="font-semibold text-[#1C211D] truncate max-w-[140px]">
                          {mat.supplierName || 'Proveedor General'}
                        </div>
                        <div className="text-[10px] text-[#5F6B61] flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-[#8F9990]" />
                          <span>Lead Time: <strong className="text-[#1C211D]">{mat.leadTimeDays} días</strong></span>
                        </div>
                      </td>

                      {/* Status Toggle Button */}
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => onToggleMaterialActive(mat.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border cursor-pointer ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-stone-100 text-stone-600 border-stone-300 hover:bg-stone-200'
                          }`}
                          title={isActive ? 'Haga clic para desactivar insumo' : 'Haga clic para reactivar insumo'}
                        >
                          {isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Activo</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-stone-500" />
                              <span>Inactivo</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {/* Quick Adjust Button */}
                          <button
                            onClick={() => handleOpenMovement(mat)}
                            className="p-1.5 text-[#3A5A40] bg-[#EBF2EC] hover:bg-[#D4E3D7] rounded-lg transition-colors font-bold flex items-center gap-1 text-[11px] cursor-pointer"
                            title="Ajustar inventario (Recepción, Salida, Conteo Físico)"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">Ajustar</span>
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(mat)}
                            className="p-1.5 text-[#5F6B61] hover:text-[#3A5A40] hover:bg-[#FAF8F5] rounded-lg transition-colors cursor-pointer"
                            title="Editar parámetros y proveedor"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  `¿Está seguro de eliminar "${mat.name}" (${mat.sku}) del catálogo?`
                                )
                              ) {
                                onDeleteMaterial(mat.id);
                              }
                            }}
                            className="p-1.5 text-[#8F9990] hover:text-[#B33927] hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar insumo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Material Modal for Create/Edit */}
      <MaterialModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveMaterial={handleSave}
        materialToEdit={editingMaterial}
      />

      {/* Quick Stock Movement Modal */}
      <InventoryMovementModal
        isOpen={Boolean(movementMaterial)}
        onClose={() => setMovementMaterial(null)}
        material={movementMaterial}
        onApplyMovement={handleApplyStockMovement}
      />
    </div>
  );
};
