import React, { useState } from 'react';
import { RawMaterial, MaterialCategory, MaterialUnit } from '../types';
import { Package, X, Check, Plus } from 'lucide-react';

interface NewMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMaterial: (material: RawMaterial) => void;
}

export const NewMaterialModal: React.FC<NewMaterialModalProps> = ({
  isOpen,
  onClose,
  onAddMaterial,
}) => {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MaterialCategory>('Tela');
  const [unit, setUnit] = useState<MaterialUnit>('m');
  const [currentStock, setCurrentStock] = useState(500);
  const [inTransitStock, setInTransitStock] = useState(0);
  const [safetyStockDays, setSafetyStockDays] = useState(15);
  const [minOrderQuantity, setMinOrderQuantity] = useState(300);
  const [unitCost, setUnitCost] = useState(18500);
  const [leadTimeDays, setLeadTimeDays] = useState(25);
  const [supplierName, setSupplierName] = useState('Tejidos Nacionales S.A.');
  const [color, setColor] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku) {
      alert('Por favor ingrese el SKU y el nombre de la materia prima.');
      return;
    }

    const newMat: RawMaterial = {
      id: `MAT-${Date.now()}`,
      sku: sku.toUpperCase().trim(),
      name: name.trim(),
      category,
      unit,
      currentStock,
      inTransitStock,
      safetyStockDays,
      minOrderQuantity,
      unitCost,
      leadTimeDays,
      supplierName: supplierName.trim(),
      color: color ? color.trim() : undefined,
    };

    onAddMaterial(newMat);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Registrar Nueva Materia Prima</h3>
              <p className="text-xs text-slate-500">
                Añada telas, botones, hilos, cremalleras o empaques al maestro de inventario.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nombre del Insumo / Tela:</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Tela Rib 100% Algodón 2x1"
                className="w-full p-2 border border-slate-300 rounded-lg font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Código SKU / Referencia:</label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Ej. TEL-RIB-ALG-01"
                className="w-full p-2 border border-slate-300 rounded-lg font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Categoría:</label>
              <select
                value={category}
                onChange={(e) => {
                  const val = e.target.value as MaterialCategory;
                  setCategory(val);
                  if (val === 'Tela') setUnit('m');
                  else if (val === 'Hilo') setUnit('cono');
                  else if (val === 'Avío / Fornitura') setUnit('u');
                }}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Tela">Tela / Tejido</option>
                <option value="Avío / Fornitura">Avío / Fornitura</option>
                <option value="Hilo">Hilo / Hilado</option>
                <option value="Entretela">Entretela</option>
                <option value="Empaque / Etiqueta">Empaque / Etiqueta</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Unidad de Medida:</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as MaterialUnit)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold"
              >
                <option value="m">Metros (m)</option>
                <option value="kg">Kilogramos (kg)</option>
                <option value="u">Unidades (u)</option>
                <option value="cono">Conos (5.000m)</option>
                <option value="rollo">Rollos</option>
                <option value="paquete">Paquetes</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Color / Especificación:</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Ej. Negro Ónix / 220 GSM"
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Stock Actual en Bodega:</label>
              <input
                type="number"
                min="0"
                value={currentStock}
                onChange={(e) => setCurrentStock(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-slate-300 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Costo Unitario (COP):</label>
              <input
                type="number"
                step="100"
                min="0"
                value={unitCost}
                onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-slate-300 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Pedido Mínimo (MOQ):</label>
              <input
                type="number"
                min="1"
                value={minOrderQuantity}
                onChange={(e) => setMinOrderQuantity(parseFloat(e.target.value) || 1)}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nombre del Proveedor:</label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Ej. Hilanderías del Sur"
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tiempo de Entrega (Lead Time Días):</label>
              <input
                type="number"
                min="1"
                max="180"
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(parseInt(e.target.value) || 1)}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Guardar Materia Prima
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
