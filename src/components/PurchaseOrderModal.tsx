import React, { useState, useMemo } from 'react';
import { PurchaseOrder, PurchaseOrderItem, RawMaterial, MRPResultItem } from '../types';
import { exportPurchaseOrderToPDF } from '../services/pdfExporter';
import { formatCOP } from '../utils/formatters';
import {
  ShoppingCart,
  FileText,
  Package,
  Plus,
  Trash2,
  X,
  Search,
  Building,
  Save,
  ChevronLeft,
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
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

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
        return 'bg-[#FAF8F5] text-[#5F6B61] border-[#E6E1D8]';
      case 'Emitida':
        return 'bg-[#EEF2F6] text-[#2D4A6E] border-[#D0DCE8]';
      case 'En Tránsito':
        return 'bg-[#F4F7EE] text-[#435C2B] border-[#DCE8CB]';
      case 'Recibida':
        return 'bg-[#EBF2EC] text-[#233829] border-[#D4E3D7]';
      default:
        return 'bg-[#FAF8F5] text-[#5F6B61] border-[#E6E1D8]';
    }
  };

  const handleGenerateAllNeeded = () => {
    onCreatePurchaseOrdersFromMRP(materialsNeedingPurchase);
  };

  // Open manual order creation form
  const handleOpenManualCreate = () => {
    setIsCreatingManual(true);
    setMobileView('detail');
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

  const handleMaterialChange = (matId: string) => {
    setSelectedMaterialId(matId);
    const mat = rawMaterials.find((m) => m.id === matId);
    if (mat) {
      setItemUnitCost(mat.unitCost || 0);
      setItemQuantity(mat.minOrderQuantity || 100);
    }
  };

  const handleAddItemToManualOrder = () => {
    const mat = rawMaterials.find((m) => m.id === selectedMaterialId);
    if (!mat || itemQuantity <= 0) return;

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
  };

  const handleRemoveManualItem = (index: number) => {
    setManualItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveManualOrder = () => {
    if (manualItems.length === 0) return;

    const finalSupplier =
      manualSupplier === '__CUSTOM__' ? manualCustomSupplier || 'Proveedor General' : manualSupplier;

    const totalAmount = manualItems.reduce((acc, item) => acc + item.subtotal, 0);
    const newPO: PurchaseOrder = {
      id: `OC-MAN-${Date.now().toString().slice(-4)}`,
      supplierName: finalSupplier,
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
    setMobileView('detail');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full border border-[#E6E1D8] overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E6E1D8] flex items-center justify-between bg-[#FCFBF9]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#EBF2EC] text-[#3A5A40] rounded-lg">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#1C211D]">
                Gestión y Emisión de Órdenes de Compra
              </h3>
              <p className="text-[11px] text-[#5F6B61] hidden sm:block">
                Genere OCs agrupadas automáticamente por proveedor o ingréselas manualmente para control de abastecimiento.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8F9990] hover:text-[#1C211D] hover:bg-[#FAF8F5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile View Toggle Buttons on screens < md */}
        <div className="md:hidden flex border-b border-[#E6E1D8] bg-[#FAF8F5]">
          <button
            onClick={() => setMobileView('list')}
            className={`flex-1 py-2 text-xs font-bold text-center border-b-2 ${
              mobileView === 'list'
                ? 'border-[#3A5A40] text-[#3A5A40] bg-white'
                : 'border-transparent text-[#5F6B61]'
            }`}
          >
            Lista de Órdenes ({purchaseOrders.length})
          </button>
          <button
            onClick={() => setMobileView('detail')}
            className={`flex-1 py-2 text-xs font-bold text-center border-b-2 ${
              mobileView === 'detail'
                ? 'border-[#3A5A40] text-[#3A5A40] bg-white'
                : 'border-transparent text-[#5F6B61]'
            }`}
          >
            {isCreatingManual ? 'Nueva Orden' : activeOrder ? `Detalle (${activeOrder.id})` : 'Detalle'}
          </button>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 md:grid-cols-3 flex-1 overflow-hidden">
          {/* Left Panel: Orders List */}
          <div
            className={`${
              mobileView === 'detail' ? 'hidden md:flex' : 'flex'
            } p-3.5 sm:p-4 border-r border-[#E6E1D8] bg-[#FAF8F5] flex-col justify-between overflow-y-auto space-y-3.5`}
          >
            <div className="space-y-3">
              {/* Action Buttons: Auto-Generate and Manual Input */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#1C211D] uppercase tracking-wider">
                  Órdenes ({purchaseOrders.length})
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleOpenManualCreate}
                    className="px-2.5 py-1 bg-white border border-[#D5CEC2] hover:bg-[#FAF8F5] text-[#1C211D] rounded-lg text-xs font-bold shadow-2xs transition-colors flex items-center gap-1 active:scale-95"
                    title="Ingresar una orden de compra manualmente"
                    id="btn-manual-po"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#3A5A40]" />
                    Manual
                  </button>
                  <button
                    onClick={handleGenerateAllNeeded}
                    disabled={materialsNeedingPurchase.length === 0}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold shadow-2xs transition-colors flex items-center gap-1 active:scale-95 ${
                      materialsNeedingPurchase.length > 0
                        ? 'bg-[#3A5A40] hover:bg-[#2D4632] text-white cursor-pointer'
                        : 'bg-[#E6E1D8] text-[#8F9990] cursor-not-allowed'
                    }`}
                    title="Agrupar automáticamente todo el déficit del MRP por proveedor"
                    id="btn-auto-generate-po"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Auto ({materialsNeedingPurchase.length})
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8F9990] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por OC o proveedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#D5CEC2] rounded-lg text-xs text-[#1C211D] placeholder-[#8F9990] focus:ring-1 focus:ring-[#3A5A40] focus:outline-hidden"
                />
              </div>

              {/* Status Filter Chips */}
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
                          ? 'bg-[#3A5A40] text-white border-[#3A5A40] shadow-2xs'
                          : 'bg-white text-[#5F6B61] border-[#E6E1D8] hover:text-[#1C211D] hover:bg-[#FAF8F5]'
                      }`}
                    >
                      {st === 'ALL' ? 'Todos' : st} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Orders List */}
              {filteredOrders.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#5F6B61] bg-white rounded-xl border border-dashed border-[#D5CEC2] space-y-2">
                  <p>No se encontraron órdenes con el filtro seleccionado.</p>
                  {statusFilter !== 'ALL' && (
                    <button
                      onClick={() => setStatusFilter('ALL')}
                      className="text-xs font-bold text-[#3A5A40] hover:underline"
                    >
                      Ver todas las órdenes
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-[48vh] sm:max-h-[50vh] overflow-y-auto pr-1">
                  {filteredOrders.map((po) => {
                    const isSelected = !isCreatingManual && activeOrder && activeOrder.id === po.id;

                    return (
                      <div
                        key={po.id}
                        onClick={() => {
                          setIsCreatingManual(false);
                          setSelectedOrderId(po.id);
                          setMobileView('detail');
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-white border-[#3A5A40] shadow-xs ring-1 ring-[#3A5A40]'
                            : 'bg-white border-[#E6E1D8] hover:border-[#D5CEC2]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-[#1C211D]">{po.id}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getStatusBadge(
                              po.status
                            )}`}
                          >
                            {po.status}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-[#1C211D] mt-1 truncate">
                          {po.supplierName}
                        </div>
                        <div className="flex justify-between items-center text-[11px] text-[#5F6B61] mt-2 pt-2 border-t border-[#F2EEE6]">
                          <span>{po.items.length} insumos</span>
                          <span className="font-bold text-[#1C211D]">
                            {formatCOP(po.totalAmount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Inventory Sync Notice */}
            <div className="p-3 bg-[#EBF2EC]/50 border border-[#D4E3D7] rounded-xl text-[11px] text-[#1C211D] space-y-1">
              <strong className="block font-bold text-[#3A5A40]">Sincronización Automática:</strong>
              <p className="text-[10px] text-[#5F6B61]">
                Al marcar una orden como <em>"En Tránsito"</em>, el sistema suma las cantidades al inventario en tránsito para reducir el déficit del MRP.
              </p>
            </div>
          </div>

          {/* Right Panel: Active Order View OR Manual Creation Form */}
          <div
            className={`${
              mobileView === 'list' ? 'hidden md:flex' : 'flex'
            } md:col-span-2 p-4 sm:p-6 overflow-y-auto flex-col justify-between space-y-5 bg-white`}
          >
            {/* VIEW A: MANUAL ORDER CREATION FORM */}
            {isCreatingManual ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E6E1D8]">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[#EBF2EC] text-[#3A5A40] rounded-lg">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1C211D]">Nueva Orden de Compra Manual</h4>
                      <p className="text-[11px] text-[#5F6B61]">
                        Seleccione el proveedor, configure las fechas y agregue los insumos.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsCreatingManual(false);
                      setMobileView('list');
                    }}
                    className="text-xs text-[#5F6B61] hover:text-[#1C211D] font-semibold"
                  >
                    Cancelar
                  </button>
                </div>

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Supplier */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-bold text-[#1C211D]">Proveedor:</label>
                    <div className="flex gap-2">
                      <select
                        value={manualSupplier}
                        onChange={(e) => setManualSupplier(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-[#D5CEC2] rounded-lg font-semibold text-[#1C211D] focus:ring-1 focus:ring-[#3A5A40]"
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
                          className="flex-1 px-3 py-2 bg-white border border-[#D5CEC2] rounded-lg text-[#1C211D] focus:ring-1 focus:ring-[#3A5A40]"
                        />
                      )}
                    </div>
                  </div>

                  {/* Order Date */}
                  <div className="space-y-1">
                    <label className="font-bold text-[#1C211D]">Fecha de Emisión:</label>
                    <input
                      type="date"
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded-lg text-[#1C211D]"
                    />
                  </div>

                  {/* Expected Delivery Date */}
                  <div className="space-y-1">
                    <label className="font-bold text-[#1C211D]">Fecha Estimada de Entrega:</label>
                    <input
                      type="date"
                      value={manualDeliveryDate}
                      onChange={(e) => setManualDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded-lg text-[#1C211D]"
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-1">
                    <label className="font-bold text-[#1C211D]">Estado Inicial:</label>
                    <select
                      value={manualStatus}
                      onChange={(e) => setManualStatus(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded-lg font-semibold text-[#1C211D]"
                    >
                      <option value="Borrador">Borrador</option>
                      <option value="Emitida">Emitida a Proveedor</option>
                      <option value="En Tránsito">En Tránsito (Suma a Stock)</option>
                      <option value="Recibida">Recibida en Bodega</option>
                    </select>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1">
                    <label className="font-bold text-[#1C211D]">Notas / Observaciones:</label>
                    <input
                      type="text"
                      placeholder="Ej: Orden urgente para tejeduría local"
                      value={manualNotes}
                      onChange={(e) => setManualNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#D5CEC2] rounded-lg text-[#1C211D]"
                    />
                  </div>
                </div>

                {/* Add Materials Section */}
                <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E6E1D8] space-y-2.5">
                  <span className="font-bold text-xs text-[#1C211D] block">
                    Agregar Materias Primas a la Orden:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] text-[#5F6B61] block mb-0.5">Materia Prima:</label>
                      <select
                        value={selectedMaterialId}
                        onChange={(e) => handleMaterialChange(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#D5CEC2] rounded-lg font-medium text-[#1C211D]"
                      >
                        {rawMaterials.map((m) => (
                          <option key={m.id} value={m.id}>
                            [{m.sku}] {m.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-[#5F6B61] block mb-0.5">Cantidad:</label>
                      <input
                        type="number"
                        min="1"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#D5CEC2] rounded-lg font-bold text-[#1C211D]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-[#5F6B61] block mb-0.5">Costo Unit. (COP):</label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={itemUnitCost}
                        onChange={(e) => setItemUnitCost(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#D5CEC2] rounded-lg font-bold text-[#1C211D]"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleAddItemToManualOrder}
                        className="w-full px-3 py-1.5 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-lg font-bold flex items-center justify-center gap-1 transition-colors shadow-2xs active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Added Items List */}
                <div className="border border-[#E6E1D8] rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF8F5] text-[#5F6B61] font-semibold border-b border-[#E6E1D8] text-[10px] uppercase">
                      <tr>
                        <th className="p-2.5">SKU</th>
                        <th className="p-2.5">Materia Prima</th>
                        <th className="p-2.5 text-right">Cantidad</th>
                        <th className="p-2.5 text-right">Subtotal COP</th>
                        <th className="p-2.5 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F2EEE6]">
                      {manualItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-[#8F9990]">
                            No ha agregado insumos aún.
                          </td>
                        </tr>
                      ) : (
                        manualItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-[#FAF8F5]">
                            <td className="p-2.5 font-mono text-[#5F6B61]">{item.rawMaterialSku}</td>
                            <td className="p-2.5 font-semibold text-[#1C211D]">{item.rawMaterialName}</td>
                            <td className="p-2.5 text-right font-bold text-[#1C211D]">
                              {item.quantity.toLocaleString()} {item.unit}
                            </td>
                            <td className="p-2.5 text-right font-bold text-[#1C211D]">
                              {formatCOP(item.subtotal)}
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveManualItem(idx)}
                                className="text-[#B33927] p-1"
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#E6E1D8]">
                  <div className="text-xs text-[#5F6B61]">
                    Total ítems: <strong>{manualItems.length}</strong>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <span className="text-[10px] text-[#5F6B61] block">TOTAL:</span>
                      <span className="text-sm sm:text-base font-bold text-[#3A5A40]">
                        {formatCOP(manualItems.reduce((s, i) => s + i.subtotal, 0))}
                      </span>
                    </div>
                    <button
                      onClick={handleSaveManualOrder}
                      disabled={manualItems.length === 0}
                      className={`px-4 py-2 rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95 ${
                        manualItems.length > 0
                          ? 'bg-[#3A5A40] hover:bg-[#2D4632] text-white cursor-pointer'
                          : 'bg-[#E6E1D8] text-[#8F9990] cursor-not-allowed'
                      }`}
                    >
                      <Save className="w-4 h-4" />
                      Guardar OC
                    </button>
                  </div>
                </div>
              </div>
            ) : activeOrder ? (
              /* VIEW B: ACTIVE ORDER DETAILS & EXPORT */
              <div className="space-y-4">
                {/* Top Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FCFBF9] p-3.5 sm:p-4 rounded-xl border border-[#E6E1D8]">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-[#1C211D]">{activeOrder.id}</h4>
                      <span className="text-xs text-[#5F6B61]">• Emisión: {activeOrder.orderDate}</span>
                    </div>
                    <p className="text-xs text-[#1C211D] font-medium mt-0.5">
                      Proveedor: <strong className="text-[#3A5A40]">{activeOrder.supplierName}</strong>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Dropdown */}
                    <select
                      value={activeOrder.status}
                      onChange={(e) => onUpdateOrderStatus(activeOrder.id, e.target.value as any)}
                      className="px-2.5 py-1.5 bg-white border border-[#D5CEC2] rounded-lg text-xs font-bold text-[#1C211D] focus:ring-1 focus:ring-[#3A5A40]"
                    >
                      <option value="Borrador">Borrador</option>
                      <option value="Emitida">Emitida a Proveedor</option>
                      <option value="En Tránsito">En Tránsito (Suma a Stock)</option>
                      <option value="Recibida">Recibida en Bodega</option>
                    </select>

                    {/* PDF Export Button */}
                    <button
                      onClick={() => exportPurchaseOrderToPDF(activeOrder)}
                      className="px-3 py-1.5 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors active:scale-95"
                      id="btn-export-po-pdf"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      PDF
                    </button>

                    {onDeleteOrder && (
                      <button
                        onClick={() => {
                          if (confirm(`¿Desea eliminar la orden de compra ${activeOrder.id}?`)) {
                            onDeleteOrder(activeOrder.id);
                          }
                        }}
                        className="p-1.5 text-[#8F9990] hover:text-[#B33927] rounded-lg transition-colors"
                        title="Eliminar esta orden"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Items Table */}
                <div className="bg-white border border-[#E6E1D8] rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF8F5] text-[#5F6B61] font-semibold border-b border-[#E6E1D8] text-[10px] uppercase">
                      <tr>
                        <th className="p-3">SKU</th>
                        <th className="p-3">Materia Prima</th>
                        <th className="p-3 text-right">Cantidad</th>
                        <th className="p-3 text-right">P. Unitario</th>
                        <th className="p-3 text-right">Subtotal COP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F2EEE6]">
                      {activeOrder.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-[#FAF8F5]">
                          <td className="p-3 font-mono text-[#5F6B61]">{item.rawMaterialSku}</td>
                          <td className="p-3 font-semibold text-[#1C211D]">{item.rawMaterialName}</td>
                          <td className="p-3 text-right font-bold text-[#1C211D]">
                            {item.quantity.toLocaleString()} {item.unit}
                          </td>
                          <td className="p-3 text-right text-[#5F6B61]">{formatCOP(item.unitCost, false)}</td>
                          <td className="p-3 text-right font-bold text-[#1C211D]">
                            {formatCOP(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Summary Card */}
                <div className="flex justify-end">
                  <div className="bg-[#FAF8F5] border border-[#E6E1D8] rounded-xl p-3.5 w-72 space-y-2 text-xs">
                    <div className="flex justify-between text-[#5F6B61]">
                      <span>Total Cantidad:</span>
                      <span className="font-bold text-[#1C211D]">
                        {activeOrder.items.reduce((s, i) => s + i.quantity, 0).toLocaleString()} u
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-[#1C211D] pt-2 border-t border-[#E6E1D8]">
                      <span>TOTAL ORDEN:</span>
                      <span className="text-[#3A5A40]">
                        {formatCOP(activeOrder.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 sm:p-12 text-center text-[#8F9990] space-y-3">
                <Package className="w-10 h-10 text-[#D5CEC2] mx-auto" />
                <p className="text-xs">Seleccione o genere una orden de compra para visualizarla.</p>
                <button
                  onClick={handleOpenManualCreate}
                  className="px-4 py-2 bg-[#3A5A40] text-white rounded-lg text-xs font-bold shadow-2xs"
                >
                  + Ingresar Nueva Orden Manual
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-[#E6E1D8] bg-[#FCFBF9] flex items-center justify-between">
          <span className="text-xs text-[#5F6B61]">
            {purchaseOrders.length} órdenes registradas
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#1C211D] hover:bg-[#2D4632] text-white rounded-lg text-xs font-bold transition-colors active:scale-95"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
