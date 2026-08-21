import React, { useState, useEffect } from 'react';
import { RawMaterial, MaterialCategory, MaterialUnit } from '../types';
import { Package, X, Check, Info, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { formatCOP } from '../utils/formatters';

interface MaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMaterial: (material: RawMaterial) => void;
  materialToEdit?: RawMaterial | null;
}

export const MaterialModal: React.FC<MaterialModalProps> = ({
  isOpen,
  onClose,
  onSaveMaterial,
  materialToEdit,
}) => {
  const isEditing = Boolean(materialToEdit);

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MaterialCategory>('Tela');
  const [unit, setUnit] = useState<MaterialUnit>('m');
  const [currentStock, setCurrentStock] = useState<number>(500);
  const [inTransitStock, setInTransitStock] = useState<number>(0);
  const [safetyStockDays, setSafetyStockDays] = useState<number>(15);
  const [minOrderQuantity, setMinOrderQuantity] = useState<number>(300);
  const [unitCost, setUnitCost] = useState<number>(18500);
  const [leadTimeDays, setLeadTimeDays] = useState<number>(25);
  const [supplierName, setSupplierName] = useState('Tejidos Nacionales S.A.');
  const [color, setColor] = useState('');
  const [widthMeters, setWidthMeters] = useState<number | undefined>(1.5);
  const [weightGsm, setWeightGsm] = useState<number | undefined>(180);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState<boolean>(true);

  // Sync state when materialToEdit changes
  useEffect(() => {
    if (materialToEdit) {
      setSku(materialToEdit.sku);
      setName(materialToEdit.name);
      setCategory(materialToEdit.category);
      setUnit(materialToEdit.unit);
      setCurrentStock(materialToEdit.currentStock);
      setInTransitStock(materialToEdit.inTransitStock || 0);
      setSafetyStockDays(materialToEdit.safetyStockDays || 15);
      setMinOrderQuantity(materialToEdit.minOrderQuantity || 1);
      setUnitCost(materialToEdit.unitCost || 0);
      setLeadTimeDays(materialToEdit.leadTimeDays || 15);
      setSupplierName(materialToEdit.supplierName || '');
      setColor(materialToEdit.color || '');
      setWidthMeters(materialToEdit.widthMeters);
      setWeightGsm(materialToEdit.weightGsm);
      setDescription(materialToEdit.description || '');
      setIsActive(materialToEdit.isActive !== false);
    } else {
      setSku('');
      setName('');
      setCategory('Tela');
      setUnit('m');
      setCurrentStock(500);
      setInTransitStock(0);
      setSafetyStockDays(15);
      setMinOrderQuantity(200);
      setUnitCost(18500);
      setLeadTimeDays(20);
      setSupplierName('Lafayette / Fabricato');
      setColor('');
      setWidthMeters(1.5);
      setWeightGsm(180);
      setDescription('');
      setIsActive(true);
    }
  }, [materialToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) {
      alert('Por favor ingrese el SKU y el nombre de la materia prima.');
      return;
    }

    const materialData: RawMaterial = {
      id: materialToEdit ? materialToEdit.id : `MAT-${Date.now()}`,
      sku: sku.toUpperCase().trim(),
      name: name.trim(),
      category,
      unit,
      currentStock: Math.max(0, Number(currentStock) || 0),
      inTransitStock: Math.max(0, Number(inTransitStock) || 0),
      safetyStockDays: Math.max(1, Number(safetyStockDays) || 1),
      minOrderQuantity: Math.max(1, Number(minOrderQuantity) || 1),
      unitCost: Math.max(0, Number(unitCost) || 0),
      leadTimeDays: Math.max(1, Number(leadTimeDays) || 1),
      supplierName: supplierName.trim() || 'Proveedor Local',
      color: color.trim() || undefined,
      widthMeters: widthMeters ? Number(widthMeters) : undefined,
      weightGsm: weightGsm ? Number(weightGsm) : undefined,
      description: description.trim() || undefined,
      isActive,
    };

    onSaveMaterial(materialData);
    onClose();
  };

  const handleCategoryChange = (newCat: MaterialCategory) => {
    setCategory(newCat);
    if (!materialToEdit) {
      if (newCat === 'Tela') setUnit('m');
      else if (newCat === 'Hilo') setUnit('conos');
      else if (newCat === 'Avío / Fornitura' || newCat === 'Botón / Broche' || newCat === 'Cremallera') setUnit('unidades');
      else if (newCat === 'Empaque / Etiqueta') setUnit('unidades');
      else if (newCat === 'Entretela') setUnit('m');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-[#E6E1D8] overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E6E1D8] flex items-center justify-between bg-[#FCFBF9]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#EBF2EC] text-[#3A5A40] rounded-xl flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-[#1C211D]">
                  {isEditing ? 'Editar Materia Prima / Insumo' : 'Registrar Nueva Materia Prima'}
                </h3>
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-stone-100 text-stone-600 border-stone-300'
                  }`}
                >
                  {isActive ? 'Activo' : 'Desactivado'}
                </span>
              </div>
              <p className="text-xs text-[#5F6B61]">
                Gestione telas, hilos, etiquetas, empaques y demás insumos para la producción y el motor MRP.
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
          {/* Active / Inactive Status Toggle */}
          <div className="flex items-center justify-between p-3 bg-[#FAF8F5] rounded-xl border border-[#E6E1D8]">
            <div className="space-y-0.5">
              <span className="font-bold text-xs text-[#1C211D]">Estado de Disponibilidad del Insumo</span>
              <p className="text-[11px] text-[#5F6B61]">
                Los insumos desactivados no generan nuevas sugerencias de compra pero conservan su histórico.
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
              <span>{isActive ? 'Insumo Activo' : 'Insumo Desactivado'}</span>
            </button>
          </div>

          {/* Basic Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#1C211D] mb-1">
                Nombre de la Materia Prima <span className="text-rose-500">*</span>:
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Tela Piel de Durazno 100% Poliéster"
                className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-xl font-medium text-[#1C211D] focus:ring-2 focus:ring-[#3A5A40]/20 focus:border-[#3A5A40] transition-all"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1C211D] mb-1">
                Código SKU / Referencia <span className="text-rose-500">*</span>:
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Ej. TEL-PIEL-DUR-01"
                className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-xl font-mono uppercase text-[#1C211D] focus:ring-2 focus:ring-[#3A5A40]/20 focus:border-[#3A5A40] transition-all"
              />
            </div>
          </div>

          {/* Categorization & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-[#1C211D] mb-1">Categoría Textil:</label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as MaterialCategory)}
                className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-xl text-[#1C211D] font-medium"
              >
                <option value="Tela">Tela / Tejido</option>
                <option value="Hilo">Hilo / Hilado</option>
                <option value="Empaque / Etiqueta">Empaque / Etiqueta</option>
                <option value="Avío / Fornitura">Avío / Fornitura</option>
                <option value="Botón / Broche">Botón / Broche</option>
                <option value="Cremallera">Cremallera / Cierre</option>
                <option value="Entretela">Entretela</option>
                <option value="Otro">Otro Insumo</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#1C211D] mb-1">Unidad de Medida:</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as MaterialUnit)}
                className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-xl font-bold text-[#1C211D]"
              >
                <option value="m">Metros (m)</option>
                <option value="kg">Kilogramos (kg)</option>
                <option value="unidades">Unidades (u)</option>
                <option value="conos">Conos (5.000m)</option>
                <option value="rollos">Rollos</option>
                <option value="yardas">Yardas</option>
                <option value="docenas">Docenas</option>
                <option value="gruesas">Gruesas (144 u)</option>
                <option value="paquetes">Paquetes</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#1C211D] mb-1">Color / Tono / Calibre:</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Ej. Negro Mate / 120 TKT"
                className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-xl text-[#1C211D]"
              />
            </div>
          </div>

          {/* Textile Specifics (Ancho & Gramaje si es tela) */}
          {category === 'Tela' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-[#FAF8F5] rounded-xl border border-[#E6E1D8]">
              <div>
                <label className="block font-bold text-[#1C211D] mb-1">Ancho Útil de Tela (metros):</label>
                <input
                  type="number"
                  step="0.05"
                  min="0.5"
                  value={widthMeters || ''}
                  onChange={(e) => setWidthMeters(e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="Ej. 1.50"
                  className="w-full p-2 bg-white border border-[#D5CEC2] rounded-lg text-[#1C211D]"
                />
              </div>
              <div>
                <label className="block font-bold text-[#1C211D] mb-1">Gramaje (g/m²):</label>
                <input
                  type="number"
                  min="10"
                  value={weightGsm || ''}
                  onChange={(e) => setWeightGsm(e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="Ej. 180"
                  className="w-full p-2 bg-white border border-[#D5CEC2] rounded-lg text-[#1C211D]"
                />
              </div>
            </div>
          )}

          {/* Stock & Costs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-[#1C211D] mb-1">Stock Actual en Bodega:</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-xl font-bold text-[#1C211D]"
                />
                <span className="absolute right-3 top-2.5 text-xs text-[#8F9990] font-semibold">{unit}</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#1C211D] mb-1">Stock en Tránsito (OCs):</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={inTransitStock}
                  onChange={(e) => setInTransitStock(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-xl text-[#1C211D]"
                />
                <span className="absolute right-3 top-2.5 text-xs text-[#8F9990] font-semibold">{unit}</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#1C211D] mb-1">Costo Unitario (COP):</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={unitCost}
                  onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-xl font-bold text-[#1C211D]"
                />
                <span className="absolute right-3 top-2.5 text-[10px] text-[#8F9990] font-semibold">COP/{unit}</span>
              </div>
            </div>
          </div>

          {/* Supplier & Logistics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-[#1C211D] mb-1">Lote Mínimo (MOQ):</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={minOrderQuantity}
                  onChange={(e) => setMinOrderQuantity(parseFloat(e.target.value) || 1)}
                  className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-xl text-[#1C211D]"
                />
                <span className="absolute right-3 top-2.5 text-xs text-[#8F9990] font-semibold">{unit}</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#1C211D] mb-1">Lead Time de Entrega:</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(parseInt(e.target.value) || 1)}
                  className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-xl text-[#1C211D]"
                />
                <span className="absolute right-3 top-2.5 text-xs text-[#8F9990] font-semibold">días</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#1C211D] mb-1">Días Stock de Seguridad:</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={safetyStockDays}
                  onChange={(e) => setSafetyStockDays(parseInt(e.target.value) || 1)}
                  className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-xl text-[#1C211D]"
                />
                <span className="absolute right-3 top-2.5 text-xs text-[#8F9990] font-semibold">días</span>
              </div>
            </div>
          </div>

          {/* Supplier Name & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#1C211D] mb-1">Proveedor Habitual:</label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Ej. Lafayette S.A. / Coats Cadena / Pasacintas"
                className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-xl font-medium text-[#1C211D]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1C211D] mb-1">Observaciones / Especificaciones:</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Uso en forrería interior, encogimiento < 2%"
                className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-xl text-[#1C211D]"
              />
            </div>
          </div>

          {/* Economic Calculation Preview */}
          <div className="p-3 bg-[#EBF2EC] rounded-xl border border-[#D4E3D7] flex items-center justify-between text-xs">
            <span className="text-[#233829] font-medium">Valor Total Inventario Actual en Bodega:</span>
            <span className="font-bold text-[#233829] text-sm font-mono">
              {formatCOP(currentStock * unitCost)}
            </span>
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
              <span>{isEditing ? 'Guardar Cambios' : 'Registrar Materia Prima'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
