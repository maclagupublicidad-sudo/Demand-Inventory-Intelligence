import React, { useState } from 'react';
import {
  Package,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Plus,
  Search,
  Filter,
  Layers,
  FileText,
  User,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { UnifiedDatabase } from '../services/unifiedDatabase';
import { TablaInventarioMovimiento, TipoMovimientoInventario } from '../types/database';
import { formatCOP } from '../utils/formatters';

export const InventoryKardexView: React.FC = () => {
  const [movements, setMovements] = useState<TablaInventarioMovimiento[]>(() => UnifiedDatabase.getMovimientos());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Manual Adjustment Form
  const [selectedMaterialSku, setSelectedMaterialSku] = useState<string>('TM01');
  const [adjustmentType, setAdjustmentType] = useState<TipoMovimientoInventario>('Entrada');
  const [quantity, setQuantity] = useState<number>(100);
  const [reference, setReference] = useState<string>('Ajuste Físico de Bodega');
  const [reason, setReason] = useState<string>('');

  const materials = UnifiedDatabase.getMateriasPrimas();
  const selectedMaterial = materials.find((m) => m.SKU_Material.toUpperCase() === selectedMaterialSku.toUpperCase());

  const filteredMovements = movements.filter((mov) => {
    const matchesSearch =
      mov.SKU_Material.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.Nombre_Material.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.referencia.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || mov.tipo_movimiento === selectedType;
    return matchesSearch && matchesType;
  });

  const handleCreateAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterial) return;

    const currentStock = selectedMaterial.Stock_Actual;
    let newStock = currentStock;
    if (adjustmentType === 'Entrada' || adjustmentType === 'Recepción compra') {
      newStock += quantity;
    } else {
      newStock = Math.max(0, currentStock - quantity);
    }

    UnifiedDatabase.updateMaterialStock({
      materialSku: selectedMaterial.SKU_Material,
      newStock,
      tipoMovimiento: adjustmentType,
      referencia: reference,
      usuario: 'Supervisor Almacén',
      observaciones: reason || `Ajuste manual de ${quantity} ${selectedMaterial.Unidad_Medida}`,
    });

    setMovements(UnifiedDatabase.getMovimientos());
    setIsModalOpen(false);
  };

  const getMovementBadge = (type: TipoMovimientoInventario) => {
    switch (type) {
      case 'Entrada':
      case 'Recepción compra':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold rounded-full">
            <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
            {type}
          </span>
        );
      case 'Salida':
      case 'Consumo producción':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold rounded-full">
            <ArrowUpRight className="w-3 h-3 text-rose-600" />
            {type}
          </span>
        );
      case 'Ajuste':
      case 'Ajuste inventario':
      case 'Devolución':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold rounded-full">
            <RefreshCw className="w-3 h-3 text-amber-600" />
            {type}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E6E1D8] p-5 sm:p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#3A5A40] text-white flex items-center justify-center shadow-xs">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-[#1C211D]">
                Kardex de Inventario & Auditoría de Movimientos
              </h2>
              <span className="px-2 py-0.5 bg-[#EBF2EC] text-[#3A5A40] text-[10px] font-bold rounded-full border border-[#D4E3D7]">
                {movements.length} Registros
              </span>
            </div>
            <p className="text-xs text-[#5F6B61]">
              Registro inmutable de entradas, consumos automáticos por BOM, recepciones de órdenes de compra y ajustes físicos.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Registrar Movimiento Manual
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-[#8F9990] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por SKU, material o referencia..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#D5CEC2] rounded-xl text-xs text-[#1C211D] placeholder-[#8F9990] focus:ring-2 focus:ring-[#3A5A40] focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs text-[#5F6B61] font-bold whitespace-nowrap">Filtrar Tipo:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-white border border-[#D5CEC2] rounded-xl text-xs font-bold text-[#1C211D] focus:ring-2 focus:ring-[#3A5A40] focus:outline-hidden cursor-pointer"
          >
            <option value="all">Todos los Movimientos</option>
            <option value="Entrada">Entrada</option>
            <option value="Salida">Salida</option>
            <option value="Consumo producción">Consumo producción (BOM)</option>
            <option value="Recepción compra">Recepción compra (OC)</option>
            <option value="Ajuste inventario">Ajuste inventario</option>
          </select>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white border border-[#E6E1D8] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E6E1D8] text-[#5F6B61] font-bold">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Tipo Movimiento</th>
                <th className="px-4 py-3">Insumo</th>
                <th className="px-4 py-3">Documento / Referencia</th>
                <th className="px-4 py-3 text-right">Cantidad</th>
                <th className="px-4 py-3 text-right">Saldo Ant.</th>
                <th className="px-4 py-3 text-right">Nuevo Saldo</th>
                <th className="px-4 py-3 text-right">Costo Unit.</th>
                <th className="px-4 py-3">Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EEE6]">
              {filteredMovements.map((mov) => {
                const isPositive =
                  mov.tipo_movimiento === 'Entrada' || mov.tipo_movimiento === 'Recepción compra';

                return (
                  <tr key={mov.id_movimiento} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="px-4 py-3 font-mono text-[#5F6B61] whitespace-nowrap">{mov.fecha}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{getMovementBadge(mov.tipo_movimiento)}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-[#1C211D]">{mov.Nombre_Material}</div>
                      <span className="font-mono text-[10px] text-[#3A5A40]">{mov.SKU_Material}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#1C211D]">{mov.referencia}</div>
                      {mov.observaciones && (
                        <div className="text-[10px] text-[#8F9990] truncate max-w-xs">{mov.observaciones}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold whitespace-nowrap">
                      <span className={isPositive ? 'text-emerald-700' : 'text-rose-700'}>
                        {isPositive ? '+' : '-'}
                        {mov.cantidad.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#8F9990] whitespace-nowrap">
                      {mov.stock_anterior.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[#1C211D] whitespace-nowrap">
                      {mov.stock_posterior.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#5F6B61] whitespace-nowrap">
                      {formatCOP(mov.costo_unitario_COP)}
                    </td>
                    <td className="px-4 py-3 text-[#5F6B61] whitespace-nowrap">{mov.usuario}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Movement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1C211D]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#E6E1D8] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#FAF8F5] border-b border-[#E6E1D8] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#1C211D]">Registrar Movimiento de Inventario</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#5F6B61] hover:text-[#1C211D] cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAdjustment} className="p-6 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-[#1C211D]">Materia Prima / Insumo *</label>
                <select
                  value={selectedMaterialSku}
                  onChange={(e) => setSelectedMaterialSku(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D5CEC2] rounded-xl focus:ring-2 focus:ring-[#3A5A40] focus:outline-hidden cursor-pointer"
                >
                  {materials.map((m) => (
                    <option key={m.id_material} value={m.SKU_Material}>
                      {m.SKU_Material} — {m.Nombre_Material} (Stock: {m.Stock_Actual} {m.Unidad_Medida})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-[#1C211D]">Tipo de Movimiento</label>
                  <select
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value as TipoMovimientoInventario)}
                    className="w-full px-3 py-2 border border-[#D5CEC2] rounded-xl focus:ring-2 focus:ring-[#3A5A40] focus:outline-hidden cursor-pointer"
                  >
                    <option value="Entrada">Entrada Manual</option>
                    <option value="Salida">Salida / Merma</option>
                    <option value="Ajuste inventario">Ajuste Físico</option>
                    <option value="Devolución">Devolución</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-[#1C211D]">Cantidad ({selectedMaterial?.Unidad_Medida})</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#D5CEC2] rounded-xl focus:ring-2 focus:ring-[#3A5A40] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#1C211D]">Documento / Referencia *</label>
                <input
                  type="text"
                  required
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ej: Remisión #4028 o Acta de Inventario Físico"
                  className="w-full px-3 py-2 border border-[#D5CEC2] rounded-xl focus:ring-2 focus:ring-[#3A5A40] focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#1C211D]">Motivo / Observaciones</label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Justificación del movimiento o reporte de auditoría..."
                  className="w-full px-3 py-2 border border-[#D5CEC2] rounded-xl focus:ring-2 focus:ring-[#3A5A40] focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E6E1D8]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#D5CEC2] rounded-xl text-[#5F6B61] hover:bg-[#FAF8F5] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#3A5A40] text-white font-bold rounded-xl hover:bg-[#2D4632] cursor-pointer shadow-xs"
                >
                  Confirmar y Actualizar Saldo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
