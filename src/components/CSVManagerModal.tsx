import React, { useState, useMemo } from 'react';
import {
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  Layers,
  ShoppingBag,
  Package,
  Info,
  ArrowRight,
  ArrowLeft,
  Filter,
  Trash2,
  FileSpreadsheet,
  Check,
  RefreshCw,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import {
  downloadCSVTemplate,
  detectCSVType,
  parseSalesCSV,
  parseRawMaterialsCSV,
  parseBOMCSV,
  DetailedCSVParseResult,
  CSVValidationIssue,
  ValidatedRow,
} from '../services/csvParser';
import { RawMaterial, Garment, SalesRecord } from '../types';
import { formatCOP } from '../utils/formatters';

interface CSVManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSales: (sales: SalesRecord[], mode: 'merge' | 'replace') => void;
  onImportMaterials: (materials: RawMaterial[], mode: 'merge' | 'replace') => void;
  onImportBOMs: (garments: Garment[], discoveredMaterials: RawMaterial[], mode: 'merge' | 'replace') => void;
  onImportAllDatasets?: (
    sales: SalesRecord[],
    materials: RawMaterial[],
    garments: Garment[],
    mode: 'merge' | 'replace'
  ) => void;
  rawMaterials: RawMaterial[];
  garments: Garment[];
  salesRecords: SalesRecord[];
}

type WizardStep = 1 | 2 | 3;
type ActiveDatasetTab = 'ventas' | 'materias_primas' | 'fichas_tecnicas';
type RowFilter = 'all' | 'valid' | 'issues';

export const CSVManagerModal: React.FC<CSVManagerModalProps> = ({
  isOpen,
  onClose,
  onImportSales,
  onImportMaterials,
  onImportBOMs,
  onImportAllDatasets,
  rawMaterials,
  garments,
  salesRecords,
}) => {
  // Wizard State
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [skipInvalidRows, setSkipInvalidRows] = useState<boolean>(true);

  // Staged Parse Results
  const [salesResult, setSalesResult] = useState<DetailedCSVParseResult<SalesRecord> | null>(null);
  const [materialsResult, setMaterialsResult] = useState<DetailedCSVParseResult<RawMaterial> | null>(null);
  const [bomResult, setBOMResult] = useState<DetailedCSVParseResult<Garment> | null>(null);

  // Active view tab for Step 2
  const [activePreviewTab, setActivePreviewTab] = useState<ActiveDatasetTab>('ventas');
  const [rowFilter, setRowFilter] = useState<RowFilter>('all');
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [selectedIssueDetail, setSelectedIssueDetail] = useState<CSVValidationIssue | null>(null);

  if (!isOpen) return null;

  // Handler for reading and parsing uploaded CSV text files
  const processUploadedFile = (name: string, content: string) => {
    setNotification(null);
    const firstLine = content.split('\n')[0] || '';
    const headers = firstLine.split(/[,;\t]/).map((h) => h.replace(/^["']|["']$/g, '').trim());
    const detectedType = detectCSVType(headers);

    let detectedName = '';

    if (detectedType === 'ventas') {
      const res = parseSalesCSV(content, name);
      setSalesResult(res);
      setActivePreviewTab('ventas');
      detectedName = 'Ventas Históricas';
    } else if (detectedType === 'materias_primas') {
      const res = parseRawMaterialsCSV(content, name);
      setMaterialsResult(res);
      setActivePreviewTab('materias_primas');
      detectedName = 'Inventario de Materias Primas';
    } else if (detectedType === 'fichas_tecnicas') {
      const baseMatList = materialsResult?.data && materialsResult.data.length > 0 ? materialsResult.data : rawMaterials;
      const res = parseBOMCSV(content, baseMatList, name);
      setBOMResult(res);
      setActivePreviewTab('fichas_tecnicas');
      detectedName = 'Fichas Técnicas (BOM)';
    } else {
      // Fallback: test against all parsers and pick the one with most valid data
      const sRes = parseSalesCSV(content, name);
      const mRes = parseRawMaterialsCSV(content, name);
      const bRes = parseBOMCSV(content, rawMaterials, name);

      if (sRes.validCount >= mRes.validCount && sRes.validCount >= bRes.validCount && sRes.validCount > 0) {
        setSalesResult(sRes);
        setActivePreviewTab('ventas');
        detectedName = 'Ventas Históricas';
      } else if (mRes.validCount >= bRes.validCount && mRes.validCount > 0) {
        setMaterialsResult(mRes);
        setActivePreviewTab('materias_primas');
        detectedName = 'Inventario de Materias Primas';
      } else if (bRes.validCount > 0) {
        setBOMResult(bRes);
        setActivePreviewTab('fichas_tecnicas');
        detectedName = 'Fichas Técnicas (BOM)';
      } else {
        setNotification({
          type: 'error',
          message: `No se pudieron reconocer las columnas del archivo "${name}". Asegúrese de incluir las cabeceras estándar descargando las plantillas.`,
        });
        return;
      }
    }

    setNotification({
      type: 'success',
      message: `✓ Archivo cargado y validado como "${detectedName}". Pase al Paso 2 para revisar el diagnóstico.`,
    });
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = (event.target?.result as string) || '';
        processUploadedFile(file.name, content);
      };
      reader.readAsText(file);
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const hasAnyLoaded = !!salesResult || !!materialsResult || !!bomResult;

  // Compute total counts
  const totalLoadedValid =
    (salesResult?.validCount || 0) + (materialsResult?.validCount || 0) + (bomResult?.validCount || 0);
  const totalBlockingErrors =
    (salesResult?.errorCount || 0) + (materialsResult?.errorCount || 0) + (bomResult?.errorCount || 0);
  const totalWarnings =
    (salesResult?.warningCount || 0) + (materialsResult?.warningCount || 0) + (bomResult?.warningCount || 0);

  // Active result for Step 2 Review
  const currentActiveResult =
    activePreviewTab === 'ventas'
      ? salesResult
      : activePreviewTab === 'materias_primas'
      ? materialsResult
      : bomResult;

  // Filtered rows for active tab preview
  const displayRows = useMemo(() => {
    if (!currentActiveResult) return [];
    if (rowFilter === 'valid') {
      return currentActiveResult.rawRows.filter((r) => r.isValid && r.issues.length === 0);
    }
    if (rowFilter === 'issues') {
      return currentActiveResult.rawRows.filter((r) => r.issues.length > 0 || !r.isValid);
    }
    return currentActiveResult.rawRows;
  }, [currentActiveResult, rowFilter]);

  // Execute Final Import
  const handleExecuteImport = () => {
    let importedSales: SalesRecord[] = [];
    let importedMaterials: RawMaterial[] = [];
    let importedGarments: Garment[] = [];
    let discoveredFromBOM: RawMaterial[] = [];

    if (salesResult) {
      importedSales = skipInvalidRows
        ? salesResult.data
        : salesResult.errorCount === 0
        ? salesResult.data
        : [];
    }

    if (materialsResult) {
      importedMaterials = skipInvalidRows
        ? materialsResult.data
        : materialsResult.errorCount === 0
        ? materialsResult.data
        : [];
    }

    if (bomResult) {
      importedGarments = skipInvalidRows
        ? bomResult.data
        : bomResult.errorCount === 0
        ? bomResult.data
        : [];
      discoveredFromBOM = bomResult.discoveredMaterials || [];
    }

    // Combine newly discovered materials from BOM
    if (discoveredFromBOM.length > 0) {
      const existingIds = new Set([
        ...rawMaterials.map((m) => m.id),
        ...importedMaterials.map((m) => m.id),
      ]);
      const brandNew = discoveredFromBOM.filter((m) => !existingIds.has(m.id));
      importedMaterials = [...importedMaterials, ...brandNew];
    }

    if (
      onImportAllDatasets &&
      (importedSales.length > 0 || importedMaterials.length > 0 || importedGarments.length > 0)
    ) {
      onImportAllDatasets(importedSales, importedMaterials, importedGarments, importMode);
    } else {
      if (importedSales.length > 0) onImportSales(importedSales, importMode);
      if (importedMaterials.length > 0) onImportMaterials(importedMaterials, importMode);
      if (importedGarments.length > 0) onImportBOMs(importedGarments, discoveredFromBOM, importMode);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-[#E6E1D8] overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-[#E6E1D8] flex items-center justify-between bg-[#FCFBF9]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#EBF2EC] text-[#233829] rounded-xl flex items-center justify-center font-bold">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-[#1C211D]">
                  Carga, Validación & Confirmación de CSV
                </h3>
                <span className="px-2 py-0.5 bg-[#EBF2EC] text-[#233829] text-[10px] font-bold rounded-full border border-[#D4E3D7]">
                  TextilIQ Engine v2.0
                </span>
              </div>
              <p className="text-xs text-[#5F6B61]">
                Proceso guiado de 3 pasos: Carga arrastrando archivos, revisión granular con solución de errores y confirmación controlada.
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

        {/* 3-STEP WIZARD PROGRESS BAR */}
        <div className="bg-[#FAF8F5] px-4 sm:px-6 py-3 border-b border-[#E6E1D8]">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-3xl mx-auto">
            {/* Step 1 */}
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-left transition-all ${
                currentStep === 1
                  ? 'bg-white text-[#233829] font-bold shadow-2xs border border-[#D5CEC2]'
                  : 'text-[#5F6B61] hover:text-[#1C211D]'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  currentStep === 1
                    ? 'bg-[#3A5A40] text-white'
                    : hasAnyLoaded
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-stone-200 text-stone-600'
                }`}
              >
                {hasAnyLoaded && currentStep !== 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
              </span>
              <div className="truncate">
                <p className="text-[11px] font-bold leading-tight">1. Cargar</p>
                <p className="text-[10px] text-[#8F9990] hidden sm:block">Subir o arrastrar CSV</p>
              </div>
            </button>

            {/* Step 2 */}
            <button
              type="button"
              onClick={() => hasAnyLoaded && setCurrentStep(2)}
              disabled={!hasAnyLoaded}
              className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-left transition-all ${
                currentStep === 2
                  ? 'bg-white text-[#233829] font-bold shadow-2xs border border-[#D5CEC2]'
                  : hasAnyLoaded
                  ? 'text-[#5F6B61] hover:text-[#1C211D]'
                  : 'text-stone-300 cursor-not-allowed'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  currentStep === 2
                    ? 'bg-[#3A5A40] text-white'
                    : totalBlockingErrors > 0
                    ? 'bg-rose-100 text-rose-700'
                    : hasAnyLoaded
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-stone-200 text-stone-400'
                }`}
              >
                2
              </span>
              <div className="truncate">
                <p className="text-[11px] font-bold leading-tight">2. Revisar & Validar</p>
                <p className="text-[10px] text-[#8F9990] hidden sm:block">
                  {totalBlockingErrors > 0 ? `${totalBlockingErrors} problemas` : 'Diagnóstico de datos'}
                </p>
              </div>
            </button>

            {/* Step 3 */}
            <button
              type="button"
              onClick={() => hasAnyLoaded && setCurrentStep(3)}
              disabled={!hasAnyLoaded}
              className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-left transition-all ${
                currentStep === 3
                  ? 'bg-white text-[#233829] font-bold shadow-2xs border border-[#D5CEC2]'
                  : hasAnyLoaded
                  ? 'text-[#5F6B61] hover:text-[#1C211D]'
                  : 'text-stone-300 cursor-not-allowed'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  currentStep === 3
                    ? 'bg-[#3A5A40] text-white'
                    : hasAnyLoaded
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-stone-200 text-stone-400'
                }`}
              >
                3
              </span>
              <div className="truncate">
                <p className="text-[11px] font-bold leading-tight">3. Confirmar</p>
                <p className="text-[10px] text-[#8F9990] hidden sm:block">Incorporar a la base</p>
              </div>
            </button>
          </div>
        </div>

        {/* NOTIFICATION MESSAGE */}
        {notification && (
          <div className="px-4 sm:px-6 pt-3 pb-0">
            <div
              className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between gap-3 ${
                notification.type === 'success'
                  ? 'bg-[#EBF2EC] border border-[#D4E3D7] text-[#233829]'
                  : notification.type === 'error'
                  ? 'bg-[#FDF2F0] border border-[#F8D4CF] text-[#B33927]'
                  : 'bg-[#EEF2F6] border border-[#D0DCE8] text-[#2D4A6E]'
              }`}
            >
              <div className="flex items-center gap-2">
                {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#3A5A40] shrink-0" />}
                {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-[#B33927] shrink-0" />}
                {notification.type === 'info' && <Info className="w-4 h-4 text-[#2D4A6E] shrink-0" />}
                <span>{notification.message}</span>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="text-stone-400 hover:text-stone-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* MAIN BODY PER STEP */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-xs">
          {/* ========================================================= */}
          {/* PASO 1: CARGAR ARCHIVOS CSV */}
          {/* ========================================================= */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Universal Drag & Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all ${
                  isDragActive
                    ? 'border-[#3A5A40] bg-[#EBF2EC]/50 scale-[1.01]'
                    : 'border-[#D5CEC2] hover:border-[#3A5A40] bg-[#FAF8F5]'
                }`}
              >
                <input
                  type="file"
                  accept=".csv,.txt"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="csv-universal-file-input"
                />
                <label
                  htmlFor="csv-universal-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-3"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white text-[#3A5A40] shadow-sm border border-[#E6E1D8] flex items-center justify-center">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-[#1C211D]">
                      Arrastre y suelte sus archivos CSV aquí, o haga clic para explorar
                    </h4>
                    <p className="text-xs text-[#5F6B61] mt-1 max-w-md mx-auto">
                      Puede cargar 1, 2 o los 3 archivos a la vez. TextilIQ identificará automáticamente si es de Ventas, Materias Primas o Fichas Técnicas.
                    </p>
                  </div>
                  <span className="px-4 py-1.5 bg-[#3A5A40] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#2D4632] transition-colors">
                    Seleccionar Archivos desde su Computador
                  </span>
                </label>
              </div>

              {/* Status Cards of the 3 Data Sources */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#5F6B61]">
                    Archivos Reconocidos & Plantillas Oficiales
                  </h4>
                  <button
                    type="button"
                    onClick={() => downloadCSVTemplate('todas')}
                    className="text-xs font-bold text-[#3A5A40] hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descargar las 3 Plantillas (.CSV)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Card 1: Ventas */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      salesResult
                        ? salesResult.errorCount > 0
                          ? 'bg-rose-50/70 border-rose-300'
                          : 'bg-[#EBF2EC] border-[#3A5A40]'
                        : 'bg-white border-[#E6E1D8]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded-lg ${
                            salesResult ? 'bg-[#3A5A40] text-white' : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs text-[#1C211D]">1. Ventas Históricas</span>
                      </div>
                      {salesResult ? (
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            salesResult.errorCount > 0
                              ? 'bg-rose-200 text-rose-900'
                              : 'bg-emerald-200 text-emerald-900'
                          }`}
                        >
                          {salesResult.validCount} válidas
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#8F9990]">{salesRecords.length} en memoria</span>
                      )}
                    </div>

                    <p className="text-[11px] text-[#5F6B61] leading-relaxed">
                      {salesResult
                        ? `Archivo: ${salesResult.fileName} (${salesResult.totalRows} filas leídas)`
                        : 'Fechas, SKU de prendas, unidades vendidas, canales e ingresos.'}
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-stone-200 flex items-center justify-between text-[11px]">
                      <button
                        onClick={() => downloadCSVTemplate('ventas')}
                        className="text-[#3A5A40] hover:underline font-semibold flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Plantilla
                      </button>
                      {salesResult && (
                        <button
                          onClick={() => setSalesResult(null)}
                          className="text-[#B33927] hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Quitar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card 2: Materias Primas */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      materialsResult
                        ? materialsResult.errorCount > 0
                          ? 'bg-rose-50/70 border-rose-300'
                          : 'bg-[#EBF2EC] border-[#3A5A40]'
                        : 'bg-white border-[#E6E1D8]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded-lg ${
                            materialsResult ? 'bg-[#3A5A40] text-white' : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          <Package className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs text-[#1C211D]">2. Materias Primas</span>
                      </div>
                      {materialsResult ? (
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            materialsResult.errorCount > 0
                              ? 'bg-rose-200 text-rose-900'
                              : 'bg-emerald-200 text-emerald-900'
                          }`}
                        >
                          {materialsResult.validCount} insumos
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#8F9990]">{rawMaterials.length} en memoria</span>
                      )}
                    </div>

                    <p className="text-[11px] text-[#5F6B61] leading-relaxed">
                      {materialsResult
                        ? `Archivo: ${materialsResult.fileName} (${materialsResult.totalRows} insumos)`
                        : 'Stock actual, en tránsito, MOQ, costo unitario COP y proveedores.'}
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-stone-200 flex items-center justify-between text-[11px]">
                      <button
                        onClick={() => downloadCSVTemplate('materias_primas')}
                        className="text-[#3A5A40] hover:underline font-semibold flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Plantilla
                      </button>
                      {materialsResult && (
                        <button
                          onClick={() => setMaterialsResult(null)}
                          className="text-[#B33927] hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Quitar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card 3: Fichas Técnicas BOM */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      bomResult
                        ? bomResult.errorCount > 0
                          ? 'bg-rose-50/70 border-rose-300'
                          : 'bg-[#EBF2EC] border-[#3A5A40]'
                        : 'bg-white border-[#E6E1D8]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded-lg ${
                            bomResult ? 'bg-[#3A5A40] text-white' : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          <Layers className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs text-[#1C211D]">3. Fichas Técnicas (BOM)</span>
                      </div>
                      {bomResult ? (
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            bomResult.errorCount > 0
                              ? 'bg-rose-200 text-rose-900'
                              : 'bg-emerald-200 text-emerald-900'
                          }`}
                        >
                          {bomResult.validCount} prendas
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#8F9990]">{garments.length} en memoria</span>
                      )}
                    </div>

                    <p className="text-[11px] text-[#5F6B61] leading-relaxed">
                      {bomResult
                        ? `Archivo: ${bomResult.fileName} (${bomResult.validCount} prendas construidas)`
                        : 'Consumos por prenda, mermas de corte, SAM de confección y PVP.'}
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-stone-200 flex items-center justify-between text-[11px]">
                      <button
                        onClick={() => downloadCSVTemplate('fichas_tecnicas')}
                        className="text-[#3A5A40] hover:underline font-semibold flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Plantilla
                      </button>
                      {bomResult && (
                        <button
                          onClick={() => setBOMResult(null)}
                          className="text-[#B33927] hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Quitar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PASO 2: REVISAR, VALIDAR Y DETECTAR ERRORES EXACTOS */}
          {/* ========================================================= */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {/* Dataset Tab Selector */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6E1D8] pb-3">
                <div className="flex items-center gap-2">
                  {salesResult && (
                    <button
                      type="button"
                      onClick={() => {
                        setActivePreviewTab('ventas');
                        setSelectedIssueDetail(null);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                        activePreviewTab === 'ventas'
                          ? 'bg-[#3A5A40] text-white shadow-2xs'
                          : 'bg-stone-100 text-[#5F6B61] hover:bg-stone-200'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Ventas ({salesResult.validCount})</span>
                      {salesResult.errorCount > 0 && (
                        <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] rounded-full">
                          {salesResult.errorCount}
                        </span>
                      )}
                    </button>
                  )}

                  {materialsResult && (
                    <button
                      type="button"
                      onClick={() => {
                        setActivePreviewTab('materias_primas');
                        setSelectedIssueDetail(null);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                        activePreviewTab === 'materias_primas'
                          ? 'bg-[#3A5A40] text-white shadow-2xs'
                          : 'bg-stone-100 text-[#5F6B61] hover:bg-stone-200'
                      }`}
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Materias Primas ({materialsResult.validCount})</span>
                      {materialsResult.errorCount > 0 && (
                        <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] rounded-full">
                          {materialsResult.errorCount}
                        </span>
                      )}
                    </button>
                  )}

                  {bomResult && (
                    <button
                      type="button"
                      onClick={() => {
                        setActivePreviewTab('fichas_tecnicas');
                        setSelectedIssueDetail(null);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                        activePreviewTab === 'fichas_tecnicas'
                          ? 'bg-[#3A5A40] text-white shadow-2xs'
                          : 'bg-stone-100 text-[#5F6B61] hover:bg-stone-200'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Fichas Técnicas ({bomResult.validCount})</span>
                      {bomResult.errorCount > 0 && (
                        <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] rounded-full">
                          {bomResult.errorCount}
                        </span>
                      )}
                    </button>
                  )}
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setRowFilter('all')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                      rowFilter === 'all' ? 'bg-white text-[#1C211D] shadow-2xs' : 'text-[#5F6B61]'
                    }`}
                  >
                    Todos ({currentActiveResult?.totalRows || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRowFilter('valid')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                      rowFilter === 'valid' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-[#5F6B61]'
                    }`}
                  >
                    Válidos ({currentActiveResult?.validCount || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRowFilter('issues')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                      rowFilter === 'issues' ? 'bg-white text-rose-700 shadow-2xs' : 'text-[#5F6B61]'
                    }`}
                  >
                    Con Alertas / Errores ({currentActiveResult?.issues.length || 0})
                  </button>
                </div>
              </div>

              {/* Missing Required Headers Banner */}
              {currentActiveResult && currentActiveResult.missingRequiredHeaders.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-xs">
                      Columnas obligatorias faltantes en el archivo:
                    </p>
                    <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                      {currentActiveResult.missingRequiredHeaders.map((col, idx) => (
                        <li key={idx}>
                          <span className="font-semibold">{col}</span>: Esta columna es requerida para el cálculo.
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Granular Diagnostic & Resolution Box */}
              {currentActiveResult && currentActiveResult.issues.length > 0 && (
                <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                      <h5 className="font-bold text-xs text-amber-900">
                        Diagnóstico de Inconsistencias Detectadas ({currentActiveResult.issues.length})
                      </h5>
                    </div>
                    <span className="text-[10px] text-amber-700">
                      Haga clic en un problema para ver la sugerencia exacta de corrección
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                    {currentActiveResult.issues.map((issue, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedIssueDetail(issue)}
                        className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                          selectedIssueDetail === issue
                            ? 'bg-amber-100/90 border-amber-500 shadow-2xs'
                            : issue.severity === 'error'
                            ? 'bg-rose-50/80 border-rose-200 hover:bg-rose-100/80'
                            : 'bg-white border-amber-200 hover:bg-amber-100/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${
                              issue.severity === 'error'
                                ? 'bg-rose-200 text-rose-900'
                                : 'bg-amber-200 text-amber-900'
                            }`}
                          >
                            {issue.severity === 'error' ? 'ERROR CRÍTICO' : 'ADVERTENCIA'}
                          </span>
                          <span className="text-[10px] font-bold text-stone-700">
                            Fila {issue.rowNumber} • Columna: {issue.column}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-stone-900 truncate">
                          {issue.issue} (Valor: "{String(issue.value)}")
                        </p>
                        <p className="text-[10px] text-stone-600 mt-0.5">
                          💡 <span className="font-medium">{issue.suggestion}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive Data Table Preview */}
              <div className="border border-[#E6E1D8] rounded-xl overflow-hidden bg-white shadow-2xs">
                <div className="max-h-72 overflow-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead className="bg-[#FAF8F5] sticky top-0 border-b border-[#E6E1D8] z-10">
                      <tr>
                        <th className="p-2.5 font-bold text-[#5F6B61] w-14 text-center">Fila</th>
                        <th className="p-2.5 font-bold text-[#5F6B61] w-24">Estado</th>
                        {currentActiveResult?.headersDetected.slice(0, 7).map((h, i) => (
                          <th key={i} className="p-2.5 font-bold text-[#1C211D] whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                        <th className="p-2.5 font-bold text-[#5F6B61]">Observación / Diagnóstico</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6E1D8]">
                      {displayRows.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="p-8 text-center text-stone-400">
                            No hay filas que coincidan con el filtro seleccionado.
                          </td>
                        </tr>
                      ) : (
                        displayRows.map((row) => {
                          const hasErrors = row.issues.some((i) => i.severity === 'error');
                          const hasWarnings = row.issues.some((i) => i.severity === 'warning');

                          return (
                            <tr
                              key={row.rowIndex}
                              className={`transition-colors ${
                                hasErrors
                                  ? 'bg-rose-50/50 hover:bg-rose-50'
                                  : hasWarnings
                                  ? 'bg-amber-50/40 hover:bg-amber-50'
                                  : 'hover:bg-[#FAF8F5]'
                              }`}
                            >
                              <td className="p-2.5 font-mono text-center font-bold text-[#8F9990]">
                                #{row.rowIndex}
                              </td>
                              <td className="p-2.5">
                                {hasErrors ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">
                                    <AlertCircle className="w-3 h-3 text-rose-600" /> Error
                                  </span>
                                ) : hasWarnings ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                                    <AlertTriangle className="w-3 h-3 text-amber-600" /> Ajustado
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                                    <Check className="w-3 h-3 text-emerald-600" /> Válido
                                  </span>
                                )}
                              </td>

                              {/* Raw CSV values */}
                              {currentActiveResult?.headersDetected.slice(0, 7).map((h, i) => (
                                <td key={i} className="p-2.5 whitespace-nowrap text-stone-800">
                                  {String(row.originalRow[h] ?? '-')}
                                </td>
                              ))}

                              {/* Diagnostic Summary for this row */}
                              <td className="p-2.5 text-[10px]">
                                {row.issues.length === 0 ? (
                                  <span className="text-emerald-700 font-medium">Listo para incorporar</span>
                                ) : (
                                  <div className="space-y-0.5">
                                    {row.issues.map((iss, idx) => (
                                      <p
                                        key={idx}
                                        className={
                                          iss.severity === 'error'
                                            ? 'text-rose-700 font-semibold'
                                            : 'text-amber-800'
                                        }
                                      >
                                        • [{iss.column}]: {iss.issue}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Policy Option: Skip Invalid Rows */}
              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="chk-skip-invalid"
                    checked={skipInvalidRows}
                    onChange={(e) => setSkipInvalidRows(e.target.checked)}
                    className="w-4 h-4 rounded text-[#3A5A40] focus:ring-[#3A5A40]"
                  />
                  <label htmlFor="chk-skip-invalid" className="text-xs font-semibold text-stone-800 cursor-pointer">
                    Omitir automáticamente filas con errores críticos y procesar todas las válidas
                  </label>
                </div>
                <span className="text-[11px] text-[#5F6B61]">
                  {totalBlockingErrors > 0 && skipInvalidRows
                    ? `Se importarán ${totalLoadedValid} filas válidas`
                    : 'Modo seguro activado'}
                </span>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PASO 3: CONFIRMAR E INCORPORAR */}
          {/* ========================================================= */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Integration Mode Card */}
              <div className="bg-[#FAF8F5] p-4 sm:p-5 rounded-2xl border border-[#E6E1D8] space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C211D]">
                  Seleccione el Modo de Integración en TextilIQ
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`p-3.5 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                      importMode === 'merge'
                        ? 'border-[#3A5A40] bg-white shadow-xs'
                        : 'border-[#E6E1D8] bg-stone-50/50 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="mt-0.5 text-[#3A5A40] focus:ring-[#3A5A40]"
                    />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-[#1C211D]">Combinar & Actualizar por SKU (Recomendado)</p>
                      <p className="text-[11px] text-[#5F6B61] leading-relaxed">
                        Actualiza los costos, stocks o consumos de los SKUs existentes y agrega nuevos registros sin eliminar datos no incluidos en este CSV.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`p-3.5 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                      importMode === 'replace'
                        ? 'border-[#B33927] bg-rose-50/30 shadow-xs'
                        : 'border-[#E6E1D8] bg-stone-50/50 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5 text-[#B33927] focus:ring-[#B33927]"
                    />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-[#B33927]">Reemplazo Total de Catálogo</p>
                      <p className="text-[11px] text-[#5F6B61] leading-relaxed">
                        Limpia los datos anteriores de los archivos correspondientes e inserta exclusivamente los registros validados en esta sesión.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Summary Impact Cards */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#5F6B61]">
                  Resumen Consolidado de Datos a Incorporar
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Sales Impact */}
                  <div className="p-4 bg-white border border-[#E6E1D8] rounded-xl shadow-2xs space-y-1.5">
                    <div className="flex items-center gap-2 text-[#3A5A40]">
                      <ShoppingBag className="w-4 h-4" />
                      <span className="font-bold text-xs text-[#1C211D]">Ventas Históricas</span>
                    </div>
                    <p className="text-xl font-bold text-[#1C211D]">
                      {salesResult ? salesResult.validCount : 0}{' '}
                      <span className="text-xs font-normal text-stone-500">registros</span>
                    </p>
                    <p className="text-[11px] text-[#5F6B61]">
                      {salesResult ? `Desde ${salesResult.fileName}` : 'Sin cambios en ventas'}
                    </p>
                  </div>

                  {/* Materials Impact */}
                  <div className="p-4 bg-white border border-[#E6E1D8] rounded-xl shadow-2xs space-y-1.5">
                    <div className="flex items-center gap-2 text-[#3A5A40]">
                      <Package className="w-4 h-4" />
                      <span className="font-bold text-xs text-[#1C211D]">Materias Primas</span>
                    </div>
                    <p className="text-xl font-bold text-[#1C211D]">
                      {(materialsResult?.validCount || 0) + (bomResult?.discoveredMaterials?.length || 0)}{' '}
                      <span className="text-xs font-normal text-stone-500">insumos</span>
                    </p>
                    <p className="text-[11px] text-[#5F6B61]">
                      {bomResult?.discoveredMaterials && bomResult.discoveredMaterials.length > 0
                        ? `Incluye ${bomResult.discoveredMaterials.length} insumos nuevos del BOM`
                        : 'Actualización directa de inventario'}
                    </p>
                  </div>

                  {/* Garments Impact */}
                  <div className="p-4 bg-white border border-[#E6E1D8] rounded-xl shadow-2xs space-y-1.5">
                    <div className="flex items-center gap-2 text-[#3A5A40]">
                      <Layers className="w-4 h-4" />
                      <span className="font-bold text-xs text-[#1C211D]">Fichas Técnicas / Prendas</span>
                    </div>
                    <p className="text-xl font-bold text-[#1C211D]">
                      {bomResult ? bomResult.validCount : 0}{' '}
                      <span className="text-xs font-normal text-stone-500">prendas</span>
                    </p>
                    <p className="text-[11px] text-[#5F6B61]">
                      {bomResult ? `Con explosión de consumos y costos` : 'Sin cambios en prendas'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ready Confirmation Banner */}
              <div className="p-4 bg-[#EBF2EC] border border-[#D4E3D7] rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#3A5A40] text-white flex items-center justify-center font-bold">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#233829]">Listo para procesar e integrar</p>
                    <p className="text-[11px] text-[#5F6B61]">
                      Los cálculos MRP, compras sugeridas y costos se actualizarán automáticamente al confirmar.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER CONTROLS */}
        <div className="p-3.5 sm:p-4 border-t border-[#E6E1D8] bg-[#FCFBF9] flex items-center justify-between gap-3">
          {currentStep === 1 ? (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#5F6B61] hover:text-[#1C211D] transition-colors"
            >
              Cancelar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => (prev > 1 ? ((prev - 1) as WizardStep) : 1))}
              className="px-4 py-2 text-xs font-bold text-[#5F6B61] hover:text-[#1C211D] flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Paso Anterior
            </button>
          )}

          <div className="flex items-center gap-2">
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => ((prev + 1) as WizardStep))}
                disabled={!hasAnyLoaded}
                className={`px-5 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all ${
                  hasAnyLoaded
                    ? 'bg-[#3A5A40] hover:bg-[#2D4632] text-white cursor-pointer active:scale-95'
                    : 'bg-[#E6E1D8] text-[#8F9990] cursor-not-allowed'
                }`}
              >
                <span>{currentStep === 1 ? 'Revisar y Validar' : 'Continuar a Confirmación'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={!hasAnyLoaded || (totalBlockingErrors > 0 && !skipInvalidRows)}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all ${
                  hasAnyLoaded && (totalBlockingErrors === 0 || skipInvalidRows)
                    ? 'bg-[#3A5A40] hover:bg-[#2D4632] text-white cursor-pointer active:scale-95'
                    : 'bg-[#E6E1D8] text-[#8F9990] cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar e Incorporar a la Base de Datos</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
