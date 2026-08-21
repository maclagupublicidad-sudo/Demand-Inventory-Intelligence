import React, { useState, useEffect } from 'react';
import { Garment, RawMaterial, BOMItem, MaterialCategory, MaterialUnit } from '../types';
import {
  Scissors,
  X,
  Check,
  Plus,
  Trash2,
  Package,
  DollarSign,
  Info,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { formatCOP } from '../utils/formatters';

interface GarmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawMaterials: RawMaterial[];
  onSaveGarment: (garment: Garment) => void;
  garmentToEdit?: Garment | null;
}

export const GarmentModal: React.FC<GarmentModalProps> = ({
  isOpen,
  onClose,
  rawMaterials,
  onSaveGarment,
  garmentToEdit,
}) => {
  const isEditing = Boolean(garmentToEdit);

  // Form Fields
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Camisería');
  const [targetSales, setTargetSales] = useState<number>(1200);
  const [retailPrice, setRetailPrice] = useState<number>(150000);
  const [finishedGoodsStock, setFinishedGoodsStock] = useState<number>(0);
  const [productionWIP, setProductionWIP] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [referenceCode, setReferenceCode] = useState('');
  const [isActive, setIsActive] = useState<boolean>(true);

  // BOM Management
  const [bomItems, setBomItems] = useState<BOMItem[]>([]);
  const [selectedMatId, setSelectedMatId] = useState('');
  const [consumption, setConsumption] = useState<number>(0.85);
  const [waste, setWaste] = useState<number>(5);
  const [componentNote, setComponentNote] = useState('');

  useEffect(() => {
    if (garmentToEdit) {
      setSku(garmentToEdit.sku);
      setName(garmentToEdit.name);
      setCategory(garmentToEdit.category);
      setTargetSales(garmentToEdit.targetSales || 0);
      setRetailPrice(garmentToEdit.retailPrice || 0);
      setFinishedGoodsStock(garmentToEdit.finishedGoodsStock || 0);
      setProductionWIP(garmentToEdit.productionWIP || 0);
      setDescription(garmentToEdit.description || '');
      setReferenceCode(garmentToEdit.referenceCode || '');
      setIsActive(garmentToEdit.isActive !== false);
      setBomItems(garmentToEdit.bom || []);
    } else {
      setSku('');
      setName('');
      setCategory('Tejido de Punto');
      setTargetSales(1200);
      setRetailPrice(75000);
      setFinishedGoodsStock(0);
      setProductionWIP(0);
      setDescription('');
      setReferenceCode('');
      setIsActive(true);
      setBomItems([]);
    }
  }, [garmentToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddBOMComponent = () => {
    if (!selectedMatId) {
      alert('Por favor seleccione una materia prima para agregar al BOM.');
      return;
    }

    const mat = rawMaterials.find((m) => m.id === selectedMatId);
    if (!mat) return;

    if (bomItems.some((i) => i.rawMaterialId === selectedMatId)) {
      alert('Este insumo ya se encuentra agregado en la ficha de materiales.');
      return;
    }

    if (consumption <= 0) {
      alert('El consumo por prenda debe ser un número positivo (ej: 0.85 kg).');
      return;
    }

    const newItem: BOMItem = {
      rawMaterialId: mat.id,
      rawMaterialName: mat.name,
      category: mat.category,
      quantityPerGarment: Number(consumption),
      unit: mat.unit,
      wastePercent: Number(waste) || 0,
      notes: componentNote.trim() || undefined,
    };

    setBomItems([...bomItems, newItem]);
    setSelectedMatId('');
    setConsumption(1);
    setWaste(5);
    setComponentNote('');
  };

  const handleRemoveBOMItem = (matId: string) => {
    setBomItems(bomItems.filter((i) => i.rawMaterialId !== matId));
  };

  const handleUpdateItemConsumption = (matId: string, newCons: number) => {
    setBomItems(
      bomItems.map((i) =>
        i.rawMaterialId === matId ? { ...i, quantityPerGarment: Math.max(0.001, newCons) } : i
      )
    );
  };

  const handleUpdateItemWaste = (matId: string, newWaste: number) => {
    setBomItems(
      bomItems.map((i) =>
        i.rawMaterialId === matId ? { ...i, wastePercent: Math.max(0, newWaste) } : i
      )
    );
  };

  // Calculate live total material cost per unit
  const totalMaterialCostPerGarment = bomItems.reduce((acc, item) => {
    const mat = rawMaterials.find((m) => m.id === item.rawMaterialId);
    const unitCost = mat?.unitCost || 0;
    const grossCons = item.quantityPerGarment * (1 + item.wastePercent / 100);
    return acc + grossCons * unitCost;
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) {
      alert('Por favor ingrese el nombre y el código SKU de la prenda.');
      return;
    }

    const garmentData: Garment = {
      ...(garmentToEdit || {}),
      id: garmentToEdit ? garmentToEdit.id : `GAR-${Date.now()}`,
      sku: sku.toUpperCase().trim(),
      name: name.trim(),
      category,
      targetSales: Math.max(0, Number(targetSales) || 0),
      historicalMonthlyAverage: garmentToEdit?.historicalMonthlyAverage || Math.max(10, Math.round(targetSales / 3)),
      retailPrice: Math.max(0, Number(retailPrice) || 0),
      costEstimate: Math.round(totalMaterialCostPerGarment + 15000), // Materiales + estimado base MOD
      finishedGoodsStock: Math.max(0, Number(finishedGoodsStock) || 0),
      productionWIP: Math.max(0, Number(productionWIP) || 0),
      bom: bomItems,
      isActive,
      description: description.trim() || undefined,
      referenceCode: referenceCode.trim() || undefined,
    };

    onSaveGarment(garmentData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-[#E6E1D8] overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E6E1D8] flex items-center justify-between bg-[#FCFBF9]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#EBF2EC] text-[#3A5A40] rounded-xl flex items-center justify-center font-bold">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-[#1C211D]">
                  {isEditing ? 'Editar Prenda & Ficha de Materiales (BOM)' : 'Registrar Nueva Prenda de Confección'}
                </h3>
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-stone-100 text-stone-600 border-stone-300'
                  }`}
                >
                  {isActive ? 'Activa' : 'Desactivada'}
                </span>
              </div>
              <p className="text-xs text-[#5F6B61]">
                Gestione prendas, configure consumos de tela por unidad, avíos y estructura de costos.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Status Toggle Bar */}
          <div className="flex items-center justify-between p-3 bg-[#FAF8F5] rounded-xl border border-[#E6E1D8]">
            <div className="space-y-0.5">
              <span className="font-bold text-xs text-[#1C211D]">Estado Comercial y Productivo de la Prenda</span>
              <p className="text-[11px] text-[#5F6B61]">
                Las prendas desactivadas se ocultan del cálculo de compras pero conservan su histórico de producción.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#3A5A40] text-white shadow-2xs'
                  : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
              }`}
            >
              {isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              <span>{isActive ? 'Prenda Activa' : 'Prenda Desactivada'}</span>
            </button>
          </div>

          {/* Section 1: Basic Information */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-[#1C211D] uppercase tracking-wider text-[#5F6B61] flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-[#3A5A40]" />
              1. Datos Maestros del Producto
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#1C211D] mb-1">
                  Nombre de la Prenda <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Camiseta Cuello Redondo Algodón 180g"
                  className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-xl font-medium text-[#1C211D] focus:ring-2 focus:ring-[#3A5A40]/20 focus:border-[#3A5A40]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1C211D] mb-1">
                  Código SKU / Referencia Única <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Ej. CAM-ALG-CRE-01"
                  className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-xl font-mono uppercase text-[#1C211D] focus:ring-2 focus:ring-[#3A5A40]/20 focus:border-[#3A5A40]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-[#1C211D] mb-1">Línea / Categoría:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-xl text-[#1C211D] font-medium"
                >
                  <option value="Camisería">Camisería</option>
                  <option value="Tejido de Punto">Tejido de Punto / Camisetas</option>
                  <option value="Polos">Polos / Cuello Camisero</option>
                  <option value="Pantalones">Pantalones / Jeans</option>
                  <option value="Chaquetas">Chaquetas / Abrigos</option>
                  <option value="Vestidos">Vestidos / Faldas</option>
                  <option value="Ropa Deportiva">Ropa Deportiva / Activewear</option>
                  <option value="Dotaciones / Uniformes">Dotaciones / Uniformes</option>
                  <option value="Confección General">Confección General</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#1C211D] mb-1">Meta del Ciclo (Unidades):</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={targetSales}
                  onChange={(e) => setTargetSales(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-xl font-bold text-[#1C211D]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1C211D] mb-1">Precio Venta PVP (COP):</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  value={retailPrice}
                  onChange={(e) => setRetailPrice(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-xl font-bold text-[#1C211D]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#1C211D] mb-1">Stock Producto Terminado (Bodega PT):</label>
                <input
                  type="number"
                  min="0"
                  value={finishedGoodsStock}
                  onChange={(e) => setFinishedGoodsStock(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-xl text-[#1C211D]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1C211D] mb-1">WIP en Proceso de Confección (Taller):</label>
                <input
                  type="number"
                  min="0"
                  value={productionWIP}
                  onChange={(e) => setProductionWIP(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-xl text-[#1C211D]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Relación Producto - Materia Prima (BOM / Ficha de Materiales) */}
          <div className="space-y-3 pt-3 border-t border-[#E6E1D8]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h4 className="font-bold text-xs text-[#1C211D] uppercase tracking-wider text-[#5F6B61] flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-[#3A5A40]" />
                  2. Relación Producto – Materia Prima (Ficha de Materiales BOM)
                </h4>
                <p className="text-[11px] text-[#5F6B61]">
                  Indique los insumos exactos y el consumo unitario para confeccionar una prenda.
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-[#5F6B61] block">Costo Materiales/Prenda:</span>
                <span className="font-bold text-xs text-[#3A5A40] font-mono">
                  {formatCOP(totalMaterialCostPerGarment)}
                </span>
              </div>
            </div>

            {/* Pedagogical Example Tip Box */}
            <div className="p-3 bg-[#EBF2EC] rounded-xl border border-[#D4E3D7] flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#3A5A40] shrink-0 mt-0.5" />
              <div className="text-[11px] text-[#233829] leading-relaxed">
                <strong>Configuración de Consumo por Prenda:</strong> Defina cuánto material se necesita para fabricar exactamente 1 unidad.
                <span className="block text-[#3A5A40] font-semibold mt-0.5">
                  Ejemplo: 1 camiseta consume 0,85 kg de tela + 1 etiqueta + 0,02 conos de hilo.
                </span>
              </div>
            </div>

            {/* Add Insumo to BOM Row */}
            <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E6E1D8] space-y-2">
              <span className="font-bold text-xs text-[#1C211D] block">Vincular Materia Prima a esta Prenda:</span>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-5">
                  <label className="text-[10px] text-[#5F6B61] block mb-0.5">Seleccionar Insumo del Catálogo:</label>
                  <select
                    value={selectedMatId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedMatId(id);
                      const m = rawMaterials.find((item) => item.id === id);
                      if (m) {
                        if (m.category === 'Tela') setConsumption(0.85);
                        else if (m.category === 'Hilo') setConsumption(0.02);
                        else if (m.category === 'Empaque / Etiqueta') setConsumption(1);
                        else if (m.category === 'Botón / Broche') setConsumption(8);
                        else setConsumption(1);
                      }
                    }}
                    className="w-full p-2 bg-white border border-[#D5CEC2] rounded-lg text-[#1C211D]"
                  >
                    <option value="">Seleccione un insumo registrado...</option>
                    {rawMaterials
                      .filter((m) => m.isActive !== false)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          [{m.sku}] {m.name} ({m.unit}) - {formatCOP(m.unitCost, false)}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[10px] text-[#5F6B61] block mb-0.5">Consumo / Prenda:</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={consumption}
                      onChange={(e) => setConsumption(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white border border-[#D5CEC2] rounded-lg font-bold text-[#1C211D]"
                      placeholder="0.85"
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] text-[#8F9990] font-semibold">
                      {rawMaterials.find((m) => m.id === selectedMatId)?.unit || 'u'}
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] text-[#5F6B61] block mb-0.5">Merma (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={waste}
                    onChange={(e) => setWaste(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-white border border-[#D5CEC2] rounded-lg text-[#1C211D]"
                    placeholder="5%"
                  />
                </div>

                <div className="sm:col-span-2 flex items-end">
                  <button
                    type="button"
                    onClick={handleAddBOMComponent}
                    className="w-full p-2 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-lg font-bold flex items-center justify-center gap-1 transition-all shadow-2xs active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Current BOM Table */}
            <div className="border border-[#E6E1D8] rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] text-[#5F6B61] font-bold border-b border-[#E6E1D8] text-[10px] uppercase">
                  <tr>
                    <th className="p-2.5">Insumo Requerido</th>
                    <th className="p-2.5">Categoría</th>
                    <th className="p-2.5 text-right">Consumo Unitario</th>
                    <th className="p-2.5 text-right">Merma (%)</th>
                    <th className="p-2.5 text-right">Costo / Prenda</th>
                    <th className="p-2.5 text-center">Quitar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EEE6]">
                  {bomItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-[#5F6B61]">
                        No hay materias primas agregadas a esta prenda. Seleccione un insumo arriba para vincularlo.
                      </td>
                    </tr>
                  ) : (
                    bomItems.map((item) => {
                      const mat = rawMaterials.find((m) => m.id === item.rawMaterialId);
                      const unitCost = mat?.unitCost || 0;
                      const grossCons = item.quantityPerGarment * (1 + item.wastePercent / 100);
                      const itemCost = grossCons * unitCost;

                      return (
                        <tr key={item.rawMaterialId} className="hover:bg-[#FAF8F5]">
                          <td className="p-2.5">
                            <div className="font-bold text-[#1C211D]">{item.rawMaterialName}</div>
                            <div className="text-[10px] text-[#5F6B61] font-mono">
                              {mat?.sku || item.rawMaterialId}
                            </div>
                          </td>
                          <td className="p-2.5">
                            <span className="px-1.5 py-0.5 bg-[#F2EEE6] text-[#5F6B61] rounded text-[10px]">
                              {item.category}
                            </span>
                          </td>
                          <td className="p-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                step="0.001"
                                min="0.001"
                                value={item.quantityPerGarment}
                                onChange={(e) =>
                                  handleUpdateItemConsumption(
                                    item.rawMaterialId,
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-16 p-1 bg-white border border-[#D5CEC2] rounded text-right font-bold text-xs"
                              />
                              <span className="text-[10px] text-[#5F6B61]">{item.unit}</span>
                            </div>
                          </td>
                          <td className="p-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <input
                                type="number"
                                min="0"
                                max="50"
                                value={item.wastePercent}
                                onChange={(e) =>
                                  handleUpdateItemWaste(
                                    item.rawMaterialId,
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-12 p-1 bg-white border border-[#D5CEC2] rounded text-right text-xs"
                              />
                              <span className="text-[10px] text-[#5F6B61]">%</span>
                            </div>
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-[#1C211D]">
                            {formatCOP(itemCost, false)}
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveBOMItem(item.rawMaterialId)}
                              className="p-1 text-[#8F9990] hover:text-[#B33927] rounded transition-colors"
                              title="Eliminar insumo del BOM"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[#E6E1D8]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#5F6B61] hover:text-[#1C211D] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'Guardar Cambios de la Prenda' : 'Crear Prenda & BOM'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
