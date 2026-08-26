import React, { useState } from 'react';
import { MRPResultItem } from '../types';
import {
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Package,
  LayoutGrid,
  Table as TableIcon,
  Check,
} from 'lucide-react';
import { formatCOP } from '../utils/formatters';
import { TechTermTooltip } from './TechTermTooltip';

interface MRPCalculatorTableProps {
  items?: MRPResultItem[];
  mrpItems?: MRPResultItem[];
  onUpdateMaterialStock?: (materialId: string, currentStock: number, inTransit: number) => void;
  onCreatePurchaseOrders?: (items: MRPResultItem[]) => void;
  onGenerateSelectedPOs?: (selectedIds: string[]) => void;
  onOpenPOModal?: () => void;
  statusFilter?: string;
  setStatusFilter?: (status: string) => void;
}

export const MRPCalculatorTable: React.FC<MRPCalculatorTableProps> = ({
  items,
  mrpItems,
  onUpdateMaterialStock,
  onCreatePurchaseOrders,
  onGenerateSelectedPOs,
  onOpenPOModal,
  statusFilter: propStatusFilter,
  setStatusFilter: propSetStatusFilter,
}) => {
  const actualItems = items || mrpItems || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [localStatusFilter, setLocalStatusFilter] = useState<string>('all');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'auto' | 'cards' | 'table'>('auto');

  const currentStatusFilter = propStatusFilter !== undefined ? propStatusFilter : localStatusFilter;
  const handleStatusChange = (val: string) => {
    if (propSetStatusFilter) {
      propSetStatusFilter(val);
    } else {
      setLocalStatusFilter(val);
    }
  };

  // Filter items
  const filteredItems = actualItems.filter((item) => {
    const matchesSearch =
      item.rawMaterial.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.rawMaterial.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.rawMaterial.supplierName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || item.rawMaterial.category === selectedCategory;
    const matchesStatus = currentStatusFilter === 'all' || item.status === currentStatusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const toggleSelectAll = () => {
    if (Object.keys(selectedItems).length === filteredItems.length && filteredItems.length > 0) {
      setSelectedItems({});
    } else {
      const newSelected: Record<string, boolean> = {};
      filteredItems.forEach((item) => {
        newSelected[item.rawMaterial.id] = true;
      });
      setSelectedItems(newSelected);
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const selectedCount = Object.values(selectedItems).filter(Boolean).length;

  const handleGenerateOrdersForSelected = () => {
    const selectedIds = Object.keys(selectedItems).filter((id) => selectedItems[id]);
    if (selectedIds.length === 0) return;

    if (onGenerateSelectedPOs) {
      onGenerateSelectedPOs(selectedIds);
    } else if (onCreatePurchaseOrders) {
      const itemsToOrder = actualItems.filter((item) => selectedItems[item.rawMaterial.id]);
      onCreatePurchaseOrders(itemsToOrder);
      if (onOpenPOModal) onOpenPOModal();
    }
  };

  const handleOrderSingleItem = (item: MRPResultItem) => {
    if (onGenerateSelectedPOs) {
      onGenerateSelectedPOs([item.rawMaterial.id]);
    } else if (onCreatePurchaseOrders) {
      onCreatePurchaseOrders([item]);
      if (onOpenPOModal) onOpenPOModal();
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'SKU',
      'Material',
      'Categoria',
      'Unidad',
      'Stock Actual',
      'En Transito',
      'Requerimiento Bruto',
      'Requerimiento con Merma',
      'Stock Seguridad',
      'Deficit Neto',
      'Compra Sugerida (MOQ)',
      'Costo Unitario COP',
      'Costo Total Estimado COP',
      'Estado',
      'Proveedor',
      'Lead Time (Dias)',
    ];

    const rows = filteredItems.map((i) => [
      `"${i.rawMaterial.sku}"`,
      `"${i.rawMaterial.name}"`,
      `"${i.rawMaterial.category}"`,
      `"${i.rawMaterial.unit}"`,
      i.currentStock,
      i.inTransitStock,
      i.grossRequirement.toFixed(2),
      i.effectiveGrossRequirement.toFixed(2),
      i.safetyStockRequired.toFixed(2),
      i.netRequirement.toFixed(2),
      i.suggestedPurchaseQty,
      i.rawMaterial.unitCost,
      i.totalEstimatedCost.toFixed(2),
      `"${i.status}"`,
      `"${i.rawMaterial.supplierName}"`,
      i.rawMaterial.leadTimeDays,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MRP_Calculo_MateriasPrimas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CRITICO':
        return (
          <span className="px-2 py-0.5 bg-[#FDF2F0] text-[#B33927] border border-[#F0D5D0] text-[10px] font-bold rounded-md uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            Crítico
          </span>
        );
      case 'REORDEN':
        return (
          <span className="px-2 py-0.5 bg-[#FDF8EE] text-[#82530C] border border-[#F7E4BF] text-[10px] font-bold rounded-md uppercase tracking-wider">
            Reorden
          </span>
        );
      case 'OPTIMO':
        return (
          <span className="px-2 py-0.5 bg-[#EBF2EC] text-[#233829] border border-[#D4E3D7] text-[10px] font-bold rounded-md uppercase tracking-wider">
            Óptimo
          </span>
        );
      case 'SOBRESTOCK':
        return (
          <span className="px-2 py-0.5 bg-[#EEF2F6] text-[#2D4A6E] border border-[#D0DCE8] text-[10px] font-bold rounded-md uppercase tracking-wider">
            Sobrestock
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E6E1D8] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#8F9990] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar material por SKU, nombre o proveedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#FAF8F5] border border-[#D5CEC2] rounded-lg pl-9 pr-3 py-2 text-xs font-medium text-[#1C211D] placeholder-[#8F9990] focus:ring-1 focus:ring-[#3A5A40] focus:bg-white transition-all"
            id="input-search-materials"
          />
        </div>

        {/* Right: Filters & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center text-xs bg-[#FAF8F5] border border-[#E6E1D8] rounded-lg px-2.5 py-1.5">
            <span className="text-[#5F6B61] mr-1.5 font-medium hidden sm:inline">Categoría:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent font-semibold text-[#1C211D] text-xs focus:outline-hidden cursor-pointer"
              id="filter-material-category"
            >
              <option value="all">Todas ({actualItems.length})</option>
              <option value="Tela">Telas</option>
              <option value="Avío / Fornitura">Avíos / Fornituras</option>
              <option value="Hilo">Hilos</option>
              <option value="Entretela">Entretelas</option>
              <option value="Empaque / Etiqueta">Empaques / Etiquetas</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center text-xs bg-[#FAF8F5] border border-[#E6E1D8] rounded-lg px-2.5 py-1.5">
            <span className="text-[#5F6B61] mr-1.5 font-medium hidden sm:inline">Estado:</span>
            <select
              value={currentStatusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-transparent font-semibold text-[#1C211D] text-xs focus:outline-hidden cursor-pointer"
              id="filter-material-status"
            >
              <option value="all">Todos</option>
              <option value="CRITICO">Crítico (Faltante)</option>
              <option value="REORDEN">Punto de Reorden</option>
              <option value="OPTIMO">Óptimo</option>
              <option value="SOBRESTOCK">Sobrestock</option>
            </select>
          </div>

          {/* View Mode Toggle (Mobile Cards vs Full Table) */}
          <div className="inline-flex rounded-lg p-0.5 bg-[#FAF8F5] border border-[#E6E1D8]">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-[#3A5A40] shadow-2xs font-bold'
                  : 'text-[#5F6B61] hover:text-[#1C211D]'
              }`}
              title="Vista en Tarjetas"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Tarjetas</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-[#3A5A40] shadow-2xs font-bold'
                  : 'text-[#5F6B61] hover:text-[#1C211D]'
              }`}
              title="Vista en Tabla"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Tabla</span>
            </button>
          </div>

          {/* Export Report */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#D5CEC2] hover:bg-[#FAF8F5] text-[#1C211D] text-xs font-semibold shadow-2xs transition-colors"
            id="btn-export-mrp-csv"
            title="Exportar a CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#5F6B61]" />
            <span className="hidden lg:inline">Exportar CSV</span>
          </button>

          {/* Generate POs for selected */}
          {selectedCount > 0 && (
            <button
              onClick={handleGenerateOrdersForSelected}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#3A5A40] hover:bg-[#2D4632] text-white text-xs font-bold shadow-xs transition-all active:scale-95"
              id="btn-create-pos-selected"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Generar OC ({selectedCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Container: Adaptive Table / Card Grid */}
      <div className="bg-white rounded-xl border border-[#E6E1D8] shadow-xs overflow-hidden">
        {/* Header Title */}
        <div className="p-3.5 sm:p-4 border-b border-[#E6E1D8] flex items-center justify-between bg-[#FCFBF9]">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-xs sm:text-sm text-[#1C211D]">
              Cálculo de Requerimientos de Materia Prima (MRP)
            </h3>
            <span className="text-[11px] text-[#5F6B61]">({filteredItems.length} insumos)</span>
          </div>

          {/* Select all toggle button */}
          <button
            onClick={toggleSelectAll}
            className="text-[11px] text-[#3A5A40] hover:text-[#2D4632] font-bold"
          >
            {selectedCount === filteredItems.length && filteredItems.length > 0
              ? 'Deseleccionar Todos'
              : 'Seleccionar Todos'}
          </button>
        </div>

        {/* 1. MOBILE RESPONSIVE CARDS VIEW (Visible when viewMode === 'cards' or by default on screens < lg if viewMode === 'auto') */}
        <div
          className={`${
            viewMode === 'table' ? 'hidden' : viewMode === 'cards' ? 'block' : 'block lg:hidden'
          } p-3 sm:p-4 space-y-3`}
        >
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Package className="w-8 h-8 text-[#D5CEC2] mx-auto" />
              <div className="text-xs font-bold text-[#1C211D]">No hay materiales calculados en el MRP</div>
              <p className="text-[11px] text-[#5F6B61] max-w-sm mx-auto">
                Registre insumos en el inventario o configure prendas con fichas técnicas para ver los requerimientos netos.
              </p>
            </div>
          ) : (
            filteredItems.map((item) => {
            const isExpanded = expandedItemId === item.rawMaterial.id;
            const isSelected = !!selectedItems[item.rawMaterial.id];
            const stockCoverPercent = item.effectiveGrossRequirement > 0
              ? Math.min(100, Math.round(((item.currentStock + item.inTransitStock) / item.effectiveGrossRequirement) * 100))
              : 100;

            return (
              <div
                key={item.rawMaterial.id}
                className={`p-4 rounded-xl border transition-all ${
                  item.status === 'CRITICO'
                    ? 'border-[#F0D5D0] bg-[#FCFBF9] hover:bg-[#FAF8F5]'
                    : 'border-[#E6E1D8] bg-white hover:bg-[#FAF8F5]'
                }`}
              >
                {/* Top Row: Checkbox, Name, Category & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectItem(item.rawMaterial.id)}
                      className="mt-1 rounded text-[#3A5A40] focus:ring-[#3A5A40] w-4 h-4 cursor-pointer"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-[#1C211D] truncate">
                        {item.rawMaterial.name}
                      </div>
                      <div className="text-[11px] text-[#5F6B61] flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[#1C211D] font-semibold">SKU: {item.rawMaterial.sku}</span>
                        <span>•</span>
                        <span className="bg-[#F2EEE6] text-[#5F6B61] px-1.5 py-0.2 rounded text-[10px] font-medium">
                          {item.rawMaterial.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">{getStatusBadge(item.status)}</div>
                </div>

                {/* Visual Progress Bar: Stock vs Requerimiento */}
                <div className="mt-3 bg-[#FAF8F5] p-2.5 rounded-lg border border-[#EAE6DF] space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#5F6B61]">
                      Cobertura: <strong className="text-[#1C211D] font-bold">{stockCoverPercent}%</strong>
                    </span>
                    <span className="text-[#5F6B61]">
                      Requerido: <strong className="text-[#1C211D]">{item.effectiveGrossRequirement.toLocaleString()} {item.rawMaterial.unit}</strong>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#EAE6DF] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        item.status === 'CRITICO'
                          ? 'bg-[#B33927]'
                          : item.status === 'REORDEN'
                          ? 'bg-[#A37B3C]'
                          : 'bg-[#3A5A40]'
                      }`}
                      style={{ width: `${Math.max(5, stockCoverPercent)}%` }}
                    />
                  </div>
                </div>

                {/* Key Metrics Grid for Mobile */}
                <div className="mt-3 grid grid-cols-2 xs:grid-cols-4 gap-2 pt-2 border-t border-[#F2EEE6] text-xs">
                  <div className="bg-[#FAF8F5] p-2 rounded-lg">
                    <span className="text-[10px] text-[#5F6B61] block">Stock Disponible</span>
                    <span className="font-bold text-[#1C211D]">
                      {item.currentStock.toLocaleString()} {item.rawMaterial.unit}
                    </span>
                    {item.inTransitStock > 0 && (
                      <span className="text-[9px] text-[#3A5A40] block font-medium">
                        +{item.inTransitStock} tránsito
                      </span>
                    )}
                  </div>

                  <div className="bg-[#FAF8F5] p-2 rounded-lg">
                    <span className="text-[10px] text-[#5F6B61] block">Déficit Neto</span>
                    {item.netRequirement > 0 ? (
                      <span className="font-bold text-[#B33927]">
                        -{item.netRequirement.toLocaleString(undefined, { maximumFractionDigits: 1 })}{' '}
                        {item.rawMaterial.unit}
                      </span>
                    ) : (
                      <span className="font-medium text-[#3A5A40]">Cubierto</span>
                    )}
                  </div>

                  <div className="bg-[#FAF8F5] p-2 rounded-lg">
                    <span className="text-[10px] text-[#5F6B61] block">Compra Sugerida</span>
                    <span className="font-bold text-[#1C211D]">
                      {item.suggestedPurchaseQty > 0 ? `${item.suggestedPurchaseQty.toLocaleString()} ${item.rawMaterial.unit}` : '0'}
                    </span>
                    <span className="text-[9px] text-[#8F9990] block">MOQ: {item.rawMaterial.minOrderQuantity}</span>
                  </div>

                  <div className="bg-[#FAF8F5] p-2 rounded-lg">
                    <span className="text-[10px] text-[#5F6B61] block">Presupuesto</span>
                    <span className="font-bold text-[#1C211D]">
                      {formatCOP(item.totalEstimatedCost, false)}
                    </span>
                    <span className="text-[9px] text-[#8F9990] block">
                      {formatCOP(item.rawMaterial.unitCost, false)}/u
                    </span>
                  </div>
                </div>

                {/* Supplier and Action Row */}
                <div className="mt-3 pt-2.5 border-t border-[#F2EEE6] flex items-center justify-between gap-2">
                  <div className="text-[11px] text-[#5F6B61] flex items-center gap-1 truncate">
                    <span className="font-semibold text-[#1C211D] truncate">{item.rawMaterial.supplierName}</span>
                    <span className="text-[#8F9990]">•</span>
                    <span className="flex items-center gap-0.5 text-[10px]">
                      <Clock className="w-3 h-3 text-[#3A5A40]" />
                      {item.rawMaterial.leadTimeDays}d
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedItemId(isExpanded ? null : item.rawMaterial.id)}
                      className="px-2.5 py-1 text-xs font-semibold text-[#5F6B61] hover:text-[#1C211D] bg-[#FAF8F5] hover:bg-[#F2EEE6] rounded-lg transition-colors flex items-center gap-1"
                    >
                      <span>{isExpanded ? 'Ocultar' : 'Prendas'}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {item.suggestedPurchaseQty > 0 ? (
                      <button
                        onClick={() => handleOrderSingleItem(item)}
                        className="px-3 py-1 bg-[#3A5A40] hover:bg-[#2D4632] active:scale-95 text-white text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center gap-1"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        Pedir
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#3A5A40] font-bold flex items-center gap-1 px-2 py-0.5 bg-[#EBF2EC] rounded-md">
                        <CheckCircle2 className="w-3 h-3" /> OK
                      </span>
                    )}
                  </div>
                </div>

                {/* Drill-down of Garments using this material on mobile */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-[#E6E1D8] space-y-2 bg-[#FCFBF9] p-3 rounded-lg border border-[#EAE6DF]">
                    <div className="text-[11px] font-bold text-[#1C211D] uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#3A5A40]" />
                      Prendas que consumen este insumo:
                    </div>
                    <div className="space-y-1.5">
                      {item.usedInGarments.map((g, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-2 rounded-lg border border-[#E6E1D8] flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-[#1C211D]">{g.garmentName}</span>
                            <span className="text-[10px] text-[#5F6B61] block">
                              Consumo unit: {g.consumption} {item.rawMaterial.unit}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-[#3A5A40]">
                              {g.demand.toLocaleString()} {item.rawMaterial.unit}
                            </span>
                            <span className="text-[10px] text-[#8F9990] block">en el ciclo</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          }))}
        </div>

        {/* 2. DESKTOP TABULAR VIEW (Visible when viewMode === 'table' or by default on screens >= lg if viewMode === 'auto') */}
        <div
          className={`${
            viewMode === 'cards' ? 'hidden' : viewMode === 'table' ? 'block' : 'hidden lg:block'
          } overflow-x-auto`}
        >
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#FAF8F5] text-[10px] font-bold uppercase text-[#5F6B61] border-b border-[#E6E1D8]">
              <tr>
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedCount === filteredItems.length && filteredItems.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded text-[#3A5A40] focus:ring-[#3A5A40]"
                  />
                </th>
                <th className="px-4 py-3">Material & SKU</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3 text-right">Stock Actual</th>
                <th className="px-4 py-3 text-right">
                  <TechTermTooltip termKey="requerimientoBruto">Requerido (Bruto + Merma)</TechTermTooltip>
                </th>
                <th className="px-4 py-3 text-right">
                  <TechTermTooltip termKey="requerimientoNeto">Déficit Neto</TechTermTooltip>
                </th>
                <th className="px-4 py-3 text-right">
                  <TechTermTooltip termKey="moq">Compra Sugerida (MOQ)</TechTermTooltip>
                </th>
                <th className="px-4 py-3 text-right">Presupuesto COP</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-[#F2EEE6]">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <div className="space-y-2">
                      <Package className="w-8 h-8 text-[#D5CEC2] mx-auto" />
                      <div className="text-xs font-bold text-[#1C211D]">No hay materiales calculados en el MRP</div>
                      <p className="text-[11px] text-[#5F6B61] max-w-sm mx-auto">
                        Registre insumos en el inventario o configure prendas con fichas técnicas para ver los requerimientos netos.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                const isExpanded = expandedItemId === item.rawMaterial.id;
                const isSelected = !!selectedItems[item.rawMaterial.id];

                return (
                  <React.Fragment key={item.rawMaterial.id}>
                    <tr
                      className={`hover:bg-[#FAF8F5] transition-colors ${
                        item.status === 'CRITICO' ? 'bg-[#FDF2F0]/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectItem(item.rawMaterial.id)}
                          className="rounded text-[#3A5A40] focus:ring-[#3A5A40]"
                        />
                      </td>

                      {/* Material Name & SKU */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-start gap-2">
                          <button
                            onClick={() => setExpandedItemId(isExpanded ? null : item.rawMaterial.id)}
                            className="mt-0.5 text-[#8F9990] hover:text-[#1C211D]"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          <div>
                            <div className="font-semibold text-[#1C211D]">{item.rawMaterial.name}</div>
                            <div className="text-[10px] text-[#5F6B61] font-mono mt-0.5 flex flex-wrap items-center gap-1.5">
                              <span>SKU: {item.rawMaterial.sku}</span>
                              <span>•</span>
                              <span>Prov: {item.rawMaterial.supplierName} ({item.rawMaterial.leadTimeDays}d)</span>
                              {item.rawMaterial.yieldFactor && item.rawMaterial.yieldFactor !== 1.0 && (
                                <span className="bg-[#EBF2EC] text-[#3A5A40] px-1.5 py-0.2 rounded text-[9px] font-bold">
                                  1 {item.rawMaterial.purchaseUnit || item.rawMaterial.unit} = {item.rawMaterial.yieldFactor} {item.rawMaterial.usageUnit || item.rawMaterial.unit}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5">
                        <span className="text-[11px] font-medium text-[#5F6B61] bg-[#F2EEE6] px-2 py-0.5 rounded">
                          {item.rawMaterial.category}
                        </span>
                      </td>

                      {/* Current Stock + In Transit */}
                      <td className="px-4 py-3.5 text-right font-mono text-[#1C211D]">
                        <div className="font-semibold">
                          {item.currentStock.toLocaleString()} {item.rawMaterial.unit}
                        </div>
                        {item.inTransitStock > 0 && (
                          <div className="text-[10px] text-[#3A5A40] font-medium">
                            +{item.inTransitStock.toLocaleString()} en tránsito
                          </div>
                        )}
                      </td>

                      {/* Effective Gross Requirement */}
                      <td className="px-4 py-3.5 text-right font-mono text-[#1C211D]">
                        <div className="font-semibold">
                          {item.effectiveGrossRequirement.toLocaleString(undefined, { maximumFractionDigits: 1 })}{' '}
                          {item.rawMaterial.unit}
                        </div>
                        <div className="text-[10px] text-[#8F9990]">
                          Base: {item.grossRequirement.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                        </div>
                      </td>

                      {/* Net Requirement (Deficit) */}
                      <td className="px-4 py-3.5 text-right font-mono">
                        {item.netRequirement > 0 ? (
                          <span className="font-bold text-[#B33927]">
                            -{item.netRequirement.toLocaleString(undefined, { maximumFractionDigits: 1 })}{' '}
                            {item.rawMaterial.unit}
                          </span>
                        ) : (
                          <span className="text-[#3A5A40] font-medium">Cubierto (+{Math.abs(item.netRequirement).toFixed(0)})</span>
                        )}
                      </td>

                      {/* Suggested Purchase Qty (MOQ adjusted) */}
                      <td className="px-4 py-3.5 text-right font-mono">
                        {item.suggestedPurchaseQty > 0 ? (
                          <div>
                            <span className="font-bold text-[#1C211D]">
                              {item.suggestedPurchaseQty.toLocaleString()} {item.rawMaterial.unit}
                            </span>
                            <div className="text-[10px] text-[#8F9990]">MOQ: {item.rawMaterial.minOrderQuantity}</div>
                          </div>
                        ) : (
                          <span className="text-[#8F9990]">—</span>
                        )}
                      </td>

                      {/* Estimated Cost */}
                      <td className="px-4 py-3.5 text-right font-mono">
                        {item.totalEstimatedCost > 0 ? (
                          <div>
                            <span className="font-bold text-[#1C211D]">
                              {formatCOP(item.totalEstimatedCost, false)}
                            </span>
                            <div className="text-[10px] text-[#8F9990]">{formatCOP(item.rawMaterial.unitCost, false)}/{item.rawMaterial.unit}</div>
                          </div>
                        ) : (
                          <span className="text-[#8F9990]">$ 0</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex justify-center">{getStatusBadge(item.status)}</div>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 text-center">
                        {item.suggestedPurchaseQty > 0 ? (
                          <button
                            onClick={() => handleOrderSingleItem(item)}
                            className="px-3 py-1 bg-[#3A5A40] hover:bg-[#2D4632] text-white text-[10px] font-bold rounded-lg uppercase shadow-2xs transition-all active:scale-95"
                            title="Generar Orden de Compra individual"
                          >
                            Pedir
                          </button>
                        ) : (
                          <span className="text-[10px] text-[#3A5A40] font-medium flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            OK
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* Expanded Garment Consumption Drill-down */}
                    {isExpanded && (
                      <tr className="bg-[#FAF8F5]/80">
                        <td colSpan={10} className="px-8 py-3.5 border-b border-[#E6E1D8]">
                          <div className="space-y-2">
                            <div className="text-[11px] font-bold text-[#1C211D] uppercase tracking-wider flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-[#3A5A40]" />
                              Desglose de consumo por prenda en este ciclo:
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {item.usedInGarments.map((g, idx) => (
                                <div key={idx} className="bg-white p-2.5 rounded-lg border border-[#E6E1D8] text-xs">
                                  <div className="font-semibold text-[#1C211D]">{g.garmentName}</div>
                                  <div className="text-[10px] text-[#5F6B61] mt-0.5">
                                    Consumo Unitario: <span className="font-bold text-[#1C211D]">{g.consumption} {item.rawMaterial.unit}</span>
                                  </div>
                                  <div className="text-[10px] text-[#5F6B61]">
                                    Demanda Total Requerida: <span className="font-bold text-[#3A5A40]">{g.demand.toLocaleString()} {item.rawMaterial.unit}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
