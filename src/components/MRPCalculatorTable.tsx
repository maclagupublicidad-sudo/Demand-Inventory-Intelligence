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
} from 'lucide-react';
import { formatCOP } from '../utils/formatters';

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

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar material por SKU, nombre o proveedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg pl-9 pr-3 py-2 text-xs font-medium text-[#111827] placeholder-[#9CA3AF] focus:ring-1 focus:ring-[#4F46E5] focus:bg-white transition-all"
            id="input-search-materials"
          />
        </div>

        {/* Right: Filters & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Filter */}
          <div className="flex items-center text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-2.5 py-1.5">
            <span className="text-[#6B7280] mr-1.5 font-medium">Categoría:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent font-semibold text-[#111827] focus:outline-hidden cursor-pointer"
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
          <div className="flex items-center text-xs bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-2.5 py-1.5">
            <span className="text-[#6B7280] mr-1.5 font-medium">Estado:</span>
            <select
              value={currentStatusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-transparent font-semibold text-[#111827] focus:outline-hidden cursor-pointer"
              id="filter-material-status"
            >
              <option value="all">Todos</option>
              <option value="CRITICO">Crítico (Faltante)</option>
              <option value="REORDEN">Punto de Reorden</option>
              <option value="OPTIMO">Óptimo</option>
              <option value="SOBRESTOCK">Sobrestock</option>
            </select>
          </div>

          {/* Export Report */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#374151] text-xs font-semibold shadow-2xs transition-colors"
            id="btn-export-mrp-csv"
          >
            <Download className="w-3.5 h-3.5 text-[#6B7280]" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          {/* Generate POs for selected */}
          {selectedCount > 0 && (
            <button
              onClick={handleGenerateOrdersForSelected}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold shadow-xs transition-colors"
              id="btn-create-pos-selected"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Generar OC ({selectedCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-sm text-[#111827]">Cálculo de Requerimientos de Materia Prima (MRP)</h3>
            <span className="text-xs text-[#6B7280]">({filteredItems.length} insumos listados)</span>
          </div>
          <button
            onClick={handleExportCSV}
            className="text-[11px] text-[#4F46E5] hover:text-[#4338CA] font-bold"
          >
            Exportar Reporte
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#F9FAFB] text-[10px] font-bold uppercase text-[#6B7280] border-b border-[#E5E7EB]">
              <tr>
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedCount === filteredItems.length && filteredItems.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded text-[#4F46E5] focus:ring-indigo-500"
                  />
                </th>
                <th className="px-4 py-3">Material & SKU</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3 text-right">Stock Actual</th>
                <th className="px-4 py-3 text-right">Requerido (Demanda + Merma)</th>
                <th className="px-4 py-3 text-right">Déficit / Déficit Neto</th>
                <th className="px-4 py-3 text-right">Compra Sugerida (MOQ)</th>
                <th className="px-4 py-3 text-right">Presupuesto COP</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-[#F3F4F6]">
              {filteredItems.map((item) => {
                const isExpanded = expandedItemId === item.rawMaterial.id;
                const isSelected = !!selectedItems[item.rawMaterial.id];

                return (
                  <React.Fragment key={item.rawMaterial.id}>
                    <tr
                      className={`hover:bg-[#F9FAFB] transition-colors ${
                        item.status === 'CRITICO' ? 'bg-red-50/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectItem(item.rawMaterial.id)}
                          className="rounded text-[#4F46E5] focus:ring-indigo-500"
                        />
                      </td>

                      {/* Material Name & SKU */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-start gap-2">
                          <button
                            onClick={() => setExpandedItemId(isExpanded ? null : item.rawMaterial.id)}
                            className="mt-0.5 text-[#9CA3AF] hover:text-[#111827]"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          <div>
                            <div className="font-semibold text-[#111827]">{item.rawMaterial.name}</div>
                            <div className="text-[10px] text-[#9CA3AF] font-mono mt-0.5">
                              SKU: {item.rawMaterial.sku} | Prov: {item.rawMaterial.supplierName} ({item.rawMaterial.leadTimeDays}d)
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5">
                        <span className="text-[11px] font-medium text-[#4B5563] bg-[#F3F4F6] px-2 py-0.5 rounded">
                          {item.rawMaterial.category}
                        </span>
                      </td>

                      {/* Current Stock + In Transit */}
                      <td className="px-4 py-3.5 text-right font-mono text-[#111827]">
                        <div className="font-semibold">
                          {item.currentStock.toLocaleString()} {item.rawMaterial.unit}
                        </div>
                        {item.inTransitStock > 0 && (
                          <div className="text-[10px] text-blue-600 font-medium">
                            +{item.inTransitStock.toLocaleString()} en tránsito
                          </div>
                        )}
                      </td>

                      {/* Effective Gross Requirement */}
                      <td className="px-4 py-3.5 text-right font-mono text-[#111827]">
                        <div className="font-semibold">
                          {item.effectiveGrossRequirement.toLocaleString(undefined, { maximumFractionDigits: 1 })}{' '}
                          {item.rawMaterial.unit}
                        </div>
                        <div className="text-[10px] text-[#9CA3AF]">
                          Base: {item.grossRequirement.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                        </div>
                      </td>

                      {/* Net Requirement (Deficit) */}
                      <td className="px-4 py-3.5 text-right font-mono">
                        {item.netRequirement > 0 ? (
                          <span className="font-bold text-red-600">
                            -{item.netRequirement.toLocaleString(undefined, { maximumFractionDigits: 1 })}{' '}
                            {item.rawMaterial.unit}
                          </span>
                        ) : (
                          <span className="text-green-600 font-medium">Cubierto (+{Math.abs(item.netRequirement).toFixed(0)})</span>
                        )}
                      </td>

                      {/* Suggested Purchase Qty (MOQ adjusted) */}
                      <td className="px-4 py-3.5 text-right font-mono">
                        {item.suggestedPurchaseQty > 0 ? (
                          <div>
                            <span className="font-bold text-[#111827]">
                              {item.suggestedPurchaseQty.toLocaleString()} {item.rawMaterial.unit}
                            </span>
                            <div className="text-[10px] text-[#9CA3AF]">MOQ: {item.rawMaterial.minOrderQuantity}</div>
                          </div>
                        ) : (
                          <span className="text-[#9CA3AF]">—</span>
                        )}
                      </td>

                      {/* Estimated Cost */}
                      <td className="px-4 py-3.5 text-right font-mono">
                        {item.totalEstimatedCost > 0 ? (
                          <div>
                            <span className="font-bold text-[#111827]">
                              {formatCOP(item.totalEstimatedCost, false)}
                            </span>
                            <div className="text-[10px] text-[#9CA3AF]">{formatCOP(item.rawMaterial.unitCost, false)}/{item.rawMaterial.unit}</div>
                          </div>
                        ) : (
                          <span className="text-[#9CA3AF]">$ 0</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        {item.status === 'CRITICO' && (
                          <span className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold rounded uppercase">
                            Crítico
                          </span>
                        )}
                        {item.status === 'REORDEN' && (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold rounded uppercase">
                            Reorden
                          </span>
                        )}
                        {item.status === 'OPTIMO' && (
                          <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold rounded uppercase">
                            Óptimo
                          </span>
                        )}
                        {item.status === 'SOBRESTOCK' && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded uppercase">
                            Sobrestock
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 text-center">
                        {item.suggestedPurchaseQty > 0 ? (
                          <button
                            onClick={() => handleOrderSingleItem(item)}
                            className="px-3 py-1 bg-black hover:bg-gray-800 text-white text-[10px] font-bold rounded uppercase shadow-2xs transition-colors"
                            title="Generar Orden de Compra individual"
                          >
                            Pedir
                          </button>
                        ) : (
                          <span className="text-[10px] text-green-600 font-medium flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            OK
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* Expanded Garment Consumption Drill-down */}
                    {isExpanded && (
                      <tr className="bg-[#F9FAFB]/80">
                        <td colSpan={10} className="px-8 py-3.5 border-b border-[#E5E7EB]">
                          <div className="space-y-2">
                            <div className="text-[11px] font-bold text-[#374151] uppercase tracking-wider flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-[#4F46E5]" />
                              Desglose de consumo por prenda en este ciclo:
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {item.usedInGarments.map((g, idx) => (
                                <div key={idx} className="bg-white p-2.5 rounded-lg border border-[#E5E7EB] text-xs">
                                  <div className="font-semibold text-[#111827]">{g.garmentName}</div>
                                  <div className="text-[10px] text-[#6B7280] mt-0.5">
                                    Consumo Unitario: <span className="font-bold text-[#111827]">{g.consumption} {item.rawMaterial.unit}</span>
                                  </div>
                                  <div className="text-[10px] text-[#6B7280]">
                                    Demanda Total Requerida: <span className="font-bold text-[#4F46E5]">{g.demand.toLocaleString()} {item.rawMaterial.unit}</span>
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
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
