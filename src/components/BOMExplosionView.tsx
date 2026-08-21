import React, { useState } from 'react';
import { Garment, RawMaterial, BOMItem, OperationRouting, QualityCheckpoint, GarmentCosting } from '../types';
import {
  Layers,
  Plus,
  Trash2,
  Edit3,
  Download,
  Scissors,
  Clock,
  CheckCircle,
  Factory,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
  TrendingUp,
  FileText,
  LayoutGrid,
  Table as TableIcon,
} from 'lucide-react';
import { formatCOP } from '../utils/formatters';
import { exportGarmentTechPackPDF } from '../services/pdfExporter';

interface BOMExplosionViewProps {
  garments: Garment[];
  rawMaterials: RawMaterial[];
  onUpdateGarmentBOM: (garmentId: string, updatedBOM: BOMItem[]) => void;
  onUpdateGarmentOperations?: (garmentId: string, updatedOperations: OperationRouting[]) => void;
  onUpdateGarmentQuality?: (garmentId: string, updatedQC: QualityCheckpoint[]) => void;
  onUpdateGarmentCosting?: (garmentId: string, updatedCosting: GarmentCosting) => void;
  onOpenNewGarmentModal?: () => void;
}

export const BOMExplosionView: React.FC<BOMExplosionViewProps> = ({
  garments,
  rawMaterials,
  onUpdateGarmentBOM,
  onUpdateGarmentOperations,
  onUpdateGarmentQuality,
  onUpdateGarmentCosting,
  onOpenNewGarmentModal,
}) => {
  const [selectedGarmentId, setSelectedGarmentId] = useState<string>(garments[0]?.id || '');
  const [activeSubTab, setActiveSubTab] = useState<'bom' | 'tiempos' | 'calidad' | 'costeo'>('bom');
  const [isEditingWaste, setIsEditingWaste] = useState(false);

  // New BOM Item state
  const [newMaterialId, setNewMaterialId] = useState<string>('');
  const [newMaterialQty, setNewMaterialQty] = useState<number>(0);
  const [newMaterialWaste, setNewMaterialWaste] = useState<number>(3);

  // New Operation state
  const [newOpName, setNewOpName] = useState('');
  const [newOpDept, setNewOpDept] = useState<'Corte' | 'Preparación' | 'Ensamble' | 'Terminación' | 'Control de Calidad'>('Ensamble');
  const [newOpMachinery, setNewOpMachinery] = useState('Plana 1 Aguja');
  const [newOpSAM, setNewOpSAM] = useState<number>(1.5);
  const [newOpNotes, setNewOpNotes] = useState('');

  // New Quality Checkpoint state
  const [newQCStage, setNewQCStage] = useState<'Corte' | 'Costura' | 'Plancha' | 'Empaque Final'>('Costura');
  const [newQCParam, setNewQCParam] = useState('');
  const [newQCTol, setNewQCTol] = useState('± 0.5 cm');
  const [newQCDefect, setNewQCDefect] = useState('');
  const [newQCSeverity, setNewQCSeverity] = useState<'Menor' | 'Mayor' | 'Crítico'>('Mayor');

  // Costing simulation state
  const [simLaborRate, setSimLaborRate] = useState<number>(150); // COP per minute
  const [simOverheadRate, setSimOverheadRate] = useState<number>(45); // COP per minute CIF
  const [simMaquilaCut, setSimMaquilaCut] = useState<number>(1200);
  const [simMaquilaSew, setSimMaquilaSew] = useState<number>(4800);
  const [simMaquilaFinish, setSimMaquilaFinish] = useState<number>(1500);
  const [simMaquilaLogistics, setSimMaquilaLogistics] = useState<number>(600);

  const selectedGarment = garments.find((g) => g.id === selectedGarmentId) || garments[0];

  const calculateGarmentMaterialCost = (garment: Garment): number => {
    return garment.bom.reduce((acc, item) => {
      const mat = rawMaterials.find((m) => m.id === item.rawMaterialId);
      const unitCost = mat?.unitCost || 0;
      const effectiveQty = item.quantityPerGarment * (1 + item.wastePercent / 100);
      return acc + effectiveQty * unitCost;
    }, 0);
  };

  const handleAddMaterialToBOM = () => {
    if (!selectedGarment || !newMaterialId || newMaterialQty <= 0) return;
    const material = rawMaterials.find((m) => m.id === newMaterialId);
    if (!material) return;

    const newItem: BOMItem = {
      rawMaterialId: material.id,
      rawMaterialName: material.name,
      quantityPerGarment: newMaterialQty,
      wastePercent: newMaterialWaste,
      unit: material.unit,
      category: material.category,
    };

    const updatedBOM = [...selectedGarment.bom, newItem];
    onUpdateGarmentBOM(selectedGarment.id, updatedBOM);

    setNewMaterialId('');
    setNewMaterialQty(0);
    setNewMaterialWaste(3);
  };

  const handleDeleteBOMItem = (index: number) => {
    if (!selectedGarment) return;
    const updatedBOM = selectedGarment.bom.filter((_, i) => i !== index);
    onUpdateGarmentBOM(selectedGarment.id, updatedBOM);
  };

  const handleUpdateItemWaste = (index: number, newWaste: number) => {
    if (!selectedGarment) return;
    const updatedBOM = selectedGarment.bom.map((item, i) =>
      i === index ? { ...item, wastePercent: Math.max(0, newWaste) } : item
    );
    onUpdateGarmentBOM(selectedGarment.id, updatedBOM);
  };

  const handleUpdateItemQuantity = (index: number, newQty: number) => {
    if (!selectedGarment) return;
    const updatedBOM = selectedGarment.bom.map((item, i) =>
      i === index ? { ...item, quantityPerGarment: Math.max(0, newQty) } : item
    );
    onUpdateGarmentBOM(selectedGarment.id, updatedBOM);
  };

  // Operations routing handlers
  const handleAddOperation = () => {
    if (!selectedGarment || !newOpName || newOpSAM <= 0 || !onUpdateGarmentOperations) return;
    const currentOps = selectedGarment.operationsRouting || [];
    const newStepNum = currentOps.length + 1;

    const newOp: OperationRouting = {
      id: `op_${Date.now()}`,
      stepNumber: newStepNum,
      operationName: newOpName,
      department: newOpDept,
      machinery: newOpMachinery,
      standardMinutes: newOpSAM,
      criticalNotes: newOpNotes,
    };

    const updatedOps = [...currentOps, newOp];
    onUpdateGarmentOperations(selectedGarment.id, updatedOps);

    setNewOpName('');
    setNewOpSAM(1.5);
    setNewOpNotes('');
  };

  const handleDeleteOperation = (opId: string) => {
    if (!selectedGarment || !onUpdateGarmentOperations) return;
    const currentOps = selectedGarment.operationsRouting || [];
    const updatedOps = currentOps
      .filter((op) => op.id !== opId)
      .map((op, idx) => ({ ...op, stepNumber: idx + 1 }));
    onUpdateGarmentOperations(selectedGarment.id, updatedOps);
  };

  // Quality Checkpoints handlers
  const handleAddQualityCheckpoint = () => {
    if (!selectedGarment || !newQCParam || !onUpdateGarmentQuality) return;
    const currentQC = selectedGarment.qualityCheckpoints || [];
    const newQC: QualityCheckpoint = {
      id: `qc_${Date.now()}`,
      stage: newQCStage,
      parameter: newQCParam,
      tolerance: newQCTol,
      potentialDefect: newQCDefect,
      severity: newQCSeverity,
    };
    const updated = [...currentQC, newQC];
    onUpdateGarmentQuality(selectedGarment.id, updated);
    setNewQCParam('');
    setNewQCDefect('');
  };

  const handleDeleteQC = (qcId: string) => {
    if (!selectedGarment || !onUpdateGarmentQuality) return;
    const currentQC = selectedGarment.qualityCheckpoints || [];
    onUpdateGarmentQuality(selectedGarment.id, currentQC.filter((q) => q.id !== qcId));
  };

  // Save Costing
  const handleSaveCosting = () => {
    if (!selectedGarment || !onUpdateGarmentCosting) return;
    const activeTotalMfgMin =
      selectedGarment.operationsRouting && selectedGarment.operationsRouting.length > 0
        ? selectedGarment.operationsRouting.reduce((s, o) => s + o.standardMinutes, 0)
        : selectedGarment.productionTimes?.totalManufacturingMinutes || 25;

    const rawMatCost = calculateGarmentMaterialCost(selectedGarment);
    const modCost = Math.round(activeTotalMfgMin * simLaborRate);
    const cifCost = Math.round(activeTotalMfgMin * simOverheadRate);
    const totalInternal = rawMatCost + modCost + cifCost;

    const totalMaquila =
      rawMatCost + simMaquilaCut + simMaquilaSew + simMaquilaFinish + simMaquilaLogistics;

    const updatedCosting: GarmentCosting = {
      rawMaterialCost: rawMatCost,
      laborCostPerMinute: simLaborRate,
      directLaborCost: modCost,
      overheadCostPerMinute: simOverheadRate,
      overheadCost: cifCost,
      totalInternalCost: totalInternal,
      maquilaRates: {
        cuttingCostPerUnit: simMaquilaCut,
        sewingCostPerUnit: simMaquilaSew,
        finishingCostPerUnit: simMaquilaFinish,
        transportPerUnit: simMaquilaLogistics,
        totalMaquilaUnitCost: totalMaquila,
      },
      targetMarginPercent:
        selectedGarment.retailPrice > 0
          ? ((selectedGarment.retailPrice - totalInternal) / selectedGarment.retailPrice) * 100
          : 45,
    };

    onUpdateGarmentCosting(selectedGarment.id, updatedCosting);
  };

  const exportGarmentsToCSV = () => {
    const headers = [
      'ID',
      'SKU',
      'Nombre Prenda',
      'Coleccion/Categoria',
      'Meta de Ventas (u)',
      'Stock Terminado (u)',
      'WIP en Proceso (u)',
      'SAM Total Manufactura (min)',
      'Costo Total Materiales COP',
      'Precio Venta PVP COP',
    ];

    const rows = garments.map((g) => [
      `"${g.id}"`,
      `"${g.sku}"`,
      `"${g.name}"`,
      `"${g.category}"`,
      g.targetSales,
      g.finishedGoodsStock,
      g.productionWIP,
      g.productionTimes?.totalManufacturingMinutes || 25,
      calculateGarmentMaterialCost(g).toFixed(2),
      g.retailPrice,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FichasTecnicas_BOM_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const rawMaterialCost = selectedGarment ? calculateGarmentMaterialCost(selectedGarment) : 0;
  const activeTotalMfgMin =
    selectedGarment?.operationsRouting && selectedGarment.operationsRouting.length > 0
      ? selectedGarment.operationsRouting.reduce((s, o) => s + o.standardMinutes, 0)
      : selectedGarment?.productionTimes?.totalManufacturingMinutes || 25;

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

  if (garments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E6E1D8] p-10 sm:p-14 text-center shadow-xs space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-[#EBF2EC] text-[#3A5A40] flex items-center justify-center mx-auto">
          <Scissors className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-bold text-[#1C211D]">
            No hay prendas ni fichas técnicas registradas
          </h3>
          <p className="text-xs sm:text-sm text-[#5F6B61] max-w-md mx-auto">
            Registre sus prendas, consumos de tela por unidad (BOM), costos de mano de obra y hojas de ruta para comenzar la planeación.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onOpenNewGarmentModal && (
            <button
              onClick={onOpenNewGarmentModal}
              className="px-4 py-2 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
              id="btn-empty-create-garment"
            >
              <Plus className="w-4 h-4" />
              Crear Primera Prenda (BOM)
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile-Only Garment Selector Top Bar (screens < lg) */}
      <div className="lg:hidden bg-white p-3.5 rounded-xl border border-[#E6E1D8] shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#1C211D]">Prenda Seleccionada:</span>
          {onOpenNewGarmentModal && (
            <button
              onClick={onOpenNewGarmentModal}
              className="px-2.5 py-1 bg-[#3A5A40] text-white rounded-lg text-xs font-bold flex items-center gap-1 active:scale-95 touch-manipulation"
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva Prenda
            </button>
          )}
        </div>
        <select
          value={selectedGarmentId}
          onChange={(e) => setSelectedGarmentId(e.target.value)}
          className="w-full bg-[#FAF8F5] border border-[#D5CEC2] rounded-lg px-3 py-2 text-xs font-bold text-[#1C211D]"
          id="mobile-select-garment"
        >
          {garments.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} [{g.sku}] - Meta: {g.targetSales.toLocaleString()} u
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Garments Desktop Catalog (hidden on small screens, sidebar on desktop) */}
        <div className="hidden lg:flex bg-white rounded-xl border border-[#E6E1D8] shadow-xs p-5 flex-col h-fit">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-[#1C211D]">Catálogo de Prendas</h3>
              <p className="text-xs text-[#5F6B61]">Fichas Técnicas & Manufactura</p>
            </div>
            {onOpenNewGarmentModal && (
              <button
                onClick={onOpenNewGarmentModal}
                className="px-2.5 py-1.5 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors active:scale-95"
                id="btn-add-new-garment"
              >
                <Plus className="w-3.5 h-3.5" />
                Nueva Prenda
              </button>
            )}
          </div>

          <div className="space-y-2">
            {garments.map((garment) => {
              const isSelected = garment.id === selectedGarment?.id;
              const totalCost = garment.costing?.totalInternalCost || garment.costEstimate;

              return (
                <button
                  key={garment.id}
                  onClick={() => setSelectedGarmentId(garment.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#EBF2EC] border-[#3A5A40] text-[#1C211D] shadow-2xs ring-1 ring-[#3A5A40]'
                      : 'bg-white border-[#E6E1D8] hover:bg-[#FAF8F5] text-[#1C211D]'
                  }`}
                >
                  <div className="w-full pr-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#1C211D] truncate">{garment.name}</span>
                      <span className="text-[10px] font-mono font-bold bg-[#F2EEE6] text-[#5F6B61] px-1.5 py-0.2 rounded">
                        {garment.category.split('/')[0]}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#5F6B61] font-mono mt-0.5">
                      SKU: {garment.sku} | Meta: {garment.targetSales.toLocaleString()} u
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px]">
                      <span className="text-[#3A5A40] font-bold">
                        Costo Int: {formatCOP(totalCost)}
                      </span>
                      <span className="text-[#5F6B61] font-medium text-[10px]">
                        SAM: {garment.productionTimes?.sewingSAM || 20} min
                      </span>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#3A5A40]' : 'text-[#8F9990]'}`}
                  />
                </button>
              );
            })}
          </div>

          {/* Global Export Database to CSV */}
          <div className="mt-5 pt-4 border-t border-[#E6E1D8]">
            <button
              onClick={exportGarmentsToCSV}
              className="w-full py-2 px-3 bg-[#FAF8F5] hover:bg-[#F2EEE6] border border-[#D5CEC2] rounded-lg text-xs font-bold text-[#1C211D] flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              title="Descargar base de datos completa de fichas técnicas en CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#3A5A40]" />
              Exportar Base de Datos CSV
            </button>
          </div>
        </div>

        {/* Right Column: Selected Garment Tech Pack & Detailed Sub-Tabs */}
        {selectedGarment && (
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Garment Header Card */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-[#E6E1D8] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#E6E1D8] pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#EBF2EC] text-[#233829] text-[10px] font-bold rounded-md uppercase border border-[#D4E3D7]">
                      {selectedGarment.category}
                    </span>
                    <span className="text-xs text-[#5F6B61] font-mono">SKU: {selectedGarment.sku}</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#1C211D] mt-1">{selectedGarment.name}</h2>
                  {selectedGarment.techPackNotes && (
                    <p className="text-xs text-[#5F6B61] mt-1 italic">
                      "{selectedGarment.techPackNotes}"
                    </p>
                  )}
                </div>

                {/* Right side: PVP + Export PDF Button */}
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-2">
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] text-[#5F6B61] uppercase tracking-wider font-bold">
                      Precio PVP
                    </p>
                    <p className="text-base sm:text-lg font-bold text-[#3A5A40]">
                      {formatCOP(selectedGarment.retailPrice)}
                    </p>
                  </div>
                  <button
                    onClick={() => exportGarmentTechPackPDF(selectedGarment, rawMaterials)}
                    className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#F2EEE6] border border-[#D5CEC2] rounded-lg text-xs font-bold text-[#1C211D] flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
                    title="Descargar Ficha Técnica en PDF"
                    id="btn-export-techpack-pdf"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#3A5A40]" />
                    <span>Ficha PDF</span>
                  </button>
                </div>
              </div>

              {/* Quick Production Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-[#FAF8F5] p-3 rounded-lg border border-[#EAE6DF]">
                  <p className="text-[10px] text-[#5F6B61] uppercase font-bold">Meta Ciclo</p>
                  <p className="text-sm sm:text-base font-bold text-[#1C211D]">
                    {selectedGarment.targetSales.toLocaleString()} u
                  </p>
                </div>
                <div className="bg-[#FAF8F5] p-3 rounded-lg border border-[#EAE6DF]">
                  <p className="text-[10px] text-[#5F6B61] uppercase font-bold">Stock Terminado</p>
                  <p className="text-sm sm:text-base font-bold text-[#1C211D]">
                    {selectedGarment.finishedGoodsStock.toLocaleString()} u
                  </p>
                </div>
                <div className="bg-[#FAF8F5] p-3 rounded-lg border border-[#EAE6DF]">
                  <p className="text-[10px] text-[#5F6B61] uppercase font-bold">En Proceso (WIP)</p>
                  <p className="text-sm sm:text-base font-bold text-[#3A5A40]">
                    {selectedGarment.productionWIP.toLocaleString()} u
                  </p>
                </div>
                <div className="bg-[#FAF8F5] p-3 rounded-lg border border-[#EAE6DF]">
                  <p className="text-[10px] text-[#5F6B61] uppercase font-bold">Tiempo Ciclo</p>
                  <p className="text-sm sm:text-base font-bold text-[#1C211D]">
                    {selectedGarment.productionTimes?.totalCycleDays || 8} días
                  </p>
                </div>
              </div>

              {/* Sub-Navigation Tabs (Touch horizontal scroll) */}
              <div className="flex border-b border-[#E6E1D8] gap-1 pt-2 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setActiveSubTab('bom')}
                  className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
                    activeSubTab === 'bom'
                      ? 'border-[#3A5A40] text-[#3A5A40]'
                      : 'border-transparent text-[#5F6B61] hover:text-[#1C211D]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  1. Materiales & BOM ({selectedGarment.bom.length})
                </button>

                <button
                  onClick={() => setActiveSubTab('tiempos')}
                  className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
                    activeSubTab === 'tiempos'
                      ? 'border-[#3A5A40] text-[#3A5A40]'
                      : 'border-transparent text-[#5F6B61] hover:text-[#1C211D]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  2. Tiempos & Ruta SAM ({selectedGarment.operationsRouting?.length || 0})
                </button>

                <button
                  onClick={() => setActiveSubTab('calidad')}
                  className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
                    activeSubTab === 'calidad'
                      ? 'border-[#3A5A40] text-[#3A5A40]'
                      : 'border-transparent text-[#5F6B61] hover:text-[#1C211D]'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  3. Calidad & QC ({selectedGarment.qualityCheckpoints?.length || 0})
                </button>

                <button
                  onClick={() => setActiveSubTab('costeo')}
                  className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
                    activeSubTab === 'costeo'
                      ? 'border-[#3A5A40] text-[#3A5A40]'
                      : 'border-transparent text-[#5F6B61] hover:text-[#1C211D]'
                  }`}
                >
                  <Factory className="w-3.5 h-3.5" />
                  4. Taller vs Maquila
                </button>
              </div>
            </div>

            {/* TAB 1: BOM & MATERIALS STRUCTURE */}
            {activeSubTab === 'bom' && (
              <div className="bg-white rounded-xl border border-[#E6E1D8] shadow-xs overflow-hidden">
                <div className="p-3.5 sm:p-4 border-b border-[#E6E1D8] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#FCFBF9]">
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-[#1C211D]">
                      Estructura de Materiales & Insumos (BOM)
                    </h3>
                    <p className="text-[11px] text-[#5F6B61]">
                      Consumo de telas, avíos, entretelas e hilos por unidad
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-[#5F6B61] block">Costo Total Materiales:</span>
                      <span className="text-sm font-bold text-[#1C211D]">
                        {formatCOP(rawMaterialCost)}
                      </span>
                    </div>
                    <button
                      onClick={() => setIsEditingWaste(!isEditingWaste)}
                      className="text-xs font-semibold text-[#3A5A40] hover:text-[#2D4632] flex items-center gap-1 border border-[#D5CEC2] px-2.5 py-1 rounded-lg bg-white shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      {isEditingWaste ? 'Listo' : 'Editar'}
                    </button>
                  </div>
                </div>

                {/* Mobile Cards for BOM Items */}
                <div className="block sm:hidden p-3 space-y-2.5">
                  {selectedGarment.bom.map((item, idx) => {
                    const mat = rawMaterials.find((m) => m.id === item.rawMaterialId);
                    const unitCost = mat?.unitCost || 0;
                    const effectiveQty = item.quantityPerGarment * (1 + item.wastePercent / 100);
                    const itemCost = effectiveQty * unitCost;

                    return (
                      <div key={idx} className="p-3 rounded-lg border border-[#E6E1D8] bg-[#FAF8F5] space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-bold text-xs text-[#1C211D]">{item.rawMaterialName}</div>
                            <div className="text-[10px] text-[#5F6B61] font-mono">{mat?.sku || item.rawMaterialId} • {item.category}</div>
                          </div>
                          <button
                            onClick={() => handleDeleteBOMItem(idx)}
                            className="p-1 text-[#8F9990] hover:text-[#B33927]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs bg-white p-2 rounded border border-[#EAE6DF]">
                          <div>
                            <span className="text-[9px] text-[#5F6B61] block">Consumo Unit</span>
                            {isEditingWaste ? (
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.quantityPerGarment}
                                onChange={(e) => handleUpdateItemQuantity(idx, parseFloat(e.target.value) || 0)}
                                className="w-full bg-[#FAF8F5] border border-[#D5CEC2] rounded px-1 text-center font-bold text-xs"
                              />
                            ) : (
                              <span className="font-bold text-[#1C211D]">{item.quantityPerGarment} {item.unit}</span>
                            )}
                          </div>
                          <div>
                            <span className="text-[9px] text-[#5F6B61] block">Merma %</span>
                            {isEditingWaste ? (
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max="30"
                                value={item.wastePercent}
                                onChange={(e) => handleUpdateItemWaste(idx, parseFloat(e.target.value) || 0)}
                                className="w-full bg-[#FAF8F5] border border-[#D5CEC2] rounded px-1 text-center font-bold text-xs"
                              />
                            ) : (
                              <span className="font-bold text-[#82530C]">{item.wastePercent}%</span>
                            )}
                          </div>
                          <div>
                            <span className="text-[9px] text-[#5F6B61] block">Subtotal COP</span>
                            <span className="font-bold text-[#3A5A40]">{formatCOP(itemCost)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table for BOM Items */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-[#FAF8F5] text-[10px] font-bold uppercase text-[#5F6B61] border-b border-[#E6E1D8]">
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
                    <tbody className="divide-y divide-[#F2EEE6]">
                      {selectedGarment.bom.map((item, idx) => {
                        const mat = rawMaterials.find((m) => m.id === item.rawMaterialId);
                        const unitCost = mat?.unitCost || 0;
                        const effectiveQty = item.quantityPerGarment * (1 + item.wastePercent / 100);
                        const itemCost = effectiveQty * unitCost;

                        return (
                          <tr key={idx} className="hover:bg-[#FAF8F5]">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-[#1C211D]">{item.rawMaterialName}</div>
                              <div className="text-[10px] text-[#8F9990]">{mat?.sku || item.rawMaterialId}</div>
                            </td>

                            <td className="px-4 py-3">
                              <span className="text-[10px] font-medium bg-[#F2EEE6] text-[#5F6B61] px-2 py-0.5 rounded">
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
                                  className="w-20 bg-white border border-[#D5CEC2] rounded px-1.5 py-0.5 text-right font-bold text-xs"
                                />
                              ) : (
                                <span className="font-semibold text-[#1C211D]">
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
                                  className="w-16 bg-white border border-[#D5CEC2] rounded px-1.5 py-0.5 text-right font-bold text-xs"
                                />
                              ) : (
                                <span className="text-[#82530C] font-semibold">{item.wastePercent}%</span>
                              )}
                            </td>

                            <td className="px-4 py-3 text-right font-mono font-bold text-[#1C211D]">
                              {effectiveQty.toFixed(3)} {item.unit}
                            </td>

                            <td className="px-4 py-3 text-right font-mono text-[#5F6B61]">
                              {formatCOP(unitCost, false)}
                            </td>

                            <td className="px-4 py-3 text-right font-mono font-bold text-[#1C211D]">
                              {formatCOP(itemCost)}
                            </td>

                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleDeleteBOMItem(idx)}
                                className="p-1 text-[#8F9990] hover:text-[#B33927] transition-colors"
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
                <div className="p-3.5 sm:p-4 bg-[#FAF8F5] border-t border-[#E6E1D8]">
                  <div className="text-xs font-bold text-[#1C211D] mb-2">
                    Agregar Insumo a la Ficha Técnica:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    <select
                      value={newMaterialId}
                      onChange={(e) => setNewMaterialId(e.target.value)}
                      className="bg-white border border-[#D5CEC2] rounded-lg px-2.5 py-1.5 text-xs text-[#1C211D] sm:col-span-2"
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
                      value={newMaterialQty || ''}
                      onChange={(e) => setNewMaterialQty(parseFloat(e.target.value) || 0)}
                      className="bg-white border border-[#D5CEC2] rounded-lg px-2.5 py-1.5 text-xs text-[#1C211D]"
                    />

                    <input
                      type="number"
                      placeholder="Merma % (ej 5)"
                      step="0.5"
                      min="0"
                      max="30"
                      value={newMaterialWaste || ''}
                      onChange={(e) => setNewMaterialWaste(parseFloat(e.target.value) || 0)}
                      className="bg-white border border-[#D5CEC2] rounded-lg px-2.5 py-1.5 text-xs text-[#1C211D]"
                    />

                    <button
                      type="button"
                      onClick={handleAddMaterialToBOM}
                      disabled={!newMaterialId}
                      className="px-3 py-1.5 bg-[#3A5A40] hover:bg-[#2D4632] disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs active:scale-95"
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-white p-3.5 rounded-xl border border-[#E6E1D8] shadow-xs">
                    <div className="flex items-center gap-1.5 text-[#3A5A40] mb-1">
                      <Scissors className="w-4 h-4" />
                      <span className="text-xs font-bold">Tiempo Corte</span>
                    </div>
                    <p className="text-base sm:text-lg font-bold text-[#1C211D]">
                      {selectedGarment.productionTimes?.cuttingMinutesPerGarment || 3.5} min
                    </p>
                    <span className="text-[10px] text-[#5F6B61]">en mesa de trazo</span>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-[#E6E1D8] shadow-xs">
                    <div className="flex items-center gap-1.5 text-[#3A5A40] mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-bold">SAM Ensamble</span>
                    </div>
                    <p className="text-base sm:text-lg font-bold text-[#1C211D]">
                      {selectedGarment.productionTimes?.sewingSAM || 22.0} min
                    </p>
                    <span className="text-[10px] text-[#5F6B61]">minutos estándar costura</span>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-[#E6E1D8] shadow-xs">
                    <div className="flex items-center gap-1.5 text-[#3A5A40] mb-1">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs font-bold">Terminación</span>
                    </div>
                    <p className="text-base sm:text-lg font-bold text-[#1C211D]">
                      {selectedGarment.productionTimes?.finishingMinutesPerGarment || 4.5} min
                    </p>
                    <span className="text-[10px] text-[#5F6B61]">ojales, botón y empaque</span>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-[#E6E1D8] shadow-xs bg-[#EBF2EC]/40">
                    <div className="flex items-center gap-1.5 text-[#233829] mb-1">
                      <Factory className="w-4 h-4" />
                      <span className="text-xs font-bold">Total SAM</span>
                    </div>
                    <p className="text-base sm:text-lg font-bold text-[#3A5A40]">
                      {activeTotalMfgMin.toFixed(1)} min
                    </p>
                    <span className="text-[10px] text-[#5F6B61]">
                      Lote: {selectedGarment.productionTimes?.standardBatchSize || 300} u
                    </span>
                  </div>
                </div>

                {/* Operations Routing */}
                <div className="bg-white rounded-xl border border-[#E6E1D8] shadow-xs overflow-hidden">
                  <div className="p-3.5 sm:p-4 border-b border-[#E6E1D8] flex items-center justify-between bg-[#FCFBF9]">
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-[#1C211D]">
                        Ruta de Operaciones & Hoja de Proceso (Ciclo Completo)
                      </h3>
                      <p className="text-[11px] text-[#5F6B61]">
                        Secuencia técnica de confección, tipo de maquinaria y SAM asignado
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold bg-[#F2EEE6] text-[#5F6B61] px-2 py-0.5 rounded-lg">
                      {selectedGarment.operationsRouting?.length || 0} Operaciones
                    </span>
                  </div>

                  {/* Operations on mobile: Cards */}
                  <div className="block sm:hidden p-3 space-y-2">
                    {(!selectedGarment.operationsRouting || selectedGarment.operationsRouting.length === 0) ? (
                      <p className="text-xs text-[#8F9990] text-center py-4">No hay operaciones registradas aún.</p>
                    ) : (
                      selectedGarment.operationsRouting.map((op) => (
                        <div key={op.id} className="p-3 rounded-lg border border-[#E6E1D8] bg-[#FAF8F5] flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-[#3A5A40]">#{op.stepNumber}</span>
                              <span className="font-bold text-xs text-[#1C211D]">{op.operationName}</span>
                            </div>
                            <div className="text-[10px] text-[#5F6B61] mt-0.5">
                              {op.department} • {op.machinery}
                            </div>
                            {op.criticalNotes && (
                              <div className="text-[9px] text-[#8F9990] italic mt-0.5">{op.criticalNotes}</div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-xs text-[#3A5A40] block">{op.standardMinutes} min</span>
                            <button
                              onClick={() => handleDeleteOperation(op.id)}
                              className="text-[#8F9990] hover:text-[#B33927] mt-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Operations on desktop: Table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-[#FAF8F5] text-[10px] font-bold uppercase text-[#5F6B61] border-b border-[#E6E1D8]">
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
                      <tbody className="divide-y divide-[#F2EEE6]">
                        {selectedGarment.operationsRouting?.map((op) => (
                          <tr key={op.id} className="hover:bg-[#FAF8F5]">
                            <td className="p-3 text-center font-bold text-[#5F6B61]">{op.stepNumber}</td>
                            <td className="p-3 font-semibold text-[#1C211D]">{op.operationName}</td>
                            <td className="p-3">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F2EEE6] text-[#5F6B61]">
                                {op.department}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-[#1C211D]">{op.machinery}</td>
                            <td className="p-3 text-right font-bold text-[#3A5A40] font-mono">
                              {op.standardMinutes.toFixed(1)} min
                            </td>
                            <td className="p-3 text-[#5F6B61] max-w-xs truncate" title={op.criticalNotes}>
                              {op.criticalNotes || '-'}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleDeleteOperation(op.id)}
                                className="p-1 text-[#8F9990] hover:text-[#B33927] transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Operation Form */}
                  <div className="p-3.5 sm:p-4 bg-[#FAF8F5] border-t border-[#E6E1D8] space-y-2.5">
                    <span className="font-bold text-xs text-[#1C211D] block">
                      Agregar Operación a la Ruta de Confección:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 text-xs">
                      <input
                        type="text"
                        placeholder="Nombre Operación (ej. Pegar Cuello)"
                        value={newOpName}
                        onChange={(e) => setNewOpName(e.target.value)}
                        className="bg-white border border-[#D5CEC2] rounded-lg px-2.5 py-1.5 sm:col-span-2 text-[#1C211D]"
                      />
                      <select
                        value={newOpDept}
                        onChange={(e: any) => setNewOpDept(e.target.value)}
                        className="bg-white border border-[#D5CEC2] rounded-lg px-2 py-1.5 text-[#1C211D]"
                      >
                        <option value="Corte">Corte</option>
                        <option value="Preparación">Preparación</option>
                        <option value="Ensamble">Ensamble</option>
                        <option value="Terminación">Terminación</option>
                        <option value="Control de Calidad">Calidad</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Máquina (ej. Fileteadora)"
                        value={newOpMachinery}
                        onChange={(e) => setNewOpMachinery(e.target.value)}
                        className="bg-white border border-[#D5CEC2] rounded-lg px-2 py-1.5 text-[#1C211D]"
                      />
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        placeholder="SAM min"
                        value={newOpSAM || ''}
                        onChange={(e) => setNewOpSAM(parseFloat(e.target.value) || 0)}
                        className="bg-white border border-[#D5CEC2] rounded-lg px-2 py-1.5 text-right font-bold text-[#1C211D]"
                      />
                      <button
                        type="button"
                        onClick={handleAddOperation}
                        disabled={!newOpName}
                        className="px-3 py-1.5 bg-[#3A5A40] hover:bg-[#2D4632] disabled:opacity-50 text-white rounded-lg font-bold transition-colors shadow-2xs active:scale-95"
                      >
                        + Agregar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CALIDAD & QC */}
            {activeSubTab === 'calidad' && (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-[#E6E1D8] shadow-xs overflow-hidden">
                  <div className="p-3.5 sm:p-4 border-b border-[#E6E1D8] flex items-center justify-between bg-[#FCFBF9]">
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-[#1C211D]">
                        Puntos Críticos de Control de Calidad (QC)
                      </h3>
                      <p className="text-[11px] text-[#5F6B61]">
                        Parámetros de tolerancia, defectos potenciales y severidad según norma técnica
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold bg-[#F2EEE6] text-[#5F6B61] px-2 py-0.5 rounded-lg">
                      {selectedGarment.qualityCheckpoints?.length || 0} Checkpoints
                    </span>
                  </div>

                  <div className="p-3.5 sm:p-4 space-y-2.5">
                    {(!selectedGarment.qualityCheckpoints || selectedGarment.qualityCheckpoints.length === 0) ? (
                      <p className="text-xs text-[#8F9990] text-center py-4">No hay puntos de calidad registrados.</p>
                    ) : (
                      selectedGarment.qualityCheckpoints.map((qc) => (
                        <div
                          key={qc.id}
                          className="p-3 rounded-lg border border-[#E6E1D8] bg-[#FAF8F5] flex items-start justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F2EEE6] text-[#5F6B61]">
                                {qc.stage}
                              </span>
                              <span className="font-bold text-xs text-[#1C211D]">{qc.parameter}</span>
                            </div>
                            <div className="text-xs text-[#5F6B61]">
                              Tolerancia: <strong className="text-[#1C211D]">{qc.tolerance}</strong>
                              {qc.potentialDefect && <span> • Defecto: <strong className="text-[#B33927]">{qc.potentialDefect}</strong></span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                qc.severity === 'Crítico'
                                  ? 'bg-[#FDF2F0] text-[#B33927] border border-[#F0D5D0]'
                                  : qc.severity === 'Mayor'
                                  ? 'bg-[#FDF8EE] text-[#82530C] border border-[#F7E4BF]'
                                  : 'bg-[#EBF2EC] text-[#233829] border border-[#D4E3D7]'
                              }`}
                            >
                              {qc.severity}
                            </span>
                            <button
                              onClick={() => handleDeleteQC(qc.id)}
                              className="p-1 text-[#8F9990] hover:text-[#B33927]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add QC Form */}
                  <div className="p-3.5 sm:p-4 bg-[#FAF8F5] border-t border-[#E6E1D8] space-y-2.5">
                    <span className="font-bold text-xs text-[#1C211D] block">
                      Agregar Checkpoint de Calidad:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                      <select
                        value={newQCStage}
                        onChange={(e: any) => setNewQCStage(e.target.value)}
                        className="bg-white border border-[#D5CEC2] rounded-lg px-2 py-1.5 text-[#1C211D]"
                      >
                        <option value="Corte">Corte</option>
                        <option value="Costura">Costura</option>
                        <option value="Plancha">Plancha</option>
                        <option value="Empaque Final">Empaque Final</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Parámetro (ej. Ancho Pecho)"
                        value={newQCParam}
                        onChange={(e) => setNewQCParam(e.target.value)}
                        className="bg-white border border-[#D5CEC2] rounded-lg px-2.5 py-1.5 text-[#1C211D]"
                      />
                      <input
                        type="text"
                        placeholder="Tolerancia (ej. ± 0.5 cm)"
                        value={newQCTol}
                        onChange={(e) => setNewQCTol(e.target.value)}
                        className="bg-white border border-[#D5CEC2] rounded-lg px-2.5 py-1.5 text-[#1C211D]"
                      />
                      <select
                        value={newQCSeverity}
                        onChange={(e: any) => setNewQCSeverity(e.target.value)}
                        className="bg-white border border-[#D5CEC2] rounded-lg px-2 py-1.5 text-[#1C211D]"
                      >
                        <option value="Menor">Menor</option>
                        <option value="Mayor">Mayor</option>
                        <option value="Crítico">Crítico</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleAddQualityCheckpoint}
                        disabled={!newQCParam}
                        className="px-3 py-1.5 bg-[#3A5A40] hover:bg-[#2D4632] disabled:opacity-50 text-white rounded-lg font-bold transition-colors shadow-2xs active:scale-95"
                      >
                        + Agregar QC
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: COSTEO: TALLER VS MAQUILA */}
            {activeSubTab === 'costeo' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Internal Workshop Card */}
                  <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E6E1D8] shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-[#E6E1D8] pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-[#EBF2EC] text-[#3A5A40] rounded-lg">
                          <Factory className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-[#1C211D]">Taller Propio Interno</h4>
                          <p className="text-[11px] text-[#5F6B61]">Costeo estándar por minuto MOD & CIF</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-[#EBF2EC] text-[#233829] text-[10px] font-bold rounded">
                        Control
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-[#F2EEE6]">
                        <span className="text-[#5F6B61]">1. Materias Primas BOM:</span>
                        <span className="font-bold text-[#1C211D]">{formatCOP(rawMaterialCost)}</span>
                      </div>

                      <div className="flex items-center justify-between py-1 border-b border-[#F2EEE6]">
                        <span className="text-[#5F6B61]">Tarifa Minuto MOD:</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="10"
                            min="50"
                            value={simLaborRate}
                            onChange={(e) => setSimLaborRate(parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-0.5 border border-[#D5CEC2] rounded text-right font-bold text-xs"
                          />
                          <span className="text-[#8F9990] text-[10px]">COP/min</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-1 border-b border-[#F2EEE6]">
                        <span className="text-[#5F6B61]">Tarifa Minuto CIF:</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="5"
                            min="10"
                            value={simOverheadRate}
                            onChange={(e) => setSimOverheadRate(parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-0.5 border border-[#D5CEC2] rounded text-right font-bold text-xs"
                          />
                          <span className="text-[#8F9990] text-[10px]">COP/min</span>
                        </div>
                      </div>

                      <div className="flex justify-between py-1 border-b border-[#F2EEE6]">
                        <span className="text-[#5F6B61]">2. Mano de Obra Directa ({activeTotalMfgMin} min):</span>
                        <span className="font-bold text-[#1C211D]">{formatCOP(liveInternalMOD)}</span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-[#F2EEE6]">
                        <span className="text-[#5F6B61]">3. Costos Indirectos CIF ({activeTotalMfgMin} min):</span>
                        <span className="font-bold text-[#1C211D]">{formatCOP(liveInternalCIF)}</span>
                      </div>

                      <div className="pt-2 flex justify-between items-center text-sm font-bold bg-[#FAF8F5] p-3 rounded-lg border border-[#EAE6DF]">
                        <span className="text-[#1C211D]">Costo Unitario Interno:</span>
                        <span className="text-[#3A5A40] text-base">{formatCOP(liveTotalInternal)}</span>
                      </div>
                    </div>
                  </div>

                  {/* External Maquila Card */}
                  <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E6E1D8] shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-[#E6E1D8] pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-[#FAF8F5] text-[#1C211D] rounded-lg">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-[#1C211D]">Maquila / Taller Satélite</h4>
                          <p className="text-[11px] text-[#5F6B61]">Servicio tercerizado por prenda</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-[#FAF8F5] text-[#5F6B61] text-[10px] font-bold rounded">
                        Flexibilidad
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-[#F2EEE6]">
                        <span className="text-[#5F6B61]">1. Materias Primas BOM:</span>
                        <span className="font-bold text-[#1C211D]">{formatCOP(rawMaterialCost)}</span>
                      </div>

                      <div className="flex items-center justify-between py-1 border-b border-[#F2EEE6]">
                        <span className="text-[#5F6B61]">Tarifa Corte Satélite:</span>
                        <input
                          type="number"
                          step="100"
                          value={simMaquilaCut}
                          onChange={(e) => setSimMaquilaCut(parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-0.5 border border-[#D5CEC2] rounded text-right font-bold text-xs"
                        />
                      </div>

                      <div className="flex items-center justify-between py-1 border-b border-[#F2EEE6]">
                        <span className="text-[#5F6B61]">Tarifa Confección Satélite:</span>
                        <input
                          type="number"
                          step="200"
                          value={simMaquilaSew}
                          onChange={(e) => setSimMaquilaSew(parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-0.5 border border-[#D5CEC2] rounded text-right font-bold text-xs"
                        />
                      </div>

                      <div className="flex items-center justify-between py-1 border-b border-[#F2EEE6]">
                        <span className="text-[#5F6B61]">Tarifa Acabados & Plancha:</span>
                        <input
                          type="number"
                          step="100"
                          value={simMaquilaFinish}
                          onChange={(e) => setSimMaquilaFinish(parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-0.5 border border-[#D5CEC2] rounded text-right font-bold text-xs"
                        />
                      </div>

                      <div className="flex items-center justify-between py-1 border-b border-[#F2EEE6]">
                        <span className="text-[#5F6B61]">Fletes y Logística:</span>
                        <input
                          type="number"
                          step="50"
                          value={simMaquilaLogistics}
                          onChange={(e) => setSimMaquilaLogistics(parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-0.5 border border-[#D5CEC2] rounded text-right font-bold text-xs"
                        />
                      </div>

                      <div className="pt-2 flex justify-between items-center text-sm font-bold bg-[#FAF8F5] p-3 rounded-lg border border-[#EAE6DF]">
                        <span className="text-[#1C211D]">Costo Unitario Maquila:</span>
                        <span className="text-[#3A5A40] text-base">{formatCOP(liveTotalMaquila)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comparative Impact Card */}
                <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E6E1D8] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#5F6B61]">
                        Comparativa Económica
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-bold ${
                          internalSavingsPerUnit >= 0
                            ? 'bg-[#EBF2EC] text-[#233829]'
                            : 'bg-[#FDF8EE] text-[#82530C]'
                        }`}
                      >
                        {internalSavingsPerUnit >= 0
                          ? `Ahorro Taller Propio: ${formatCOP(internalSavingsPerUnit)} / u`
                          : `Ahorro Maquila: ${formatCOP(Math.abs(internalSavingsPerUnit))} / u`}
                      </span>
                    </div>
                    <p className="text-xs text-[#5F6B61]">
                      Para el lote meta de <strong>{selectedGarment.targetSales.toLocaleString()} unidades</strong>, producir
                      en taller interno representa un impacto de{' '}
                      <strong className="text-[#1C211D]">{formatCOP(batchSavings)}</strong> frente a maquila.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveCosting}
                    className="w-full sm:w-auto px-4 py-2.5 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-lg text-xs font-bold transition-colors shadow-2xs shrink-0 flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Guardar Tarifas
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
