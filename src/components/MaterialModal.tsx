import React, { useState, useEffect } from 'react';
import { RawMaterial, MaterialCategory, MaterialUnit } from '../types';
import { Package, X, Check, Info, AlertCircle, ToggleLeft, ToggleRight, ArrowRightLeft, Sparkles, HelpCircle } from 'lucide-react';
import { formatCOP } from '../utils/formatters';
import { TechTermTooltip } from './TechTermTooltip';

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

  // Conversion and yield states
  const [enableConversion, setEnableConversion] = useState<boolean>(false);
  const [purchaseUnit, setPurchaseUnit] = useState<MaterialUnit>('kg');
  const [usageUnit, setUsageUnit] = useState<MaterialUnit>('m');
  const [yieldFactor, setYieldFactor] = useState<number>(2.5);
  const [yieldDescription, setYieldDescription] = useState<string>('1 kg de tela rinde 2.50 metros utilizables');
  const [defaultWastePercent, setDefaultWastePercent] = useState<number>(5.0);

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

      const hasYield = Boolean(
        (materialToEdit.yieldFactor && materialToEdit.yieldFactor !== 1.0) ||
        (materialToEdit.purchaseUnit && materialToEdit.usageUnit && materialToEdit.purchaseUnit !== materialToEdit.usageUnit)
      );
      setEnableConversion(hasYield);
      setPurchaseUnit(materialToEdit.purchaseUnit || materialToEdit.unit || 'kg');
      setUsageUnit(materialToEdit.usageUnit || (materialToEdit.unit === 'kg' ? 'm' : materialToEdit.unit));
      setYieldFactor(materialToEdit.yieldFactor || 1.0);
      setYieldDescription(materialToEdit.yieldDescription || '');
      setDefaultWastePercent(materialToEdit.defaultWastePercent || 5.0);
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
      setEnableConversion(false);
      setPurchaseUnit('kg');
      setUsageUnit('m');
      setYieldFactor(2.5);
      setYieldDescription('1 kg rinde 2.50 metros utilizables');
      setDefaultWastePercent(5.0);
    }
  }, [materialToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) {
      alert('Por favor ingrese el SKU y el nombre de la materia prima.');
      return;
    }

    const finalPurchaseUnit = enableConversion ? purchaseUnit : unit;
    const finalUsageUnit = enableConversion ? usageUnit : unit;
    const finalYieldFactor = enableConversion ? Math.max(0.0001, Number(yieldFactor) || 1.0) : 1.0;

    const materialData: RawMaterial = {
      id: materialToEdit ? materialToEdit.id : `MAT-${Date.now()}`,
      sku: sku.toUpperCase().trim(),
      name: name.trim(),
      category,
      unit: finalPurchaseUnit,
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
      purchaseUnit: finalPurchaseUnit,
      usageUnit: finalUsageUnit,
      yieldFactor: finalYieldFactor,
      yieldDescription: enableConversion ? yieldDescription.trim() || `1 ${finalPurchaseUnit} = ${finalYieldFactor} ${finalUsageUnit}` : undefined,
      defaultWastePercent: Number(defaultWastePercent) || 5.0,
    };

    onSaveMaterial(materialData);
    onClose();
  };

  const handleCategoryChange = (newCat: MaterialCategory) => {
    setCategory(newCat);
    if (!materialToEdit) {
      if (newCat === 'Tela') {
        setUnit('m');
        setPurchaseUnit('kg');
        setUsageUnit('m');
        setYieldFactor(2.5);
      } else if (newCat === 'Hilo') {
        setUnit('conos');
        setPurchaseUnit('conos');
        setUsageUnit('m');
        setYieldFactor(5000);
      } else if (newCat === 'Avío / Fornitura' || newCat === 'Botón / Broche' || newCat === 'Cremallera') {
        setUnit('unidades');
        setPurchaseUnit('gruesas');
        setUsageUnit('unidades');
        setYieldFactor(144);
      } else if (newCat === 'Empaque / Etiqueta') {
        setUnit('unidades');
        setPurchaseUnit('paquetes');
        setUsageUnit('unidades');
        setYieldFactor(100);
      } else if (newCat === 'Entretela') {
        setUnit('m');
        setPurchaseUnit('rollos');
        setUsageUnit('m');
        setYieldFactor(100);
      }
    }
  };

  const effectiveUsageStock = enableConversion ? Number((currentStock * (yieldFactor || 1)).toFixed(2)) : currentStock;
  const effectiveCostPerUsageUnit = enableConversion && yieldFactor > 0 ? unitCost / yieldFactor : unitCost;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-[#E6E1D8] overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E6E1D8] flex items-center justify-between bg-[#FCFBF9]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#EBF2EC] text-[#3A5A40] rounded-xl flex items-center justify-center font-bold shadow-2xs">
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
                Gestione telas, hilos, avíos, conversiones de compra a uso y requerimientos de producción.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#8F9990] hover:text-[#1C211D] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                placeholder="Ej. Tela Piqué 100% Algodón Pima"
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
                placeholder="Ej. TEL-PIQ-PIMA-01"
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
              <label className="block font-bold text-[#1C211D] mb-1">Unidad Principal de Compra:</label>
              <select
                value={enableConversion ? purchaseUnit : unit}
                onChange={(e) => {
                  const u = e.target.value as MaterialUnit;
                  setUnit(u);
                  setPurchaseUnit(u);
                }}
                className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-xl font-bold text-[#1C211D]"
              >
                <option value="kg">Kilogramos (kg)</option>
                <option value="m">Metros (m)</option>
                <option value="rollos">Rollos</option>
                <option value="conos">Conos</option>
                <option value="unidades">Unidades (u)</option>
                <option value="gruesas">Gruesas (144 u)</option>
                <option value="docenas">Docenas (12 u)</option>
                <option value="paquetes">Paquetes</option>
                <option value="yardas">Yardas</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#1C211D] mb-1">Color / Tono / Calibre:</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Ej. Gris Jaspe / Azul Marino"
                className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-xl text-[#1C211D]"
              />
            </div>
          </div>

          {/* ========================================================= */}
          {/* CONVERSIÓN DE UNIDADES Y RENDIMIENTO (COMPRA VS CONSUMO) */}
          {/* ========================================================= */}
          <div className="bg-[#FAF8F5] border border-[#E6E1D8] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-[#3A5A40]" />
                <span className="font-bold text-[#1C211D]">
                  <TechTermTooltip termKey="rendimiento">Conversión de Unidad de Compra a Consumo (Rendimiento)</TechTermTooltip>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEnableConversion(!enableConversion)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  enableConversion
                    ? 'bg-[#3A5A40] text-white shadow-2xs'
                    : 'bg-white border border-[#D5CEC2] text-[#5F6B61] hover:text-[#1C211D]'
                }`}
              >
                {enableConversion ? 'Conversión Activada' : 'Activar Rendimiento (ej. kg a m)'}
              </button>
            </div>

            {enableConversion ? (
              <div className="space-y-3 pt-2 border-t border-[#E6E1D8]">
                <p className="text-[11px] text-[#5F6B61]">
                  Permite comprar la materia prima en una unidad (ej. kilogramos o rollos) y consumirla en las prendas en otra unidad (ej. metros o unidades), aplicando la equivalencia de rendimiento automáticamente.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-[#1C211D] mb-1">Unidad en Confección (Uso):</label>
                    <select
                      value={usageUnit}
                      onChange={(e) => setUsageUnit(e.target.value as MaterialUnit)}
                      className="w-full p-2 bg-white border border-[#D5CEC2] rounded-lg font-bold text-[#1C211D]"
                    >
                      <option value="m">Metros (m)</option>
                      <option value="cm">Centímetros (cm)</option>
                      <option value="unidades">Unidades (u)</option>
                      <option value="yardas">Yardas</option>
                      <option value="conos">Conos</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1C211D] mb-1">
                      Factor Rendimiento (1 {purchaseUnit} = ? {usageUnit}):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.001"
                      value={yieldFactor}
                      onChange={(e) => setYieldFactor(parseFloat(e.target.value) || 1.0)}
                      className="w-full p-2 bg-white border border-[#3A5A40] rounded-lg font-bold text-[#3A5A40]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1C211D] mb-1">Merma Base Sugerida (%):</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="50"
                      value={defaultWastePercent}
                      onChange={(e) => setDefaultWastePercent(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 bg-white border border-[#D5CEC2] rounded-lg text-[#1C211D]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#1C211D] mb-1">Descripción del Rendimiento:</label>
                  <input
                    type="text"
                    value={yieldDescription}
                    onChange={(e) => setYieldDescription(e.target.value)}
                    placeholder="Ej. 1 kg rinde 2.50 metros utilizables para tizado y corte"
                    className="w-full p-2 bg-white border border-[#D5CEC2] rounded-lg text-[#1C211D]"
                  />
                </div>

                {/* Live Conversion Summary Box */}
                <div className="bg-[#EBF2EC] border border-[#D4E3D7] rounded-xl p-3 text-xs space-y-1.5 text-[#233829]">
                  <div className="flex items-center justify-between font-bold">
                    <span>Equivalencia Activa:</span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-[#D4E3D7]">
                      1 {purchaseUnit} = {yieldFactor} {usageUnit}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      • Stock en Bodega ({currentStock} {purchaseUnit}) = <strong>{effectiveUsageStock} {usageUnit} útiles</strong>
                    </div>
                    <div>
                      • Costo Efectivo: <strong>{formatCOP(effectiveCostPerUsageUnit)} / {usageUnit}</strong>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-[#5F6B61] italic">
                El insumo se comprará y consumirá en la misma unidad ({unit}). Si compra tela en kilogramos o avíos por paquete, active el rendimiento para convertir a metros o unidades.
              </p>
            )}
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
              <label className="block font-bold text-[#1C211D] mb-1">
                Stock Actual en Bodega:
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-xl font-bold text-[#1C211D]"
                />
                <span className="absolute right-3 top-2.5 text-xs text-[#8F9990] font-semibold">
                  {enableConversion ? purchaseUnit : unit}
                </span>
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
                <span className="absolute right-3 top-2.5 text-xs text-[#8F9990] font-semibold">
                  {enableConversion ? purchaseUnit : unit}
                </span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#1C211D] mb-1">
                Costo de Compra (COP):
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={unitCost}
                  onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-xl font-bold text-[#1C211D]"
                />
                <span className="absolute right-3 top-2.5 text-[10px] text-[#8F9990] font-semibold">
                  COP/{enableConversion ? purchaseUnit : unit}
                </span>
              </div>
            </div>
          </div>

          {/* Supplier & Logistics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-[#1C211D] mb-1">
                <TechTermTooltip termKey="moq">Lote Mínimo (MOQ):</TechTermTooltip>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={minOrderQuantity}
                  onChange={(e) => setMinOrderQuantity(parseFloat(e.target.value) || 1)}
                  className="w-full p-2.5 bg-white border border-[#D5CEC2] rounded-xl text-[#1C211D]"
                />
                <span className="absolute right-3 top-2.5 text-xs text-[#8F9990] font-semibold">
                  {enableConversion ? purchaseUnit : unit}
                </span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#1C211D] mb-1">
                <TechTermTooltip termKey="lead_time">Lead Time de Entrega:</TechTermTooltip>
              </label>
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
              <label className="block font-bold text-[#1C211D] mb-1">
                <TechTermTooltip termKey="stock_seguridad">Días Stock de Seguridad:</TechTermTooltip>
              </label>
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
                placeholder="Ej. Tejido peinado, encogimiento < 2%"
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
              className="px-4 py-2 text-xs font-semibold text-[#5F6B61] hover:text-[#1C211D] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
              id="btn-save-material-modal"
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

