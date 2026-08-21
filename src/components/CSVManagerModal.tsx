import React, { useState } from 'react';
import {
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  ShoppingBag,
  Package,
  Info,
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
  const [activeTab] = useState<'ventas' | 'materias_primas' | 'fichas_tecnicas' | 'lote_completo'>('lote_completo');

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
      const baseMatList = importedMaterials.length > 0 ? importedMaterials : rawMaterials;
      const res = parseBOMCSV(bomFile.content, baseMatList);
      importedGarments = res.garments;
      discoveredFromBOM = res.discoveredMaterials;
    }

    // Combine discovered materials from BOM if any
    if (discoveredFromBOM.length > 0) {
      const existingIds = new Set([
        ...rawMaterials.map((m) => m.id),
        ...importedMaterials.map((m) => m.id),
      ]);
      const brandNew = discoveredFromBOM.filter((m) => !existingIds.has(m.id));
      importedMaterials = [...importedMaterials, ...brandNew];
    }

    if (onImportAllDatasets && (importedSales.length > 0 || importedMaterials.length > 0 || importedGarments.length > 0)) {
      onImportAllDatasets(importedSales, importedMaterials, importedGarments, importMode);
    } else {
      if (importedSales.length > 0) onImportSales(importedSales, importMode);
      if (importedMaterials.length > 0) onImportMaterials(importedMaterials, importMode);
      if (importedGarments.length > 0) onImportBOMs(importedGarments, discoveredFromBOM, importMode);
    }

    onClose();
  };

  const hasAnyStaged = !!salesFile || !!materialsFile || !!bomFile;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-[#E6E1D8] overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E6E1D8] flex items-center justify-between bg-[#FCFBF9]">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#EBF2EC] text-[#3A5A40] rounded-lg">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#1C211D]">
                Centro de Carga e Integración de Archivos CSV
              </h3>
              <p className="text-[11px] text-[#5F6B61]">
                Cargue sus 3 archivos en conjunto o individualmente sin sobreescrituras accidentales.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8F9990] hover:text-[#1C211D] hover:bg-[#FAF8F5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Sub-Header: Mode Selector & Template Downloads */}
        <div className="p-3.5 sm:p-4 bg-[#FAF8F5] border-b border-[#E6E1D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Mode Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#1C211D]">Modo:</span>
            <div className="inline-flex rounded-lg border border-[#D5CEC2] bg-white p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setImportMode('merge')}
                className={`px-3 py-1 font-semibold rounded-md transition-colors ${
                  importMode === 'merge'
                    ? 'bg-[#3A5A40] text-white shadow-2xs'
                    : 'text-[#5F6B61] hover:text-[#1C211D]'
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
                    ? 'bg-[#3A5A40] text-white shadow-2xs'
                    : 'text-[#5F6B61] hover:text-[#1C211D]'
                }`}
                title="Borra el catálogo anterior e inserta únicamente lo que venga en los archivos"
              >
                Reemplazar
              </button>
            </div>
          </div>

          {/* Template Download Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadCSVTemplate('todas')}
              className="px-3 py-1.5 bg-white border border-[#D5CEC2] hover:bg-[#FAF8F5] text-[#1C211D] rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors active:scale-95"
              title="Descargar plantillas en CSV para Ventas, Materias Primas y Fichas Técnicas"
            >
              <Download className="w-3.5 h-3.5 text-[#3A5A40]" />
              <span>Plantillas CSV</span>
            </button>
          </div>
        </div>

        {/* Modal Main Content Area */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Notification Banner */}
          {notification && (
            <div
              className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                notification.type === 'success'
                  ? 'bg-[#EBF2EC] border border-[#D4E3D7] text-[#233829]'
                  : notification.type === 'error'
                  ? 'bg-[#FDF2F0] border border-[#F8D4CF] text-[#B33927]'
                  : 'bg-[#EEF2F6] border border-[#D0DCE8] text-[#2D4A6E]'
              }`}
            >
              {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#3A5A40] shrink-0" />}
              {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-[#B33927] shrink-0" />}
              {notification.type === 'info' && <Info className="w-4 h-4 text-[#2D4A6E] shrink-0" />}
              <span>{notification.message}</span>
            </div>
          )}

          {/* Warnings List */}
          {warnings.length > 0 && (
            <div className="p-3 bg-[#FCF6E8] border border-[#F2DEB0] rounded-lg text-xs text-[#8A5016] space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-[#8A5016]" />
                Advertencias detectadas:
              </div>
              <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                {warnings.slice(0, 4).map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 3 Datasets Status Cards */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#5F6B61]">
              Estado de los 3 Archivos de Configuración Textil
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Card 1: Ventas */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  salesFile
                    ? 'bg-[#EBF2EC] border-[#3A5A40]'
                    : salesRecords.length > 0
                    ? 'bg-white border-[#E6E1D8]'
                    : 'bg-[#FAF8F5] border-dashed border-[#D5CEC2]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <ShoppingBag className={`w-4 h-4 ${salesFile ? 'text-[#3A5A40]' : 'text-[#5F6B61]'}`} />
                    <span className="font-bold text-xs text-[#1C211D]">1. Ventas Históricas</span>
                  </div>
                  {salesFile ? (
                    <span className="px-1.5 py-0.5 bg-[#D4E3D7] text-[#233829] text-[10px] font-bold rounded">
                      Cargado ({salesFile.count})
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#5F6B61]">
                      {salesRecords.length} en memoria
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#5F6B61]">
                  {salesFile
                    ? `Archivo: ${salesFile.name}`
                    : 'Proyecta promedios mensuales y demanda.'}
                </p>
                <div className="mt-2.5 flex items-center justify-between text-[11px]">
                  <button
                    onClick={() => downloadCSVTemplate('ventas')}
                    className="text-[#3A5A40] hover:underline font-semibold"
                  >
                    Plantilla CSV
                  </button>
                  {salesFile && (
                    <button
                      onClick={() => setSalesFile(null)}
                      className="text-[#B33927] hover:underline"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>

              {/* Card 2: Materias Primas */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  materialsFile
                    ? 'bg-[#EBF2EC] border-[#3A5A40]'
                    : rawMaterials.length > 0
                    ? 'bg-white border-[#E6E1D8]'
                    : 'bg-[#FAF8F5] border-dashed border-[#D5CEC2]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Package className={`w-4 h-4 ${materialsFile ? 'text-[#3A5A40]' : 'text-[#5F6B61]'}`} />
                    <span className="font-bold text-xs text-[#1C211D]">2. Materias Primas</span>
                  </div>
                  {materialsFile ? (
                    <span className="px-1.5 py-0.5 bg-[#D4E3D7] text-[#233829] text-[10px] font-bold rounded">
                      Cargado ({materialsFile.count})
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#5F6B61]">
                      {rawMaterials.length} en memoria
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#5F6B61]">
                  {materialsFile
                    ? `Archivo: ${materialsFile.name}`
                    : 'Stock actual, en tránsito, MOQ y costo.'}
                </p>
                <div className="mt-2.5 flex items-center justify-between text-[11px]">
                  <button
                    onClick={() => downloadCSVTemplate('materias_primas')}
                    className="text-[#3A5A40] hover:underline font-semibold"
                  >
                    Plantilla CSV
                  </button>
                  {materialsFile && (
                    <button
                      onClick={() => setMaterialsFile(null)}
                      className="text-[#B33927] hover:underline"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>

              {/* Card 3: Fichas Técnicas BOM */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  bomFile
                    ? 'bg-[#EBF2EC] border-[#3A5A40]'
                    : garments.length > 0
                    ? 'bg-white border-[#E6E1D8]'
                    : 'bg-[#FAF8F5] border-dashed border-[#D5CEC2]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Layers className={`w-4 h-4 ${bomFile ? 'text-[#3A5A40]' : 'text-[#5F6B61]'}`} />
                    <span className="font-bold text-xs text-[#1C211D]">3. Fichas Técnicas</span>
                  </div>
                  {bomFile ? (
                    <span className="px-1.5 py-0.5 bg-[#D4E3D7] text-[#233829] text-[10px] font-bold rounded">
                      Cargado ({bomFile.count})
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#5F6B61]">
                      {garments.length} en memoria
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#5F6B61]">
                  {bomFile
                    ? `Archivo: ${bomFile.name}`
                    : 'Consumos unitarios por prenda y mermas.'}
                </p>
                <div className="mt-2.5 flex items-center justify-between text-[11px]">
                  <button
                    onClick={() => downloadCSVTemplate('fichas_tecnicas')}
                    className="text-[#3A5A40] hover:underline font-semibold"
                  >
                    Plantilla CSV
                  </button>
                  {bomFile && (
                    <button
                      onClick={() => setBOMFile(null)}
                      className="text-[#B33927] hover:underline"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Universal Dropzone */}
          <div className="border-2 border-dashed border-[#D5CEC2] hover:border-[#3A5A40] rounded-xl p-5 sm:p-6 text-center transition-colors bg-[#FAF8F5]">
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
              <div className="w-10 h-10 rounded-full bg-[#EBF2EC] text-[#3A5A40] flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-xs sm:text-sm font-semibold text-[#1C211D]">
                Haga clic para seleccionar o arrastre sus archivos CSV aquí
              </div>
              <p className="text-[11px] text-[#5F6B61]">
                Puede seleccionar 1, 2 o los 3 archivos a la vez. El sistema auto-detectará el tipo de cada archivo.
              </p>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-[#E6E1D8] bg-[#FCFBF9] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#5F6B61] hover:text-[#1C211D] transition-colors"
          >
            Cerrar
          </button>

          <button
            onClick={handleExecuteImport}
            disabled={!hasAnyStaged}
            className={`px-5 py-2 rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95 ${
              hasAnyStaged
                ? 'bg-[#3A5A40] hover:bg-[#2D4632] text-white cursor-pointer'
                : 'bg-[#E6E1D8] text-[#8F9990] cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Procesar e Integrar Datos</span>
          </button>
        </div>
      </div>
    </div>
  );
};
