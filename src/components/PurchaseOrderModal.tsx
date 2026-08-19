import React, { useState, useMemo } from 'react';
import { PurchaseOrder, PurchaseOrderItem, RawMaterial, MRPResultItem } from '../types';
import { exportPurchaseOrderToPDF } from '../services/pdfExporter';
import { formatCOP } from '../utils/formatters';
import {
  ShoppingCart,
  FileText,
  CheckCircle2,
  Package,
  Clock,
  DollarSign,
  Plus,
  Trash2,
  X,
  Search,
  Filter,
  Truck,
  Building,
  Calendar,
  AlertCircle,
  Save,
  Check,
} from 'lucide-react';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  mrpItems: MRPResultItem[];
  purchaseOrders: PurchaseOrder[];
  rawMaterials: RawMaterial[];
  onCreatePurchaseOrdersFromMRP: (itemsToOrder: MRPResultItem[]) => void;
  onUpdateOrderStatus: (orderId: string, status: 'Borrador' | 'Emitida' | 'En Tránsito' | 'Recibida') => void;
  onAddManualOrder?: (order: PurchaseOrder) => void;
  onDeleteOrder?: (orderId: string) => void;
}

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  mrpItems,
  purchaseOrders,
  rawMaterials,
  onCreatePurchaseOrdersFromMRP,
  onUpdateOrderStatus,
  onAddManualOrder,
  onDeleteOrder,
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Borrador' | 'Emitida' | 'En Tránsito' | 'Recibida'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isCreatingManual, setIsCreatingManual] = useState<boolean>(false);

  // Manual Order Form State
  const [manualSupplier, setManualSupplier] = useState<string>('');
  const [manualCustomSupplier, setManualCustomSupplier] = useState<string>('');
  const [manualDate, setManualDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [manualDeliveryDate, setManualDeliveryDate] = useState<string>(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [manualStatus, setManualStatus] = useState<'Borrador' | 'Emitida' | 'En Tránsito' | 'Recibida'>('Borrador');
  const [manualNotes, setManualNotes] = useState<string>('');
  const [manualItems, setManualItems] = useState<PurchaseOrderItem[]>([]);

  // Item selector in manual form
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState<number>(100);
  const [itemUnitCost, setItemUnitCost] = useState<number>(0);

  // Existing suppliers extracted from raw materials catalog
  const existingSuppliers = useMemo(() => {
    const set = new Set<string>();
    rawMaterials.forEach((m) => {
      if (m.supplierName && m.supplierName.trim()) {
        set.add(m.supplierName.trim());
      }
    });
    return Array.from(set);
  }, [rawMaterials]);

  // Materials needing purchase based on MRP suggested purchase quantity
  const materialsNeedingPurchase = useMemo(() => {
    return mrpItems.filter((i) => i.suggestedPurchaseQty > 0);
  }, [mrpItems]);

  // Filtered orders list based on statusFilter and searchTerm
  const filteredOrders = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const matchStatus = statusFilter === 'ALL' || po.status === statusFilter;
      const matchSearch =
        searchTerm === '' ||
        po.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.items.some((item) =>
          item.rawMaterialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.rawMaterialSku.toLowerCase().includes(searchTerm.toLowerCase())
        );
      return matchStatus && matchSearch;
    });
  }, [purchaseOrders, statusFilter, searchTerm]);

  // Determine currently active order
  const activeOrder = useMemo(() => {
    if (filteredOrders.length === 0) return null;
    const found = filteredOrders.find((po) => po.id === selectedOrderId);
    return found || filteredOrders[0];
  }, [filteredOrders, selectedOrderId]);

  if (!isOpen) return null;

  // Status badge style helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Borrador':
        return 'bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]';
      case 'Emitida':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'En Tránsito':
        return 'bg-indigo-50 text-[#4F46E5] border-indigo-200';
      case 'Recibida':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]';
    }
  };

  const handleGenerateAllNeeded = () => {
    onCreatePurchaseOrdersFromMRP(materialsNeedingPurchase);
  };

  // Open manual order creation form
  const handleOpenManualCreate = () => {
    setIsCreatingManual(true);
    setManualSupplier(existingSuppliers[0] || 'Proveedor Textil');
    setManualCustomSupplier('');
    setManualDate(new Date().toISOString().split('T')[0]);
    setManualDeliveryDate(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setManualStatus('Borrador');
    setManualNotes('');
    setManualItems([]);

    if (rawMaterials.length > 0) {
      setSelectedMaterialId(rawMaterials[0].id);
      setItemQuantity(rawMaterials[0].minOrderQuantity || 100);
      setItemUnitCost(rawMaterials[0].unitCost || 0);
    }
  };

  // When material selected in manual form changes, update unit cost and MOQ
  const handleMaterialChange = (matId: string) => {
    setSelectedMaterialId(matId);
    const mat = rawMaterials.find((m) => m.id === matId);
    if (mat) {
      setItemQuantity(mat.minOrderQuantity || 100);
      setItemUnitCost(mat.unitCost || 0);
    }
  };

  // Add item to manual order
  const handleAddItemToManualOrder = () => {
    const mat = rawMaterials.find((m) => m.id === selectedMaterialId);
    if (!mat || itemQuantity <= 0) return;

    // Check if already in manual items
    const existingIndex = manualItems.findIndex((i) => i.rawMaterialId === mat.id);
    if (existingIndex >= 0) {
      setManualItems((prev) =>
        prev.map((i, idx) =>
          idx === existingIndex
            ? {
                ...i,
                quantity: i.quantity + itemQuantity,
                subtotal: (i.quantity + itemQuantity) * itemUnitCost,
              }
            : i
        )
      );
    } else {
      const newItem: PurchaseOrderItem = {
        rawMaterialId: mat.id,
        rawMaterialSku: mat.sku,
        rawMaterialName: mat.name,
        category: mat.category,
        quantity: itemQuantity,
        unit: mat.unit,
        unitCost: itemUnitCost,
        subtotal: itemQuantity * itemUnitCost,
      };
      setManualItems((prev) => [...prev, newItem]);
    }
  };

  const handleRemoveManualItem = (index: number) => {
    setManualItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Save manual order
  const handleSaveManualOrder = () => {
    const supplier =
      manualSupplier === '__CUSTOM__' ? manualCustomSupplier.trim() : manualSupplier.trim();

    if (!supplier) {
      alert('Por favor especifique el nombre del proveedor.');
      return;
    }

    if (manualItems.length === 0) {
      alert('Debe agregar al menos una materia prima a la orden de compra.');
      return;
    }

    const totalAmount = manualItems.reduce((acc, item) => acc + item.subtotal, 0);
    const newOrderNumber = `OC-MAN-${Date.now().toString().slice(-4)}`;

    const newPO: PurchaseOrder = {
      id: newOrderNumber,
      supplierName: supplier,
      orderDate: manualDate,
      expectedDeliveryDate: manualDeliveryDate,
      status: manualStatus,
      items: manualItems,
      totalAmount,
      notes: manualNotes || 'Orden ingresada manualmente por el operador de compras.',
    };

    if (onAddManualOrder) {
      onAddManualOrder(newPO);
    }

    setSelectedOrderId(newPO.id);
    setIsCreatingManual(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full border border-[#E5E7EB] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 text-[#4F46E5] rounded-lg">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111827]">
                Gestión y Emisión de Órdenes de Compra
              </h3>
              <p className="text-xs text-[#6B7280]">
                Genere OCs agrupadas automáticamente por proveedor o ingréselas manualmente para control de abastecimiento.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F9FAFB] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 md:grid-cols-3 flex-1 overflow-hidden">
          {/* Left Panel: Orders List, Search, and Status Filter */}
          <div className="p-4 border-r border-[#E5E7EB] bg-[#F9FAFB] flex flex-col justify-between overflow-y-auto space-y-4">
            <div className="space-y-3">
              {/* Action Buttons: Auto-Generate and Manual Input */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#111827] uppercase tracking-wider">
                  Órdenes ({purchaseOrders.length})
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleOpenManualCreate}
                    className="px-2.5 py-1 bg-white border border-[#D1D5DB] hover:bg-[#F3F4F6] text-[#374151] rounded-lg text-xs font-bold shadow-2xs transition-colors flex items-center gap-1"
                    title="Ingresar una orden de compra manualmente"
                    id="btn-manual-po"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#4F46E5]" />
                    Manual
                  </button>
                  <button
                    onClick={handleGenerateAllNeeded}
                    disabled={materialsNeedingPurchase.length === 0}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold shadow-2xs transition-colors flex items-center gap-1 ${
                      materialsNeedingPurchase.length > 0
                        ? 'bg-[#4F46E5] hover:bg-[#4338CA] text-white cursor-pointer'
                        : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
                    }`}
                    title="Agrupar automáticamente todo el déficit del MRP por proveedor"
                    id="btn-auto-generate-po"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Auto-Generar ({materialsNeedingPurchase.length})
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por OC o proveedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#D1D5DB] rounded-lg text-xs text-[#111827] placeholder-[#9CA3AF] focus:ring-1 focus:ring-[#4F46E5] focus:outline-hidden"
                />
              </div>

              {/* Status Filter Chips (ACTIVE & FUNCTIONAL) */}
              <div className="flex flex-wrap gap-1">
                {(['ALL', 'Borrador', 'Emitida', 'En Tránsito', 'Recibida'] as const).map((st) => {
                  const count =
                    st === 'ALL'
                      ? purchaseOrders.length
                      : purchaseOrders.filter((p) => p.status === st).length;
                  const isSelected = statusFilter === st;

                  return (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-all ${
                        isSelected
                          ? 'bg-[#4F46E5] text-white border-[#4F46E5] shadow-2xs'
                          : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:text-[#111827] hover:bg-[#F3F4F6]'
                      }`}
                    >
                      {st === 'ALL' ? 'Todos' : st} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Orders List */}
              {filteredOrders.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#6B7280] bg-white rounded-xl border border-dashed border-[#D1D5DB] space-y-2">
                  <p>No se encontraron órdenes con el filtro seleccionado.</p>
                  {statusFilter !== 'ALL' && (
                    <button
                      onClick={() => setStatusFilter('ALL')}
                      className="text-xs font-bold text-[#4F46E5] hover:underline"
                    >
                      Ver todas las órdenes
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {filteredOrders.map((po) => {
                    const isSelected = !isCreatingManual && activeOrder && activeOrder.id === po.id;

                    return (
                      <div
                        key={po.id}
                        onClick={() => {
                          setIsCreatingManual(false);
                          setSelectedOrderId(po.id);
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-white border-[#4F46E5] shadow-xs ring-1 ring-[#4F46E5]'
                            : 'bg-white border-[#E5E7EB] hover:border-[#D1D5DB]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-[#111827]">{po.id}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getStatusBadge(
                              po.status
                            )}`}
                          >
                            {po.status}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-[#374151] mt-1 truncate">
                          {po.supplierName}
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-[#6B7280] mt-2 pt-2 border-t border-[#F3F4F6]">
                          <span>{po.items.length} materias primas</span>
                          <span className="font-bold text-[#111827]">
                            {formatCOP(po.totalAmount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Inventory Sync Helper Notice */}
            <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-[11px] text-[#374151] space-y-1">
              <strong className="block font-bold text-[#4F46E5]">Sincronización Automática:</strong>
              <p className="text-[10px] text-[#4B5563]">
                Al marcar una orden como <em>"En Tránsito"</em>, el sistema suma las cantidades al inventario en tránsito para reducir el déficit del MRP.
              </p>
            </div>
          </div>

          {/* Right Panel: Active Order View OR Manual Order Creation Form */}
          <div className="md:col-span-2 p-6 overflow-y-auto flex flex-col justify-between space-y-6 bg-white">
            {/* VIEW A: MANUAL ORDER CREATION FORM */}
            {isCreatingManual ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-50 text-[#4F46E5] rounded-lg">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#111827]">Nueva Orden de Compra Manual</h4>
                      <p className="text-xs text-[#6B7280]">
                        Seleccione el proveedor, configure las fechas y agregue los insumos necesarios.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsCreatingManual(false)}
                    className="text-xs text-[#6B7280] hover:text-[#111827] font-semibold"
                  >
                    Cancelar
                  </button>
                </div>

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Supplier */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-[#374151]">Proveedor:</label>
                    <div className="flex gap-2">
                      <select
                        value={manualSupplier}
                        onChange={(e) => setManualSupplier(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg font-semibold text-[#111827] focus:ring-1 focus:ring-[#4F46E5] focus:outline-hidden"
                      >
                        {existingSuppliers.map((sup) => (
                          <option key={sup} value={sup}>
                            {sup}
                          </option>
                        ))}
                        <option value="__CUSTOM__">+ Otro Proveedor Nuevo...</option>
                      </select>

                      {manualSupplier === '__CUSTOM__' && (
                        <input
                          type="text"
                          placeholder="Nombre del nuevo proveedor..."
                          value={manualCustomSupplier}
                          onChange={(e) => setManualCustomSupplier(e.target.value)}
                          className="flex-1 px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg text-[#111827] focus:ring-1 focus:ring-[#4F46E5] focus:outline-hidden"
                        />
                      )}
                    </div>
                  </div>

                  {/* Order Date */}
                  <div className="space-y-1">
                    <label className="font-bold text-[#374151]">Fecha de Emisión:</label>
                    <input
                      type="date"
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg text-[#111827] focus:ring-1 focus:ring-[#4F46E5] focus:outline-hidden"
                    />
                  </div>

                  {/* Expected Delivery Date */}
                  <div className="space-y-1">
                    <label className="font-bold text-[#374151]">Fecha Estimada de Entrega:</label>
                    <input
                      type="date"
                      value={manualDeliveryDate}
                      onChange={(e) => setManualDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg text-[#111827] focus:ring-1 focus:ring-[#4F46E5] focus:outline-hidden"
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-1">
                    <label className="font-bold text-[#374151]">Estado Inicial:</label>
                    <select
                      value={manualStatus}
                      onChange={(e) => setManualStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg font-semibold text-[#111827] focus:ring-1 focus:ring-[#4F46E5] focus:outline-hidden"
                    >
                      <option value="Borrador">Borrador</option>
                      <option value="Emitida">Emitida a Proveedor</option>
                      <option value="En Tránsito">En Tránsito (Suma a Stock)</option>
                      <option value="Recibida">Recibida en Bodega</option>
                    </select>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1">
                    <label className="font-bold text-[#374151]">Notas / Observaciones:</label>
                    <input
                      type="text"
                      placeholder="Ej: Orden urgente para tejeduría local"
                      value={manualNotes}
                      onChange={(e) => setManualNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#D1D5DB] rounded-lg text-[#111827] focus:ring-1 focus:ring-[#4F46E5] focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Add Materials Section */}
                <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] space-y-3">
                  <span className="font-bold text-xs text-[#111827] block">
                    Agregar Materias Primas a la Orden:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] text-[#6B7280] block mb-0.5">Materia Prima:</label>
                      <select
                        value={selectedMaterialId}
                        onChange={(e) => handleMaterialChange(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-[#D1D5DB] rounded-lg font-medium text-[#111827]"
                      >
                        {rawMaterials.map((m) => (
                          <option key={m.id} value={m.id}>
                            [{m.sku}] {m.name} ({m.category})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-[#6B7280] block mb-0.5">Cantidad:</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-white border border-[#D1D5DB] rounded-lg font-bold text-[#111827]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-[#6B7280] block mb-0.5">Costo Unit. (COP):</label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={itemUnitCost}
                        onChange={(e) => setItemUnitCost(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-white border border-[#D1D5DB] rounded-lg font-bold text-[#111827]"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleAddItemToManualOrder}
                        className="w-full px-3 py-1.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg font-bold flex items-center justify-center gap-1 transition-colors shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar Ítem
                      </button>
                    </div>
                  </div>
                </div>

                {/* Added Items List */}
                <div className="border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F9FAFB] text-[#6B7280] font-semibold border-b border-[#E5E7EB] text-[11px] uppercase">
                      <tr>
                        <th className="p-3">SKU</th>
                        <th className="p-3">Materia Prima</th>
                        <th className="p-3 text-right">Cantidad</th>
                        <th className="p-3 text-right">P. Unitario</th>
                        <th className="p-3 text-right">Subtotal COP</th>
                        <th className="p-3 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {manualItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-[#9CA3AF]">
                            No ha agregado insumos a esta orden aún. Seleccione uno arriba y presione "Agregar Ítem".
                          </td>
                        </tr>
                      ) : (
                        manualItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-[#F9FAFB]">
                            <td className="p-3 font-mono text-[#6B7280]">{item.rawMaterialSku}</td>
                            <td className="p-3 font-semibold text-[#111827]">{item.rawMaterialName}</td>
                            <td className="p-3 text-right font-bold text-[#111827]">
                              {item.quantity.toLocaleString()} {item.unit}
                            </td>
                            <td className="p-3 text-right text-[#6B7280]">{formatCOP(item.unitCost, false)}</td>
                            <td className="p-3 text-right font-bold text-[#111827]">
                              {formatCOP(item.subtotal)}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveManualItem(idx)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Quitar ítem"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Total and Save Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
                  <div className="text-xs text-[#6B7280]">
                    Total ítems: <strong>{manualItems.length}</strong>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[11px] text-[#6B7280] block">TOTAL A EMITIR:</span>
                      <span className="text-base font-black text-[#4F46E5]">
                        {formatCOP(manualItems.reduce((s, i) => s + i.subtotal, 0))}
                      </span>
                    </div>
                    <button
                      onClick={handleSaveManualOrder}
                      disabled={manualItems.length === 0}
                      className={`px-5 py-2 rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all ${
                        manualItems.length > 0
                          ? 'bg-[#4F46E5] hover:bg-[#4338CA] text-white cursor-pointer'
                          : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
                      }`}
                    >
                      <Save className="w-4 h-4" />
                      Guardar Orden de Compra
                    </button>
                  </div>
                </div>
              </div>
            ) : activeOrder ? (
              /* VIEW B: ACTIVE ORDER DETAILS & EXPORT */
              <div className="space-y-5">
                {/* Top Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F9FAFB] p-4 rounded-xl border border-[#E5E7EB]">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-[#111827]">{activeOrder.id}</h4>
                      <span className="text-xs text-[#6B7280]">• Emisión: {activeOrder.orderDate}</span>
                      <span className="text-xs text-[#6B7280]">• Entrega: {activeOrder.expectedDeliveryDate}</span>
                    </div>
                    <p className="text-xs text-[#4B5563] font-medium mt-0.5">
                      Proveedor: <strong className="text-[#111827]">{activeOrder.supplierName}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status Dropdown */}
                    <select
                      value={activeOrder.status}
                      onChange={(e) => onUpdateOrderStatus(activeOrder.id, e.target.value as any)}
                      className="px-3 py-1.5 bg-white border border-[#D1D5DB] rounded-lg text-xs font-bold text-[#111827] focus:ring-1 focus:ring-[#4F46E5]"
                    >
                      <option value="Borrador">Borrador</option>
                      <option value="Emitida">Emitida a Proveedor</option>
                      <option value="En Tránsito">En Tránsito (Suma a Stock)</option>
                      <option value="Recibida">Recibida en Bodega</option>
                    </select>

                    {/* PDF Export Button */}
                    <button
                      onClick={() => exportPurchaseOrderToPDF(activeOrder)}
                      className="px-3 py-1.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors"
                      id="btn-export-po-pdf"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Descargar PDF
                    </button>

                    {/* Delete button if provided */}
                    {onDeleteOrder && (
                      <button
                        onClick={() => {
                          if (confirm(`¿Desea eliminar la orden de compra ${activeOrder.id}?`)) {
                            onDeleteOrder(activeOrder.id);
                          }
                        }}
                        className="p-1.5 text-[#9CA3AF] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Eliminar esta orden"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Items Table */}
                <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F9FAFB] text-[#6B7280] font-semibold border-b border-[#E5E7EB] text-[11px] uppercase">
                      <tr>
                        <th className="p-3">SKU</th>
                        <th className="p-3">Materia Prima</th>
                        <th className="p-3">Categoría</th>
                        <th className="p-3 text-right">Cantidad</th>
                        <th className="p-3 text-right">P. Unitario</th>
                        <th className="p-3 text-right">Subtotal COP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {activeOrder.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-[#F9FAFB]">
                          <td className="p-3 font-mono text-[#6B7280]">{item.rawMaterialSku}</td>
                          <td className="p-3 font-semibold text-[#111827]">{item.rawMaterialName}</td>
                          <td className="p-3 text-[#6B7280]">{item.category}</td>
                          <td className="p-3 text-right font-bold text-[#111827]">
                            {item.quantity.toLocaleString()} {item.unit}
                          </td>
                          <td className="p-3 text-right text-[#6B7280]">{formatCOP(item.unitCost, false)}</td>
                          <td className="p-3 text-right font-bold text-[#111827]">
                            {formatCOP(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Summary Card */}
                <div className="flex justify-end">
                  <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 w-72 space-y-2 text-xs">
                    <div className="flex justify-between text-[#6B7280]">
                      <span>Total Unidades / Metros:</span>
                      <span className="font-bold text-[#111827]">
                        {activeOrder.items.reduce((s, i) => s + i.quantity, 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-[#111827] pt-2 border-t border-[#E5E7EB]">
                      <span>TOTAL ORDEN:</span>
                      <span className="text-[#4F46E5]">
                        {formatCOP(activeOrder.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-[#9CA3AF] space-y-3">
                <Package className="w-12 h-12 text-[#D1D5DB] mx-auto" />
                <p className="text-sm">Seleccione o genere una orden de compra para visualizarla.</p>
                <button
                  onClick={handleOpenManualCreate}
                  className="px-4 py-2 bg-[#4F46E5] text-white rounded-lg text-xs font-bold shadow-2xs"
                >
                  + Ingresar Nueva Orden Manual
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-between">
          <span className="text-xs text-[#6B7280]">
            {purchaseOrders.length} órdenes registradas en el sistema
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#111827] hover:bg-black text-white rounded-lg text-xs font-bold transition-colors"
          >
            Aceptar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
