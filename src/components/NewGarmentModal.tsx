import React, { useState } from 'react';
import { Garment, RawMaterial, BOMItem, MaterialCategory } from '../types';
import { Plus, X, Scissors, Layers, Check } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Registrar Nueva Prenda de Confección</h3>
              <p className="text-xs text-slate-500">
                Configure los datos maestros de la prenda y su ficha técnica de materiales inicial.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nombre de la Prenda:</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Bermuda Cargo Gabardina"
                className="w-full p-2 border border-slate-300 rounded-lg font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Código SKU:</label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Ej. BER-CAR-GAB-BEI"
                className="w-full p-2 border border-slate-300 rounded-lg font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Categoría:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="Camisería">Camisería</option>
                <option value="Pantalonería / Denim">Pantalonería / Denim</option>
                <option value="Tejido de Punto">Tejido de Punto (Polos/T-Shirts)</option>
                <option value="Vestidos & Faldas">Vestidos & Faldas</option>
                <option value="Chaquetería">Chaquetería / Abrigos</option>
                <option value="Sport / Ropa Deportiva">Sport / Ropa Deportiva</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Meta de Ventas del Ciclo (u):</label>
              <input
                type="number"
                min="10"
                value={targetSales}
                onChange={(e) => setTargetSales(parseInt(e.target.value) || 0)}
                className="w-full p-2 border border-slate-300 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">P. Venta Estimado (COP):</label>
              <input
                type="number"
                step="500"
                value={retailPrice}
                onChange={(e) => setRetailPrice(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* BOM Section */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              Insumos de la Ficha Técnica (BOM):
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div className="sm:col-span-2">
                <select
                  value={selectedMatId}
                  onChange={(e) => setSelectedMatId(e.target.value)}
                  className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs"
                >
                  <option value="">-- Seleccionar Insumo del Catálogo --</option>
                  {rawMaterials.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.category}] {m.name} ({m.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <input
                  type="number"
                  step="0.01"
                  min="0.001"
                  placeholder="Consumo"
                  value={consumption}
                  onChange={(e) => setConsumption(parseFloat(e.target.value) || 0)}
                  className="w-full p-1.5 border border-slate-300 rounded text-xs text-center"
                />
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleAddBOMComponent}
                  className="w-full py-1.5 bg-blue-600 text-white rounded font-bold hover:bg-blue-700"
                >
                  + Añadir
                </button>
              </div>
            </div>

            {/* Added BOM List */}
            {bomItems.length > 0 ? (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {bomItems.map((item) => (
                  <div
                    key={item.rawMaterialId}
                    className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 text-xs"
                  >
                    <div>
                      <strong className="text-slate-900">{item.rawMaterialName}</strong>
                      <span className="text-slate-500 ml-2">
                        {item.quantityPerGarment} {item.unit} (Merma {item.wastePercent}%)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveBOMItem(item.rawMaterialId)}
                      className="text-rose-600 hover:text-rose-800"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">
                Ningún insumo añadido aún. Puede agregarlos ahora o editarlos luego en la pestaña de Fichas Técnicas.
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
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
              Guardar Prenda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
