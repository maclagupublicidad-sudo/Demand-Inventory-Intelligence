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

export interface CSVParseResult<T> {
  data: T[];
  errors: string[];
  totalRows: number;
}

export type DetectedCSVType = 'ventas' | 'materias_primas' | 'fichas_tecnicas' | 'desconocido';

// Helper to normalize header keys (lowercase, trim, remove accents/underscores)
function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
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
      'bom',
      'fichatecnica',
      'sam',
      'samconfeccion',
      'tiempocorte',
    ].some((k) => h.includes(k))
  );
  if (hasBOMKeywords) return 'fichas_tecnicas';

  const hasMaterialKeywords = norm.some((h) =>
    ['stockactual', 'entransito', 'moq', 'moqloteminimo', 'costounitario', 'leadtime', 'stockseguridad'].some((k) =>
      h.includes(k)
    )
  );
  if (hasMaterialKeywords) return 'materias_primas';

  const hasSalesKeywords = norm.some((h) =>
    ['unidadesvendidas', 'canal', 'ingresototal', 'unidades', 'ventas'].some((k) => h.includes(k))
  );
  if (hasSalesKeywords) return 'ventas';

  return 'desconocido';
}

// Download CSV template generator
export function downloadCSVTemplate(type: 'ventas' | 'produccion' | 'materias_primas' | 'fichas_tecnicas' | 'todas') {
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
        ['VES-LIN-BOT-BEI', 'Vestido Camisero Lino Botones Frontales', 'Vestidos & Faldas', '1100', '260000', '4.5', '32.0', '5.5', '280', '2800', '16500', '3200', 'TEL-LIN-100-BEI', 'Lino Puro 100% Pre-lavado', '2.30', 'm', '5.5', 'Vestido midi con cinturón de tela y bolsillos'],
        ['CHA-BOM-TAS-NEG', 'Chaqueta Bomber Taslan Impermeable', 'Chaquetería', '950', '288000', '4.0', '36.0', '5.0', '280', '2900', '18500', '3500', 'TEL-TAS-NYL-NEG', 'Nylon Taslan Repelente', '1.85', 'm', '5.0', 'Chaqueta bomber deportiva con forro tafetán'],
        ['JOG-FLC-URB-MAR', 'Jogger Urbano Fleece Algodón con Puño', 'Pantalonería / Sport', '1900', '152000', '3.0', '18.0', '3.5', '280', '1800', '9200', '2200', 'TEL-FLC-ALG-MAR', 'Franela Fleece Algodón 280g', '0.65', 'kg', '6.5', 'Jogger deportivo con cordón y pretina elástica'],
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

// Export current garments and BOM database to CSV
export function exportGarmentsToCSV(garments: Garment[], rawMaterials: RawMaterial[]) {
  const headers = [
    'SKU_Prenda',
    'Nombre_Prenda',
    'Categoria_Prenda',
    'Meta_Ventas_Ciclo',
    'PVP_COP',
    'Tiempo_Corte_Min',
    'SAM_Confeccion_Min',
    'Tiempo_Acabados_Min',
    'Tiempo_Total_Min',
    'Tarifa_Minuto_Interno_COP',
    'Costo_MOD_Interno_COP',
    'Costo_Total_Interno_COP',
    'Tarifa_Maquila_Corte_COP',
    'Tarifa_Maquila_Confeccion_COP',
    'Tarifa_Maquila_Acabados_COP',
    'Costo_Total_Maquila_COP',
    'SKU_Materia_Prima',
    'Nombre_Materia_Prima',
    'Consumo_Por_Prenda',
    'Unidad_Medida',
    'Merma_Corte_Porcentaje',
    'Costo_Material_COP',
    'Notas_Ficha_Tecnica',
  ];

  const rows: string[][] = [];

  garments.forEach((g) => {
    const pt = g.productionTimes;
    const cost = g.costing;
    const notes = g.techPackNotes || '';

    if (g.bom.length === 0) {
      rows.push([
        g.sku,
        g.name,
        g.category,
        String(g.targetSales),
        String(g.retailPrice),
        String(pt?.cuttingMinutesPerGarment || 3.0),
        String(pt?.sewingSAM || 20.0),
        String(pt?.finishingMinutesPerGarment || 4.0),
        String(pt?.totalManufacturingMinutes || 27.0),
        String(cost?.internalLaborRatePerMinute || 280),
        String(cost?.internalLaborCost || 7560),
        String(cost?.totalInternalCost || g.costEstimate),
        String(cost?.maquilaCuttingRate || 2000),
        String(cost?.maquilaSewingRate || 12000),
        String(cost?.maquilaFinishingRate || 2500),
        String(cost?.totalMaquilaCost || g.costEstimate * 1.15),
        '',
        '',
        '',
        '',
        '',
        '',
        notes,
      ]);
    } else {
      g.bom.forEach((item) => {
        const mat = rawMaterials.find((m) => m.id === item.rawMaterialId);
        const itemCost = item.quantityPerGarment * (1 + item.wastePercent / 100) * (mat?.unitCost || 0);

        rows.push([
          g.sku,
          g.name,
          g.category,
          String(g.targetSales),
          String(g.retailPrice),
          String(pt?.cuttingMinutesPerGarment || 3.0),
          String(pt?.sewingSAM || 20.0),
          String(pt?.finishingMinutesPerGarment || 4.0),
          String(pt?.totalManufacturingMinutes || 27.0),
          String(cost?.internalLaborRatePerMinute || 280),
          String(cost?.internalLaborCost || 7560),
          String(cost?.totalInternalCost || g.costEstimate),
          String(cost?.maquilaCuttingRate || 2000),
          String(cost?.maquilaSewingRate || 12000),
          String(cost?.maquilaFinishingRate || 2500),
          String(cost?.totalMaquilaCost || g.costEstimate * 1.15),
          mat?.sku || item.rawMaterialId,
          item.rawMaterialName,
          String(item.quantityPerGarment),
          item.unit,
          String(item.wastePercent),
          String(Math.round(itemCost)),
          notes,
        ]);
      });
    }
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `base_datos_fichas_tecnicas_textiliq_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Find property in row with fuzzy matching
function getRowValue(row: any, candidates: string[]): any {
  const keys = Object.keys(row);
  for (const candidate of candidates) {
    const normCand = normalizeKey(candidate);
    const matchedKey = keys.find((k) => normalizeKey(k) === normCand || normalizeKey(k).includes(normCand));
    if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null && row[matchedKey] !== '') {
      return row[matchedKey];
    }
  }
  return undefined;
}

// Parse Sales CSV
export function parseSalesCSV(fileContent: string): CSVParseResult<SalesRecord> {
  const parsed = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: true,
  });

  const records: SalesRecord[] = [];
  const errors: string[] = [];

  parsed.data.forEach((row: any, index: number) => {
    try {
      const date = getRowValue(row, ['Fecha', 'Date', 'fechaventa']) || new Date().toISOString().split('T')[0];
      const garmentSku = getRowValue(row, ['SKU_Prenda', 'SKU', 'Codigo', 'Referencia', 'sku_prenda', 'skuprenda']);
      const garmentName = getRowValue(row, ['Nombre_Prenda', 'Producto', 'Prenda', 'Descripcion', 'nombre']) || garmentSku;
      const unitsSold = Number(getRowValue(row, ['Unidades_Vendidas', 'Cantidad', 'Unidades', 'Ventas', 'qty']) || 0);
      const channel = getRowValue(row, ['Canal', 'Channel', 'CanalVenta', 'Cliente']) || 'Canal General';
      const revenue = Number(
        getRowValue(row, ['Ingreso_Total_COP', 'Ingreso_Total_USD', 'Total_COP', 'Total', 'Ingresos', 'VentaTotal']) ||
          unitsSold * 150000
      );

      if (garmentSku && unitsSold > 0) {
        records.push({
          id: `CSV-SAL-${Date.now()}-${index}`,
          date: String(date).trim(),
          garmentSku: String(garmentSku).trim(),
          garmentName: String(garmentName).trim(),
          unitsSold,
          channel: String(channel).trim(),
          revenue,
        });
      } else if (!garmentSku) {
        errors.push(`Fila ${index + 2}: Falta la columna SKU_Prenda`);
      }
    } catch (err: any) {
      errors.push(`Fila ${index + 2}: ${err?.message || 'Error de formato'}`);
    }
  });

  return {
    data: records,
    errors,
    totalRows: parsed.data.length,
  };
}

// Parse Raw Materials Inventory CSV
export function parseRawMaterialsCSV(fileContent: string): CSVParseResult<RawMaterial> {
  const parsed = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: true,
  });

  const materials: RawMaterial[] = [];
  const errors: string[] = [];

  parsed.data.forEach((row: any, index: number) => {
    try {
      const rawSku = getRowValue(row, ['SKU_Material', 'SKU', 'Codigo', 'Material_SKU', 'skumaterial', 'referencia']);
      if (!rawSku) {
        errors.push(`Fila ${index + 2}: Falta SKU_Material`);
        return;
      }
      const sku = String(rawSku).trim();
      const name = String(getRowValue(row, ['Nombre_Material', 'Nombre', 'Descripcion', 'Material', 'Insumo']) || sku).trim();

      const catRaw = String(getRowValue(row, ['Categoria', 'Category', 'Tipo', 'Rubro']) || 'Tela').trim();
      let category: MaterialCategory = 'Tela';
      if (
        catRaw.toLowerCase().includes('av') ||
        catRaw.toLowerCase().includes('fornit') ||
        catRaw.toLowerCase().includes('boton') ||
        catRaw.toLowerCase().includes('crem')
      ) {
        category = 'Avío / Fornitura';
      } else if (catRaw.toLowerCase().includes('hil') || catRaw.toLowerCase().includes('yarn')) {
        category = 'Hilo';
      } else if (catRaw.toLowerCase().includes('entre') || catRaw.toLowerCase().includes('fusion')) {
        category = 'Entretela';
      } else if (catRaw.toLowerCase().includes('emp') || catRaw.toLowerCase().includes('etiq') || catRaw.toLowerCase().includes('bolsa')) {
        category = 'Empaque / Etiqueta';
      }

      const unitRaw = String(getRowValue(row, ['Unidad_Medida', 'Unidad', 'Unit', 'Medida']) || 'm').trim();
      let unit: MaterialUnit = 'm';
      if (['kg', 'kilos', 'kilogramos'].includes(unitRaw.toLowerCase())) unit = 'kg';
      else if (['unidades', 'und', 'u', 'piezas', 'pza', 'pcs'].includes(unitRaw.toLowerCase())) unit = 'unidades';
      else if (['yardas', 'yd', 'yds'].includes(unitRaw.toLowerCase())) unit = 'yardas';
      else if (['conos', 'cono'].includes(unitRaw.toLowerCase())) unit = 'conos';
      else if (['gruesas', 'gr'].includes(unitRaw.toLowerCase())) unit = 'gruesas';
      else if (['docenas', 'doc'].includes(unitRaw.toLowerCase())) unit = 'docenas';

      const currentStock = Number(getRowValue(row, ['Stock_Actual', 'Stock', 'Inventario', 'Existencias', 'Disponible']) || 0);
      const inTransitStock = Number(getRowValue(row, ['En_Transito', 'Transito', 'PorLlegar', 'TransitoStock', 'oc_abiertas']) || 0);
      const safetyStockDays = Number(getRowValue(row, ['Stock_Seguridad_Dias', 'Safety_Stock', 'SeguridadDias', 'DiasSeguridad']) || 15);
      const minOrderQuantity = Number(getRowValue(row, ['MOQ_Lote_Minimo', 'MOQ', 'LoteMinimo', 'PedidoMinimo']) || 1);
      const unitCost = Number(getRowValue(row, ['Costo_Unitario_COP', 'Costo_Unitario_USD', 'Costo_Unitario', 'Costo', 'PrecioUnitario', 'UnitCost']) || 1000);
      const supplierName = String(getRowValue(row, ['Proveedor', 'Supplier', 'Fabricante', 'Distribuidor']) || 'Proveedor General').trim();
      const leadTimeDays = Number(getRowValue(row, ['Lead_Time_Dias', 'LeadTime', 'TiempoEntrega', 'DiasEntrega']) || 15);

      materials.push({
        id: `MAT-${sku.toUpperCase()}`,
        sku,
        name,
        category,
        unit,
        currentStock,
        inTransitStock,
        safetyStockDays,
        minOrderQuantity: Math.max(1, minOrderQuantity),
        unitCost: Math.max(1, unitCost),
        supplierName,
        leadTimeDays: Math.max(1, leadTimeDays),
      });
    } catch (err: any) {
      errors.push(`Fila ${index + 2}: ${err?.message || 'Error de datos'}`);
    }
  });

  return {
    data: materials,
    errors,
    totalRows: parsed.data.length,
  };
}

// Parse BOM (Fichas Técnicas) CSV
export interface BOMParseResult {
  garments: Garment[];
  discoveredMaterials: RawMaterial[];
  errors: string[];
  totalRows: number;
}

export function parseBOMCSV(
  fileContent: string,
  existingMaterials: RawMaterial[]
): BOMParseResult {
  const parsed = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: true,
  });

  const garmentsMap = new Map<string, Garment>();
  const discoveredMaterialsMap = new Map<string, RawMaterial>();
  const errors: string[] = [];

  // Index existing materials by uppercase SKU and by ID
  const materialBySku = new Map<string, RawMaterial>();
  existingMaterials.forEach((m) => {
    materialBySku.set(m.sku.toUpperCase(), m);
    materialBySku.set(m.id.toUpperCase(), m);
  });

  parsed.data.forEach((row: any, index: number) => {
    try {
      const rawGarmentSku = getRowValue(row, ['SKU_Prenda', 'Garment_SKU', 'SKU', 'Prenda_SKU', 'Referencia']);
      if (!rawGarmentSku) {
        errors.push(`Fila ${index + 2}: Falta SKU_Prenda`);
        return;
      }

      const garmentSku = String(rawGarmentSku).trim();
      const garmentName = String(
        getRowValue(row, ['Nombre_Prenda', 'Garment_Name', 'Prenda', 'Descripcion_Prenda', 'Nombre']) || garmentSku
      ).trim();
      const category = String(getRowValue(row, ['Categoria_Prenda', 'Category', 'Coleccion', 'TipoPrenda']) || 'Confección').trim();
      const targetSales = Number(getRowValue(row, ['Meta_Ventas_Ciclo', 'Target', 'MetaVentas', 'UnidadesMeta', 'Meta']) || 1000);
      const retailPrice = Number(getRowValue(row, ['PVP_COP', 'Precio_Venta_COP', 'RetailPrice', 'PVP', 'Precio']) || 150000);

      // Production Times
      const cuttingMinutes = Number(getRowValue(row, ['Tiempo_Corte_Min', 'CorteMin', 'TiempoCorte']) || 3.5);
      const sewingSAM = Number(getRowValue(row, ['SAM_Confeccion_Min', 'SAM', 'ConfeccionSAM', 'MinutosConfeccion']) || 20.0);
      const finishingMinutes = Number(getRowValue(row, ['Tiempo_Acabados_Min', 'AcabadosMin', 'TiempoTerminacion']) || 4.0);
      const totalMfgMinutes = cuttingMinutes + sewingSAM + finishingMinutes;

      // Costing Rates
      const internalLaborRate = Number(getRowValue(row, ['Tarifa_Minuto_Interno_COP', 'TarifaInternaMin', 'CostoMinutoInterno']) || 280);
      const internalOverheadRate = Number(getRowValue(row, ['Tarifa_CIF_Minuto_COP', 'CIFMinuto']) || 95);
      const maquilaCuttingRate = Number(getRowValue(row, ['Tarifa_Maquila_Corte_COP', 'MaquilaCorte']) || 2200);
      const maquilaSewingRate = Number(getRowValue(row, ['Tarifa_Maquila_Confeccion_COP', 'MaquilaConfeccion']) || 12000);
      const maquilaFinishingRate = Number(getRowValue(row, ['Tarifa_Maquila_Acabados_COP', 'MaquilaAcabados']) || 2500);
      const maquilaLogisticsRate = Number(getRowValue(row, ['Fletes_Maquila_COP', 'LogisticaMaquila']) || 900);
      const notes = String(getRowValue(row, ['Notas_Ficha_Tecnica', 'Notas', 'Observaciones', 'TechPackNotes']) || '');

      const rawMatSku = getRowValue(row, ['SKU_Materia_Prima', 'Material_SKU', 'SKU_Insumo', 'Insumo_SKU', 'Material']);
      const matSku = rawMatSku ? String(rawMatSku).trim() : '';
      const matName = String(
        getRowValue(row, ['Nombre_Materia_Prima', 'Nombre_Material', 'Insumo_Nombre', 'Descripcion_Material']) || matSku
      ).trim();
      const consumption = Number(getRowValue(row, ['Consumo_Por_Prenda', 'Consumo', 'Cantidad', 'ConsumoUnitario']) || 0);

      const unitRaw = String(getRowValue(row, ['Unidad_Medida', 'Unidad', 'Unit', 'Medida']) || 'm').trim();
      let unit: MaterialUnit = 'm';
      if (['kg', 'kilos'].includes(unitRaw.toLowerCase())) unit = 'kg';
      else if (['unidades', 'und', 'u', 'piezas', 'pza'].includes(unitRaw.toLowerCase())) unit = 'unidades';
      else if (['yardas', 'yd'].includes(unitRaw.toLowerCase())) unit = 'yardas';
      else if (['conos', 'cono'].includes(unitRaw.toLowerCase())) unit = 'conos';

      const wastePercent = Number(getRowValue(row, ['Merma_Corte_Porcentaje', 'Merma', 'Scrap', 'Desperdicio']) || 5);

      // Find matching material or register as newly discovered
      let matchedMat = materialBySku.get(matSku.toUpperCase());
      const materialId = `MAT-${matSku.toUpperCase()}`;

      if (!matchedMat && matSku) {
        let cat: MaterialCategory = 'Tela';
        if (matSku.startsWith('AVI-') || matName.toLowerCase().includes('bot') || matName.toLowerCase().includes('crem')) {
          cat = 'Avío / Fornitura';
        } else if (matSku.startsWith('HIL-') || matName.toLowerCase().includes('hil')) {
          cat = 'Hilo';
        } else if (matSku.startsWith('ENT-') || matName.toLowerCase().includes('entre')) {
          cat = 'Entretela';
        } else if (matSku.startsWith('EMP-') || matName.toLowerCase().includes('etiq') || matName.toLowerCase().includes('bolsa')) {
          cat = 'Empaque / Etiqueta';
        }

        const autoCreatedMat: RawMaterial = {
          id: materialId,
          sku: matSku,
          name: matName || matSku,
          category: cat,
          unit,
          currentStock: 0,
          inTransitStock: 0,
          safetyStockDays: 15,
          minOrderQuantity: 10,
          unitCost: 10000,
          supplierName: 'Proveedor Pendiente',
          leadTimeDays: 15,
        };
        discoveredMaterialsMap.set(matSku.toUpperCase(), autoCreatedMat);
        materialBySku.set(matSku.toUpperCase(), autoCreatedMat);
        matchedMat = autoCreatedMat;
      }

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
        const internalOverheadCost = totalMfgMinutes * internalOverheadRate;

        const prodCosting: ProductionCosting = {
          rawMaterialsCost: 0, // Will be computed from BOM
          internalLaborRatePerMinute: internalLaborRate,
          internalOverheadRatePerMinute: internalOverheadRate,
          internalLaborCost,
          internalOverheadCost,
          totalInternalCost: internalLaborCost + internalOverheadCost,
          maquilaCuttingRate,
          maquilaSewingRate,
          maquilaFinishingRate,
          maquilaLogisticsCost: maquilaLogisticsRate,
          totalMaquilaCost: maquilaCuttingRate + maquilaSewingRate + maquilaFinishingRate + maquilaLogisticsRate,
          recommendedSellingPrice: retailPrice,
          internalProfitMarginPercent: 65,
          maquilaProfitMarginPercent: 60,
        };

        garment = {
          id: `GAR-${garmentSku.toUpperCase()}`,
          sku: garmentSku,
          name: garmentName,
          category,
          targetSales: Math.max(10, targetSales),
          historicalMonthlyAverage: Math.round(Math.max(10, targetSales) / 3),
          retailPrice,
          costEstimate: Math.round(internalLaborCost + internalOverheadCost + 30000),
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
    } catch (err: any) {
      errors.push(`Fila ${index + 2}: ${err?.message || 'Error de datos'}`);
    }
  });

  // Re-compute rawMaterialsCost for all garments parsed
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

  return {
    garments: Array.from(garmentsMap.values()),
    discoveredMaterials: Array.from(discoveredMaterialsMap.values()),
    errors,
    totalRows: parsed.data.length,
  };
}
