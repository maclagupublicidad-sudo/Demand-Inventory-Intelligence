import React, { useState } from 'react';
import { Garment, RawMaterial, BOMItem } from '../types';
import { X, Scissors, Check, Plus, Trash2 } from 'lucide-react';

interface NewGarmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawMaterials: RawMaterial[];
  onAddGarment: (garment: Garment) => void;
}

export const NewGarmentModal: React.FC<NewGarmentModalProps> = ({
  isOpen,
  onClose,
  rawMaterials,
  onAddGarment,
}) => {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Camisería');
  const [targetSales, setTargetSales] = useState(1200);
  const [retailPrice, setRetailPrice] = useState(150000);
  const [finishedGoodsStock, setFinishedGoodsStock] = useState(0);
  const [productionWIP, setProductionWIP] = useState(0);

  // Initial BOM selection
  const [bomItems, setBomItems] = useState<BOMItem[]>([]);
  const [selectedMatId, setSelectedMatId] = useState('');
  const [consumption, setConsumption] = useState(1.5);
  const [waste, setWaste] = useState(5);

  if (!isOpen) return null;

  const handleAddBOMComponent = () => {
    if (!selectedMatId) return;
    const mat = rawMaterials.find((m) => m.id === selectedMatId);
    if (!mat) return;

    if (bomItems.some((i) => i.rawMaterialId === selectedMatId)) {
      alert('Este insumo ya está en la lista.');
      return;
    }

    setBomItems([
      ...bomItems,
      {
        rawMaterialId: mat.id,
        rawMaterialName: mat.name,
        category: mat.category,
        quantityPerGarment: consumption,
        unit: mat.unit,
        wastePercent: waste,
      },
    ]);

    setSelectedMatId('');
    setConsumption(1);
    setWaste(5);
  };

  const handleRemoveBOMItem = (matId: string) => {
    setBomItems(bomItems.filter((i) => i.rawMaterialId !== matId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku) {
      alert('Por favor ingrese el SKU y el nombre de la prenda.');
      return;
    }

    const newGarment: Garment = {
      id: `GAR-${Date.now()}`,
      sku: sku.toUpperCase().trim(),
      name: name.trim(),
      category,
      targetSales,
      historicalMonthlyAverage: Math.round(targetSales / 3),
      retailPrice,
      costEstimate: 65000,
      finishedGoodsStock,
      productionWIP,
      bom: bomItems,
    };

    onAddGarment(newGarment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-[#E6E1D8] overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E6E1D8] flex items-center justify-between bg-[#FCFBF9]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-[#EBF2EC] text-[#3A5A40] rounded-lg">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#1C211D]">Registrar Nueva Prenda de Confección</h3>
              <p className="text-[11px] text-[#5F6B61]">
                Configure los datos maestros de la prenda y su ficha técnica de materiales inicial.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#8F9990] hover:text-[#1C211D]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#1C211D] mb-1">Nombre de la Prenda:</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Bermuda Cargo Gabardina"
                className="w-full p-2 bg-white border border-[#D5CEC2] rounded-lg font-medium text-[#1C211D] focus:ring-1 focus:ring-[#3A5A40]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1C211D] mb-1">Código SKU:</label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Ej. BER-CAR-GAB-BEI"
                className="w-full p-2 bg-white border border-[#D5CEC2] rounded-lg font-mono uppercase text-[#1C211D] focus:ring-1 focus:ring-[#3A5A40]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-[#1C211D] mb-1">Categoría:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 bg-white border border-[#D5CEC2] rounded-lg text-[#1C211D]"
              >
                <option value="Camisería">Camisería</option>
                <option value="Pantalones">Pantalones</option>
                <option value="Chaquetas">Chaquetas</option>
                <option value="Vestidos">Vestidos</option>
                <option value="Polos">Polos / Camisetas</option>
                <option value="Ropa Deportiva">Ropa Deportiva</option>
                <option value="Uniformes">Uniformes</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#1C211D] mb-1">Meta del Ciclo (u):</label>
              <input
                type="number"
                min="1"
                required
                value={targetSales}
                onChange={(e) => setTargetSales(parseInt(e.target.value) || 0)}
                className="w-full p-2 bg-white border border-[#D5CEC2] rounded-lg font-bold text-[#1C211D]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1C211D] mb-1">P. Venta Público (COP):</label>
              <input
                type="number"
                min="0"
                step="1000"
                required
                value={retailPrice}
                onChange={(e) => setRetailPrice(parseFloat(e.target.value) || 0)}
                className="w-full p-2 bg-white border border-[#D5CEC2] rounded-lg font-medium text-[#1C211D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#1C211D] mb-1">Stock de Producto Terminado (PT):</label>
              <input
                type="number"
                min="0"
                value={finishedGoodsStock}
                onChange={(e) => setFinishedGoodsStock(parseInt(e.target.value) || 0)}
                className="w-full p-2 bg-white border border-[#D5CEC2] rounded-lg text-[#1C211D]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1C211D] mb-1">En Proceso / WIP (Taller):</label>
              <input
                type="number"
                min="0"
                value={productionWIP}
                onChange={(e) => setProductionWIP(parseInt(e.target.value) || 0)}
                className="w-full p-2 bg-white border border-[#D5CEC2] rounded-lg text-[#1C211D]"
              />
            </div>
          </div>

          {/* BOM Section */}
          <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E6E1D8] space-y-2.5">
            <span className="font-bold text-xs text-[#1C211D] block">
              Estructura de Materiales (BOM Inicial):
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div className="sm:col-span-2">
                <label className="text-[10px] text-[#5F6B61] block mb-0.5">Insumo / Tela:</label>
                <select
                  value={selectedMatId}
                  onChange={(e) => setSelectedMatId(e.target.value)}
                  className="w-full p-1.5 bg-white border border-[#D5CEC2] rounded-lg text-[#1C211D]"
                >
                  <option value="">Seleccione insumo...</option>
                  {rawMaterials.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.sku}] {m.name} ({m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-[#5F6B61] block mb-0.5">Consumo Unit.:</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={consumption}
                  onChange={(e) => setConsumption(parseFloat(e.target.value) || 0)}
                  className="w-full p-1.5 bg-white border border-[#D5CEC2] rounded-lg font-bold text-[#1C211D]"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAddBOMComponent}
                  className="w-full p-1.5 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-lg font-bold flex items-center justify-center gap-1 transition-colors active:scale-95 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar
                </button>
              </div>
            </div>

            {/* List of added materials */}
            <div className="border border-[#E6E1D8] rounded-lg overflow-hidden bg-white mt-2">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] text-[#5F6B61] text-[10px] border-b border-[#E6E1D8]">
                  <tr>
                    <th className="p-2">Insumo</th>
                    <th className="p-2 text-right">Consumo</th>
                    <th className="p-2 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EEE6]">
                  {bomItems.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-3 text-center text-[#8F9990] text-[11px]">
                        No ha agregado insumos aún (puede completarlos luego en la ficha técnica).
                      </td>
                    </tr>
                  ) : (
                    bomItems.map((item) => (
                      <tr key={item.rawMaterialId} className="hover:bg-[#FAF8F5]">
                        <td className="p-2 font-medium text-[#1C211D]">{item.rawMaterialName}</td>
                        <td className="p-2 text-right font-bold text-[#1C211D]">
                          {item.quantityPerGarment} {item.unit}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveBOMItem(item.rawMaterialId)}
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
              Guardar Prenda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
