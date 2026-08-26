import React, { useState, useMemo } from 'react';
import {
  Garment,
  RawMaterial,
  BOMItem,
  OperationRouting,
  QualityCheckpoint,
  GarmentCosting,
} from '../types';
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
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Edit2,
  Info,
  DollarSign,
  Package,
  Sparkles,
  Tag,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import { formatCOP } from '../utils/formatters';
import { exportGarmentTechPackPDF } from '../services/pdfExporter';
import { TechTermTooltip } from './TechTermTooltip';

interface BOMExplosionViewProps {
  garments: Garment[];
  rawMaterials: RawMaterial[];
  onUpdateGarmentBOM: (garmentId: string, updatedBOM: BOMItem[]) => void;
  onUpdateGarment?: (updatedGarment: Garment) => void;
  onToggleGarmentActive?: (garmentId: string) => void;
  onDeleteGarment?: (garmentId: string) => void;
  onOpenNewGarmentModal?: () => void;
  onOpenEditGarmentModal?: (garment: Garment) => void;
  onUpdateGarmentOperations?: (garmentId: string, updatedOperations: OperationRouting[]) => void;
  onUpdateGarmentQuality?: (garmentId: string, updatedQC: QualityCheckpoint[]) => void;
  onUpdateGarmentCosting?: (garmentId: string, updatedCosting: GarmentCosting) => void;
  onOpenCSVModal?: () => void;
}

export const BOMExplosionView: React.FC<BOMExplosionViewProps> = ({
  garments,
  rawMaterials,
  onUpdateGarmentBOM,
  onUpdateGarment,
  onToggleGarmentActive,
  onDeleteGarment,
  onOpenNewGarmentModal,
  onOpenEditGarmentModal,
  onUpdateGarmentOperations,
  onUpdateGarmentQuality,
  onUpdateGarmentCosting,
  onOpenCSVModal,
}) => {
  const [selectedGarmentId, setSelectedGarmentId] = useState<string>(garments[0]?.id || '');
  const [activeSubTab, setActiveSubTab] = useState<'bom' | 'tiempos' | 'calidad' | 'costeo'>('bom');
  const [isEditingWaste, setIsEditingWaste] = useState(true); // default true for high productivity

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // New BOM Item state
  const [newMaterialId, setNewMaterialId] = useState<string>('');
  const [newMaterialQty, setNewMaterialQty] = useState<number>(0.85);
  const [newMaterialWaste, setNewMaterialWaste] = useState<number>(5);
  const [newMaterialNotes, setNewMaterialNotes] = useState<string>('');

  // Batch Requirement Simulation State (1, 10, 100, 500, N garments)
  const [batchSimQty, setBatchSimQty] = useState<number>(100);

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

  // Filtered Garments Catalog
  const filteredGarments = useMemo(() => {
    return garments.filter((g) => {
      const isActive = g.isActive !== false;
      if (statusFilter === 'ACTIVE' && !isActive) return false;
      if (statusFilter === 'INACTIVE' && isActive) return false;

      if (categoryFilter !== 'ALL' && g.category !== categoryFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = g.name.toLowerCase().includes(q);
        const matchSku = g.sku.toLowerCase().includes(q);
        const matchCat = g.category.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchCat) return false;
      }

      return true;
    });
  }, [garments, searchQuery, categoryFilter, statusFilter]);

  // Categories list
  const garmentCategories = useMemo(() => {
    const set = new Set<string>();
    garments.forEach((g) => {
      if (g.category) set.add(g.category);
    });
    return Array.from(set);
  }, [garments]);

  // Selected Garment
  const selectedGarment = useMemo(() => {
    return (
      garments.find((g) => g.id === selectedGarmentId) ||
      filteredGarments[0] ||
      garments[0]
    );
  }, [garments, selectedGarmentId, filteredGarments]);

  // Cost Calculation
  const calculateGarmentMaterialCost = (garment: Garment): number => {
    if (!garment?.bom) return 0;
    return garment.bom.reduce((acc, item) => {
      const mat = rawMaterials.find((m) => m.id === item.rawMaterialId);
      const unitCost = mat?.unitCost || 0;
      const effectiveQty = item.quantityPerGarment * (1 + item.wastePercent / 100);
      return acc + effectiveQty * unitCost;
    }, 0);
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

  // Selected Material helper for new BOM item
  const selectedNewMat = rawMaterials.find((m) => m.id === newMaterialId);

  // Handle adding Material to BOM
  const handleAddMaterialToBOM = () => {
    if (!selectedGarment || !newMaterialId || newMaterialQty <= 0) {
      alert('Por favor seleccione un insumo y defina un consumo unitario válido (> 0).');
      return;
    }
    const material = rawMaterials.find((m) => m.id === newMaterialId);
    if (!material) return;

    if (selectedGarment.bom.some((b) => b.rawMaterialId === newMaterialId)) {
      alert('Este insumo ya se encuentra agregado a la ficha técnica de esta prenda.');
      return;
    }

    const newItem: BOMItem = {
      rawMaterialId: material.id,
      rawMaterialName: material.name,
      quantityPerGarment: newMaterialQty,
      wastePercent: newMaterialWaste,
      unit: material.unit,
      category: material.category,
      notes: newMaterialNotes.trim() || undefined,
    };

    const updatedBOM = [...selectedGarment.bom, newItem];
    onUpdateGarmentBOM(selectedGarment.id, updatedBOM);

    setNewMaterialId('');
    setNewMaterialQty(0.85);
    setNewMaterialWaste(5);
    setNewMaterialNotes('');
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
      i === index ? { ...item, quantityPerGarment: Math.max(0.001, newQty) } : item
    );
    onUpdateGarmentBOM(selectedGarment.id, updatedBOM);
  };

  // Operations Routing Handlers
  const handleAddOperation = () => {
    if (!selectedGarment || !newOpName || newOpSAM <= 0 || !onUpdateGarmentOperations) return;
    const currentOps = selectedGarment.operationsRouting || [];
    const newStepNum = currentOps.length + 1;

    const newOp: OperationRouting = {
      id: `op_${Date.now()}`,
      stepNumber: newStepNum,
      operationName: newOpName.trim(),
      department: newOpDept as any,
      machinery: newOpMachinery.trim(),
      standardMinutes: newOpSAM,
      criticalNotes: newOpNotes.trim() || undefined,
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

  // Quality Checkpoints Handlers
  const handleAddQualityCheckpoint = () => {
    if (!selectedGarment || !newQCParam || !onUpdateGarmentQuality) return;
    const currentQC = selectedGarment.qualityCheckpoints || [];
    const newQC: QualityCheckpoint = {
      id: `qc_${Date.now()}`,
      stage: newQCStage,
      parameter: newQCParam.trim(),
      tolerance: newQCTol.trim(),
      potentialDefect: newQCDefect.trim() || 'Defecto visual / dimensional',
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
    const updatedCosting: GarmentCosting = {
      rawMaterialCost,
      laborCostPerMinute: simLaborRate,
      directLaborCost: liveInternalMOD,
      overheadCostPerMinute: simOverheadRate,
      overheadCost: liveInternalCIF,
      totalInternalCost: liveTotalInternal,
      maquilaRates: {
        cuttingCostPerUnit: simMaquilaCut,
        sewingCostPerUnit: simMaquilaSew,
        finishingCostPerUnit: simMaquilaFinish,
        transportPerUnit: simMaquilaLogistics,
        totalMaquilaUnitCost: liveTotalMaquila,
      },
      targetMarginPercent:
        selectedGarment.retailPrice > 0
          ? ((selectedGarment.retailPrice - liveTotalInternal) / selectedGarment.retailPrice) * 100
          : 45,
    };

    onUpdateGarmentCosting(selectedGarment.id, updatedCosting);
    alert('Estructura de costos guardada exitosamente.');
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
      'Estado',
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
      g.isActive !== false ? 'Activa' : 'Desactivada',
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

  if (garments.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#E6E1D8] p-10 sm:p-14 text-center shadow-xs space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#EBF2EC] text-[#3A5A40] flex items-center justify-center mx-auto">
          <Scissors className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-bold text-[#1C211D]">
            No hay prendas ni fichas técnicas registradas
          </h3>
          <p className="text-xs sm:text-sm text-[#5F6B61] max-w-md mx-auto">
            Registre sus prendas, configure la relación con sus materias primas (BOM) y defina los consumos unitarios por prenda para activar el planificador MRP.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onOpenCSVModal && (
            <button
              onClick={onOpenCSVModal}
              className="px-4 py-2.5 bg-white border border-[#D5CEC2] hover:bg-[#FAF8F5] text-[#1C211D] rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              id="btn-empty-import-bom-csv"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#3A5A40]" />
              Importar Fichas Técnicas CSV
            </button>
          )}
          {onOpenNewGarmentModal && (
            <button
              onClick={onOpenNewGarmentModal}
              className="px-4 py-2.5 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
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
      <div className="lg:hidden bg-white p-4 rounded-xl border border-[#E6E1D8] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#1C211D] flex items-center gap-1.5">
            <Scissors className="w-4 h-4 text-[#3A5A40]" />
            Prenda Seleccionada:
          </span>
          <div className="flex items-center gap-1.5">
            {selectedGarment && onOpenEditGarmentModal && (
              <button
                onClick={() => onOpenEditGarmentModal(selectedGarment)}
                className="px-2.5 py-1 bg-white border border-[#D5CEC2] text-[#1C211D] rounded-lg text-xs font-semibold flex items-center gap-1 active:scale-95"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Editar
              </button>
            )}
            {onOpenNewGarmentModal && (
              <button
                onClick={onOpenNewGarmentModal}
                className="px-2.5 py-1 bg-[#3A5A40] text-white rounded-lg text-xs font-bold flex items-center gap-1 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                Nueva
              </button>
            )}
          </div>
        </div>
        <select
          value={selectedGarment?.id || ''}
          onChange={(e) => setSelectedGarmentId(e.target.value)}
          className="w-full bg-[#FAF8F5] border border-[#D5CEC2] rounded-lg px-3 py-2 text-xs font-bold text-[#1C211D]"
          id="mobile-select-garment"
        >
          {garments.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} [{g.sku}] {g.isActive === false ? '(Desactivada)' : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Garments Desktop Catalog (Sidebar on Desktop) */}
        <div className="hidden lg:flex bg-white rounded-2xl border border-[#E6E1D8] shadow-xs p-4 flex-col h-fit space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-[#1C211D]">Catálogo de Prendas</h3>
              <p className="text-[11px] text-[#5F6B61]">Gestión & Fichas Técnicas</p>
            </div>
            <div className="flex items-center gap-1.5">
              {onOpenCSVModal && (
                <button
                  onClick={onOpenCSVModal}
                  className="p-1.5 bg-white hover:bg-[#FAF8F5] text-[#1C211D] border border-[#D5CEC2] rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                  title="Importar catálogo y fichas técnicas CSV"
                  id="btn-import-bom-csv"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#3A5A40]" />
                </button>
              )}
              {onOpenNewGarmentModal && (
                <button
                  onClick={onOpenNewGarmentModal}
                  className="px-2.5 py-1.5 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors active:scale-95 cursor-pointer"
                  id="btn-add-new-garment"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva</span>
                </button>
              )}
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="space-y-2 pt-1 border-t border-[#E6E1D8]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8F9990] absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Buscar prenda o SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#FAF8F5] border border-[#D5CEC2] rounded-lg text-xs text-[#1C211D] placeholder-[#8F9990] focus:ring-1 focus:ring-[#3A5A40]"
              />
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full p-1 bg-[#FAF8F5] border border-[#D5CEC2] rounded text-[11px] text-[#1C211D]"
              >
                <option value="ALL">Todas las líneas</option>
                {garmentCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full p-1 bg-[#FAF8F5] border border-[#D5CEC2] rounded text-[11px] text-[#1C211D]"
              >
                <option value="ALL">Todos los estados</option>
                <option value="ACTIVE">Solo Activas</option>
                <option value="INACTIVE">Solo Desactivadas</option>
              </select>
            </div>
          </div>

          {/* Garment List Cards */}
          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {filteredGarments.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#5F6B61] space-y-1">
                <Scissors className="w-6 h-6 text-[#D5CEC2] mx-auto" />
                <p className="font-semibold">No se encontraron prendas</p>
                <p className="text-[10px]">Ajuste los filtros de búsqueda.</p>
              </div>
            ) : (
              filteredGarments.map((garment) => {
                const isSelected = garment.id === selectedGarment?.id;
                const totalCost = calculateGarmentMaterialCost(garment);
                const isAct = garment.isActive !== false;

                return (
                  <div
                    key={garment.id}
                    onClick={() => setSelectedGarmentId(garment.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between relative group ${
                      isSelected
                        ? 'bg-[#EBF2EC] border-[#3A5A40] text-[#1C211D] shadow-2xs ring-1 ring-[#3A5A40]'
                        : 'bg-white border-[#E6E1D8] hover:bg-[#FAF8F5] text-[#1C211D]'
                    } ${!isAct ? 'opacity-70 bg-stone-50' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="font-bold text-xs text-[#1C211D] truncate max-w-[170px]">
                        {garment.name}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                          isAct
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-stone-100 text-stone-600 border-stone-300'
                        }`}
                      >
                        {isAct ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#5F6B61] font-mono mt-1">
                      <span>SKU: {garment.sku}</span>
                      <span className="bg-[#F2EEE6] text-[#5F6B61] px-1 rounded font-sans font-medium">
                        {garment.category.split('/')[0]}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2 text-[11px] pt-1.5 border-t border-[#EAE6DF]">
                      <span className="text-[#3A5A40] font-bold font-mono">
                        {formatCOP(totalCost, false)}
                      </span>
                      <span className="text-[#5F6B61] text-[10px]">
                        {garment.bom.length} {garment.bom.length === 1 ? 'insumo' : 'insumos'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Global Export Database to CSV */}
          <div className="pt-3 border-t border-[#E6E1D8]">
            <button
              onClick={exportGarmentsToCSV}
              className="w-full py-2 px-3 bg-[#FAF8F5] hover:bg-[#F2EEE6] border border-[#D5CEC2] rounded-xl text-xs font-bold text-[#1C211D] flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              title="Descargar base de datos completa de fichas técnicas en CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#3A5A40]" />
              Exportar Prendas en CSV
            </button>
          </div>
        </div>

        {/* Right Column: Selected Garment Tech Pack & Detailed Sub-Tabs */}
        {selectedGarment && (
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Garment Header Card */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#E6E1D8] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#E6E1D8] pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#EBF2EC] text-[#233829] text-[10px] font-bold rounded-md uppercase border border-[#D4E3D7]">
                      {selectedGarment.category}
                    </span>
                    <span className="text-xs text-[#5F6B61] font-mono font-bold">
                      SKU: {selectedGarment.sku}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                        selectedGarment.isActive !== false
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-stone-100 text-stone-600 border-stone-300'
                      }`}
                    >
                      {selectedGarment.isActive !== false ? 'Prenda Activa' : 'Prenda Desactivada'}
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-bold text-[#1C211D]">
                    {selectedGarment.name}
                  </h2>

                  {selectedGarment.description && (
                    <p className="text-xs text-[#5F6B61]">
                      {selectedGarment.description}
                    </p>
                  )}
                </div>

                {/* Right side: PVP + Action Toolbar */}
                <div className="flex flex-row sm:flex-col items-end justify-between gap-2.5">
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] text-[#5F6B61] uppercase tracking-wider font-bold">
                      Precio de Venta PVP
                    </p>
                    <p className="text-base sm:text-lg font-bold text-[#3A5A40] font-mono">
                      {formatCOP(selectedGarment.retailPrice)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {onOpenEditGarmentModal && (
                      <button
                        onClick={() => onOpenEditGarmentModal(selectedGarment)}
                        className="px-3 py-1.5 bg-white hover:bg-[#FAF8F5] border border-[#D5CEC2] rounded-lg text-xs font-bold text-[#1C211D] flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
                        id="btn-edit-garment-details"
                        title="Editar datos maestros y ficha técnica de la prenda"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[#3A5A40]" />
                        <span>Editar</span>
                      </button>
                    )}

                    {onToggleGarmentActive && (
                      <button
                        onClick={() => onToggleGarmentActive(selectedGarment.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95 ${
                          selectedGarment.isActive !== false
                            ? 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-300'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                        title={
                          selectedGarment.isActive !== false
                            ? 'Desactivar prenda del plan de compras'
                            : 'Reactivar prenda'
                        }
                      >
                        {selectedGarment.isActive !== false ? 'Desactivar' : 'Activar'}
                      </button>
                    )}

                    {onDeleteGarment && (
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `¿Está seguro de eliminar permanentemente la prenda "${selectedGarment.name}" [${selectedGarment.sku}]?`
                            )
                          ) {
                            onDeleteGarment(selectedGarment.id);
                          }
                        }}
                        className="p-1.5 text-[#8F9990] hover:text-[#B33927] hover:bg-[#FAF8F5] rounded-lg transition-colors border border-transparent hover:border-[#E6E1D8]"
                        title="Eliminar prenda"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => exportGarmentTechPackPDF(selectedGarment, rawMaterials)}
                      className="px-3 py-1.5 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                      title="Descargar Ficha Técnica Oficial en PDF"
                      id="btn-export-techpack-pdf"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Ficha PDF</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Production Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE6DF]">
                  <p className="text-[10px] text-[#5F6B61] uppercase font-bold">Meta del Ciclo</p>
                  <p className="text-sm sm:text-base font-bold text-[#1C211D]">
                    {selectedGarment.targetSales.toLocaleString()} u
                  </p>
                </div>
                <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE6DF]">
                  <p className="text-[10px] text-[#5F6B61] uppercase font-bold">Stock PT (Bodega)</p>
                  <p className="text-sm sm:text-base font-bold text-[#1C211D]">
                    {selectedGarment.finishedGoodsStock.toLocaleString()} u
                  </p>
                </div>
                <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE6DF]">
                  <p className="text-[10px] text-[#5F6B61] uppercase font-bold">En Proceso (WIP)</p>
                  <p className="text-sm sm:text-base font-bold text-[#3A5A40]">
                    {selectedGarment.productionWIP.toLocaleString()} u
                  </p>
                </div>
                <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE6DF]">
                  <p className="text-[10px] text-[#5F6B61] uppercase font-bold">Costo Materiales</p>
                  <p className="text-sm sm:text-base font-bold text-[#1C211D] font-mono">
                    {formatCOP(rawMaterialCost, false)}
                  </p>
                </div>
              </div>

              {/* Sub-Navigation Tabs */}
              <div className="flex border-b border-[#E6E1D8] gap-1 pt-2 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setActiveSubTab('bom')}
                  className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
                    activeSubTab === 'bom'
                      ? 'border-[#3A5A40] text-[#3A5A40]'
                      : 'border-transparent text-[#5F6B61] hover:text-[#1C211D]'
                  }`}
                  id="tab-bom-materials"
                >
                  <Layers className="w-3.5 h-3.5" />
                  1. Ficha de Materiales (BOM) & Consumos ({selectedGarment.bom.length})
                </button>

                <button
                  onClick={() => setActiveSubTab('tiempos')}
                  className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
                    activeSubTab === 'tiempos'
                      ? 'border-[#3A5A40] text-[#3A5A40]'
                      : 'border-transparent text-[#5F6B61] hover:text-[#1C211D]'
                  }`}
                  id="tab-bom-sam"
                >
                  <Clock className="w-3.5 h-3.5" />
                  2. Tiempos SAM & Ruta ({selectedGarment.operationsRouting?.length || 0})
                </button>

                <button
                  onClick={() => setActiveSubTab('calidad')}
                  className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
                    activeSubTab === 'calidad'
                      ? 'border-[#3A5A40] text-[#3A5A40]'
                      : 'border-transparent text-[#5F6B61] hover:text-[#1C211D]'
                  }`}
                  id="tab-bom-qc"
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
                  id="tab-bom-costing"
                >
                  <Factory className="w-3.5 h-3.5" />
                  4. Costeo & Maquila
                </button>
              </div>
            </div>

            {/* TAB 1: BOM & MATERIALS STRUCTURE & CONSUMPTION CONFIGURATION */}
            {activeSubTab === 'bom' && (
              <div className="bg-white rounded-2xl border border-[#E6E1D8] shadow-xs overflow-hidden space-y-0">
                {/* Header Bar */}
                <div className="p-4 sm:p-5 border-b border-[#E6E1D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FCFBF9]">
                  <div>
                    <h3 className="font-bold text-sm text-[#1C211D] flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#3A5A40]" />
                      Estructura de Materiales (BOM) & Configuración de Consumo por Prenda
                    </h3>
                    <p className="text-xs text-[#5F6B61] mt-0.5">
                      Indique exactamente los insumos y consumos necesarios para fabricar 1 unidad de esta prenda.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-[#5F6B61] block">Costo Total Materiales:</span>
                      <span className="text-sm font-bold text-[#3A5A40] font-mono">
                        {formatCOP(rawMaterialCost)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pedagogical Tip / Educational Guidance Card */}
                <div className="p-4 bg-[#EBF2EC]/70 border-b border-[#D4E3D7] flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#3A5A40] text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4 text-amber-200" />
                  </div>
                  <div className="text-xs text-[#233829] space-y-1">
                    <div className="font-bold text-xs">
                      ¿Cómo funciona el Consumo por Prenda en TextilIQ?
                    </div>
                    <p className="text-[11px] leading-relaxed text-[#2D4736]">
                      <strong>Definición del consumo unitario:</strong> Especifique la cantidad neta que requiere cada prenda (ejemplo: <strong>una camiseta consume 0,85 kg de tela</strong> + 1 etiqueta + 0,02 conos de hilo).textilIQ aplicará el % de merma configurado para proyectar las órdenes de compra en el motor MRP.
                    </p>
                  </div>
                </div>

                {/* Table of BOM Items */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-[#FAF8F5] text-[10px] font-bold uppercase text-[#5F6B61] border-b border-[#E6E1D8]">
                      <tr>
                        <th className="px-4 py-3">Insumo / Materia Prima</th>
                        <th className="px-4 py-3">Categoría & Unidad</th>
                        <th className="px-4 py-3 text-right">Consumo por Prenda</th>
                        <th className="px-4 py-3 text-right">
                          <TechTermTooltip termKey="merma">Merma (%)</TechTermTooltip>
                        </th>
                        <th className="px-4 py-3 text-right">Consumo Real (Bruto)</th>
                        <th className="px-4 py-3 text-right">Costo Unit. Insumo</th>
                        <th className="px-4 py-3 text-right">Costo Componente</th>
                        <th className="px-4 py-3 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F2EEE6]">
                      {selectedGarment.bom.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-[#5F6B61]">
                            <Package className="w-8 h-8 text-[#D5CEC2] mx-auto mb-2" />
                            <p className="font-bold text-[#1C211D]">No hay materias primas vinculadas</p>
                            <p className="text-[11px] text-[#5F6B61] max-w-sm mx-auto mt-0.5">
                              Utilice el formulario inferior para agregar telas, hilos, botones, cremalleras o etiquetas a esta prenda.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        selectedGarment.bom.map((item, idx) => {
                          const mat = rawMaterials.find((m) => m.id === item.rawMaterialId);
                          const unitCost = mat?.unitCost || 0;
                          const effectiveQty = item.quantityPerGarment * (1 + item.wastePercent / 100);
                          const itemCost = effectiveQty * unitCost;
                          const hasYield = Boolean(
                            mat && ((mat.yieldFactor && mat.yieldFactor !== 1.0) || (mat.purchaseUnit && mat.usageUnit && mat.purchaseUnit !== mat.usageUnit))
                          );
                          const pUnit = mat?.purchaseUnit || mat?.unit || item.unit;
                          const uUnit = mat?.usageUnit || item.unit;
                          const yFactor = mat?.yieldFactor || 1.0;
                          const equivPurchase = hasYield && yFactor > 0 ? (effectiveQty / yFactor).toFixed(4) : null;

                          return (
                            <tr key={idx} className="hover:bg-[#FAF8F5] transition-colors">
                              <td className="px-4 py-3">
                                <div className="font-bold text-[#1C211D]">{item.rawMaterialName}</div>
                                <div className="text-[10px] text-[#5F6B61] font-mono flex items-center gap-1.5 mt-0.5">
                                  <span>{mat?.sku || item.rawMaterialId}</span>
                                  {hasYield && (
                                    <span className="bg-[#EBF2EC] text-[#3A5A40] px-1.5 py-0.2 rounded text-[9px] font-bold">
                                      1 {pUnit} = {yFactor} {uUnit}
                                    </span>
                                  )}
                                </div>
                                {item.notes && <div className="text-[10px] text-[#8F9990]">{item.notes}</div>}
                              </td>

                              <td className="px-4 py-3">
                                <span className="text-[10px] font-semibold bg-[#F2EEE6] text-[#5F6B61] px-2 py-0.5 rounded">
                                  {item.category}
                                </span>
                              </td>

                              {/* Editable Net Consumption per Garment */}
                              <td className="px-4 py-3 text-right">
                                <div className="inline-flex items-center gap-1 justify-end">
                                  <input
                                    type="number"
                                    step="0.001"
                                    min="0.001"
                                    value={item.quantityPerGarment}
                                    onChange={(e) =>
                                      handleUpdateItemQuantity(idx, parseFloat(e.target.value) || 0)
                                    }
                                    className="w-20 bg-white border border-[#D5CEC2] rounded-lg px-2 py-1 text-right font-bold text-xs text-[#1C211D] focus:ring-1 focus:ring-[#3A5A40]"
                                  />
                                  <span className="text-[10px] font-semibold text-[#5F6B61] w-8 text-left">
                                    {item.unit}
                                  </span>
                                </div>
                              </td>

                              {/* Editable Waste % */}
                              <td className="px-4 py-3 text-right">
                                <div className="inline-flex items-center gap-1 justify-end">
                                  <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    max="50"
                                    value={item.wastePercent}
                                    onChange={(e) =>
                                      handleUpdateItemWaste(idx, parseFloat(e.target.value) || 0)
                                    }
                                    className="w-14 bg-white border border-[#D5CEC2] rounded-lg px-2 py-1 text-right font-semibold text-xs text-[#82530C] focus:ring-1 focus:ring-[#3A5A40]"
                                  />
                                  <span className="text-[10px] text-[#5F6B61]">%</span>
                                </div>
                              </td>

                              {/* Effective Gross Consumption */}
                              <td className="px-4 py-3 text-right font-mono">
                                <div className="font-semibold text-[#1C211D]">
                                  {effectiveQty.toFixed(3)} {item.unit}
                                </div>
                                {equivPurchase && (
                                  <div className="text-[10px] text-[#3A5A40]">
                                    ≈ {equivPurchase} {pUnit}
                                  </div>
                                )}
                              </td>

                              {/* Unit Cost of Material */}
                              <td className="px-4 py-3 text-right font-mono text-[#5F6B61]">
                                {formatCOP(unitCost, false)}
                              </td>

                              {/* Total Component Cost */}
                              <td className="px-4 py-3 text-right font-mono font-bold text-[#3A5A40]">
                                {formatCOP(itemCost, false)}
                              </td>

                              {/* Delete Action */}
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => handleDeleteBOMItem(idx)}
                                  className="p-1.5 text-[#8F9990] hover:text-[#B33927] rounded-lg transition-colors hover:bg-stone-100 cursor-pointer"
                                  title="Eliminar insumo de la ficha técnica"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ========================================================================= */}
                {/* EXPLOSIÓN DE REQUERIMIENTOS POR LOTE DE PRODUCCIÓN (1, 10, 100, 500, ETC.) */}
                {/* ========================================================================= */}
                <div className="p-4 sm:p-5 bg-[#FCFBF9] border-t border-[#E6E1D8] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#E6E1D8] shadow-2xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <Scissors className="w-4 h-4 text-[#3A5A40]" />
                        <h4 className="font-bold text-xs sm:text-sm text-[#1C211D]">
                          Calculadora de Explosión de Consumos por Lote de Fabricación
                        </h4>
                      </div>
                      <p className="text-[11px] text-[#5F6B61] mt-0.5">
                        Vea exactamente cuánta materia prima e inventario físico necesita para confeccionar cualquier cantidad de prendas.
                      </p>
                    </div>

                    {/* Batch Selector Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-[#5F6B61] mr-1">Calcular para:</span>
                      {[1, 10, 50, 100, 500, 1000].map((qty) => (
                        <button
                          key={qty}
                          type="button"
                          onClick={() => setBatchSimQty(qty)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            batchSimQty === qty
                              ? 'bg-[#3A5A40] text-white shadow-2xs'
                              : 'bg-white border border-[#D5CEC2] text-[#1C211D] hover:bg-[#FAF8F5]'
                          }`}
                        >
                          {qty.toLocaleString()} {qty === 1 ? 'prenda' : 'u'}
                        </button>
                      ))}
                      <div className="flex items-center gap-1 ml-1">
                        <input
                          type="number"
                          min="1"
                          value={batchSimQty}
                          onChange={(e) => setBatchSimQty(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-20 p-1 bg-white border border-[#3A5A40] rounded-lg text-xs font-bold text-center text-[#3A5A40]"
                        />
                        <span className="text-[10px] text-[#5F6B61] font-semibold">u</span>
                      </div>
                    </div>
                  </div>

                  {/* Batch Explosion Grid / Table */}
                  {selectedGarment.bom.length > 0 && (
                    <div className="border border-[#E6E1D8] rounded-xl overflow-hidden bg-white shadow-2xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#FAF8F5] text-[10px] font-bold uppercase text-[#5F6B61] border-b border-[#E6E1D8]">
                            <tr>
                              <th className="p-3">Materia Prima</th>
                              <th className="p-3 text-right">Consumo Unit.</th>
                              <th className="p-3 text-right">Requerido para {batchSimQty.toLocaleString()} u (Uso)</th>
                              <th className="p-3 text-right">Equivalente en Compra</th>
                              <th className="p-3 text-right">Stock en Bodega</th>
                              <th className="p-3 text-center">Disponibilidad</th>
                              <th className="p-3 text-right">Costo Insumo (Lote)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F2EEE6]">
                            {selectedGarment.bom.map((bItem, i) => {
                              const mat = rawMaterials.find((m) => m.id === bItem.rawMaterialId);
                              const grossUnit = bItem.quantityPerGarment * (1 + bItem.wastePercent / 100);
                              const totalBatchUsage = grossUnit * batchSimQty;
                              const pUnit = mat?.purchaseUnit || mat?.unit || bItem.unit;
                              const uUnit = mat?.usageUnit || bItem.unit;
                              const yFactor = mat?.yieldFactor || 1.0;
                              const totalBatchPurchase = yFactor > 0 ? totalBatchUsage / yFactor : totalBatchUsage;
                              const currentStock = mat?.currentStock || 0;
                              const stockInUsage = mat ? currentStock * yFactor : currentStock;
                              const hasEnough = stockInUsage >= totalBatchUsage;
                              const missingQty = Math.max(0, totalBatchPurchase - currentStock);
                              const cost = totalBatchUsage * (mat?.unitCost || 0);

                              return (
                                <tr key={i} className="hover:bg-[#FAF8F5]">
                                  <td className="p-3">
                                    <div className="font-bold text-[#1C211D]">{bItem.rawMaterialName}</div>
                                    <div className="text-[10px] text-[#5F6B61] font-mono">{mat?.sku || bItem.rawMaterialId}</div>
                                  </td>
                                  <td className="p-3 text-right font-mono text-[#5F6B61]">
                                    {bItem.quantityPerGarment} {bItem.unit} (+{bItem.wastePercent}%)
                                  </td>
                                  <td className="p-3 text-right font-bold text-[#1C211D] font-mono">
                                    {totalBatchUsage.toLocaleString(undefined, { maximumFractionDigits: 2 })} {uUnit}
                                  </td>
                                  <td className="p-3 text-right font-mono text-[#3A5A40] font-semibold">
                                    {totalBatchPurchase.toLocaleString(undefined, { maximumFractionDigits: 2 })} {pUnit}
                                  </td>
                                  <td className="p-3 text-right font-mono">
                                    <span className="font-bold text-[#1C211D]">{currentStock.toLocaleString()} {pUnit}</span>
                                    {yFactor !== 1.0 && (
                                      <span className="text-[10px] text-[#5F6B61] block">
                                        ≈ {stockInUsage.toLocaleString(undefined, { maximumFractionDigits: 1 })} {uUnit}
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 text-center">
                                    {hasEnough ? (
                                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                                        ✓ Stock Suficiente
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px] block" title={`Faltan ${missingQty.toFixed(2)} ${pUnit} para este lote`}>
                                        Faltan {missingQty.toFixed(1)} {pUnit}
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 text-right font-mono font-bold text-[#3A5A40]">
                                    {formatCOP(cost, false)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot className="bg-[#FAF8F5] border-t border-[#E6E1D8] font-bold">
                            <tr>
                              <td colSpan={6} className="p-3 text-right text-[#1C211D]">
                                Inversión Total Materia Prima para Fabricar {batchSimQty.toLocaleString()} prendas:
                              </td>
                              <td className="p-3 text-right font-mono text-sm text-[#3A5A40]">
                                {formatCOP(rawMaterialCost * batchSimQty)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Add Material to BOM Quick Panel */}
                <div className="p-4 sm:p-5 bg-[#FAF8F5] border-t border-[#E6E1D8] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1C211D] flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-[#3A5A40]" />
                      Vincular Nueva Materia Prima a esta Prenda:
                    </span>
                    <span className="text-[10px] text-[#5F6B61]">
                      Seleccione del catálogo de insumos y configure el consumo unitario.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    {/* Material Selector */}
                    <div className="sm:col-span-5">
                      <label className="text-[10px] text-[#5F6B61] block mb-1 font-semibold">
                        Materia Prima:
                      </label>
                      <select
                        value={newMaterialId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setNewMaterialId(id);
                          const m = rawMaterials.find((item) => item.id === id);
                          if (m) {
                            if (m.category === 'Tela') setNewMaterialQty(0.85);
                            else if (m.category === 'Hilo') setNewMaterialQty(0.02);
                            else if (m.category === 'Empaque / Etiqueta') setNewMaterialQty(1);
                            else if (m.category === 'Botón / Broche') setNewMaterialQty(8);
                            else setNewMaterialQty(1);
                          }
                        }}
                        className="w-full p-2 bg-white border border-[#D5CEC2] rounded-xl text-xs text-[#1C211D] font-medium"
                      >
                        <option value="">Seleccione insumo del maestro...</option>
                        {rawMaterials
                          .filter((m) => m.isActive !== false)
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              [{m.sku}] {m.name} ({m.unit}) • {formatCOP(m.unitCost, false)}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Unit Consumption Input */}
                    <div className="sm:col-span-3">
                      <label className="text-[10px] text-[#5F6B61] block mb-1 font-semibold">
                        Consumo Unitario:
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.001"
                          min="0.001"
                          value={newMaterialQty}
                          onChange={(e) => setNewMaterialQty(parseFloat(e.target.value) || 0)}
                          className="w-full p-2 bg-white border border-[#D5CEC2] rounded-xl font-bold text-xs text-[#1C211D]"
                          placeholder="0.85"
                        />
                        <span className="absolute right-3 top-2 text-xs font-semibold text-[#8F9990]">
                          {selectedNewMat?.unit || 'u'}
                        </span>
                      </div>
                    </div>

                    {/* Waste Percent Input */}
                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-[#5F6B61] block mb-1 font-semibold">
                        Merma (%):
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="50"
                          value={newMaterialWaste}
                          onChange={(e) => setNewMaterialWaste(parseFloat(e.target.value) || 0)}
                          className="w-full p-2 bg-white border border-[#D5CEC2] rounded-xl text-xs text-[#1C211D]"
                          placeholder="5"
                        />
                        <span className="absolute right-3 top-2 text-xs font-semibold text-[#8F9990]">%</span>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="sm:col-span-2 flex items-end">
                      <button
                        type="button"
                        onClick={handleAddMaterialToBOM}
                        disabled={!newMaterialId}
                        className="w-full p-2 bg-[#3A5A40] hover:bg-[#2D4632] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Vincular Insumo</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Financial Summary Box */}
                <div className="p-4 bg-[#FCFBF9] border-t border-[#E6E1D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div>
                      <span className="text-[10px] text-[#5F6B61] block uppercase font-bold">
                        Costo Materiales Prenda:
                      </span>
                      <span className="text-base font-bold text-[#3A5A40] font-mono">
                        {formatCOP(rawMaterialCost)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#5F6B61] block uppercase font-bold">
                        Margen Bruto de Materiales:
                      </span>
                      <span className="text-base font-bold text-[#1C211D]">
                        {selectedGarment.retailPrice > 0
                          ? `${(
                              ((selectedGarment.retailPrice - rawMaterialCost) /
                                selectedGarment.retailPrice) *
                              100
                            ).toFixed(1)}%`
                          : 'N/A'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#5F6B61] block uppercase font-bold">
                        Inversión Insumos (Meta {selectedGarment.targetSales.toLocaleString()} u):
                      </span>
                      <span className="text-base font-bold text-[#1C211D] font-mono">
                        {formatCOP(rawMaterialCost * selectedGarment.targetSales)}
                      </span>
                    </div>
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

                  {/* Operations Table */}
                  <div className="overflow-x-auto">
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
                        {(!selectedGarment.operationsRouting || selectedGarment.operationsRouting.length === 0) ? (
                          <tr>
                            <td colSpan={7} className="p-6 text-center text-[#5F6B61]">
                              No hay operaciones registradas aún. Añada el flujo de corte y costura abajo.
                            </td>
                          </tr>
                        ) : (
                          selectedGarment.operationsRouting.map((op) => (
                            <tr key={op.id} className="hover:bg-[#FAF8F5]">
                              <td className="p-3 text-center font-bold text-[#5F6B61]">{op.stepNumber}</td>
                              <td className="p-3 font-semibold text-[#1C211D]">{op.operationName}</td>
                              <td className="p-3">
                                <span className="bg-[#F2EEE6] text-[#5F6B61] px-2 py-0.5 rounded text-[10px] font-medium">
                                  {op.department}
                                </span>
                              </td>
                              <td className="p-3 text-[#1C211D]">{op.machinery}</td>
                              <td className="p-3 text-right font-mono font-bold text-[#3A5A40]">
                                {op.standardMinutes} min
                              </td>
                              <td className="p-3 text-[#5F6B61] text-[11px]">
                                {op.criticalNotes || '-'}
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => handleDeleteOperation(op.id)}
                                  className="p-1 text-[#8F9990] hover:text-[#B33927] rounded transition-colors"
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
                  <div className="p-3.5 sm:p-4 bg-[#FAF8F5] border-t border-[#E6E1D8] space-y-2">
                    <span className="text-xs font-bold text-[#1C211D] block">
                      Añadir Operación a la Ruta de Confección:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                      <input
                        type="text"
                        placeholder="Nombre de la operación (ej: Pegar pechera)"
                        value={newOpName}
                        onChange={(e) => setNewOpName(e.target.value)}
                        className="p-2 bg-white border border-[#D5CEC2] rounded-lg text-xs sm:col-span-2 text-[#1C211D]"
                      />

                      <select
                        value={newOpDept}
                        onChange={(e) => setNewOpDept(e.target.value as any)}
                        className="p-2 bg-white border border-[#D5CEC2] rounded-lg text-xs text-[#1C211D]"
                      >
                        <option value="Corte">Corte</option>
                        <option value="Preparación">Preparación</option>
                        <option value="Ensamble">Ensamble</option>
                        <option value="Terminación">Terminación</option>
                        <option value="Control de Calidad">Control de Calidad</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Maquinaria (ej: Fileteadora)"
                        value={newOpMachinery}
                        onChange={(e) => setNewOpMachinery(e.target.value)}
                        className="p-2 bg-white border border-[#D5CEC2] rounded-lg text-xs text-[#1C211D]"
                      />

                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        placeholder="SAM (min)"
                        value={newOpSAM}
                        onChange={(e) => setNewOpSAM(parseFloat(e.target.value) || 0)}
                        className="p-2 bg-white border border-[#D5CEC2] rounded-lg text-xs font-bold text-[#1C211D]"
                      />

                      <button
                        type="button"
                        onClick={handleAddOperation}
                        disabled={!newOpName}
                        className="p-2 bg-[#3A5A40] hover:bg-[#2D4632] disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                      >
                        + Añadir Operación
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CALIDAD & QC CHECKPOINTS */}
            {activeSubTab === 'calidad' && (
              <div className="bg-white rounded-xl border border-[#E6E1D8] shadow-xs overflow-hidden">
                <div className="p-3.5 sm:p-4 border-b border-[#E6E1D8] flex items-center justify-between bg-[#FCFBF9]">
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-[#1C211D]">
                      Puntos de Inspección & Control de Calidad (QC)
                    </h3>
                    <p className="text-[11px] text-[#5F6B61]">
                      Tolerancias críticas y criterios de no-conformidad
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-[#F2EEE6] text-[#5F6B61] px-2 py-0.5 rounded-lg">
                    {selectedGarment.qualityCheckpoints?.length || 0} Puntos QC
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-[#FAF8F5] text-[10px] font-bold uppercase text-[#5F6B61] border-b border-[#E6E1D8]">
                      <tr>
                        <th className="p-3">Etapa</th>
                        <th className="p-3">Parámetro de Medida</th>
                        <th className="p-3">Tolerancia Aceptable</th>
                        <th className="p-3">Defecto Potencial</th>
                        <th className="p-3 text-center">Severidad</th>
                        <th className="p-3 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F2EEE6]">
                      {(!selectedGarment.qualityCheckpoints || selectedGarment.qualityCheckpoints.length === 0) ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-[#5F6B61]">
                            No hay puntos de control de calidad registrados para esta prenda.
                          </td>
                        </tr>
                      ) : (
                        selectedGarment.qualityCheckpoints.map((qc) => (
                          <tr key={qc.id} className="hover:bg-[#FAF8F5]">
                            <td className="p-3 font-semibold text-[#1C211D]">{qc.stage || 'General'}</td>
                            <td className="p-3 text-[#1C211D]">{qc.parameter}</td>
                            <td className="p-3 font-mono text-[#5F6B61]">{qc.tolerance}</td>
                            <td className="p-3 text-[#B33927] font-medium">{qc.potentialDefect}</td>
                            <td className="p-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  qc.severity === 'Crítico'
                                    ? 'bg-rose-100 text-rose-800'
                                    : qc.severity === 'Mayor'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {qc.severity}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleDeleteQC(qc.id)}
                                className="p-1 text-[#8F9990] hover:text-[#B33927] rounded transition-colors"
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

                {/* Add QC Form */}
                <div className="p-3.5 sm:p-4 bg-[#FAF8F5] border-t border-[#E6E1D8] space-y-2">
                  <span className="text-xs font-bold text-[#1C211D] block">
                    Registrar Nuevo Punto de Control QC:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                    <select
                      value={newQCStage}
                      onChange={(e) => setNewQCStage(e.target.value as any)}
                      className="p-2 bg-white border border-[#D5CEC2] rounded-lg text-xs text-[#1C211D]"
                    >
                      <option value="Corte">Corte</option>
                      <option value="Costura">Costura</option>
                      <option value="Plancha">Plancha</option>
                      <option value="Empaque Final">Empaque Final</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Parámetro (ej: Ancho de cuello)"
                      value={newQCParam}
                      onChange={(e) => setNewQCParam(e.target.value)}
                      className="p-2 bg-white border border-[#D5CEC2] rounded-lg text-xs sm:col-span-2 text-[#1C211D]"
                    />

                    <input
                      type="text"
                      placeholder="Tolerancia (ej: ± 0.5 cm)"
                      value={newQCTol}
                      onChange={(e) => setNewQCTol(e.target.value)}
                      className="p-2 bg-white border border-[#D5CEC2] rounded-lg text-xs text-[#1C211D]"
                    />

                    <select
                      value={newQCSeverity}
                      onChange={(e) => setNewQCSeverity(e.target.value as any)}
                      className="p-2 bg-white border border-[#D5CEC2] rounded-lg text-xs text-[#1C211D]"
                    >
                      <option value="Menor">Menor</option>
                      <option value="Mayor">Mayor</option>
                      <option value="Crítico">Crítico</option>
                    </select>

                    <button
                      type="button"
                      onClick={handleAddQualityCheckpoint}
                      disabled={!newQCParam}
                      className="p-2 bg-[#3A5A40] hover:bg-[#2D4632] disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                    >
                      + Añadir QC
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: COSTEO INTEGRAL & SIMULACIÓN TALLER PROPIO VS MAQUILA */}
            {activeSubTab === 'costeo' && (
              <div className="bg-white rounded-xl border border-[#E6E1D8] shadow-xs p-4 sm:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6E1D8] pb-4">
                  <div>
                    <h3 className="font-bold text-sm text-[#1C211D]">
                      Costeo Integral de Confección: Planta Propia vs Maquila Satélite
                    </h3>
                    <p className="text-xs text-[#5F6B61]">
                      Simulación económica y análisis de ahorro por unidad y lote
                    </p>
                  </div>
                  <button
                    onClick={handleSaveCosting}
                    className="px-4 py-2 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-lg text-xs font-bold shadow-xs transition-all active:scale-95"
                  >
                    Guardar Estructura Costos
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Planta Propia */}
                  <div className="p-4 rounded-xl border border-[#D4E3D7] bg-[#EBF2EC]/30 space-y-3">
                    <h4 className="font-bold text-xs text-[#233829] uppercase tracking-wider flex items-center gap-1.5">
                      <Factory className="w-4 h-4 text-[#3A5A40]" />
                      Producción en Taller Propio
                    </h4>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-[#EAE6DF]">
                        <span className="text-[#5F6B61]">Materia Prima (Telas + Avíos):</span>
                        <span className="font-bold text-[#1C211D] font-mono">{formatCOP(rawMaterialCost)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#EAE6DF]">
                        <span className="text-[#5F6B61]">Mano de Obra Directa (MOD):</span>
                        <span className="font-bold text-[#1C211D] font-mono">{formatCOP(liveInternalMOD)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#EAE6DF]">
                        <span className="text-[#5F6B61]">Costos Indirectos Fabril (CIF):</span>
                        <span className="font-bold text-[#1C211D] font-mono">{formatCOP(liveInternalCIF)}</span>
                      </div>
                      <div className="flex justify-between pt-2 text-sm font-bold text-[#233829]">
                        <span>Costo Unitario Total Propio:</span>
                        <span className="font-mono">{formatCOP(liveTotalInternal)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Maquila Externa */}
                  <div className="p-4 rounded-xl border border-[#E6E1D8] bg-[#FAF8F5] space-y-3">
                    <h4 className="font-bold text-xs text-[#1C211D] uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-[#8F9990]" />
                      Producción en Satélite / Maquila Externa
                    </h4>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-[#EAE6DF]">
                        <span className="text-[#5F6B61]">Materia Prima (Telas + Avíos):</span>
                        <span className="font-bold text-[#1C211D] font-mono">{formatCOP(rawMaterialCost)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#EAE6DF]">
                        <span className="text-[#5F6B61]">Corte Satélite:</span>
                        <span className="font-bold text-[#1C211D] font-mono">{formatCOP(simMaquilaCut)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#EAE6DF]">
                        <span className="text-[#5F6B61]">Confección Satélite:</span>
                        <span className="font-bold text-[#1C211D] font-mono">{formatCOP(simMaquilaSew)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#EAE6DF]">
                        <span className="text-[#5F6B61]">Acabados & Fletes:</span>
                        <span className="font-bold text-[#1C211D] font-mono">
                          {formatCOP(simMaquilaFinish + simMaquilaLogistics)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 text-sm font-bold text-[#1C211D]">
                        <span>Costo Unitario Maquila:</span>
                        <span className="font-mono">{formatCOP(liveTotalMaquila)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
