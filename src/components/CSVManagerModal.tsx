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
  Edit3,
  CheckCheck,
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

  // Inline editing state for fixing rows directly in the review table
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; column: string; value: string } | null>(null);

  // Handler for reading and parsing uploaded CSV text files
  const processUploadedFile = (name: string, content: string, customMaterialsList?: RawMaterial[]) => {
    setNotification(null);
    const firstLine = content.split('\n')[0] || '';
    const headers = firstLine.split(/[,;\t]/).map((h) => h.replace(/^["']|["']$/g, '').trim());
    const detectedType = detectCSVType(headers);

    let detectedName = '';

    if (detectedType === 'materias_primas') {
      const res = parseRawMaterialsCSV(content, name);
      setMaterialsResult(res);
      setActivePreviewTab('materias_primas');
      detectedName = '1. Inventario de Materias Primas';
      return res;
    } else if (detectedType === 'fichas_tecnicas') {
      const baseMatList =
        customMaterialsList && customMaterialsList.length > 0
          ? customMaterialsList
          : materialsResult?.data && materialsResult.data.length > 0
          ? materialsResult.data
          : rawMaterials;
      const res = parseBOMCSV(content, baseMatList, name);
      setBOMResult(res);
      setActivePreviewTab('fichas_tecnicas');
      detectedName = '2. Fichas Técnicas (BOM)';
      return res;
    } else if (detectedType === 'ventas') {
      const res = parseSalesCSV(content, name);
      setSalesResult(res);
      setActivePreviewTab('ventas');
      detectedName = '3. Ventas Históricas';
      return res;
    } else {
      // Fallback: test against all parsers with prioritization
      const mRes = parseRawMaterialsCSV(content, name);
      const bRes = parseBOMCSV(content, customMaterialsList || rawMaterials, name);
      const sRes = parseSalesCSV(content, name);

      if (mRes.validCount >= bRes.validCount && mRes.validCount >= sRes.validCount && mRes.validCount > 0) {
        setMaterialsResult(mRes);
        setActivePreviewTab('materias_primas');
        detectedName = '1. Inventario de Materias Primas';
        return mRes;
      } else if (bRes.validCount >= sRes.validCount && bRes.validCount > 0) {
        setBOMResult(bRes);
        setActivePreviewTab('fichas_tecnicas');
        detectedName = '2. Fichas Técnicas (BOM)';
        return bRes;
      } else if (sRes.validCount > 0) {
        setSalesResult(sRes);
        setActivePreviewTab('ventas');
        detectedName = '3. Ventas Históricas';
        return sRes;
      } else {
        setNotification({
          type: 'error',
          message: `No se pudieron reconocer las columnas del archivo "${name}". Asegúrese de incluir las cabeceras estándar descargando las plantillas.`,
        });
        return null;
      }
    }
  };

  // Process multiple files in the optimal sequential dependency order: 1. Materias Primas -> 2. Fichas Técnicas -> 3. Ventas
  const processBatchFiles = (fileList: Array<{ name: string; content: string }>) => {
    const classified = fileList.map((f) => {
      const firstLine = f.content.split('\n')[0] || '';
      const headers = firstLine.split(/[,;\t]/).map((h) => h.replace(/^["']|["']$/g, '').trim());
      const detectedType = detectCSVType(headers);
      return { ...f, detectedType };
    });

    const priorityOrder: Record<string, number> = {
      materias_primas: 1,
      fichas_tecnicas: 2,
      ventas: 3,
      desconocido: 4,
    };
    classified.sort((a, b) => (priorityOrder[a.detectedType] || 99) - (priorityOrder[b.detectedType] || 99));

    let accumulatedMaterials = materialsResult?.data && materialsResult.data.length > 0 ? materialsResult.data : rawMaterials;
    const loadedSummary: string[] = [];

    for (const item of classified) {
      if (item.detectedType === 'materias_primas') {
        const res = parseRawMaterialsCSV(item.content, item.name);
        setMaterialsResult(res);
        accumulatedMaterials = res.data;
        loadedSummary.push(`1. Materias Primas (${res.validCount})`);
      } else if (item.detectedType === 'fichas_tecnicas') {
        const res = parseBOMCSV(item.content, accumulatedMaterials, item.name);
        setBOMResult(res);
        loadedSummary.push(`2. BOM (${res.validCount})`);
      } else if (item.detectedType === 'ventas') {
        const res = parseSalesCSV(item.content, item.name);
        setSalesResult(res);
        loadedSummary.push(`3. Ventas (${res.validCount})`);
      } else {
        processUploadedFile(item.name, item.content, accumulatedMaterials);
      }
    }

    if (loadedSummary.length > 0) {
      setNotification({
        type: 'success',
        message: `✓ Archivos procesados en orden recomendado: ${loadedSummary.join(' ➔ ')}. Continúe al Paso 2 para revisar.`,
      });
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    const readPromises = fileArray.map((file) => {
      return new Promise<{ name: string; content: string }>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve({
            name: file.name,
            content: (event.target?.result as string) || '',
          });
        };
        reader.readAsText(file);
      });
    });

    Promise.all(readPromises).then((batch) => {
      if (batch.length === 1) {
        processUploadedFile(batch[0].name, batch[0].content);
      } else {
        processBatchFiles(batch);
      }
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

  // Load realistic sample datasets with 1 click in recommended order
  const loadDemoData = (type: 'materias_primas' | 'fichas_tecnicas' | 'ventas' | 'all') => {
    const sampleMats = `SKU,Nombre,Categoria,Unidad,Stock_Actual,En_Transito,Stock_Seguridad_Dias,MOQ_Lote_Minimo,Lead_Time_Dias,Costo_Unitario_COP,Proveedor,Color,Ancho_Metros,Gramaje_GSM
TEL-OXF-BLA,Tela Oxford 100% Algodón Blanco,Tela,m,350,150,15,100,7,18500,Lafayette S.A.,Blanco Óptico,1.50,140
TEL-DEN-AZU,Denim Índigo Pesado 14oz,Tela,m,520,300,20,150,12,24000,Fabricato Textil,Azul Índigo,1.60,400
TEL-PIQ-NAV,Tejido Piqué 24/1 Algodón/Poliéster,Tela,kg,180,80,15,50,5,32000,Hilazas de Colombia,Azul Marino,1.80,220
TEL-LIN-BEI,Lino Rústico Pre-lavado,Tela,m,120,50,18,60,10,29000,Lafayette S.A.,Beige Natural,1.45,180
TEL-TAS-NEG,Taslan Impermeable Recubierto,Tela,m,90,100,12,80,6,19800,Textiles Miraflores,Negro,1.50,130
HIL-BLA-120,Hilo Poliéster 120 TKT Blanco,Hilo,conos,45,20,10,10,3,6800,Coats Cadena,Blanco,0,0
HIL-AZU-120,Hilo Poliéster 120 TKT Azul Marino,Hilo,conos,38,15,10,10,3,6800,Coats Cadena,Azul Marino,0,0
BOT-NAC-18L,Botón Nácar 4 Huecos 18L,Botón / Broche,unidades,2500,1000,15,500,4,180,Pasacintas Colombia,Nácar Natural,0,0
BOT-MET-JEAN,Botón Metálico Remache Jean 24L,Botón / Broche,unidades,1800,800,15,400,5,350,Cierres Andinos,Bronce Viejo,0,0
REM-MET-JEAN,Remache de Cobre Bolsillo Jean,Avío / Fornitura,unidades,3200,1500,15,1000,4,90,Cierres Andinos,Cobre Satinado,0,0
CRE-MET-15CM,Cremallera Metálica Cobre 15cm Jean,Cremallera,unidades,450,200,15,100,5,1850,YKK Colombia,Cobre / Índigo,0,0
ETI-SAT-CON,Etiqueta Satín Instrucciones Cuidado,Empaque / Etiqueta,unidades,4200,2000,15,1000,4,120,Marquillas Gráficas,Blanco/Negro,0,0
ENT-FUS-75G,Entretela Tejida Termofusible Cuello,Entretela,m,110,60,15,50,4,8200,Pasacintas Colombia,Blanco,0.90,75`;

    const sampleBOM = `SKU_Prenda,Nombre_Prenda,SKU_Insumo,Nombre_Insumo,Cantidad_Por_Prenda,Merma_Corte_Porcentaje,Unidad,Costo_Unitario_COP,Proveedor,PVP_Venta_COP,SAM_Minutos
CAM-OXF-001,Camisa Oxford Manga Larga,TEL-OXF-BLA,Tela Oxford 100% Algodón Blanco,1.65,6.0,m,18500,Lafayette S.A.,85000,24.5
CAM-OXF-001,Camisa Oxford Manga Larga,HIL-BLA-120,Hilo Poliéster 120 TKT Blanco,0.02,3.0,conos,6800,Coats Cadena,85000,24.5
CAM-OXF-001,Camisa Oxford Manga Larga,BOT-NAC-18L,Botón Nácar 4 Huecos 18L,8.0,2.0,unidades,180,Pasacintas Colombia,85000,24.5
CAM-OXF-001,Camisa Oxford Manga Larga,ENT-FUS-75G,Entretela Tejida Termofusible Cuello,0.25,5.0,m,8200,Pasacintas Colombia,85000,24.5
CAM-OXF-001,Camisa Oxford Manga Larga,ETI-SAT-CON,Etiqueta Satín Instrucciones Cuidado,1.0,1.0,unidades,120,Marquillas Gráficas,85000,24.5
JEA-DEN-002,Jean Clásico Denim 14oz,TEL-DEN-AZU,Denim Índigo Pesado 14oz,1.40,7.0,m,24000,Fabricato Textil,120000,28.0
JEA-DEN-002,Jean Clásico Denim 14oz,HIL-AZU-120,Hilo Poliéster 120 TKT Azul Marino,0.03,4.0,conos,6800,Coats Cadena,120000,28.0
JEA-DEN-002,Jean Clásico Denim 14oz,CRE-MET-15CM,Cremallera Metálica Cobre 15cm Jean,1.0,1.0,unidades,1850,YKK Colombia,120000,28.0
JEA-DEN-002,Jean Clásico Denim 14oz,BOT-MET-JEAN,Botón Metálico Remache Jean 24L,1.0,1.0,unidades,350,Cierres Andinos,120000,28.0
JEA-DEN-002,Jean Clásico Denim 14oz,REM-MET-JEAN,Remache de Cobre Bolsillo Jean,6.0,2.0,unidades,90,Cierres Andinos,120000,28.0
JEA-DEN-002,Jean Clásico Denim 14oz,ETI-SAT-CON,Etiqueta Satín Instrucciones Cuidado,1.0,1.0,unidades,120,Marquillas Gráficas,120000,28.0`;

    const sampleSales = `Fecha_Venta,SKU_Prenda,Nombre_Prenda,Unidades_Vendidas,Canal,Ingreso_Total_COP
2026-01-15,CAM-OXF-001,Camisa Oxford Manga Larga,180,Tienda Principal,$14400000
2026-01-18,JEA-DEN-002,Jean Clásico Denim 14oz,220,E-Commerce,$26400000
2026-01-22,POL-PIQ-003,Polo Piqué Algodón Premium,150,Mayoristas,$8250000
2026-01-28,VES-LIN-004,Vestido Casual Lino Midi,95,Boutique Exclusiva,$11400000
2026-02-05,CHA-BOM-005,Chaqueta Bomber Impermeable,80,Tienda Principal,$14400000
2026-02-12,CAM-OXF-001,Camisa Oxford Manga Larga,210,E-Commerce,$16800000
2026-02-20,JEA-DEN-002,Jean Clásico Denim 14oz,240,Tienda Principal,$28800000`;

    if (type === 'all') {
      processBatchFiles([
        { name: '1_Inventario_Materias_Primas.csv', content: sampleMats },
        { name: '2_Fichas_Tecnicas_BOM.csv', content: sampleBOM },
        { name: '3_Ventas_Historicas.csv', content: sampleSales },
      ]);
    } else if (type === 'materias_primas') {
      processUploadedFile('1_Inventario_Materias_Primas.csv', sampleMats);
    } else if (type === 'fichas_tecnicas') {
      processUploadedFile('2_Fichas_Tecnicas_BOM.csv', sampleBOM);
    } else if (type === 'ventas') {
      processUploadedFile('3_Ventas_Historicas.csv', sampleSales);
    }
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

  // Execute confirmation
  const handleExecuteImport = () => {
    let importedAny = false;

    // 1. Sales
    if (salesResult && salesResult.data.length > 0) {
      const salesToImport = skipInvalidRows
        ? salesResult.data
        : salesResult.rawRows.filter((r) => r.isValid).map((r) => r.parsedItem!).filter(Boolean);
      if (salesToImport.length > 0) {
        onImportSales(salesToImport, importMode);
        importedAny = true;
      }
    }

    // 2. Materials
    if (materialsResult && materialsResult.data.length > 0) {
      const matsToImport = skipInvalidRows
        ? materialsResult.data
        : materialsResult.rawRows.filter((r) => r.isValid).map((r) => r.parsedItem!).filter(Boolean);
      if (matsToImport.length > 0) {
        onImportMaterials(matsToImport, importMode);
        importedAny = true;
      }
    }

    // 3. BOMs
    if (bomResult && bomResult.data.length > 0) {
      const garmentsToImport = skipInvalidRows
        ? bomResult.data
        : bomResult.rawRows.filter((r) => r.isValid).map((r) => r.parsedItem!).filter(Boolean);
      if (garmentsToImport.length > 0) {
        onImportBOMs(garmentsToImport, bomResult.discoveredMaterials || [], importMode);
        importedAny = true;
      }
    }

    if (importedAny) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-[#E6E1D8] overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh]">
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-[#E6E1D8] flex items-center justify-between bg-[#FCFBF9]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#EBF2EC] text-[#3A5A40] rounded-xl flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-[#1C211D]">
                  Carga & Validación Automática de Archivos CSV
                </h3>
                <span className="px-2 py-0.5 bg-[#EBF2EC] text-[#3A5A40] text-[10px] font-bold rounded-full border border-[#D4E3D7]">
                  Asistente en 3 Pasos
                </span>
              </div>
              <p className="text-xs text-[#5F6B61]">
                Cargue, verifique diagnósticos de inconsistencias y confirme la incorporación en el sistema.
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
        <div className="bg-[#FAF8F5] border-b border-[#E6E1D8] px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Step 1 */}
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                currentStep === 1
                  ? 'text-[#3A5A40]'
                  : currentStep > 1
                  ? 'text-[#1C211D] hover:underline'
                  : 'text-[#8F9990]'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                  currentStep === 1
                    ? 'bg-[#3A5A40] text-white shadow-2xs'
                    : currentStep > 1
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-stone-200 text-stone-600'
                }`}
              >
                {currentStep > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
              </div>
              <span>1. Cargar Archivos</span>
            </button>

            <span className="text-stone-300">/</span>

            {/* Step 2 */}
            <button
              type="button"
              disabled={!hasAnyLoaded}
              onClick={() => hasAnyLoaded && setCurrentStep(2)}
              className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                currentStep === 2
                  ? 'text-[#3A5A40]'
                  : currentStep > 2
                  ? 'text-[#1C211D] hover:underline'
                  : hasAnyLoaded
                  ? 'text-[#5F6B61] hover:underline'
                  : 'text-[#8F9990] cursor-not-allowed opacity-60'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                  currentStep === 2
                    ? 'bg-[#3A5A40] text-white shadow-2xs'
                    : currentStep > 2
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-stone-200 text-stone-600'
                }`}
              >
                {currentStep > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
              </div>
              <span>2. Revisar & Validar</span>
              {totalBlockingErrors > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 text-[9px] rounded-full font-bold">
                  {totalBlockingErrors} alertas
                </span>
              )}
            </button>

            <span className="text-stone-300">/</span>

            {/* Step 3 */}
            <button
              type="button"
              disabled={!hasAnyLoaded}
              onClick={() => hasAnyLoaded && setCurrentStep(3)}
              className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                currentStep === 3
                  ? 'text-[#3A5A40]'
                  : hasAnyLoaded
                  ? 'text-[#5F6B61] hover:underline'
                  : 'text-[#8F9990] cursor-not-allowed opacity-60'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                  currentStep === 3
                    ? 'bg-[#3A5A40] text-white shadow-2xs'
                    : 'bg-stone-200 text-stone-600'
                }`}
              >
                3
              </div>
              <span>3. Confirmar e Incorporar</span>
            </button>
          </div>

          {/* Quick status indicator */}
          {hasAnyLoaded && (
            <div className="hidden md:flex items-center gap-2 text-[11px]">
              <span className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {totalLoadedValid} registros listos
              </span>
              {totalBlockingErrors > 0 && (
                <span className="text-rose-800 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  {totalBlockingErrors} errores
                </span>
              )}
            </div>
          )}
        </div>

        {/* NOTIFICATION TOAST */}
        {notification && (
          <div
            className={`p-3 text-xs flex items-center justify-between transition-all ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-b border-emerald-200'
                : notification.type === 'error'
                ? 'bg-rose-50 text-rose-900 border-b border-rose-200'
                : 'bg-amber-50 text-amber-900 border-b border-amber-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-stone-400 hover:text-stone-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* MODAL MAIN CONTENT */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-xs">
          {/* ========================================================= */}
          {/* PASO 1: CARGAR ARCHIVOS CSV O PROBAR CON DATOS DE MUESTRA */}
          {/* ========================================================= */}
          {currentStep === 1 && (
            <div className="space-y-5">
              {/* ORDEN RECOMENDADO DE CARGA BANNER */}
              <div className="p-4 bg-gradient-to-r from-[#FAF8F5] via-[#FCFBF9] to-[#EBF2EC] rounded-2xl border border-[#D5CEC2] shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#3A5A40] text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                      123
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#1C211D]">
                      Orden Recomendado de Carga de Archivos
                    </h4>
                  </div>
                  <span className="text-[10px] font-semibold text-[#3A5A40] bg-white px-2.5 py-0.5 rounded-full border border-[#D4E3D7]">
                    Secuencia para Cero Advertencias
                  </span>
                </div>
                <p className="text-[11px] text-[#5F6B61] mb-3">
                  Para garantizar la integridad total de los cálculos MRP y costos de producción, cargue sus archivos en esta secuencia:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {/* Sequence Step 1 */}
                  <div className="p-3 bg-white/90 rounded-xl border border-[#E6E1D8] flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#3A5A40] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[#1C211D]">
                        <Package className="w-3.5 h-3.5 text-[#3A5A40]" />
                        <span>1. Materias Primas</span>
                      </div>
                      <p className="text-[10px] text-[#5F6B61] mt-0.5 leading-tight">
                        Crea el catálogo base de telas, hilos y avíos con costos reales COP, MOQ, stock y proveedores.
                      </p>
                    </div>
                  </div>

                  {/* Sequence Step 2 */}
                  <div className="p-3 bg-white/90 rounded-xl border border-[#E6E1D8] flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#3A5A40] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[#1C211D]">
                        <Layers className="w-3.5 h-3.5 text-[#3A5A40]" />
                        <span>2. Fichas Técnicas (BOM)</span>
                      </div>
                      <p className="text-[10px] text-[#5F6B61] mt-0.5 leading-tight">
                        Enlaza los insumos a las prendas con consumos unitarios, mermas de corte y tiempos SAM.
                      </p>
                    </div>
                  </div>

                  {/* Sequence Step 3 */}
                  <div className="p-3 bg-white/90 rounded-xl border border-[#E6E1D8] flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#3A5A40] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[#1C211D]">
                        <ShoppingBag className="w-3.5 h-3.5 text-[#3A5A40]" />
                        <span>3. Ventas & Demanda</span>
                      </div>
                      <p className="text-[10px] text-[#5F6B61] mt-0.5 leading-tight">
                        Define la demanda histórica o metas de confección para disparar la explosión de materiales MRP.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drag & Drop Hero Box */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
                  isDragActive
                    ? 'border-[#3A5A40] bg-[#EBF2EC]/80 scale-[0.99]'
                    : 'border-[#D5CEC2] hover:border-[#3A5A40] bg-[#FCFBF9]'
                }`}
                onClick={() => document.getElementById('csv-file-input')?.click()}
              >
                <input
                  id="csv-file-input"
                  type="file"
                  accept=".csv,.txt"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <div className="w-12 h-12 bg-[#EBF2EC] text-[#3A5A40] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-2xs">
                  <Upload className="w-6 h-6" />
                </div>

                <h4 className="text-sm sm:text-base font-bold text-[#1C211D]">
                  Arrastre y suelte sus archivos CSV aquí, o haga clic para explorar
                </h4>
                <p className="text-xs text-[#5F6B61] mt-1 max-w-md mx-auto">
                  Puede soltar varios archivos a la vez: el sistema los ordenará y procesará automáticamente respetando la secuencia <strong>Materias Primas ➔ BOM ➔ Ventas</strong>.
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <span className="px-2.5 py-1 bg-white border border-[#E6E1D8] text-[#5F6B61] rounded-lg text-[10px] font-semibold">
                    📄 Soporta UTF-8 / Excel CSV
                  </span>
                  <span className="px-2.5 py-1 bg-white border border-[#E6E1D8] text-[#5F6B61] rounded-lg text-[10px] font-semibold">
                    ✓ Comas y Puntos Decimales
                  </span>
                  <span className="px-2.5 py-1 bg-white border border-[#E6E1D8] text-[#5F6B61] rounded-lg text-[10px] font-semibold">
                    ⚡ Auto-Detección y Ordenamiento Secuencial
                  </span>
                </div>
              </div>

              {/* One-Click Sample Datasets in Recommended Order */}
              <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E6E1D8] space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#3A5A40]" />
                    <span className="font-bold text-xs text-[#1C211D]">
                      ¿Desea probar de inmediato con datos reales de confección colombiana?
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadDemoData('all')}
                    className="px-2.5 py-1 bg-[#3A5A40] text-white hover:bg-[#2D4632] rounded-lg text-[11px] font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Cargar los 3 Archivos en Orden (Demo Completa)
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => loadDemoData('materias_primas')}
                    className="p-2.5 bg-white hover:bg-[#EBF2EC] border border-[#D5CEC2] rounded-xl text-left transition-colors flex items-center gap-2 group cursor-pointer"
                  >
                    <Package className="w-4 h-4 text-[#3A5A40] shrink-0" />
                    <div>
                      <p className="font-bold text-[11px] text-[#1C211D] group-hover:text-[#3A5A40]">
                        1. Materias Primas de Muestra
                      </p>
                      <p className="text-[10px] text-[#5F6B61]">Telas, Hilos, Botones, MOQ, Lead Time</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => loadDemoData('fichas_tecnicas')}
                    className="p-2.5 bg-white hover:bg-[#EBF2EC] border border-[#D5CEC2] rounded-xl text-left transition-colors flex items-center gap-2 group cursor-pointer"
                  >
                    <Layers className="w-4 h-4 text-[#3A5A40] shrink-0" />
                    <div>
                      <p className="font-bold text-[11px] text-[#1C211D] group-hover:text-[#3A5A40]">
                        2. BOM de Muestra
                      </p>
                      <p className="text-[10px] text-[#5F6B61]">Consumos unitarios y mermas de corte</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => loadDemoData('ventas')}
                    className="p-2.5 bg-white hover:bg-[#EBF2EC] border border-[#D5CEC2] rounded-xl text-left transition-colors flex items-center gap-2 group cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#3A5A40] shrink-0" />
                    <div>
                      <p className="font-bold text-[11px] text-[#1C211D] group-hover:text-[#3A5A40]">
                        3. Ventas de Muestra
                      </p>
                      <p className="text-[10px] text-[#5F6B61]">Camisas, Jeans, Polos, Vestidos</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Status of Staged Datasets & Template Download in 1-2-3 Order */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#5F6B61]">
                    Estado de Archivos Cargados & Descarga de Plantillas (Secuencia 1-2-3)
                  </h4>
                  <button
                    type="button"
                    onClick={() => downloadCSVTemplate('todas')}
                    className="px-2.5 py-1 bg-[#FAF8F5] hover:bg-[#EBF2EC] border border-[#D5CEC2] hover:border-[#3A5A40] text-[#3A5A40] rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descargar las 3 Plantillas CSV (Pack Completo)
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Card 1: Materias Primas */}
                  <div
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      materialsResult
                        ? materialsResult.errorCount > 0
                          ? 'bg-rose-50/70 border-rose-300'
                          : 'bg-[#EBF2EC] border-[#3A5A40]'
                        : 'bg-white border-[#E6E1D8]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-1.5 rounded-lg ${
                              materialsResult ? 'bg-[#3A5A40] text-white' : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-[#1C211D] block">1. Materias Primas</span>
                            <span className="text-[9px] text-[#3A5A40] font-semibold">1_plantilla_materias_primas_insumos.csv</span>
                          </div>
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
                          : 'Stock actual, en tránsito, MOQ, costos COP, mermas de defecto, ancho y gramaje.'}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-stone-200 flex items-center justify-between text-[11px]">
                      <button
                        type="button"
                        onClick={() => downloadCSVTemplate('materias_primas')}
                        className="text-[#3A5A40] hover:text-[#2D4632] hover:underline font-bold flex items-center gap-1.5 cursor-pointer bg-[#FAF8F5] px-2 py-1 rounded-md border border-[#E6E1D8]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Descargar Plantilla 1
                      </button>
                      {materialsResult && (
                        <button
                          type="button"
                          onClick={() => setMaterialsResult(null)}
                          className="text-[#B33927] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                        >
                          <Trash2 className="w-3 h-3" />
                          Quitar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card 2: Fichas Técnicas BOM */}
                  <div
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      bomResult
                        ? bomResult.errorCount > 0
                          ? 'bg-rose-50/70 border-rose-300'
                          : 'bg-[#EBF2EC] border-[#3A5A40]'
                        : 'bg-white border-[#E6E1D8]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-1.5 rounded-lg ${
                              bomResult ? 'bg-[#3A5A40] text-white' : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            <Layers className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-[#1C211D] block">2. Fichas Técnicas (BOM)</span>
                            <span className="text-[9px] text-[#3A5A40] font-semibold">2_plantilla_fichas_tecnicas_BOM.csv</span>
                          </div>
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
                          : 'Consumos por prenda, mermas de corte, SAM de confección, tarifas de maquila y PVP.'}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-stone-200 flex items-center justify-between text-[11px]">
                      <button
                        type="button"
                        onClick={() => downloadCSVTemplate('fichas_tecnicas')}
                        className="text-[#3A5A40] hover:text-[#2D4632] hover:underline font-bold flex items-center gap-1.5 cursor-pointer bg-[#FAF8F5] px-2 py-1 rounded-md border border-[#E6E1D8]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Descargar Plantilla 2
                      </button>
                      {bomResult && (
                        <button
                          type="button"
                          onClick={() => setBOMResult(null)}
                          className="text-[#B33927] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                        >
                          <Trash2 className="w-3 h-3" />
                          Quitar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card 3: Ventas */}
                  <div
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      salesResult
                        ? salesResult.errorCount > 0
                          ? 'bg-rose-50/70 border-rose-300'
                          : 'bg-[#EBF2EC] border-[#3A5A40]'
                        : 'bg-white border-[#E6E1D8]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-1.5 rounded-lg ${
                              salesResult ? 'bg-[#3A5A40] text-white' : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-[#1C211D] block">3. Ventas Históricas</span>
                            <span className="text-[9px] text-[#3A5A40] font-semibold">3_plantilla_ventas_historicas_demanda.csv</span>
                          </div>
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
                          : 'Fechas de venta, SKU de prenda, unidades comercializadas, canal de venta e ingresos COP.'}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-stone-200 flex items-center justify-between text-[11px]">
                      <button
                        type="button"
                        onClick={() => downloadCSVTemplate('ventas')}
                        className="text-[#3A5A40] hover:text-[#2D4632] hover:underline font-bold flex items-center gap-1.5 cursor-pointer bg-[#FAF8F5] px-2 py-1 rounded-md border border-[#E6E1D8]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Descargar Plantilla 3
                      </button>
                      {salesResult && (
                        <button
                          type="button"
                          onClick={() => setSalesResult(null)}
                          className="text-[#B33927] hover:underline flex items-center gap-1 cursor-pointer font-medium"
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
              {/* Dataset Tab Selector in Recommended Order (1. Materias Primas -> 2. BOM -> 3. Ventas) */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6E1D8] pb-3">
                <div className="flex items-center gap-2">
                  {materialsResult && (
                    <button
                      type="button"
                      onClick={() => {
                        setActivePreviewTab('materias_primas');
                        setSelectedIssueDetail(null);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        activePreviewTab === 'materias_primas'
                          ? 'bg-[#3A5A40] text-white shadow-2xs'
                          : 'bg-stone-100 text-[#5F6B61] hover:bg-stone-200'
                      }`}
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>1. Materias Primas ({materialsResult.validCount})</span>
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        activePreviewTab === 'fichas_tecnicas'
                          ? 'bg-[#3A5A40] text-white shadow-2xs'
                          : 'bg-stone-100 text-[#5F6B61] hover:bg-stone-200'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>2. Fichas Técnicas ({bomResult.validCount})</span>
                      {bomResult.errorCount > 0 && (
                        <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] rounded-full">
                          {bomResult.errorCount}
                        </span>
                      )}
                    </button>
                  )}

                  {salesResult && (
                    <button
                      type="button"
                      onClick={() => {
                        setActivePreviewTab('ventas');
                        setSelectedIssueDetail(null);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        activePreviewTab === 'ventas'
                          ? 'bg-[#3A5A40] text-white shadow-2xs'
                          : 'bg-stone-100 text-[#5F6B61] hover:bg-stone-200'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>3. Ventas ({salesResult.validCount})</span>
                      {salesResult.errorCount > 0 && (
                        <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] rounded-full">
                          {salesResult.errorCount}
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
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      rowFilter === 'all' ? 'bg-white text-[#1C211D] shadow-2xs' : 'text-[#5F6B61]'
                    }`}
                  >
                    Todos ({currentActiveResult?.totalRows || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRowFilter('valid')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      rowFilter === 'valid' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-[#5F6B61]'
                    }`}
                  >
                    Válidos ({currentActiveResult?.validCount || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRowFilter('issues')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
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
                        Diagnóstico Exacto de Inconsistencias ({currentActiveResult.issues.length})
                      </h5>
                    </div>
                    <span className="text-[10px] text-amber-700 font-medium">
                      Indica fila, columna, dato con problema y cómo solucionarlo
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
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
                          {issue.issue} (Valor encontrado: "{String(issue.value)}")
                        </p>
                        <p className="text-[10px] text-stone-600 mt-0.5">
                          💡 <span className="font-medium text-stone-800">{issue.suggestion}</span>
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
              className="px-4 py-2 text-xs font-semibold text-[#5F6B61] hover:text-[#1C211D] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => (prev > 1 ? ((prev - 1) as WizardStep) : 1))}
              className="px-4 py-2 text-xs font-bold text-[#5F6B61] hover:text-[#1C211D] flex items-center gap-1.5 transition-colors cursor-pointer"
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
