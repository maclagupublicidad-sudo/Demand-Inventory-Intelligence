import React, { useState, useEffect } from 'react';
import { RawMaterial } from '../types';
import {
  PackagePlus,
  PackageMinus,
  Sliders,
  ArrowRightLeft,
  X,
  Check,
  AlertCircle,
  FileText,
  Truck,
  Building,
  Info,
} from 'lucide-react';
import { formatCOP } from '../utils/formatters';

export interface StockMovementRecord {
  id: string;
  materialId: string;
  materialSku: string;
  materialName: string;
  type: 'INFLOW_RECEIPT' | 'OUTFLOW_PRODUCTION' | 'PHYSICAL_ADJUSTMENT';
  quantity: number;
  previousStock: number;
  newStock: number;
  previousInTransit: number;
  newInTransit: number;
  referenceDoc?: string; // Remisión, Factura, OP
  reason: string;
  date: string;
  user?: string;
}

interface InventoryMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: RawMaterial | null;
  onApplyMovement: (
    materialId: string,
    newCurrentStock: number,
    newInTransitStock: number,
    movementLog: StockMovementRecord
  ) => void;
}

export const InventoryMovementModal: React.FC<InventoryMovementModalProps> = ({
  isOpen,
  onClose,
  material,
  onApplyMovement,
}) => {
  const [movementType, setMovementType] = useState<
    'INFLOW_RECEIPT' | 'OUTFLOW_PRODUCTION' | 'PHYSICAL_ADJUSTMENT'
  >('INFLOW_RECEIPT');

  // Input states
  const [quantity, setQuantity] = useState<number>(0);
  const [exactPhysicalStock, setExactPhysicalStock] = useState<number>(0);
  const [deductFromInTransit, setDeductFromInTransit] = useState<boolean>(false);
  const [referenceDoc, setReferenceDoc] = useState<string>('');
  const [reason, setReason] = useState<string>('Recepción de pedido de proveedor');

  useEffect(() => {
    if (material) {
      setExactPhysicalStock(material.currentStock);
      setDeductFromInTransit((material.inTransitStock || 0) > 0);
      setQuantity(0);
      setReferenceDoc('');
      setMovementType('INFLOW_RECEIPT');
      setReason('Recepción de pedido de proveedor');
    }
  }, [material, isOpen]);

  if (!isOpen || !material) return null;

  const currentStock = material.currentStock;
  const currentInTransit = material.inTransitStock || 0;

  // Compute preview calculations
  let calculatedNewStock = currentStock;
  let calculatedNewInTransit = currentInTransit;

  if (movementType === 'INFLOW_RECEIPT') {
    calculatedNewStock = currentStock + Math.max(0, quantity);
    if (deductFromInTransit) {
      calculatedNewInTransit = Math.max(0, currentInTransit - Math.max(0, quantity));
    }
  } else if (movementType === 'OUTFLOW_PRODUCTION') {
    calculatedNewStock = Math.max(0, currentStock - Math.max(0, quantity));
  } else if (movementType === 'PHYSICAL_ADJUSTMENT') {
    calculatedNewStock = Math.max(0, exactPhysicalStock);
  }

  const stockDifference = calculatedNewStock - currentStock;

  const handleTypeChange = (
    type: 'INFLOW_RECEIPT' | 'OUTFLOW_PRODUCTION' | 'PHYSICAL_ADJUSTMENT'
  ) => {
    setMovementType(type);
    if (type === 'INFLOW_RECEIPT') {
      setReason('Recepción de pedido de proveedor');
      setDeductFromInTransit(material.inTransitStock > 0);
    } else if (type === 'OUTFLOW_PRODUCTION') {
      setReason('Entrega a mesa de corte / taller de confección');
    } else if (type === 'PHYSICAL_ADJUSTMENT') {
      setReason('Ajuste por conteo físico de inventario en bodega');
      setExactPhysicalStock(material.currentStock);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (movementType !== 'PHYSICAL_ADJUSTMENT' && (!quantity || quantity <= 0)) {
      alert('Por favor ingrese una cantidad mayor a cero.');
      return;
    }

    if (movementType === 'OUTFLOW_PRODUCTION' && quantity > currentStock) {
      const confirmExceed = window.confirm(
        `La cantidad a despachar (${quantity} ${material.unit}) es mayor al stock disponible en bodega (${currentStock} ${material.unit}). ¿Desea continuar dejando el stock en 0?`
      );
      if (!confirmExceed) return;
    }

    const movementLog: StockMovementRecord = {
      id: `MOV-${Date.now()}`,
      materialId: material.id,
      materialSku: material.sku,
      materialName: material.name,
      type: movementType,
      quantity: movementType === 'PHYSICAL_ADJUSTMENT' ? Math.abs(stockDifference) : quantity,
      previousStock: currentStock,
      newStock: calculatedNewStock,
      previousInTransit: currentInTransit,
      newInTransit: calculatedNewInTransit,
      referenceDoc: referenceDoc.trim() || undefined,
      reason: reason.trim() || 'Movimiento de inventario',
      date: new Date().toISOString(),
    };

    onApplyMovement(material.id, calculatedNewStock, calculatedNewInTransit, movementLog);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-[#E6E1D8] overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#E6E1D8] flex items-center justify-between bg-[#FCFBF9]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#EBF2EC] text-[#3A5A40] rounded-xl flex items-center justify-center font-bold">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#1C211D]">
                Ajuste & Movimiento de Inventario
              </h3>
              <p className="text-xs text-[#5F6B61]">
                {material.sku} • {material.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#8F9990] hover:text-[#1C211D] hover:bg-[#FAF8F5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current State Snapshot */}
        <div className="bg-[#FAF8F5] p-3.5 px-4 sm:px-6 border-b border-[#E6E1D8] grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-white p-2 rounded-lg border border-[#E6E1D8]">
            <span className="text-[10px] text-[#5F6B61] font-medium block">Disponible (Físico)</span>
            <span className="font-bold text-[#1C211D] text-sm font-mono">
              {currentStock.toLocaleString()} {material.unit}
            </span>
          </div>
          <div className="bg-white p-2 rounded-lg border border-[#E6E1D8]">
            <span className="text-[10px] text-[#5F6B61] font-medium block">En Tránsito (Comprado)</span>
            <span className="font-bold text-[#3A5A40] text-sm font-mono">
              +{currentInTransit.toLocaleString()} {material.unit}
            </span>
          </div>
          <div className="bg-white p-2 rounded-lg border border-[#E6E1D8]">
            <span className="text-[10px] text-[#5F6B61] font-medium block">Total Proyectado</span>
            <span className="font-bold text-[#1C211D] text-sm font-mono">
              {(currentStock + currentInTransit).toLocaleString()} {material.unit}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Movement Type Tabs */}
          <div>
            <label className="block font-bold text-[#1C211D] mb-1.5">Tipo de Movimiento:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('INFLOW_RECEIPT')}
                className={`p-2.5 rounded-xl border text-left flex flex-col items-center justify-center gap-1 transition-all ${
                  movementType === 'INFLOW_RECEIPT'
                    ? 'bg-[#EBF2EC] border-[#3A5A40] text-[#233829] font-bold shadow-2xs'
                    : 'bg-white border-[#D5CEC2] text-[#5F6B61] hover:bg-[#FAF8F5]'
                }`}
              >
                <PackagePlus className="w-4 h-4 text-[#3A5A40]" />
                <span className="text-[11px] text-center">Entrada / Recepción</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('OUTFLOW_PRODUCTION')}
                className={`p-2.5 rounded-xl border text-left flex flex-col items-center justify-center gap-1 transition-all ${
                  movementType === 'OUTFLOW_PRODUCTION'
                    ? 'bg-rose-50 border-rose-400 text-rose-950 font-bold shadow-2xs'
                    : 'bg-white border-[#D5CEC2] text-[#5F6B61] hover:bg-[#FAF8F5]'
                }`}
              >
                <PackageMinus className="w-4 h-4 text-rose-600" />
                <span className="text-[11px] text-center">Salida / Consumo</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('PHYSICAL_ADJUSTMENT')}
                className={`p-2.5 rounded-xl border text-left flex flex-col items-center justify-center gap-1 transition-all ${
                  movementType === 'PHYSICAL_ADJUSTMENT'
                    ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold shadow-2xs'
                    : 'bg-white border-[#D5CEC2] text-[#5F6B61] hover:bg-[#FAF8F5]'
                }`}
              >
                <Sliders className="w-4 h-4 text-amber-600" />
                <span className="text-[11px] text-center">Conteo Físico</span>
              </button>
            </div>
          </div>

          {/* Dynamic Inputs depending on type */}
          {movementType === 'INFLOW_RECEIPT' && (
            <div className="space-y-3 p-3.5 bg-[#FCFBF9] rounded-xl border border-[#E6E1D8]">
              <div>
                <label className="block font-bold text-[#1C211D] mb-1">
                  Cantidad Recibida ({material.unit}) <span className="text-rose-500">*</span>:
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={quantity || ''}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    placeholder={`Ej. ${material.minOrderQuantity || 100}`}
                    className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-xl font-bold text-sm text-[#1C211D]"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-[#8F9990] font-semibold">
                    {material.unit}
                  </span>
                </div>
              </div>

              {currentInTransit > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="chk-deduct-transit"
                    checked={deductFromInTransit}
                    onChange={(e) => setDeductFromInTransit(e.target.checked)}
                    className="w-4 h-4 rounded text-[#3A5A40] focus:ring-[#3A5A40]"
                  />
                  <label
                    htmlFor="chk-deduct-transit"
                    className="text-xs text-[#1C211D] cursor-pointer font-medium"
                  >
                    Descontar esta cantidad del stock "En Tránsito" (OCs entregadas)
                  </label>
                </div>
              )}
            </div>
          )}

          {movementType === 'OUTFLOW_PRODUCTION' && (
            <div className="space-y-3 p-3.5 bg-[#FCFBF9] rounded-xl border border-[#E6E1D8]">
              <div>
                <label className="block font-bold text-[#1C211D] mb-1">
                  Cantidad a Despachar / Consumir ({material.unit}) <span className="text-rose-500">*</span>:
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={quantity || ''}
                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    placeholder="Ej. 150"
                    className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-xl font-bold text-sm text-[#1C211D]"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-[#8F9990] font-semibold">
                    {material.unit}
                  </span>
                </div>
              </div>
            </div>
          )}

          {movementType === 'PHYSICAL_ADJUSTMENT' && (
            <div className="space-y-3 p-3.5 bg-[#FCFBF9] rounded-xl border border-[#E6E1D8]">
              <div>
                <label className="block font-bold text-[#1C211D] mb-1">
                  Nuevo Stock Real Contado en Bodega ({material.unit}) <span className="text-rose-500">*</span>:
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={exactPhysicalStock}
                    onChange={(e) => setExactPhysicalStock(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-xl font-bold text-sm text-[#1C211D]"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-[#8F9990] font-semibold">
                    {material.unit}
                  </span>
                </div>
              </div>

              <div className="text-xs flex items-center justify-between p-2 rounded-lg bg-stone-100 text-[#5F6B61]">
                <span>Diferencia resultante:</span>
                <span
                  className={`font-mono font-bold ${
                    stockDifference > 0
                      ? 'text-emerald-700'
                      : stockDifference < 0
                      ? 'text-rose-700'
                      : 'text-stone-700'
                  }`}
                >
                  {stockDifference > 0 ? `+${stockDifference}` : stockDifference} {material.unit}
                </span>
              </div>
            </div>
          )}

          {/* Reference Document & Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#1C211D] mb-1">Documento / Remisión / OP:</label>
              <input
                type="text"
                value={referenceDoc}
                onChange={(e) => setReferenceDoc(e.target.value)}
                placeholder="Ej. REM-2026-8942 / OP-045"
                className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-xl text-[#1C211D]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1C211D] mb-1">Motivo / Observación:</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej. Ingreso factura Lafayette #892"
                className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-xl text-[#1C211D]"
              />
            </div>
          </div>

          {/* Impact Preview Box */}
          <div className="p-3.5 bg-[#EBF2EC] rounded-xl border border-[#D4E3D7] space-y-1.5">
            <div className="flex items-center justify-between font-bold text-[#233829]">
              <span>Nuevo Stock Disponible:</span>
              <span className="text-sm font-mono">
                {calculatedNewStock.toLocaleString()} {material.unit}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#5F6B61]">
              <span>Nuevo Stock En Tránsito:</span>
              <span className="font-mono">
                {calculatedNewInTransit.toLocaleString()} {material.unit}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#5F6B61] pt-1 border-t border-[#D4E3D7]">
              <span>Nueva Valoración en Bodega:</span>
              <span className="font-bold text-[#233829] font-mono">
                {formatCOP(calculatedNewStock * material.unitCost, false)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-[#E6E1D8]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#5F6B61] hover:text-[#1C211D]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Confirmar y Aplicar Movimiento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
