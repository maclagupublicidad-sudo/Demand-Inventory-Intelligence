import React, { useState } from 'react';
import {
  Upload,
  Download,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  ShoppingBag,
  Package,
  RefreshCw,
  Info,
  ArrowRight,
} from 'lucide-react';
import {
  downloadCSVTemplate,
  detectCSVType,
  parseSalesCSV,
  parseRawMaterialsCSV,
  parseBOMCSV,
} from '../services/csvParser';
import { RawMaterial, Garment, SalesRecord } from '../types';

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
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [activeTab, setActiveTab] = useState<'ventas' | 'materias_primas' | 'fichas_tecnicas' | 'lote_completo'>('lote_completo');

  // Staged files content
  const [salesFile, setSalesFile] = useState<{ name: string; content: string; count: number } | null>(null);
  const [materialsFile, setMaterialsFile] = useState<{ name: string; content: string; count: number } | null>(null);
  const [bomFile, setBOMFile] = useState<{ name: string; content: string; count: number } | null>(null);

  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  if (!isOpen) return null;

  // Process a single file content and categorize automatically
  const processUploadedFile = (name: string, content: string) => {
    setWarnings([]);
    setNotification(null);

    const firstLine = content.split('\n')[0] || '';
    const headers = firstLine.split(/[,;\t]/).map((h) => h.replace(/^["']|["']$/g, '').trim());
    const detectedType = detectCSVType(headers);

    let recognized = false;

    if (detectedType === 'ventas' || activeTab === 'ventas') {
      const res = parseSalesCSV(content);
      if (res.data.length > 0) {
        setSalesFile({ name, content, count: res.data.length });
        setNotification({
          type: 'success',
          message: `✓ Archivo de Ventas detectado: ${res.data.length} filas listas para importar.`,
        });
        if (res.errors.length > 0) setWarnings(res.errors);
        recognized = true;
      }
    } else if (detectedType === 'materias_primas' || activeTab === 'materias_primas') {
      const res = parseRawMaterialsCSV(content);
      if (res.data.length > 0) {
        setMaterialsFile({ name, content, count: res.data.length });
        setNotification({
          type: 'success',
          message: `✓ Archivo de Materias Primas detectado: ${res.data.length} insumos listos para importar.`,
        });
        if (res.errors.length > 0) setWarnings(res.errors);
        recognized = true;
      }
    } else if (detectedType === 'fichas_tecnicas' || activeTab === 'fichas_tecnicas') {
      const res = parseBOMCSV(content, rawMaterials);
      if (res.garments.length > 0) {
        setBOMFile({ name, content, count: res.garments.length });
        setNotification({
          type: 'success',
          message: `✓ Archivo de Fichas Técnicas (BOM) detectado: ${res.garments.length} prendas listas para importar.`,
        });
        if (res.errors.length > 0) setWarnings(res.errors);
        recognized = true;
      }
    }

    if (!recognized) {
      setNotification({
        type: 'error',
        message: `No se pudo reconocer automáticamente las columnas del archivo "${name}". Verifique las cabeceras descargando las plantillas.`,
      });
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
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

  // Perform import based on loaded files
  const handleExecuteImport = () => {
    let importedSales: SalesRecord[] = [];
    let importedMaterials: RawMaterial[] = [];
    let importedGarments: Garment[] = [];
    let discoveredFromBOM: RawMaterial[] = [];

    if (salesFile) {
      const res = parseSalesCSV(salesFile.content);
      importedSales = res.data;
    }

    if (materialsFile) {
      const res = parseRawMaterialsCSV(materialsFile.content);
      importedMaterials = res.data;
    }

    if (bomFile) {
      // Pass both current materials and newly imported materials to BOM parser
      const combinedMaterials = [...rawMaterials, ...importedMaterials];
      const res = parseBOMCSV(bomFile.content, combinedMaterials);
      importedGarments = res.garments;
      discoveredFromBOM = res.discoveredMaterials;
    }

    if (onImportAllDatasets && (importedSales.length > 0 || importedMaterials.length > 0 || importedGarments.length > 0)) {
      onImportAllDatasets(
        importedSales,
        [...importedMaterials, ...discoveredFromBOM],
        importedGarments,
        importMode
      );
    } else {
      if (importedMaterials.length > 0) {
        onImportMaterials([...importedMaterials, ...discoveredFromBOM], importMode);
      }
      if (importedGarments.length > 0) {
        onImportBOMs(importedGarments, discoveredFromBOM, importMode);
      }
      if (importedSales.length > 0) {
        onImportSales(importedSales, importMode);
      }
    }

    const totalCount =
      (salesFile ? `${salesFile.count} ventas` : '') +
      (materialsFile ? `, ${materialsFile.count} materias primas` : '') +
      (bomFile ? `, ${bomFile.count} fichas técnicas` : '');

    setNotification({
      type: 'success',
      message: `¡Importación completada con éxito! Se integraron: ${totalCount}. El cálculo MRP y metas se han recalculado automáticamente.`,
    });

    // Reset staged files
    setSalesFile(null);
    setMaterialsFile(null);
    setBOMFile(null);
  };

  const hasAnyStaged = salesFile !== null || materialsFile !== null || bomFile !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-[#E5E7EB] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 text-[#4F46E5] rounded-lg">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#111827]">
                Centro de Carga e Integración de Archivos CSV
              </h3>
              <p className="text-xs text-[#6B7280]">
                Cargue sus 3 archivos en conjunto o individualmente sin sobreescrituras accidentales.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F9FAFB] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Sub-Header: Mode Selector & Template Downloads */}
        <div className="p-4 bg-[#F9FAFB] border-b border-[#E5E7EB] flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Mode Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#374151]">Modo de Carga:</span>
            <div className="inline-flex rounded-lg border border-[#E5E7EB] bg-white p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setImportMode('merge')}
                className={`px-3 py-1 font-semibold rounded-md transition-colors ${
                  importMode === 'merge'
                    ? 'bg-[#4F46E5] text-white shadow-2xs'
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
                title="Actualiza o agrega por SKU sin borrar los datos existentes de otros archivos"
              >
                Combinar por SKU (Recomendado)
              </button>
              <button
                type="button"
                onClick={() => setImportMode('replace')}
                className={`px-3 py-1 font-semibold rounded-md transition-colors ${
                  importMode === 'replace'
                    ? 'bg-[#4F46E5] text-white shadow-2xs'
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
                title="Borra el catálogo anterior e inserta únicamente lo que venga en los archivos"
              >
                Reemplazar Completo
              </button>
            </div>
          </div>

          {/* Template Download Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadCSVTemplate('todas')}
              className="px-3 py-1.5 bg-white border border-[#D1D5DB] hover:bg-[#F3F4F6] text-[#374151] rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
              title="Descargar plantillas en CSV para Ventas, Materias Primas y Fichas Técnicas"
            >
              <Download className="w-3.5 h-3.5 text-[#4F46E5]" />
              <span>Descargar 3 Plantillas CSV</span>
            </button>
          </div>
        </div>

        {/* Modal Main Content Area */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Notification Banner */}
          {notification && (
            <div
              className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                notification.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : notification.type === 'error'
                  ? 'bg-red-50 border border-red-200 text-red-800'
                  : 'bg-blue-50 border border-blue-200 text-blue-800'
              }`}
            >
              {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
              {notification.type === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0" />}
              <span>{notification.message}</span>
            </div>
          )}

          {/* Warnings List */}
          {warnings.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Advertencias detectadas en los archivos:
              </div>
              <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                {warnings.slice(0, 4).map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 3 Datasets Pipeline Visual Status Cards */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
              Estado de los 3 Archivos de Configuración Textil
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Card 1: Ventas */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  salesFile
                    ? 'bg-emerald-50/40 border-emerald-300'
                    : salesRecords.length > 0
                    ? 'bg-white border-[#E5E7EB]'
                    : 'bg-[#F9FAFB] border-dashed border-[#D1D5DB]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className={`w-4 h-4 ${salesFile ? 'text-emerald-600' : 'text-[#4F46E5]'}`} />
                    <span className="font-bold text-xs text-[#111827]">1. Ventas Históricas</span>
                  </div>
                  {salesFile ? (
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                      Cargado ({salesFile.count})
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#6B7280]">
                      {salesRecords.length} en memoria
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#6B7280]">
                  {salesFile
                    ? `Archivo: ${salesFile.name}`
                    : 'Proyecta promedios mensuales y demanda del ciclo.'}
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <button
                    onClick={() => downloadCSVTemplate('ventas')}
                    className="text-[#4F46E5] hover:underline font-semibold"
                  >
                    Plantilla CSV
                  </button>
                  {salesFile && (
                    <button
                      onClick={() => setSalesFile(null)}
                      className="text-red-600 hover:underline"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>

              {/* Card 2: Materias Primas */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  materialsFile
                    ? 'bg-emerald-50/40 border-emerald-300'
                    : rawMaterials.length > 0
                    ? 'bg-white border-[#E5E7EB]'
                    : 'bg-[#F9FAFB] border-dashed border-[#D1D5DB]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Package className={`w-4 h-4 ${materialsFile ? 'text-emerald-600' : 'text-[#4F46E5]'}`} />
                    <span className="font-bold text-xs text-[#111827]">2. Materias Primas</span>
                  </div>
                  {materialsFile ? (
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                      Cargado ({materialsFile.count})
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#6B7280]">
                      {rawMaterials.length} en memoria
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#6B7280]">
                  {materialsFile
                    ? `Archivo: ${materialsFile.name}`
                    : 'Stock actual, en tránsito, MOQ, costo y proveedores.'}
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <button
                    onClick={() => downloadCSVTemplate('materias_primas')}
                    className="text-[#4F46E5] hover:underline font-semibold"
                  >
                    Plantilla CSV
                  </button>
                  {materialsFile && (
                    <button
                      onClick={() => setMaterialsFile(null)}
                      className="text-red-600 hover:underline"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>

              {/* Card 3: Fichas Técnicas BOM */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  bomFile
                    ? 'bg-emerald-50/40 border-emerald-300'
                    : garments.length > 0
                    ? 'bg-white border-[#E5E7EB]'
                    : 'bg-[#F9FAFB] border-dashed border-[#D1D5DB]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Layers className={`w-4 h-4 ${bomFile ? 'text-emerald-600' : 'text-[#4F46E5]'}`} />
                    <span className="font-bold text-xs text-[#111827]">3. Fichas Técnicas (BOM)</span>
                  </div>
                  {bomFile ? (
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                      Cargado ({bomFile.count})
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#6B7280]">
                      {garments.length} en memoria
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#6B7280]">
                  {bomFile
                    ? `Archivo: ${bomFile.name}`
                    : 'Consumos unitarios por prenda, metas y merma de corte.'}
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <button
                    onClick={() => downloadCSVTemplate('fichas_tecnicas')}
                    className="text-[#4F46E5] hover:underline font-semibold"
                  >
                    Plantilla CSV
                  </button>
                  {bomFile && (
                    <button
                      onClick={() => setBOMFile(null)}
                      className="text-red-600 hover:underline"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Universal Dropzone */}
          <div className="border-2 border-dashed border-[#D1D5DB] hover:border-[#4F46E5] rounded-xl p-6 text-center transition-colors bg-[#F9FAFB]">
            <input
              type="file"
              accept=".csv,.txt"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
              id="csv-universal-input"
            />
            <label
              htmlFor="csv-universal-input"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-[#4F46E5] flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-[#111827]">
                Haga clic para seleccionar o arrastre sus archivos CSV aquí
              </div>
              <p className="text-xs text-[#6B7280]">
                Puede seleccionar 1, 2 o los 3 archivos a la vez. El sistema auto-detectará el tipo de cada archivo.
              </p>
            </label>
          </div>

          {/* Helpful Guidance Notice */}
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 text-xs text-[#374151] space-y-1.5">
            <div className="font-bold text-[#4F46E5] flex items-center gap-1.5">
              <Info className="w-4 h-4" />
              ¿Cómo interactúan los archivos en el cálculo MRP?
            </div>
            <p className="text-[11px] text-[#4B5563]">
              1. <strong>Ventas:</strong> Define la demanda real histórica de cada prenda y calcula su promedio mensual.
            </p>
            <p className="text-[11px] text-[#4B5563]">
              2. <strong>Materias Primas:</strong> Establece el catálogo de insumos, stock disponible, tiempos de entrega y costos.
            </p>
            <p className="text-[11px] text-[#4B5563]">
              3. <strong>Fichas Técnicas (BOM):</strong> Conecta las prendas con sus insumos multiplicando el consumo unitario por la meta de ventas.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#E5E7EB] bg-white flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#6B7280] hover:text-[#111827] transition-colors"
          >
            Cerrar
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExecuteImport}
              disabled={!hasAnyStaged}
              className={`px-5 py-2 rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all ${
                hasAnyStaged
                  ? 'bg-[#4F46E5] hover:bg-[#4338CA] text-white cursor-pointer'
                  : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Procesar e Integrar Datos</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
