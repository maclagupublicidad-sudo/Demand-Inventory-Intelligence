import React, { useState } from 'react';
import {
  Garment,
  RawMaterial,
  BOMItem,
  ProductionOperation,
  QualityCheckpoint,
  ProductionCosting,
  ProductionTimes,
} from '../types';
import { formatCOP } from '../utils/formatters';
import { exportGarmentsToCSV } from '../services/csvParser';
import {
  Scissors,
  Plus,
  Trash2,
  Edit3,
  DollarSign,
  Layers,
  ChevronRight,
  Clock,
  ShieldAlert,
  TrendingUp,
  Download,
  CheckCircle,
  AlertTriangle,
  Factory,
  Settings,
  HelpCircle,
  Percent,
} from 'lucide-react';

interface BOMExplosionViewProps {
  garments: Garment[];
  rawMaterials: RawMaterial[];
  onUpdateGarmentBOM: (garmentId: string, updatedBOM: BOMItem[]) => void;
  onUpdateGarment?: (updatedGarment: Garment) => void;
  onOpenNewGarmentModal: () => void;
}

export const BOMExplosionView: React.FC<BOMExplosionViewProps> = ({
  garments,
  rawMaterials,
  onUpdateGarmentBOM,
  onUpdateGarment,
  onOpenNewGarmentModal,
}) => {
  const [selectedGarmentId, setSelectedGarmentId] = useState<string>(garments[0]?.id || '');
  const [activeSubTab, setActiveSubTab] = useState<'bom' | 'tiempos' | 'calidad' | 'costeo'>('bom');
  const [isEditingWaste, setIsEditingWaste] = useState<boolean>(false);

  // Material adder state
  const [newMaterialId, setNewMaterialId] = useState<string>('');
  const [newMaterialQty, setNewMaterialQty] = useState<number>(1);
  const [newMaterialWaste, setNewMaterialWaste] = useState<number>(5);

  // Operation adder state
  const [newOpName, setNewOpName] = useState<string>('');
  const [newOpDept, setNewOpDept] = useState<'Corte' | 'Preparación' | 'Ensamble' | 'Terminación' | 'Empaque'>('Ensamble');
  const [newOpMachine, setNewOpMachine] = useState<string>('Plana 1 Aguja');
  const [newOpSAM, setNewOpSAM] = useState<number>(3.0);
  const [newOpNotes, setNewOpNotes] = useState<string>('');

  // Quality checkpoint adder state
  const [newQcOp, setNewQcOp] = useState<string>('');
  const [newQcDefect, setNewQcDefect] = useState<string>('');
  const [newQcPrevention, setNewQcPrevention] = useState<string>('');
  const [newQcTolerance, setNewQcTolerance] = useState<string>('+/- 1.0 mm');
  const [newQcSeverity, setNewQcSeverity] = useState<'Alta' | 'Media' | 'Baja'>('Alta');

  // Interactive Cost Simulator State
  const [simLaborRate, setSimLaborRate] = useState<number>(280);
  const [simOverheadRate, setSimOverheadRate] = useState<number>(95);
  const [simMaquilaCut, setSimMaquilaCut] = useState<number>(2200);
  const [simMaquilaSew, setSimMaquilaSew] = useState<number>(12000);
  const [simMaquilaFinish, setSimMaquilaFinish] = useState<number>(2500);
  const [simMaquilaLogistics, setSimMaquilaLogistics] = useState<number>(900);

  const selectedGarment = garments.find((g) => g.id === selectedGarmentId) || garments[0];

  // Sync simulator state when selected garment changes
  React.useEffect(() => {
    if (selectedGarment?.costing) {
      setSimLaborRate(selectedGarment.costing.internalLaborRatePerMinute || 280);
      setSimOverheadRate(selectedGarment.costing.internalOverheadRatePerMinute || 95);
      setSimMaquilaCut(selectedGarment.costing.maquilaCuttingRate || 2200);
      setSimMaquilaSew(selectedGarment.costing.maquilaSewingRate || 12000);
      setSimMaquilaFinish(selectedGarment.costing.maquilaFinishingRate || 2500);
      setSimMaquilaLogistics(selectedGarment.costing.maquilaLogisticsCost || 900);
    }
  }, [selectedGarmentId]);

  // Calculate total raw material cost per garment from BOM
  const calculateGarmentMaterialCost = (garment: Garment) => {
    return garment.bom.reduce((acc, item) => {
      const mat = rawMaterials.find((m) => m.id === item.rawMaterialId);
      if (!mat) return acc;
      const effectiveQty = item.quantityPerGarment * (1 + item.wastePercent / 100);
      return acc + effectiveQty * mat.unitCost;
    }, 0);
  };

  const rawMaterialCost = selectedGarment ? calculateGarmentMaterialCost(selectedGarment) : 0;

  // Handle BOM modifications
  const handleUpdateItemWaste = (itemIndex: number, newWaste: number) => {
    if (!selectedGarment) return;
    const newBOM = [...selectedGarment.bom];
    newBOM[itemIndex] = {
      ...newBOM[itemIndex],
      wastePercent: newWaste,
    };
    onUpdateGarmentBOM(selectedGarment.id, newBOM);
  };

  const handleUpdateItemQuantity = (itemIndex: number, newQty: number) => {
    if (!selectedGarment) return;
    const newBOM = [...selectedGarment.bom];
    newBOM[itemIndex] = {
      ...newBOM[itemIndex],
      quantityPerGarment: newQty,
    };
    onUpdateGarmentBOM(selectedGarment.id, newBOM);
  };

  const handleDeleteBOMItem = (itemIndex: number) => {
    if (!selectedGarment) return;
    const newBOM = selectedGarment.bom.filter((_, idx) => idx !== itemIndex);
    onUpdateGarmentBOM(selectedGarment.id, newBOM);
  };

  const handleAddMaterialToBOM = () => {
    if (!selectedGarment || !newMaterialId) return;
    const mat = rawMaterials.find((m) => m.id === newMaterialId);
    if (!mat) return;

    const newItem: BOMItem = {
      rawMaterialId: mat.id,
      rawMaterialName: mat.name,
      category: mat.category,
      quantityPerGarment: newMaterialQty,
      unit: mat.unit,
      wastePercent: newMaterialWaste,
    };

    onUpdateGarmentBOM(selectedGarment.id, [...selectedGarment.bom, newItem]);
    setNewMaterialId('');
    setNewMaterialQty(1);
    setNewMaterialWaste(5);
  };

  // Add Operation to Routing
  const handleAddOperation = () => {
    if (!selectedGarment || !newOpName.trim()) return;

    const currentRouting = selectedGarment.operationsRouting || [];
    const newOp: ProductionOperation = {
      id: `OP-${selectedGarment.sku}-${Date.now()}`,
      stepNumber: currentRouting.length + 1,
      operationName: newOpName.trim(),
      department: newOpDept,
      machinery: newOpMachine.trim(),
      standardMinutes: newOpSAM,
      criticalNotes: newOpNotes.trim() || undefined,
    };

    const updatedRouting = [...currentRouting, newOp];
    const totalSAM = updatedRouting.reduce((sum, op) => sum + op.standardMinutes, 0);

    const updatedTimes: ProductionTimes = {
      cuttingMinutesPerGarment: selectedGarment.productionTimes?.cuttingMinutesPerGarment || 3.5,
      sewingSAM: totalSAM,
      finishingMinutesPerGarment: selectedGarment.productionTimes?.finishingMinutesPerGarment || 4.5,
      totalManufacturingMinutes:
        (selectedGarment.productionTimes?.cuttingMinutesPerGarment || 3.5) +
        totalSAM +
        (selectedGarment.productionTimes?.finishingMinutesPerGarment || 4.5),
      standardBatchSize: selectedGarment.productionTimes?.standardBatchSize || 300,
      totalCycleDays: selectedGarment.productionTimes?.totalCycleDays || 8,
    };

    const updatedGarment: Garment = {
      ...selectedGarment,
      operationsRouting: updatedRouting,
      productionTimes: updatedTimes,
    };

    if (onUpdateGarment) {
      onUpdateGarment(updatedGarment);
    }

    setNewOpName('');
    setNewOpSAM(3.0);
    setNewOpNotes('');
  };

  // Delete Operation from Routing
  const handleDeleteOperation = (opId: string) => {
    if (!selectedGarment || !selectedGarment.operationsRouting) return;
    const filtered = selectedGarment.operationsRouting
      .filter((op) => op.id !== opId)
      .map((op, idx) => ({ ...op, stepNumber: idx + 1 }));

    const totalSAM = filtered.reduce((sum, op) => sum + op.standardMinutes, 0);
    const updatedTimes: ProductionTimes = {
      ...(selectedGarment.productionTimes || {
        cuttingMinutesPerGarment: 3.5,
        finishingMinutesPerGarment: 4.5,
        standardBatchSize: 300,
        totalCycleDays: 8,
        totalManufacturingMinutes: 30,
        sewingSAM: 22,
      }),
      sewingSAM: totalSAM,
      totalManufacturingMinutes:
        (selectedGarment.productionTimes?.cuttingMinutesPerGarment || 3.5) +
        totalSAM +
        (selectedGarment.productionTimes?.finishingMinutesPerGarment || 4.5),
    };

    const updatedGarment: Garment = {
      ...selectedGarment,
      operationsRouting: filtered,
      productionTimes: updatedTimes,
    };

    if (onUpdateGarment) {
      onUpdateGarment(updatedGarment);
    }
  };

  // Add Quality Checkpoint
  const handleAddQualityCheckpoint = () => {
    if (!selectedGarment || !newQcDefect.trim() || !newQcPrevention.trim()) return;

    const currentQc = selectedGarment.qualityCheckpoints || [];
    const newCheckpoint: QualityCheckpoint = {
      id: `QC-${selectedGarment.sku}-${Date.now()}`,
      operationName: newQcOp.trim() || 'Confección General',
      potentialDefect: newQcDefect.trim(),
      preventionInstruction: newQcPrevention.trim(),
      toleranceMetric: newQcTolerance.trim(),
      severity: newQcSeverity,
    };

    const updatedGarment: Garment = {
      ...selectedGarment,
      qualityCheckpoints: [...currentQc, newCheckpoint],
    };

    if (onUpdateGarment) {
      onUpdateGarment(updatedGarment);
    }

    setNewQcOp('');
    setNewQcDefect('');
    setNewQcPrevention('');
    setNewQcTolerance('+/- 1.0 mm');
  };

  // Delete Quality Checkpoint
  const handleDeleteQualityCheckpoint = (qcId: string) => {
    if (!selectedGarment || !selectedGarment.qualityCheckpoints) return;
    const filtered = selectedGarment.qualityCheckpoints.filter((qc) => qc.id !== qcId);

    const updatedGarment: Garment = {
      ...selectedGarment,
      qualityCheckpoints: filtered,
    };

    if (onUpdateGarment) {
      onUpdateGarment(updatedGarment);
    }
  };

  // Save Costing updates
  const handleSaveCosting = () => {
    if (!selectedGarment) return;

    const totalMinutes = selectedGarment.productionTimes?.totalManufacturingMinutes || 30;
    const internalLabor = Math.round(totalMinutes * simLaborRate);
    const internalOverhead = Math.round(totalMinutes * simOverheadRate);
    const totalInternal = Math.round(rawMaterialCost + internalLabor + internalOverhead);

    const totalMaquila = Math.round(
      rawMaterialCost + simMaquilaCut + simMaquilaSew + simMaquilaFinish + simMaquilaLogistics
    );

    const internalMargin =
      selectedGarment.retailPrice > 0
        ? parseFloat((((selectedGarment.retailPrice - totalInternal) / selectedGarment.retailPrice) * 100).toFixed(1))
        : 0;

    const maquilaMargin =
      selectedGarment.retailPrice > 0
        ? parseFloat((((selectedGarment.retailPrice - totalMaquila) / selectedGarment.retailPrice) * 100).toFixed(1))
        : 0;

    const updatedCosting: ProductionCosting = {
      rawMaterialsCost: Math.round(rawMaterialCost),
      internalLaborRatePerMinute: simLaborRate,
      internalOverheadRatePerMinute: simOverheadRate,
      internalLaborCost: internalLabor,
      internalOverheadCost: internalOverhead,
      totalInternalCost: totalInternal,
      maquilaCuttingRate: simMaquilaCut,
      maquilaSewingRate: simMaquilaSew,
      maquilaFinishingRate: simMaquilaFinish,
      maquilaLogisticsCost: simMaquilaLogistics,
      totalMaquilaCost: totalMaquila,
      recommendedSellingPrice: selectedGarment.retailPrice,
      internalProfitMarginPercent: internalMargin,
      maquilaProfitMarginPercent: maquilaMargin,
    };

    const updatedGarment: Garment = {
      ...selectedGarment,
      costing: updatedCosting,
      costEstimate: totalInternal,
    };

    if (onUpdateGarment) {
      onUpdateGarment(updatedGarment);
    }
  };

  // Calculated live cost indicators for the active simulator
  const activeTotalMfgMin = selectedGarment?.productionTimes?.totalManufacturingMinutes || 30;
  const liveInternalMOD = Math.round(activeTotalMfgMin * simLaborRate);
  const liveInternalCIF = Math.round(activeTotalMfgMin * simOverheadRate);
  const liveTotalInternal = Math.round(rawMaterialCost + liveInternalMOD + liveInternalCIF);
  const liveTotalMaquila = Math.round(
    rawMaterialCost + simMaquilaCut + simMaquilaSew + simMaquilaFinish + simMaquilaLogistics
  );
  const internalSavingsPerUnit = liveTotalMaquila - liveTotalInternal;
  const batchSavings = selectedGarment
    ? internalSavingsPerUnit * selectedGarment.targetSales
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Garments Selector List */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs p-5 flex flex-col h-fit">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-[#111827]">Catálogo de Prendas</h3>
            <p className="text-xs text-[#6B7280]">Fichas Técnicas & Manufactura</p>
          </div>
          <button
            onClick={onOpenNewGarmentModal}
            className="px-2.5 py-1.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
            id="btn-add-new-garment"
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva Prenda
          </button>
        </div>

        <div className="space-y-2">
          {garments.map((garment) => {
            const isSelected = garment.id === selectedGarment?.id;
            const matCost = calculateGarmentMaterialCost(garment);
            const totalCost = garment.costing?.totalInternalCost || garment.costEstimate;

            return (
              <button
                key={garment.id}
                onClick={() => setSelectedGarmentId(garment.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#EEF2FF] border-[#4F46E5] text-[#111827] shadow-2xs ring-1 ring-[#4F46E5]'
                    : 'bg-white border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#374151]'
                }`}
              >
                <div className="w-full pr-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#111827] truncate">{garment.name}</span>
                    <span className="text-[10px] font-mono font-bold bg-[#E5E7EB] text-[#374151] px-1.5 py-0.2 rounded">
                      {garment.category.split('/')[0]}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#6B7280] font-mono mt-0.5">
                    SKU: {garment.sku} | Meta: {garment.targetSales.toLocaleString()} u
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[11px]">
                    <span className="text-[#4F46E5] font-bold">
                      Costo Int: {formatCOP(totalCost)}
                    </span>
                    <span className="text-[#059669] font-medium text-[10px]">
                      SAM: {garment.productionTimes?.sewingSAM || 20} min
                    </span>
                  </div>
                </div>
                <ChevronRight
                  className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#4F46E5]' : 'text-[#9CA3AF]'}`}
                />
              </button>
            );
          })}
        </div>

        {/* Global Export Database to CSV */}
        <div className="mt-5 pt-4 border-t border-[#E5E7EB]">
          <button
            onClick={() => exportGarmentsToCSV(garments, rawMaterials)}
            className="w-full py-2 px-3 bg-[#F9FAFB] hover:bg-[#F3F4F6] border border-[#D1D5DB] rounded-lg text-xs font-bold text-[#111827] flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            title="Descargar toda la base de datos de fichas técnicas en CSV con tiempos de producción y costeo"
          >
            <Download className="w-3.5 h-3.5 text-[#4F46E5]" />
            Exportar Base de Datos CSV Completa
          </button>
        </div>
      </div>

      {/* Right Column: Selected Garment Tech Pack & Detailed Sub-Tabs */}
      {selectedGarment && (
        <div className="lg:col-span-2 space-y-6">
          {/* Garment Header Card */}
          <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-indigo-50 text-[#4F46E5] text-[10px] font-bold rounded uppercase">
                    {selectedGarment.category}
                  </span>
                  <span className="text-xs text-[#6B7280] font-mono">SKU: {selectedGarment.sku}</span>
                </div>
                <h2 className="text-xl font-bold text-[#111827] mt-1">{selectedGarment.name}</h2>
                {selectedGarment.techPackNotes && (
                  <p className="text-xs text-[#4B5563] mt-1 italic">
                    "{selectedGarment.techPackNotes}"
                  </p>
                )}
              </div>

              <div className="text-right flex sm:flex-col items-center sm:items-end justify-between gap-1">
                <p className="text-[10px] text-[#6B7280] uppercase tracking-wider font-bold">
                  Precio de Venta (PVP)
                </p>
                <p className="text-xl font-bold text-[#059669]">
                  {formatCOP(selectedGarment.retailPrice)}
                </p>
                <span className="text-[10px] text-[#6B7280]">
                  Costo Base: {formatCOP(selectedGarment.costEstimate)}
                </span>
              </div>
            </div>

            {/* Quick Production Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]">
                <p className="text-[10px] text-[#6B7280] uppercase font-bold">Meta Ciclo</p>
                <p className="text-base font-bold text-[#111827]">
                  {selectedGarment.targetSales.toLocaleString()} u
                </p>
              </div>
              <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]">
                <p className="text-[10px] text-[#6B7280] uppercase font-bold">Stock Terminado</p>
                <p className="text-base font-bold text-[#111827]">
                  {selectedGarment.finishedGoodsStock.toLocaleString()} u
                </p>
              </div>
              <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]">
                <p className="text-[10px] text-[#6B7280] uppercase font-bold">En Proceso (WIP)</p>
                <p className="text-base font-bold text-[#111827]">
                  {selectedGarment.productionWIP.toLocaleString()} u
                </p>
              </div>
              <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]">
                <p className="text-[10px] text-[#6B7280] uppercase font-bold">Tiempo Total Ciclo</p>
                <p className="text-base font-bold text-[#4F46E5]">
                  {selectedGarment.productionTimes?.totalCycleDays || 8} días
                </p>
              </div>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="flex border-b border-[#E5E7EB] gap-2 pt-2 overflow-x-auto">
              <button
                onClick={() => setActiveSubTab('bom')}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
                  activeSubTab === 'bom'
                    ? 'border-[#4F46E5] text-[#4F46E5]'
                    : 'border-transparent text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                1. Materiales & BOM ({selectedGarment.bom.length})
              </button>

              <button
                onClick={() => setActiveSubTab('tiempos')}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
                  activeSubTab === 'tiempos'
                    ? 'border-[#4F46E5] text-[#4F46E5]'
                    : 'border-transparent text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                2. Tiempos & Ruta SAM ({selectedGarment.operationsRouting?.length || 0})
              </button>

              <button
                onClick={() => setActiveSubTab('calidad')}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
                  activeSubTab === 'calidad'
                    ? 'border-[#4F46E5] text-[#4F46E5]'
                    : 'border-transparent text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                3. Puntos de Calidad & Errores ({selectedGarment.qualityCheckpoints?.length || 0})
              </button>

              <button
                onClick={() => setActiveSubTab('costeo')}
                className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
                  activeSubTab === 'costeo'
                    ? 'border-[#4F46E5] text-[#4F46E5]'
                    : 'border-transparent text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                <Factory className="w-3.5 h-3.5" />
                4. Costeo: Taller vs Maquila
              </button>
            </div>
          </div>

          {/* TAB 1: BOM & MATERIALS STRUCTURE */}
          {activeSubTab === 'bom' && (
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
              <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#111827]">
                    Ficha Técnica: Estructura de Materiales (BOM)
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Consumo de telas, avíos, entretelas e hilos por prenda
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-[#6B7280] block">Costo Total Materiales:</span>
                    <span className="text-sm font-bold text-[#111827]">
                      {formatCOP(rawMaterialCost)}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsEditingWaste(!isEditingWaste)}
                    className="text-xs font-semibold text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-1 border border-[#D1D5DB] px-2.5 py-1 rounded-lg"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    {isEditingWaste ? 'Listo' : 'Editar Consumos'}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#F9FAFB] text-[10px] font-bold uppercase text-[#6B7280] border-b border-[#E5E7EB]">
                    <tr>
                      <th className="px-4 py-3">Material / Insumo</th>
                      <th className="px-4 py-3">Categoría</th>
                      <th className="px-4 py-3 text-right">Consumo Unit.</th>
                      <th className="px-4 py-3 text-right">Merma (%)</th>
                      <th className="px-4 py-3 text-right">Consumo Real</th>
                      <th className="px-4 py-3 text-right">Costo Unit. Insumo</th>
                      <th className="px-4 py-3 text-right">Subtotal COP</th>
                      <th className="px-4 py-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-[#F3F4F6]">
                    {selectedGarment.bom.map((item, idx) => {
                      const mat = rawMaterials.find((m) => m.id === item.rawMaterialId);
                      const unitCost = mat?.unitCost || 0;
                      const effectiveQty = item.quantityPerGarment * (1 + item.wastePercent / 100);
                      const itemCost = effectiveQty * unitCost;

                      return (
                        <tr key={idx} className="hover:bg-[#F9FAFB]">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-[#111827]">{item.rawMaterialName}</div>
                            <div className="text-[10px] text-[#9CA3AF]">{mat?.sku || item.rawMaterialId}</div>
                          </td>

                          <td className="px-4 py-3">
                            <span className="text-[10px] font-medium bg-[#F3F4F6] text-[#4B5563] px-2 py-0.5 rounded">
                              {item.category}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right font-mono">
                            {isEditingWaste ? (
                              <input
                                type="number"
                                step="0.001"
                                min="0"
                                value={item.quantityPerGarment}
                                onChange={(e) => handleUpdateItemQuantity(idx, parseFloat(e.target.value) || 0)}
                                className="w-20 bg-white border border-[#D1D5DB] rounded px-1.5 py-0.5 text-right font-bold text-xs"
                              />
                            ) : (
                              <span className="font-semibold text-[#111827]">
                                {item.quantityPerGarment} {item.unit}
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right font-mono">
                            {isEditingWaste ? (
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max="30"
                                value={item.wastePercent}
                                onChange={(e) => handleUpdateItemWaste(idx, parseFloat(e.target.value) || 0)}
                                className="w-16 bg-white border border-[#D1D5DB] rounded px-1.5 py-0.5 text-right font-bold text-xs"
                              />
                            ) : (
                              <span className="text-amber-600 font-semibold">{item.wastePercent}%</span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right font-mono font-bold text-[#111827]">
                            {effectiveQty.toFixed(3)} {item.unit}
                          </td>

                          <td className="px-4 py-3 text-right font-mono text-[#6B7280]">
                            {formatCOP(unitCost, false)}
                          </td>

                          <td className="px-4 py-3 text-right font-mono font-bold text-[#111827]">
                            {formatCOP(itemCost)}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleDeleteBOMItem(idx)}
                              className="p-1 text-[#9CA3AF] hover:text-red-600 transition-colors"
                              title="Eliminar insumo del BOM"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Add Material Form */}
              <div className="p-4 bg-[#F9FAFB] border-t border-[#E5E7EB]">
                <div className="text-xs font-bold text-[#374151] mb-2">
                  Agregar Insumo a la Ficha Técnica:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  <select
                    value={newMaterialId}
                    onChange={(e) => setNewMaterialId(e.target.value)}
                    className="bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-xs text-[#111827] sm:col-span-2"
                  >
                    <option value="">Seleccionar Insumo del Maestro...</option>
                    {rawMaterials.map((m) => (
                      <option key={m.id} value={m.id}>
                        [{m.sku}] {m.name} ({formatCOP(m.unitCost)} / {m.unit})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    placeholder="Consumo Unitario"
                    step="0.01"
                    min="0.001"
                    value={newMaterialQty}
                    onChange={(e) => setNewMaterialQty(parseFloat(e.target.value) || 0)}
                    className="bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-xs text-[#111827]"
                  />

                  <input
                    type="number"
                    placeholder="Merma % (ej 5)"
                    step="0.5"
                    min="0"
                    max="30"
                    value={newMaterialWaste}
                    onChange={(e) => setNewMaterialWaste(parseFloat(e.target.value) || 0)}
                    className="bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-xs text-[#111827]"
                  />

                  <button
                    type="button"
                    onClick={handleAddMaterialToBOM}
                    disabled={!newMaterialId}
                    className="px-3 py-1.5 bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                  >
                    + Agregar Insumo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TIEMPOS DE PRODUCCIÓN & RUTA DE OPERACIONES (SAM) */}
          {activeSubTab === 'tiempos' && (
            <div className="space-y-4">
              {/* KPIs Header */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
                  <div className="flex items-center gap-1.5 text-indigo-600 mb-1">
                    <Scissors className="w-4 h-4" />
                    <span className="text-xs font-bold">Tiempo de Corte</span>
                  </div>
                  <p className="text-lg font-bold text-[#111827]">
                    {selectedGarment.productionTimes?.cuttingMinutesPerGarment || 3.5} min
                  </p>
                  <span className="text-[10px] text-[#6B7280]">por prenda en mesa</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
                  <div className="flex items-center gap-1.5 text-purple-600 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-bold">SAM Ensamble</span>
                  </div>
                  <p className="text-lg font-bold text-[#111827]">
                    {selectedGarment.productionTimes?.sewingSAM || 22.0} min
                  </p>
                  <span className="text-[10px] text-[#6B7280]">minutos estándar costura</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs">
                  <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-bold">Acabados & Plancha</span>
                  </div>
                  <p className="text-lg font-bold text-[#111827]">
                    {selectedGarment.productionTimes?.finishingMinutesPerGarment || 4.5} min
                  </p>
                  <span className="text-[10px] text-[#6B7280]">ojales, botón y empaque</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#E5E7EB] shadow-xs bg-indigo-50/40">
                  <div className="flex items-center gap-1.5 text-indigo-700 mb-1">
                    <Factory className="w-4 h-4" />
                    <span className="text-xs font-bold">Total Manufactura</span>
                  </div>
                  <p className="text-lg font-bold text-[#4F46E5]">
                    {selectedGarment.productionTimes?.totalManufacturingMinutes || 30.0} min
                  </p>
                  <span className="text-[10px] text-[#6B7280]">
                    Lote estándar: {selectedGarment.productionTimes?.standardBatchSize || 300} u
                  </span>
                </div>
              </div>

              {/* Operations Routing Table */}
              <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden">
                <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-[#111827]">
                      Ruta de Operaciones & Hoja de Proceso (Ciclo Completo)
                    </h3>
                    <p className="text-xs text-[#6B7280]">
                      Secuencia técnica de confección, tipo de maquinaria y SAM asignado
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-[#F3F4F6] text-[#4B5563] px-2.5 py-1 rounded-lg">
                    {selectedGarment.operationsRouting?.length || 0} Operaciones en Línea
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-[#F9FAFB] text-[10px] font-bold uppercase text-[#6B7280] border-b border-[#E5E7EB]">
                      <tr>
                        <th className="p-3 text-center w-12">#</th>
                        <th className="p-3">Operación / Proceso</th>
                        <th className="p-3">Área / Dpto</th>
                        <th className="p-3">Maquinaria Requerida</th>
                        <th className="p-3 text-right">SAM (min)</th>
                        <th className="p-3">Observaciones Técnicas</th>
                        <th className="p-3 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {!selectedGarment.operationsRouting || selectedGarment.operationsRouting.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-[#9CA3AF]">
                            No hay operaciones registradas. Agrega operaciones abajo para desglosar la ruta.
                          </td>
                        </tr>
                      ) : (
                        selectedGarment.operationsRouting.map((op) => (
                          <tr key={op.id} className="hover:bg-[#F9FAFB]">
                            <td className="p-3 text-center font-bold text-[#6B7280]">
                              {op.stepNumber}
                            </td>
                            <td className="p-3 font-semibold text-[#111827]">
                              {op.operationName}
                            </td>
                            <td className="p-3">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  op.department === 'Corte'
                                    ? 'bg-amber-100 text-amber-800'
                                    : op.department === 'Preparación'
                                    ? 'bg-blue-100 text-blue-800'
                                    : op.department === 'Ensamble'
                                    ? 'bg-purple-100 text-purple-800'
                                    : op.department === 'Terminación'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {op.department}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-[#374151]">{op.machinery}</td>
                            <td className="p-3 text-right font-bold text-[#4F46E5] font-mono">
                              {op.standardMinutes.toFixed(1)} min
                            </td>
                            <td className="p-3 text-[#6B7280] max-w-xs truncate" title={op.criticalNotes}>
                              {op.criticalNotes || '-'}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleDeleteOperation(op.id)}
                                className="p-1 text-[#9CA3AF] hover:text-red-600 transition-colors"
                                title="Eliminar operación"
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

                {/* Add Operation Form */}
                <div className="p-4 bg-[#F9FAFB] border-t border-[#E5E7EB] space-y-3">
                  <span className="font-bold text-xs text-[#111827] block">
                    Agregar Operación a la Ruta de Confección:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 text-xs">
                    <input
                      type="text"
                      placeholder="Nombre de la operación (ej: Pegar cuello)"
                      value={newOpName}
                      onChange={(e) => setNewOpName(e.target.value)}
                      className="sm:col-span-2 bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-[#111827]"
                    />

                    <select
                      value={newOpDept}
                      onChange={(e: any) => setNewOpDept(e.target.value)}
                      className="bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-[#111827]"
                    >
                      <option value="Corte">Corte</option>
                      <option value="Preparación">Preparación</option>
                      <option value="Ensamble">Ensamble</option>
                      <option value="Terminación">Terminación</option>
                      <option value="Empaque">Empaque</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Maquinaria (ej: Overlock 4H)"
                      value={newOpMachine}
                      onChange={(e) => setNewOpMachine(e.target.value)}
                      className="bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-[#111827]"
                    />

                    <input
                      type="number"
                      placeholder="SAM (min)"
                      step="0.1"
                      min="0.1"
                      value={newOpSAM}
                      onChange={(e) => setNewOpSAM(parseFloat(e.target.value) || 0)}
                      className="bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 font-bold text-[#111827]"
                    />

                    <button
                      type="button"
                      onClick={handleAddOperation}
                      disabled={!newOpName.trim()}
                      className="px-3 py-1.5 bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-50 text-white rounded-lg font-bold flex items-center justify-center gap-1 transition-colors shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Agregar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CALIDAD & PREVENCIÓN DE ERRORES */}
          {activeSubTab === 'calidad' && (
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-xs overflow-hidden space-y-4">
              <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#111827]">
                    Puntos Críticos de Calidad & Prevención de Errores Frecuentes
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Pautas operativas para evitar reprocesos, segundas y mermas de costura
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  Control en Proceso
                </span>
              </div>

              <div className="overflow-x-auto px-4">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#F9FAFB] text-[10px] font-bold uppercase text-[#6B7280] border-b border-[#E5E7EB]">
                    <tr>
                      <th className="p-3">Operación / Zona</th>
                      <th className="p-3">Posible Error / Defecto</th>
                      <th className="p-3">Instrucción de Prevención Técnica</th>
                      <th className="p-3">Tolerancia Admisible</th>
                      <th className="p-3 text-center">Severidad</th>
                      <th className="p-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {!selectedGarment.qualityCheckpoints || selectedGarment.qualityCheckpoints.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-[#9CA3AF]">
                          No se han registrado puntos críticos de calidad aún.
                        </td>
                      </tr>
                    ) : (
                      selectedGarment.qualityCheckpoints.map((qc) => (
                        <tr key={qc.id} className="hover:bg-[#F9FAFB]">
                          <td className="p-3 font-bold text-[#111827]">{qc.operationName}</td>
                          <td className="p-3 text-red-700 font-medium">{qc.potentialDefect}</td>
                          <td className="p-3 text-[#374151]">{qc.preventionInstruction}</td>
                          <td className="p-3 font-mono font-bold text-[#4F46E5]">{qc.toleranceMetric}</td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                qc.severity === 'Alta'
                                  ? 'bg-red-100 text-red-800'
                                  : qc.severity === 'Media'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {qc.severity}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleDeleteQualityCheckpoint(qc.id)}
                              className="p-1 text-[#9CA3AF] hover:text-red-600 transition-colors"
                              title="Eliminar punto de control"
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

              {/* Add Checkpoint Form */}
              <div className="p-4 bg-[#F9FAFB] border-t border-[#E5E7EB] space-y-3">
                <span className="font-bold text-xs text-[#111827] block">
                  Registrar Nuevo Punto de Control de Calidad:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Operación / Zona (ej: Pegado Cuello)"
                    value={newQcOp}
                    onChange={(e) => setNewQcOp(e.target.value)}
                    className="bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-[#111827]"
                  />
                  <input
                    type="text"
                    placeholder="Posible defecto (ej: Descuadre de puntas)"
                    value={newQcDefect}
                    onChange={(e) => setNewQcDefect(e.target.value)}
                    className="bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-[#111827]"
                  />
                  <input
                    type="text"
                    placeholder="Instrucción de prevención (ej: Usar plantilla acrílica)"
                    value={newQcPrevention}
                    onChange={(e) => setNewQcPrevention(e.target.value)}
                    className="bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-[#111827]"
                  />
                  <input
                    type="text"
                    placeholder="Tolerancia (ej: +/- 1.0 mm)"
                    value={newQcTolerance}
                    onChange={(e) => setNewQcTolerance(e.target.value)}
                    className="bg-white border border-[#D1D5DB] rounded-lg px-2.5 py-1.5 text-[#111827]"
                  />
                  <div className="flex gap-1">
                    <select
                      value={newQcSeverity}
                      onChange={(e: any) => setNewQcSeverity(e.target.value)}
                      className="bg-white border border-[#D1D5DB] rounded-lg px-2 py-1.5 text-[#111827] w-24"
                    >
                      <option value="Alta">Alta</option>
                      <option value="Media">Media</option>
                      <option value="Baja">Baja</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddQualityCheckpoint}
                      disabled={!newQcDefect.trim() || !newQcPrevention.trim()}
                      className="flex-1 px-3 py-1.5 bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-50 text-white rounded-lg font-bold flex items-center justify-center gap-1 transition-colors shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: COSTEO DE PRODUCCIÓN: TALLER INTERNO VS MAQUILA */}
          {activeSubTab === 'costeo' && (
            <div className="space-y-6">
              {/* Interactive Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Internal Workshop Card */}
                <div className="bg-white p-5 rounded-xl border-2 border-indigo-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                        <Factory className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#111827]">Taller Propio (Interno)</h4>
                        <p className="text-[11px] text-[#6B7280]">Cálculo por Minuto Estándar (SAM)</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded">
                      Control Directo
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#F3F4F6]">
                      <span className="text-[#6B7280]">1. Materias Primas (BOM Telas + Avíos):</span>
                      <span className="font-bold text-[#111827]">{formatCOP(rawMaterialCost)}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-[#F3F4F6]">
                      <span className="text-[#6B7280]">
                        Tarifa Minuto MOD Planta:
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="10"
                          min="50"
                          value={simLaborRate}
                          onChange={(e) => setSimLaborRate(parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-0.5 border border-[#D1D5DB] rounded text-right font-bold text-xs"
                        />
                        <span className="text-[#9CA3AF] text-[10px]">COP/min</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-[#F3F4F6]">
                      <span className="text-[#6B7280]">
                        Tarifa Minuto Costos Indirectos (CIF):
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="5"
                          min="10"
                          value={simOverheadRate}
                          onChange={(e) => setSimOverheadRate(parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-0.5 border border-[#D1D5DB] rounded text-right font-bold text-xs"
                        />
                        <span className="text-[#9CA3AF] text-[10px]">COP/min</span>
                      </div>
                    </div>

                    <div className="flex justify-between py-1 border-b border-[#F3F4F6]">
                      <span className="text-[#6B7280]">
                        2. Mano de Obra Directa ({activeTotalMfgMin} min * {simLaborRate} COP):
                      </span>
                      <span className="font-bold text-[#111827]">{formatCOP(liveInternalMOD)}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-[#F3F4F6]">
                      <span className="text-[#6B7280]">
                        3. Costos Indirectos CIF ({activeTotalMfgMin} min * {simOverheadRate} COP):
                      </span>
                      <span className="font-bold text-[#111827]">{formatCOP(liveInternalCIF)}</span>
                    </div>

                    <div className="pt-2 flex justify-between items-center text-sm font-bold bg-[#EEF2FF] p-3 rounded-lg border border-indigo-100">
                      <span className="text-[#111827]">Costo Unitario Interno:</span>
                      <span className="text-[#4F46E5] text-base">{formatCOP(liveTotalInternal)}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1 px-1">
                      <span className="text-[#6B7280]">Margen Bruto sobre PVP ({formatCOP(selectedGarment.retailPrice)}):</span>
                      <span className="font-bold text-[#059669]">
                        {selectedGarment.retailPrice > 0
                          ? (((selectedGarment.retailPrice - liveTotalInternal) / selectedGarment.retailPrice) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* External Maquila / Satellite Card */}
                <div className="bg-white p-5 rounded-xl border-2 border-emerald-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#111827]">Maquila / Taller Satélite</h4>
                        <p className="text-[11px] text-[#6B7280]">Cálculo por Servicio Tercerizado</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded">
                      Flexibilidad
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#F3F4F6]">
                      <span className="text-[#6B7280]">1. Materias Primas (BOM Telas + Avíos):</span>
                      <span className="font-bold text-[#111827]">{formatCOP(rawMaterialCost)}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-[#F3F4F6]">
                      <span className="text-[#6B7280]">Tarifa Servicio de Corte Satélite:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="100"
                          min="0"
                          value={simMaquilaCut}
                          onChange={(e) => setSimMaquilaCut(parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-0.5 border border-[#D1D5DB] rounded text-right font-bold text-xs"
                        />
                        <span className="text-[#9CA3AF] text-[10px]">COP/u</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-[#F3F4F6]">
                      <span className="text-[#6B7280]">Tarifa Confección / Ensamble Satélite:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="200"
                          min="0"
                          value={simMaquilaSew}
                          onChange={(e) => setSimMaquilaSew(parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-0.5 border border-[#D1D5DB] rounded text-right font-bold text-xs"
                        />
                        <span className="text-[#9CA3AF] text-[10px]">COP/u</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-[#F3F4F6]">
                      <span className="text-[#6B7280]">Tarifa Acabados, Ojalado y Plancha:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="100"
                          min="0"
                          value={simMaquilaFinish}
                          onChange={(e) => setSimMaquilaFinish(parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-0.5 border border-[#D1D5DB] rounded text-right font-bold text-xs"
                        />
                        <span className="text-[#9CA3AF] text-[10px]">COP/u</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-[#F3F4F6]">
                      <span className="text-[#6B7280]">Fletes & Transporte de Satélites:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="50"
                          min="0"
                          value={simMaquilaLogistics}
                          onChange={(e) => setSimMaquilaLogistics(parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-0.5 border border-[#D1D5DB] rounded text-right font-bold text-xs"
                        />
                        <span className="text-[#9CA3AF] text-[10px]">COP/u</span>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-between items-center text-sm font-bold bg-[#ECFDF5] p-3 rounded-lg border border-emerald-100">
                      <span className="text-[#111827]">Costo Unitario Maquila:</span>
                      <span className="text-[#059669] text-base">{formatCOP(liveTotalMaquila)}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1 px-1">
                      <span className="text-[#6B7280]">Margen Bruto sobre PVP ({formatCOP(selectedGarment.retailPrice)}):</span>
                      <span className="font-bold text-[#059669]">
                        {selectedGarment.retailPrice > 0
                          ? (((selectedGarment.retailPrice - liveTotalMaquila) / selectedGarment.retailPrice) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decision & Economic Summary Banner */}
              <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                      Comparativa Económica de Decisión
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-bold ${
                        internalSavingsPerUnit >= 0
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {internalSavingsPerUnit >= 0
                        ? `Ahorro Taller Propio: ${formatCOP(internalSavingsPerUnit)} / prenda`
                        : `Ahorro Maquila: ${formatCOP(Math.abs(internalSavingsPerUnit))} / prenda`}
                    </span>
                  </div>
                  <p className="text-xs text-[#4B5563]">
                    Para el lote meta de <strong>{selectedGarment.targetSales.toLocaleString()} unidades</strong>, producir
                    en taller interno representa un impacto de{' '}
                    <strong className="text-[#111827]">{formatCOP(batchSavings)}</strong> en comparación con maquila satélite.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveCosting}
                  className="px-4 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg text-xs font-bold transition-colors shadow-2xs shrink-0 flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  Guardar Tarifas en Ficha Técnica
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
