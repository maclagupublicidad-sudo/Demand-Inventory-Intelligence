import Papa from 'papaparse';
import {
  RawMaterial,
  Garment,
  SalesRecord,
  MaterialCategory,
  MaterialUnit,
  BOMItem,
  ProductionTimes,
  ProductionCosting,
} from '../types';

export interface CSVValidationIssue {
  rowNumber: number; // 1-indexed for user (matching CSV/Excel row)
  column: string; // Header or field affected
  value: any; // Raw offending value found
  severity: 'error' | 'warning';
  issue: string; // Short explanation of the problem
  suggestion: string; // How to resolve the problem
}

export interface ValidatedRow<T> {
  rowIndex: number;
  originalRow: Record<string, any>;
  parsedItem?: T;
  issues: CSVValidationIssue[];
  isValid: boolean;
}

export interface DetailedCSVParseResult<T> {
  type: 'ventas' | 'materias_primas' | 'fichas_tecnicas' | 'desconocido';
  fileName: string;
  data: T[];
  rawRows: ValidatedRow<T>[];
  issues: CSVValidationIssue[];
  validCount: number;
  errorCount: number;
  warningCount: number;
  totalRows: number;
  headersDetected: string[];
  missingRequiredHeaders: string[];
  discoveredMaterials?: RawMaterial[];
}

export type DetectedCSVType = 'ventas' | 'materias_primas' | 'fichas_tecnicas' | 'desconocido';

// Normalize header strings for flexible matching
export function normalizeKey(key: string): string {
  if (!key) return '';
  return key
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// Find property in row with fuzzy matching
export function getRowValue(row: Record<string, any>, candidates: string[]): { value: any; foundKey: string | null } {
  const keys = Object.keys(row || {});
  for (const candidate of candidates) {
    const normCand = normalizeKey(candidate);
    const matchedKey = keys.find((k) => {
      const normK = normalizeKey(k);
      return normK === normCand || normK.includes(normCand);
    });
    if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null && String(row[matchedKey]).trim() !== '') {
      return { value: row[matchedKey], foundKey: matchedKey };
    }
  }
  return { value: undefined, foundKey: null };
}

// Auto-detect CSV type from header columns
export function detectCSVType(headers: string[]): DetectedCSVType {
  const norm = headers.map(normalizeKey);

  const hasBOMKeywords = norm.some((h) =>
    [
      'consumo',
      'consumoporprenda',
      'merma',
      'mermacorte',
      'mermacorteporcentaje',
      'fichatecnica',
      'sam',
      'samconfeccion',
      'tiempocorte',
      'skumateriaprima',
      'insumo',
    ].some((k) => h.includes(k))
  );
  if (hasBOMKeywords) return 'fichas_tecnicas';

  const hasMaterialKeywords = norm.some((h) =>
    ['stockactual', 'entransito', 'moq', 'moqloteminimo', 'costounitario', 'leadtime', 'stockseguridad', 'skumaterial'].some((k) =>
      h.includes(k)
    )
  );
  if (hasMaterialKeywords) return 'materias_primas';

  const hasSalesKeywords = norm.some((h) =>
    ['unidadesvendidas', 'canal', 'ingresototal', 'unidades', 'ventas', 'fechaventa'].some((k) => h.includes(k))
  );
  if (hasSalesKeywords) return 'ventas';

  return 'desconocido';
}

// Parse number safely with detailed validation
function parseNumberField(
  val: any,
  fieldName: string,
  rowNumber: number,
  options: { min?: number; max?: number; defaultValue?: number; required?: boolean; isInteger?: boolean } = {}
): { numberVal: number; issue: CSVValidationIssue | null } {
  const { min = 0, max = Infinity, defaultValue = 0, required = false, isInteger = false } = options;

  if (val === undefined || val === null || String(val).trim() === '') {
    if (required) {
      return {
        numberVal: defaultValue,
        issue: {
          rowNumber,
          column: fieldName,
          value: '(vacío)',
          severity: 'error',
          issue: `El campo "${fieldName}" es obligatorio y no puede estar vacío`,
          suggestion: `Ingrese un valor numérico válido (mínimo ${min})`,
        },
      };
    }
    return { numberVal: defaultValue, issue: null };
  }

  // Handle currency symbols, thousands separators (dot or comma)
  let cleanStr = String(val)
    .replace(/[$€COP\s]/gi, '')
    .trim();

  // If format is like "19.800,50" or "19,800.50" or "19.800"
  if (cleanStr.includes('.') && cleanStr.includes(',')) {
    if (cleanStr.indexOf('.') < cleanStr.indexOf(',')) {
      cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
    } else {
      cleanStr = cleanStr.replace(/,/g, '');
    }
  } else if (cleanStr.includes(',') && !cleanStr.includes('.')) {
    // Check if comma is decimal or thousands
    const parts = cleanStr.split(',');
    if (parts[1] && parts[1].length === 3 && parts[0].length <= 3) {
      cleanStr = parts.join(''); // thousand
    } else {
      cleanStr = cleanStr.replace(',', '.');
    }
  } else if (cleanStr.includes('.') && cleanStr.split('.').length > 2) {
    // multiple dots e.g. 1.000.000
    cleanStr = cleanStr.replace(/\./g, '');
  }

  const parsed = Number(cleanStr);

  if (isNaN(parsed)) {
    return {
      numberVal: defaultValue,
      issue: {
        rowNumber,
        column: fieldName,
        value: String(val),
        severity: 'error',
        issue: `El valor "${val}" no es un número válido`,
        suggestion: `Reemplace el texto por un valor numérico (ej: 25000 o 3.5)`,
      },
    };
  }

  if (parsed < min) {
    return {
      numberVal: Math.max(min, parsed),
      issue: {
        rowNumber,
        column: fieldName,
        value: parsed,
        severity: 'error',
        issue: `El valor no puede ser menor a ${min}`,
        suggestion: `Ingrese un número mayor o igual a ${min}`,
      },
    };
  }

  if (parsed > max) {
    return {
      numberVal: Math.min(max, parsed),
      issue: {
        rowNumber,
        column: fieldName,
        value: parsed,
        severity: 'warning',
        issue: `El valor excede el rango estándar máximo (${max})`,
        suggestion: `Verifique si la unidad o escala es correcta`,
      },
    };
  }

  return {
    numberVal: isInteger ? Math.round(parsed) : parsed,
    issue: null,
  };
}

// -------------------------------------------------------------
// 1. SALES PARSER & VALIDATOR
// -------------------------------------------------------------
export function parseSalesCSV(fileContent: string, fileName = 'ventas.csv'): DetailedCSVParseResult<SalesRecord> {
  const parsed = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false,
  });

  const headers = (parsed.meta.fields || []).map((h) => h.trim());
  const normHeaders = headers.map(normalizeKey);
  const missingRequiredHeaders: string[] = [];

  const hasSkuCol = normHeaders.some((h) => ['skuprenda', 'sku', 'codigo', 'referencia'].some((k) => h.includes(k)));
  const hasQtyCol = normHeaders.some((h) => ['unidadesvendidas', 'cantidad', 'unidades', 'ventas', 'qty'].some((k) => h.includes(k)));

  if (!hasSkuCol) missingRequiredHeaders.push('SKU_Prenda (o SKU / Referencia)');
  if (!hasQtyCol) missingRequiredHeaders.push('Unidades_Vendidas (o Cantidad / Unidades)');

  const records: SalesRecord[] = [];
  const allIssues: CSVValidationIssue[] = [];
  const rawRows: ValidatedRow<SalesRecord>[] = [];

  parsed.data.forEach((row: any, index: number) => {
    const rowNumber = index + 2; // +1 for 0-index, +1 for CSV header row
    const rowIssues: CSVValidationIssue[] = [];

    // SKU
    const { value: rawSku } = getRowValue(row, ['SKU_Prenda', 'SKU', 'Codigo', 'Referencia', 'sku_prenda', 'skuprenda']);
    if (!rawSku || String(rawSku).trim() === '') {
      rowIssues.push({
        rowNumber,
        column: 'SKU_Prenda',
        value: '(vacío)',
        severity: 'error',
        issue: 'Falta el código SKU de la prenda en la fila',
        suggestion: 'Indique un SKU válido (ej: CAM-OXF-ML-AZUL)',
      });
    }
    const garmentSku = String(rawSku || '').trim();

    // Name
    const { value: rawName } = getRowValue(row, ['Nombre_Prenda', 'Producto', 'Prenda', 'Descripcion', 'nombre']);
    const garmentName = String(rawName || garmentSku || `Prenda ${garmentSku}`).trim();

    // Date
    const { value: rawDate } = getRowValue(row, ['Fecha', 'Date', 'fechaventa', 'Fecha_Venta']);
    let dateStr = new Date().toISOString().split('T')[0];
    if (rawDate) {
      const trimmedDate = String(rawDate).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
        dateStr = trimmedDate;
      } else {
        const parsedDate = new Date(trimmedDate);
        if (!isNaN(parsedDate.getTime())) {
          dateStr = parsedDate.toISOString().split('T')[0];
        } else {
          rowIssues.push({
            rowNumber,
            column: 'Fecha',
            value: trimmedDate,
            severity: 'warning',
            issue: `Formato de fecha "${trimmedDate}" no estándar`,
            suggestion: 'Use el formato AAAA-MM-DD (ej: 2026-08-15). Se aplicará la fecha de hoy por defecto.',
          });
        }
      }
    }

    // Units
    const { value: rawUnits } = getRowValue(row, ['Unidades_Vendidas', 'Cantidad', 'Unidades', 'Ventas', 'qty']);
    const unitsRes = parseNumberField(rawUnits, 'Unidades_Vendidas', rowNumber, { min: 1, required: true, isInteger: true });
    if (unitsRes.issue) rowIssues.push(unitsRes.issue);
    const unitsSold = unitsRes.numberVal;

    // Channel
    const { value: rawChannel } = getRowValue(row, ['Canal', 'Channel', 'CanalVenta', 'Cliente', 'Canal_Venta']);
    const channel = String(rawChannel || 'Tiendas Retail').trim();

    // Revenue
    const { value: rawRevenue } = getRowValue(row, [
      'Ingreso_Total_COP',
      'Ingreso_Total',
      'Total_COP',
      'Total',
      'Ingresos',
      'VentaTotal',
    ]);
    const revRes = parseNumberField(rawRevenue, 'Ingreso_Total_COP', rowNumber, {
      min: 0,
      defaultValue: unitsSold * 150000,
    });
    if (revRes.issue) rowIssues.push(revRes.issue);
    const revenue = revRes.numberVal;

    const hasErrors = rowIssues.some((i) => i.severity === 'error');
    let item: SalesRecord | undefined;

    if (!hasErrors && garmentSku) {
      item = {
        id: `CSV-SAL-${Date.now()}-${index}`,
        date: dateStr,
        garmentSku,
        garmentName,
        unitsSold,
        channel,
        revenue,
      };
      records.push(item);
    }

    allIssues.push(...rowIssues);
    rawRows.push({
      rowIndex: rowNumber,
      originalRow: row,
      parsedItem: item,
      issues: rowIssues,
      isValid: !hasErrors && !!garmentSku,
    });
  });

  const errorCount = allIssues.filter((i) => i.severity === 'error').length;
  const warningCount = allIssues.filter((i) => i.severity === 'warning').length;

  return {
    type: 'ventas',
    fileName,
    data: records,
    rawRows,
    issues: allIssues,
    validCount: records.length,
    errorCount,
    warningCount,
    totalRows: parsed.data.length,
    headersDetected: headers,
    missingRequiredHeaders,
  };
}

// -------------------------------------------------------------
// 2. RAW MATERIALS PARSER & VALIDATOR
// -------------------------------------------------------------
export function parseRawMaterialsCSV(
  fileContent: string,
  fileName = 'materias_primas.csv'
): DetailedCSVParseResult<RawMaterial> {
  const parsed = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false,
  });

  const headers = (parsed.meta.fields || []).map((h) => h.trim());
  const normHeaders = headers.map(normalizeKey);
  const missingRequiredHeaders: string[] = [];

  const hasSkuCol = normHeaders.some((h) => ['skumaterial', 'sku', 'codigo', 'materialsku', 'referencia'].some((k) => h.includes(k)));
  const hasCostCol = normHeaders.some((h) => ['costounitario', 'costo', 'unitcost', 'preciounitario'].some((k) => h.includes(k)));

  if (!hasSkuCol) missingRequiredHeaders.push('SKU_Material (o SKU / Referencia)');
  if (!hasCostCol) missingRequiredHeaders.push('Costo_Unitario_COP (o Costo Unitario)');

  const materials: RawMaterial[] = [];
  const allIssues: CSVValidationIssue[] = [];
  const rawRows: ValidatedRow<RawMaterial>[] = [];
  const seenSkus = new Set<string>();

  parsed.data.forEach((row: any, index: number) => {
    const rowNumber = index + 2;
    const rowIssues: CSVValidationIssue[] = [];

    // SKU
    const { value: rawSku } = getRowValue(row, [
      'SKU_Material',
      'SKU',
      'Codigo',
      'Material_SKU',
      'skumaterial',
      'referencia',
    ]);
    if (!rawSku || String(rawSku).trim() === '') {
      rowIssues.push({
        rowNumber,
        column: 'SKU_Material',
        value: '(vacío)',
        severity: 'error',
        issue: 'Falta el código SKU del material o insumo',
        suggestion: 'Indique un SKU único (ej: TEL-OXF-100-AZU)',
      });
    }
    const sku = String(rawSku || '').trim();

    if (sku && seenSkus.has(sku.toUpperCase())) {
      rowIssues.push({
        rowNumber,
        column: 'SKU_Material',
        value: sku,
        severity: 'warning',
        issue: `SKU duplicado "${sku}" encontrado en varias filas`,
        suggestion: 'Si es intencional, se actualizarán los datos con la última fila leída.',
      });
    } else if (sku) {
      seenSkus.add(sku.toUpperCase());
    }

    // Name
    const { value: rawName } = getRowValue(row, ['Nombre_Material', 'Nombre', 'Descripcion', 'Material', 'Insumo']);
    const name = String(rawName || sku || `Insumo ${sku}`).trim();

    // Category
    const { value: rawCat } = getRowValue(row, ['Categoria', 'Category', 'Tipo', 'Rubro', 'Grupo']);
    const catStr = String(rawCat || 'Tela').trim();
    let category: MaterialCategory = 'Tela';
    const normCat = normalizeKey(catStr);

    if (normCat.includes('av') || normCat.includes('fornit') || normCat.includes('boton') || normCat.includes('crem')) {
      category = 'Avío / Fornitura';
    } else if (normCat.includes('hil') || normCat.includes('yarn')) {
      category = 'Hilo';
    } else if (normCat.includes('entre') || normCat.includes('fusion')) {
      category = 'Entretela';
    } else if (normCat.includes('emp') || normCat.includes('etiq') || normCat.includes('bolsa')) {
      category = 'Empaque / Etiqueta';
    } else if (normCat.includes('tel') || normCat.includes('fabric')) {
      category = 'Tela';
    } else {
      rowIssues.push({
        rowNumber,
        column: 'Categoria',
        value: catStr,
        severity: 'warning',
        issue: `Categoría "${catStr}" no estándar`,
        suggestion: 'Se asignó "Tela". Opciones válidas: Tela, Avío / Fornitura, Hilo, Entretela, Empaque / Etiqueta.',
      });
    }

    // Unit
    const { value: rawUnit } = getRowValue(row, ['Unidad_Medida', 'Unidad', 'Unit', 'Medida']);
    const unitStr = String(rawUnit || 'm').trim();
    let unit: MaterialUnit = 'm';
    const normUnit = normalizeKey(unitStr);

    if (['kg', 'kilos', 'kilogramos', 'kilo'].includes(normUnit)) unit = 'kg';
    else if (['unidades', 'und', 'u', 'piezas', 'pza', 'pcs', 'unidad'].includes(normUnit)) unit = 'unidades';
    else if (['yardas', 'yd', 'yds', 'yarda'].includes(normUnit)) unit = 'yardas';
    else if (['conos', 'cono'].includes(normUnit)) unit = 'conos';
    else if (['gruesas', 'gr', 'gruesa'].includes(normUnit)) unit = 'gruesas';
    else if (['docenas', 'doc', 'docena'].includes(normUnit)) unit = 'docenas';
    else if (['m', 'metros', 'metro', 'mts'].includes(normUnit)) unit = 'm';
    else {
      rowIssues.push({
        rowNumber,
        column: 'Unidad_Medida',
        value: unitStr,
        severity: 'warning',
        issue: `Unidad de medida "${unitStr}" desconocida`,
        suggestion: 'Se asumió "m" (metros). Unidades válidas: m, kg, unidades, yardas, conos, gruesas, docenas.',
      });
    }

    // Numeric metrics
    const { value: rawStock } = getRowValue(row, ['Stock_Actual', 'Stock', 'Inventario', 'Existencias', 'Disponible']);
    const stockRes = parseNumberField(rawStock, 'Stock_Actual', rowNumber, { min: 0, defaultValue: 0 });
    if (stockRes.issue) rowIssues.push(stockRes.issue);
    const currentStock = stockRes.numberVal;

    const { value: rawInTransit } = getRowValue(row, [
      'En_Transito',
      'Transito',
      'PorLlegar',
      'TransitoStock',
      'oc_abiertas',
    ]);
    const transitRes = parseNumberField(rawInTransit, 'En_Transito', rowNumber, { min: 0, defaultValue: 0 });
    if (transitRes.issue) rowIssues.push(transitRes.issue);
    const inTransitStock = transitRes.numberVal;

    const { value: rawSafety } = getRowValue(row, [
      'Stock_Seguridad_Dias',
      'Safety_Stock',
      'SeguridadDias',
      'DiasSeguridad',
    ]);
    const safetyRes = parseNumberField(rawSafety, 'Stock_Seguridad_Dias', rowNumber, { min: 1, max: 90, defaultValue: 15, isInteger: true });
    if (safetyRes.issue) rowIssues.push(safetyRes.issue);
    const safetyStockDays = safetyRes.numberVal;

    const { value: rawMOQ } = getRowValue(row, ['MOQ_Lote_Minimo', 'MOQ', 'LoteMinimo', 'PedidoMinimo']);
    const moqRes = parseNumberField(rawMOQ, 'MOQ_Lote_Minimo', rowNumber, { min: 1, defaultValue: 10, isInteger: true });
    if (moqRes.issue) rowIssues.push(moqRes.issue);
    const minOrderQuantity = moqRes.numberVal;

    const { value: rawCost } = getRowValue(row, [
      'Costo_Unitario_COP',
      'Costo_Unitario',
      'Costo',
      'PrecioUnitario',
      'UnitCost',
      'Costo_Unitario_USD',
    ]);
    const costRes = parseNumberField(rawCost, 'Costo_Unitario_COP', rowNumber, { min: 1, defaultValue: 1000, required: true });
    if (costRes.issue) rowIssues.push(costRes.issue);
    const unitCost = costRes.numberVal;

    const { value: rawLead } = getRowValue(row, ['Lead_Time_Dias', 'LeadTime', 'TiempoEntrega', 'DiasEntrega']);
    const leadRes = parseNumberField(rawLead, 'Lead_Time_Dias', rowNumber, { min: 1, max: 120, defaultValue: 14, isInteger: true });
    if (leadRes.issue) rowIssues.push(leadRes.issue);
    const leadTimeDays = leadRes.numberVal;

    const { value: rawSupplier } = getRowValue(row, ['Proveedor', 'Supplier', 'Fabricante', 'Distribuidor']);
    const supplierName = String(rawSupplier || 'Proveedor General').trim();

    const hasErrors = rowIssues.some((i) => i.severity === 'error');
    let item: RawMaterial | undefined;

    if (!hasErrors && sku) {
      item = {
        id: `MAT-${sku.toUpperCase()}`,
        sku,
        name,
        category,
        unit,
        currentStock,
        inTransitStock,
        safetyStockDays,
        minOrderQuantity,
        unitCost,
        supplierName,
        leadTimeDays,
      };
      materials.push(item);
    }

    allIssues.push(...rowIssues);
    rawRows.push({
      rowIndex: rowNumber,
      originalRow: row,
      parsedItem: item,
      issues: rowIssues,
      isValid: !hasErrors && !!sku,
    });
  });

  const errorCount = allIssues.filter((i) => i.severity === 'error').length;
  const warningCount = allIssues.filter((i) => i.severity === 'warning').length;

  return {
    type: 'materias_primas',
    fileName,
    data: materials,
    rawRows,
    issues: allIssues,
    validCount: materials.length,
    errorCount,
    warningCount,
    totalRows: parsed.data.length,
    headersDetected: headers,
    missingRequiredHeaders,
  };
}

// -------------------------------------------------------------
// 3. BOM & TECH PACK PARSER & VALIDATOR
// -------------------------------------------------------------
export function parseBOMCSV(
  fileContent: string,
  existingMaterials: RawMaterial[],
  fileName = 'fichas_tecnicas.csv'
): DetailedCSVParseResult<Garment> {
  const parsed = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false,
  });

  const headers = (parsed.meta.fields || []).map((h) => h.trim());
  const normHeaders = headers.map(normalizeKey);
  const missingRequiredHeaders: string[] = [];

  const hasGarmentSku = normHeaders.some((h) => ['skuprenda', 'garmentsku', 'sku', 'referencia'].some((k) => h.includes(k)));
  const hasMatSku = normHeaders.some((h) => ['skumateriaprima', 'materialsku', 'skuinsumo', 'material'].some((k) => h.includes(k)));
  const hasConsumption = normHeaders.some((h) => ['consumoporprenda', 'consumo', 'cantidad'].some((k) => h.includes(k)));

  if (!hasGarmentSku) missingRequiredHeaders.push('SKU_Prenda (Código de la prenda)');
  if (!hasMatSku) missingRequiredHeaders.push('SKU_Materia_Prima (Código del insumo)');
  if (!hasConsumption) missingRequiredHeaders.push('Consumo_Por_Prenda (Metros/Kg/Unidades)');

  const garmentsMap = new Map<string, Garment>();
  const discoveredMaterialsMap = new Map<string, RawMaterial>();
  const allIssues: CSVValidationIssue[] = [];
  const rawRows: ValidatedRow<Garment>[] = [];

  // Index existing materials
  const materialBySku = new Map<string, RawMaterial>();
  existingMaterials.forEach((m) => {
    materialBySku.set(m.sku.toUpperCase(), m);
    materialBySku.set(m.id.toUpperCase(), m);
  });

  parsed.data.forEach((row: any, index: number) => {
    const rowNumber = index + 2;
    const rowIssues: CSVValidationIssue[] = [];

    // Garment SKU
    const { value: rawGarmentSku } = getRowValue(row, [
      'SKU_Prenda',
      'Garment_SKU',
      'SKU',
      'Prenda_SKU',
      'Referencia',
      'Codigo_Prenda',
    ]);
    if (!rawGarmentSku || String(rawGarmentSku).trim() === '') {
      rowIssues.push({
        rowNumber,
        column: 'SKU_Prenda',
        value: '(vacío)',
        severity: 'error',
        issue: 'Falta el SKU de la prenda',
        suggestion: 'Indique el código de la prenda (ej: CAM-OXF-ML-AZUL)',
      });
    }
    const garmentSku = String(rawGarmentSku || '').trim();

    // Garment Name
    const { value: rawGarmentName } = getRowValue(row, [
      'Nombre_Prenda',
      'Garment_Name',
      'Prenda',
      'Descripcion_Prenda',
      'Nombre',
    ]);
    const garmentName = String(rawGarmentName || garmentSku || `Prenda ${garmentSku}`).trim();

    // Garment Category
    const { value: rawCat } = getRowValue(row, ['Categoria_Prenda', 'Category', 'Coleccion', 'TipoPrenda', 'Linea']);
    const category = String(rawCat || 'Confección').trim();

    // Target Sales & Retail Price
    const { value: rawTarget } = getRowValue(row, ['Meta_Ventas_Ciclo', 'Target', 'MetaVentas', 'UnidadesMeta', 'Meta']);
    const targetRes = parseNumberField(rawTarget, 'Meta_Ventas_Ciclo', rowNumber, { min: 1, defaultValue: 1000, isInteger: true });
    if (targetRes.issue) rowIssues.push(targetRes.issue);
    const targetSales = targetRes.numberVal;

    const { value: rawPrice } = getRowValue(row, ['PVP_COP', 'Precio_Venta_COP', 'RetailPrice', 'PVP', 'Precio']);
    const priceRes = parseNumberField(rawPrice, 'PVP_COP', rowNumber, { min: 1, defaultValue: 150000 });
    if (priceRes.issue) rowIssues.push(priceRes.issue);
    const retailPrice = priceRes.numberVal;

    // Production times
    const { value: rawCutt } = getRowValue(row, ['Tiempo_Corte_Min', 'CorteMin', 'TiempoCorte']);
    const cuttingRes = parseNumberField(rawCutt, 'Tiempo_Corte_Min', rowNumber, { min: 0.1, max: 120, defaultValue: 3.5 });
    if (cuttingRes.issue) rowIssues.push(cuttingRes.issue);
    const cuttingMinutes = cuttingRes.numberVal;

    const { value: rawSAM } = getRowValue(row, ['SAM_Confeccion_Min', 'SAM', 'ConfeccionSAM', 'MinutosConfeccion']);
    const samRes = parseNumberField(rawSAM, 'SAM_Confeccion_Min', rowNumber, { min: 0.5, max: 300, defaultValue: 20.0 });
    if (samRes.issue) rowIssues.push(samRes.issue);
    const sewingSAM = samRes.numberVal;

    const { value: rawFin } = getRowValue(row, ['Tiempo_Acabados_Min', 'AcabadosMin', 'TiempoTerminacion']);
    const finRes = parseNumberField(rawFin, 'Tiempo_Acabados_Min', rowNumber, { min: 0.1, max: 120, defaultValue: 4.0 });
    if (finRes.issue) rowIssues.push(finRes.issue);
    const finishingMinutes = finRes.numberVal;
    const totalMfgMinutes = cuttingMinutes + sewingSAM + finishingMinutes;

    // Costing Rates
    const { value: rawLaborRate } = getRowValue(row, ['Tarifa_Minuto_Interno_COP', 'TarifaInternaMin', 'CostoMinutoInterno']);
    const laborRateRes = parseNumberField(rawLaborRate, 'Tarifa_Minuto_Interno_COP', rowNumber, { min: 50, defaultValue: 280 });
    const internalLaborRate = laborRateRes.numberVal;

    const { value: rawMaqCut } = getRowValue(row, ['Tarifa_Maquila_Corte_COP', 'MaquilaCorte']);
    const maqCutRes = parseNumberField(rawMaqCut, 'Tarifa_Maquila_Corte_COP', rowNumber, { min: 0, defaultValue: 2200 });
    const maquilaCuttingRate = maqCutRes.numberVal;

    const { value: rawMaqSew } = getRowValue(row, ['Tarifa_Maquila_Confeccion_COP', 'MaquilaConfeccion']);
    const maqSewRes = parseNumberField(rawMaqSew, 'Tarifa_Maquila_Confeccion_COP', rowNumber, { min: 0, defaultValue: 12000 });
    const maquilaSewingRate = maqSewRes.numberVal;

    const { value: rawMaqFin } = getRowValue(row, ['Tarifa_Maquila_Acabados_COP', 'MaquilaAcabados']);
    const maqFinRes = parseNumberField(rawMaqFin, 'Tarifa_Maquila_Acabados_COP', rowNumber, { min: 0, defaultValue: 2500 });
    const maquilaFinishingRate = maqFinRes.numberVal;

    const { value: rawNotes } = getRowValue(row, ['Notas_Ficha_Tecnica', 'Notas', 'Observaciones', 'TechPackNotes']);
    const notes = String(rawNotes || '').trim();

    // Material Insumo SKU & Consumption
    const { value: rawMatSku } = getRowValue(row, [
      'SKU_Materia_Prima',
      'Material_SKU',
      'SKU_Insumo',
      'Insumo_SKU',
      'Material',
      'SKU_Material',
    ]);
    const matSku = rawMatSku ? String(rawMatSku).trim() : '';

    if (!matSku) {
      rowIssues.push({
        rowNumber,
        column: 'SKU_Materia_Prima',
        value: '(vacío)',
        severity: 'error',
        issue: 'Falta el SKU de la materia prima en el BOM',
        suggestion: 'Indique el código del insumo requerido para la prenda',
      });
    }

    const { value: rawMatName } = getRowValue(row, [
      'Nombre_Materia_Prima',
      'Nombre_Material',
      'Insumo_Nombre',
      'Descripcion_Material',
    ]);
    const matName = String(rawMatName || matSku).trim();

    const { value: rawConsumption } = getRowValue(row, [
      'Consumo_Por_Prenda',
      'Consumo',
      'Cantidad',
      'ConsumoUnitario',
    ]);
    const consRes = parseNumberField(rawConsumption, 'Consumo_Por_Prenda', rowNumber, {
      min: 0.0001,
      defaultValue: 1.0,
      required: true,
    });
    if (consRes.issue) rowIssues.push(consRes.issue);
    const consumption = consRes.numberVal;

    const { value: rawWaste } = getRowValue(row, [
      'Merma_Corte_Porcentaje',
      'Merma',
      'Scrap',
      'Desperdicio',
      'MermaPorcentaje',
    ]);
    const wasteRes = parseNumberField(rawWaste, 'Merma_Corte_Porcentaje', rowNumber, { min: 0, max: 99, defaultValue: 5 });
    if (wasteRes.issue) rowIssues.push(wasteRes.issue);
    const wastePercent = wasteRes.numberVal;

    const { value: rawUnit } = getRowValue(row, ['Unidad_Medida', 'Unidad', 'Unit', 'Medida']);
    const unitStr = String(rawUnit || 'm').trim();
    let unit: MaterialUnit = 'm';
    const normUnit = normalizeKey(unitStr);
    if (['kg', 'kilos'].includes(normUnit)) unit = 'kg';
    else if (['unidades', 'und', 'u', 'piezas', 'pza'].includes(normUnit)) unit = 'unidades';
    else if (['yardas', 'yd'].includes(normUnit)) unit = 'yardas';
    else if (['conos', 'cono'].includes(normUnit)) unit = 'conos';

    // Auto-discover material if not existing
    let matchedMat = materialBySku.get(matSku.toUpperCase());
    const materialId = `MAT-${matSku.toUpperCase()}`;

    if (!matchedMat && matSku) {
      let autoCat: MaterialCategory = 'Tela';
      if (matSku.startsWith('AVI-') || matName.toLowerCase().includes('bot') || matName.toLowerCase().includes('crem')) {
        autoCat = 'Avío / Fornitura';
      } else if (matSku.startsWith('HIL-') || matName.toLowerCase().includes('hil')) {
        autoCat = 'Hilo';
      } else if (matSku.startsWith('ENT-') || matName.toLowerCase().includes('entre')) {
        autoCat = 'Entretela';
      } else if (matSku.startsWith('EMP-') || matName.toLowerCase().includes('etiq') || matName.toLowerCase().includes('bolsa')) {
        autoCat = 'Empaque / Etiqueta';
      }

      const autoCreatedMat: RawMaterial = {
        id: materialId,
        sku: matSku,
        name: matName || matSku,
        category: autoCat,
        unit,
        currentStock: 0,
        inTransitStock: 0,
        safetyStockDays: 15,
        minOrderQuantity: 10,
        unitCost: 10000,
        supplierName: 'Auto-creado desde Ficha Técnica',
        leadTimeDays: 14,
      };
      discoveredMaterialsMap.set(matSku.toUpperCase(), autoCreatedMat);
      materialBySku.set(matSku.toUpperCase(), autoCreatedMat);
      matchedMat = autoCreatedMat;

      rowIssues.push({
        rowNumber,
        column: 'SKU_Materia_Prima',
        value: matSku,
        severity: 'warning',
        issue: `Insumo "${matSku}" no estaba previamente en el inventario`,
        suggestion:
          'Se creará automáticamente con costo estimado base $10.000 COP. Recomendación: cargue primero el archivo "1. Materias Primas" para heredar costos y proveedores reales.',
      });
    }

    const hasErrors = rowIssues.some((i) => i.severity === 'error');

    if (garmentSku) {
      let garment = garmentsMap.get(garmentSku.toUpperCase());
      if (!garment) {
        const prodTimes: ProductionTimes = {
          cuttingMinutesPerGarment: cuttingMinutes,
          sewingSAM: sewingSAM,
          finishingMinutesPerGarment: finishingMinutes,
          totalManufacturingMinutes: totalMfgMinutes,
          standardBatchSize: 300,
          totalCycleDays: 7,
        };

        const internalLaborCost = totalMfgMinutes * internalLaborRate;
        const internalOverheadCost = totalMfgMinutes * 95;

        const prodCosting: ProductionCosting = {
          rawMaterialsCost: 0,
          internalLaborRatePerMinute: internalLaborRate,
          internalOverheadRatePerMinute: 95,
          internalLaborCost,
          internalOverheadCost,
          totalInternalCost: internalLaborCost + internalOverheadCost,
          maquilaCuttingRate,
          maquilaSewingRate,
          maquilaFinishingRate,
          maquilaLogisticsCost: 900,
          totalMaquilaCost: maquilaCuttingRate + maquilaSewingRate + maquilaFinishingRate + 900,
          recommendedSellingPrice: retailPrice,
          internalProfitMarginPercent: 65,
          maquilaProfitMarginPercent: 60,
        };

        garment = {
          id: `GAR-${garmentSku.toUpperCase()}`,
          sku: garmentSku,
          name: garmentName,
          category,
          targetSales,
          historicalMonthlyAverage: Math.round(targetSales / 3),
          retailPrice,
          costEstimate: Math.round(internalLaborCost + internalOverheadCost + 25000),
          finishedGoodsStock: 0,
          productionWIP: 0,
          bom: [],
          productionTimes: prodTimes,
          costing: prodCosting,
          techPackNotes: notes,
        };
        garmentsMap.set(garmentSku.toUpperCase(), garment);
      }

      if (matSku && consumption > 0) {
        garment.bom.push({
          rawMaterialId: matchedMat ? matchedMat.id : materialId,
          rawMaterialName: matchedMat ? matchedMat.name : matName || matSku,
          category: matchedMat ? matchedMat.category : 'Tela',
          quantityPerGarment: consumption,
          unit,
          wastePercent,
        });
      }
    }

    allIssues.push(...rowIssues);
    rawRows.push({
      rowIndex: rowNumber,
      originalRow: row,
      parsedItem: garmentsMap.get(garmentSku.toUpperCase()),
      issues: rowIssues,
      isValid: !hasErrors && !!garmentSku && !!matSku,
    });
  });

  // Calculate finalized BOM costs
  garmentsMap.forEach((g) => {
    let matTotal = 0;
    g.bom.forEach((item) => {
      const mat = materialBySku.get(item.rawMaterialId.toUpperCase()) || materialBySku.get(item.rawMaterialName.toUpperCase());
      const unitCost = mat?.unitCost || 0;
      matTotal += item.quantityPerGarment * (1 + item.wastePercent / 100) * unitCost;
    });

    if (g.costing) {
      g.costing.rawMaterialsCost = Math.round(matTotal);
      g.costing.totalInternalCost = Math.round(matTotal + g.costing.internalLaborCost + g.costing.internalOverheadCost);
      g.costing.totalMaquilaCost = Math.round(
        matTotal +
          g.costing.maquilaCuttingRate +
          g.costing.maquilaSewingRate +
          g.costing.maquilaFinishingRate +
          g.costing.maquilaLogisticsCost
      );
      if (g.retailPrice > 0) {
        g.costing.internalProfitMarginPercent = parseFloat(
          (((g.retailPrice - g.costing.totalInternalCost) / g.retailPrice) * 100).toFixed(1)
        );
        g.costing.maquilaProfitMarginPercent = parseFloat(
          (((g.retailPrice - g.costing.totalMaquilaCost) / g.retailPrice) * 100).toFixed(1)
        );
      }
      g.costEstimate = g.costing.totalInternalCost;
    }
  });

  const errorCount = allIssues.filter((i) => i.severity === 'error').length;
  const warningCount = allIssues.filter((i) => i.severity === 'warning').length;

  return {
    type: 'fichas_tecnicas',
    fileName,
    data: Array.from(garmentsMap.values()),
    rawRows,
    issues: allIssues,
    validCount: garmentsMap.size,
    errorCount,
    warningCount,
    totalRows: parsed.data.length,
    headersDetected: headers,
    missingRequiredHeaders,
    discoveredMaterials: Array.from(discoveredMaterialsMap.values()),
  };
}

// -------------------------------------------------------------
// TEMPLATE DOWNLOADS & EXPORTS
// -------------------------------------------------------------
export function downloadCSVTemplate(type: 'ventas' | 'materias_primas' | 'fichas_tecnicas' | 'todas') {
  if (type === 'todas') {
    downloadCSVTemplate('ventas');
    setTimeout(() => downloadCSVTemplate('materias_primas'), 250);
    setTimeout(() => downloadCSVTemplate('fichas_tecnicas'), 500);
    return;
  }

  let headers: string[] = [];
  let sampleRows: string[][] = [];
  let filename = '';

  switch (type) {
    case 'ventas':
      filename = '1_plantilla_ventas_historicas_COP.csv';
      headers = ['Fecha', 'SKU_Prenda', 'Nombre_Prenda', 'Unidades_Vendidas', 'Canal', 'Ingreso_Total_COP'];
      sampleRows = [
        ['2026-06-01', 'CAM-OXF-ML-AZUL', 'Camisa Oxford Manga Larga Clásica', '120', 'Tiendas Retail', '20160000'],
        ['2026-06-15', 'PAN-JEA-SLIM-IND', 'Pantalón Jean Denim Slim Fit 5 Bolsillos', '180', 'Mayorista', '41760000'],
        ['2026-07-01', 'POL-PIQ-PIMA-GRS', 'Polo Piqué Algodón Pima Manga Corta', '220', 'E-Commerce', '29920000'],
        ['2026-07-15', 'CAM-OXF-ML-AZUL', 'Camisa Oxford Manga Larga Clásica', '150', 'Tiendas Retail', '25200000'],
        ['2026-08-01', 'VES-LIN-BOT-BEI', 'Vestido Camisero Lino Botones Frontales', '90', 'Boutique Flagship', '23400000'],
        ['2026-08-10', 'CHA-BOM-TAS-NEG', 'Chaqueta Bomber Taslan Impermeable', '110', 'Distribuidores', '31680000'],
      ];
      break;

    case 'materias_primas':
      filename = '2_plantilla_inventario_materias_primas_COP.csv';
      headers = [
        'SKU_Material',
        'Nombre_Material',
        'Categoria',
        'Unidad_Medida',
        'Stock_Actual',
        'En_Transito',
        'Stock_Seguridad_Dias',
        'MOQ_Lote_Minimo',
        'Costo_Unitario_COP',
        'Proveedor',
        'Lead_Time_Dias',
      ];
      sampleRows = [
        ['TEL-OXF-100-AZU', 'Tela Oxford 100% Algodón (Azul Cielo)', 'Tela', 'm', '1450', '500', '15', '200', '19800', 'Textiles Fabricato / El Cóndor S.A.', '14'],
        ['TEL-DEN-125-IND', 'Denim Índigo 12.5 oz Sanforizado', 'Tela', 'm', '2800', '1200', '20', '500', '28900', 'Coltejer Textil Colombiana', '21'],
        ['TEL-PIQ-PIMA-GRS', 'Piqué Algodón Pima 24/1 (Gris Jaspe)', 'Tela', 'kg', '650', '300', '15', '100', '48000', 'Hilanderías Universal de Colombia', '18'],
        ['TEL-LIN-100-BEI', 'Lino Puro 100% Pre-lavado (Beige Natural)', 'Tela', 'm', '480', '200', '25', '150', '38500', 'Importadora Textil Andina SAS', '30'],
        ['TEL-TAS-NYL-NEG', 'Nylon Taslan Repelente al Agua (Negro)', 'Tela', 'm', '890', '0', '12', '200', '24500', 'Lafayette S.A.S. Textiles Técnicos', '12'],
        ['AVI-BOT-18L-PER', 'Botón Poliéster 18L 4 Huecos (Efecto Perla)', 'Avío / Fornitura', 'unidades', '28000', '10000', '15', '1000', '140', 'Botones & Fornituras de Colombia', '10'],
        ['AVI-BOT-REM-24L', 'Botón Remache Metálico Jean 24L (Bronce Envejecido)', 'Avío / Fornitura', 'unidades', '6500', '2000', '20', '500', '480', 'Herrajes & Metales YKK', '15'],
        ['AVI-CRE-MET-15C', 'Cremallera Metálica Latón #4.5 de 15cm (Índigo)', 'Avío / Fornitura', 'unidades', '4200', '1500', '18', '500', '1750', 'Corporación Cierres YKK', '16'],
        ['AVI-CRE-TAS-65C', 'Cremallera Diente de Perro Separable #5 de 65cm (Negro)', 'Avío / Fornitura', 'unidades', '1100', '0', '15', '200', '3600', 'Corporación Cierres YKK', '14'],
        ['HIL-POL-120-BLA', 'Hilo 100% Poliéster Spun 120/2 Cono 5,000m (Blanco)', 'Hilo', 'conos', '95', '30', '15', '20', '14500', 'Coats Cadena Andina S.A.', '7'],
        ['HIL-COR-040-OCR', 'Hilo Core-Spun 40/2 Jean Cono 4,000m (Ocre)', 'Hilo', 'conos', '65', '0', '20', '15', '26000', 'Coats Cadena Andina S.A.', '10'],
        ['ENT-FUS-75G-BLA', 'Entretela Tejida Fusionable Cuellos/Puños 75g (Blanco)', 'Entretela', 'm', '850', '300', '20', '100', '4900', 'Freudenberg / Entretelas de Colombia', '15'],
        ['EMP-BOL-REC-TRA', 'Bolsa Polietileno Reciclado Transparente con Adhesivo', 'Empaque / Etiqueta', 'unidades', '14000', '5000', '15', '2000', '210', 'Empaques Ecológicos SAS', '7'],
        ['EMP-ETI-MAR-DAM', 'Etiqueta de Marca Tejida Damasco Alta Definición', 'Empaque / Etiqueta', 'unidades', '18500', '5000', '25', '2500', '320', 'Etiquetas & Marquillas de Colombia', '20'],
      ];
      break;

    case 'fichas_tecnicas':
      filename = '3_plantilla_fichas_tecnicas_produccion_COP.csv';
      headers = [
        'SKU_Prenda',
        'Nombre_Prenda',
        'Categoria_Prenda',
        'Meta_Ventas_Ciclo',
        'PVP_COP',
        'Tiempo_Corte_Min',
        'SAM_Confeccion_Min',
        'Tiempo_Acabados_Min',
        'Tarifa_Minuto_Interno_COP',
        'Tarifa_Maquila_Corte_COP',
        'Tarifa_Maquila_Confeccion_COP',
        'Tarifa_Maquila_Acabados_COP',
        'SKU_Materia_Prima',
        'Nombre_Materia_Prima',
        'Consumo_Por_Prenda',
        'Unidad_Medida',
        'Merma_Corte_Porcentaje',
        'Notas_Ficha_Tecnica',
      ];
      sampleRows = [
        ['CAM-OXF-ML-AZUL', 'Camisa Oxford Manga Larga Clásica', 'Camisería', '2400', '168000', '3.5', '22.0', '4.5', '280', '2200', '11500', '2400', 'TEL-OXF-100-AZU', 'Tela Oxford 100% Algodón', '1.65', 'm', '5.0', 'Camisa ejecutiva formal con cuello button-down'],
        ['CAM-OXF-ML-AZUL', 'Camisa Oxford Manga Larga Clásica', 'Camisería', '2400', '168000', '3.5', '22.0', '4.5', '280', '2200', '11500', '2400', 'AVI-BOT-18L-PER', 'Botón Poliéster 18L', '10', 'unidades', '2.0', 'Camisa ejecutiva formal con cuello button-down'],
        ['CAM-OXF-ML-AZUL', 'Camisa Oxford Manga Larga Clásica', 'Camisería', '2400', '168000', '3.5', '22.0', '4.5', '280', '2200', '11500', '2400', 'ENT-FUS-75G-BLA', 'Entretela Tejida Fusionable', '0.28', 'm', '4.0', 'Camisa ejecutiva formal con cuello button-down'],
        ['CAM-OXF-ML-AZUL', 'Camisa Oxford Manga Larga Clásica', 'Camisería', '2400', '168000', '3.5', '22.0', '4.5', '280', '2200', '11500', '2400', 'HIL-POL-120-BLA', 'Hilo Poliéster 120/2', '0.018', 'conos', '3.0', 'Camisa ejecutiva formal con cuello button-down'],
        ['PAN-JEA-SLIM-IND', 'Pantalón Jean Denim Slim Fit 5 Bolsillos', 'Pantalonería / Denim', '3200', '232000', '4.0', '28.5', '6.0', '280', '2600', '15800', '4500', 'TEL-DEN-125-IND', 'Denim Índigo 12.5 oz', '1.45', 'm', '6.0', 'Jean 5 bolsillos con lavado stone wash'],
        ['PAN-JEA-SLIM-IND', 'Pantalón Jean Denim Slim Fit 5 Bolsillos', 'Pantalonería / Denim', '3200', '232000', '4.0', '28.5', '6.0', '280', '2600', '15800', '4500', 'AVI-BOT-REM-24L', 'Botón Remache Jean 24L', '1', 'unidades', '1.0', 'Jean 5 bolsillos con lavado stone wash'],
        ['PAN-JEA-SLIM-IND', 'Pantalón Jean Denim Slim Fit 5 Bolsillos', 'Pantalonería / Denim', '3200', '232000', '4.0', '28.5', '6.0', '280', '2600', '15800', '4500', 'AVI-CRE-MET-15C', 'Cremallera Metálica Latón 15cm', '1', 'unidades', '1.0', 'Jean 5 bolsillos con lavado stone wash'],
        ['POL-PIQ-PIMA-GRS', 'Polo Piqué Algodón Pima Manga Corta', 'Tejido de Punto', '2800', '136000', '2.5', '14.0', '3.0', '280', '1500', '7200', '1800', 'TEL-PIQ-PIMA-GRS', 'Piqué Algodón Pima 24/1', '0.32', 'kg', '7.0', 'Polo clásico con cuello rectilíneo y tapeta'],
        ['POL-PIQ-PIMA-GRS', 'Polo Piqué Algodón Pima Manga Corta', 'Tejido de Punto', '2800', '136000', '2.5', '14.0', '3.0', '280', '1500', '7200', '1800', 'AVI-BOT-18L-PER', 'Botón Poliéster 18L', '3', 'unidades', '2.0', 'Polo clásico con cuello rectilíneo y tapeta'],
      ];
      break;

    default:
      break;
  }

  const csvContent = [headers.join(','), ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
