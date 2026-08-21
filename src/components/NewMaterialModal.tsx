import React, { useState } from 'react';
import { RawMaterial, MaterialCategory, MaterialUnit } from '../types';
import { Package, X, Check } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-[#E6E1D8] overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E6E1D8] flex items-center justify-between bg-[#FCFBF9]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-[#EBF2EC] text-[#3A5A40] rounded-lg">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#1C211D]">Registrar Nueva Materia Prima</h3>
              <p className="text-[11px] text-[#5F6B61]">
                Añada telas, botones, hilos, cremalleras o empaques al maestro de inventario.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#8F9990] hover:text-[#1C211D]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5 overflow-y-auto flex-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#1C211D] mb-1">Nombre del Insumo / Tela:</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Tela Rib 100% Algodón 2x1"
                className="w-full p-2 bg-white border border-[#D5CEC2] rounded-lg font-medium text-[#1C211D] focus:ring-1 focus:ring-[#3A5A40]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1C211D] mb-1">Código SKU / Referencia:</label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Ej. TEL-RIB-ALG-01"
                className="w-full p-2 bg-white border border-[#D5CEC2] rounded-lg font-mono uppercase text-[#1C211D] focus:ring-1 focus:ring-[#3A5A40]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-[#1C211D] mb-1">Categoría:</label>
              <select
                value={category}
                onChange={(e) => {
                  const val = e.target.value as MaterialCategory;
                  setCategory(val);
                  if (val === 'Tela') setUnit('m');
                  else if (val === 'Hilo') setUnit('cono');
                  else if (val === 'Avío / Fornitura') setUnit('u');
                }}
                className="w-full p-2 bg-white border border-[#D5CEC2] rounded-lg text-[#1C211D]"
              >
                <option value="Tela">Tela / Tejido</option>
                <option value="Avío / Fornitura">Avío / Fornitura</option>
                <option value="Hilo">Hilo / Hilado</option>
                <option value="Entretela">Entretela</option>
                <option value="Empaque / Etiqueta">Empaque / Etiqueta</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#1C211D] mb-1">Unidad de Medida:</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as MaterialUnit)}
                className="w-full p-2 bg-white border border-[#D5CEC2] rounded-lg font-bold text-[#1C211D]"
              >
                <option value="m">Metros (m)</option>
                <option value="kg">Kilogramos (kg)</option>
                <option value="u">Unidades (u)</option>
                <option value="cono">Conos (5.000m)</option>
                <option value="rollo">Rollos</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#1C211D] mb-1">Color / Tono:</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Ej. Azul Índigo 14oz"
                className="w-full p-2 bg-white border border-[#D5CEC2] rounded-lg text-[#1C211D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#1C211D] mb-1">Stock Disponible en Bodega:</label>
              <input
                type="number"
                min="0"
                value={currentStock}
                onChange={(e) => setCurrentStock(parseFloat(e.target.value) || 0)}
                className="w-full p-2 bg-white border border-[#D5CEC2] rounded-lg font-bold text-[#1C211D]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1C211D] mb-1">Stock en Tránsito (OC Abiertas):</label>
              <input
                type="number"
                min="0"
                value={inTransitStock}
                onChange={(e) => setInTransitStock(parseFloat(e.target.value) || 0)}
                className="w-full p-2 bg-white border border-[#D5CEC2] rounded-lg text-[#1C211D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-[#1C211D] mb-1">Costo Unit. (COP):</label>
              <input
                type="number"
                min="0"
                step="100"
                value={unitCost}
                onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                className="w-full p-2 bg-white border border-[#D5CEC2] rounded-lg font-bold text-[#1C211D]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1C211D] mb-1">Pedido Mínimo / MOQ:</label>
              <input
                type="number"
                min="1"
                value={minOrderQuantity}
                onChange={(e) => setMinOrderQuantity(parseFloat(e.target.value) || 1)}
                className="w-full p-2 bg-white border border-[#D5CEC2] rounded-lg text-[#1C211D]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1C211D] mb-1">Lead Time (Días):</label>
              <input
                type="number"
                min="1"
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(parseInt(e.target.value) || 1)}
                className="w-full p-2 bg-white border border-[#D5CEC2] rounded-lg text-[#1C211D]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#1C211D] mb-1">Proveedor Habitual:</label>
            <input
              type="text"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="Ej. Fabricato S.A. / Lafayette / Enka"
              className="w-full p-2 bg-white border border-[#D5CEC2] rounded-lg font-medium text-[#1C211D]"
            />
          </div>

          {/* Footer */}
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
              className="px-5 py-2 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 active:scale-95"
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
