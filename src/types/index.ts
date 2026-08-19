export type MaterialCategory = 'Tela' | 'Avío / Fornitura' | 'Hilo' | 'Empaque / Etiqueta' | 'Entretela';

export type MaterialUnit = 'm' | 'kg' | 'unidades' | 'yardas' | 'conos' | 'gruesas' | 'docenas';

export interface RawMaterial {
  id: string;
  sku: string;
  name: string;
  category: MaterialCategory;
  unit: MaterialUnit;
  currentStock: number;
  inTransitStock: number;
  safetyStockDays: number;
  minOrderQuantity: number; // MOQ
  unitCost: number; // COP/unit
  supplierName: string;
  leadTimeDays: number;
  description?: string;
  color?: string;
  widthMeters?: number; // Para telas (ej. 1.50m)
  weightGsm?: number; // Para telas gramos/m2
}

export interface BOMItem {
  rawMaterialId: string;
  rawMaterialName: string;
  category: MaterialCategory;
  quantityPerGarment: number; // Consumo unitario
  unit: MaterialUnit;
  wastePercent: number; // Merma de corte específica para este componente (%)
}

export interface ProductionTimes {
  cuttingMinutesPerGarment: number; // Minutos de corte por prenda
  sewingSAM: number; // SAM (Standard Allowed Minutes) de ensamble / costura
  finishingMinutesPerGarment: number; // Minutos de ojalado, botón, planchado y empaque
  totalManufacturingMinutes: number; // Total minutos mano de obra (Corte + Confección + Acabados)
  standardBatchSize: number; // Tamaño de lote estándar (unidades)
  totalCycleDays: number; // Días promedio de paso de corte a bodega
}

export interface ProductionOperation {
  id: string;
  stepNumber: number;
  operationName: string; // ej: "Fusionar cuellos y puños", "Pegar bolsillos parche", "Cerrar costados"
  department: 'Corte' | 'Preparación' | 'Ensamble' | 'Terminación' | 'Empaque';
  machinery: string; // ej: "Fusionadora", "Plana 1 Aguja", "Overlock 4 hilos", "Cerradora de Codo", "Ojaladora"
  standardMinutes: number; // SAM de la operación
  criticalNotes?: string; // Observaciones técnicas o de calidad
}

export interface QualityCheckpoint {
  id: string;
  operationName: string;
  potentialDefect: string; // ej: "Descarrilamiento de pespunte", "Descalce de líneas", "Revirado de tela"
  preventionInstruction: string; // ej: "Utilizar guía 1/16, revisar tensión de hilo inferior"
  toleranceMetric: string; // ej: "+/- 1.5mm de margen", "10-12 puntadas por pulgada (SPI)"
  severity: 'Alta' | 'Media' | 'Baja';
}

export interface ProductionCosting {
  rawMaterialsCost: number; // Costo total telas + avíos (COP)
  internalLaborRatePerMinute: number; // Tarifa minuto planta interna (COP/min, ej: 280 COP/min)
  internalOverheadRatePerMinute: number; // Costos indirectos CIF (COP/min, ej: 95 COP/min)
  internalLaborCost: number; // Total MOD interno (SAM total * tarifa)
  internalOverheadCost: number; // Total CIF interno
  totalInternalCost: number; // Costo unitario total taller propio (Telas + MOD + CIF)

  maquilaCuttingRate: number; // Tarifa de corte satélite (COP/u)
  maquilaSewingRate: number; // Tarifa de confección satélite (COP/u)
  maquilaFinishingRate: number; // Tarifa de plancha/acabados satélite (COP/u)
  maquilaLogisticsCost: number; // Fletes y empaque satélite (COP/u)
  totalMaquilaCost: number; // Costo unitario total maquila externa

  recommendedSellingPrice: number; // Precio de venta recomendado (COP)
  internalProfitMarginPercent: number; // Margen de ganancia en producción interna (%)
  maquilaProfitMarginPercent: number; // Margen de ganancia en producción maquila (%)
}

export interface Garment {
  id: string;
  sku: string;
  name: string;
  category: string; // Camisería, Pantalonería, Tejido de Punto, Vestidos, Chaquetería
  targetSales: number; // Unidades meta para el ciclo actual
  historicalMonthlyAverage: number; // Promedio mensual histórico
  retailPrice: number;
  costEstimate: number; // Costo base (COP)
  finishedGoodsStock: number; // Stock de producto terminado
  productionWIP: number; // Prendas en proceso de confección
  bom: BOMItem[];
  // Información Desglosada de Producción y Ficha Técnica
  productionTimes?: ProductionTimes;
  operationsRouting?: ProductionOperation[];
  qualityCheckpoints?: QualityCheckpoint[];
  costing?: ProductionCosting;
  techPackNotes?: string;
}

export type CycleDuration = '1_month' | '3_months' | '6_months' | '12_months' | 'custom';

export interface ProductionCycleConfig {
  id: string;
  name: string;
  durationMonths: number;
  customDays?: number;
  startDate: string;
  season?: 'general' | 'primavera_verano' | 'otono_invierno' | 'navidad_findeano' | 'escolar'; // Temporada comercial activa
  defaultScrapRatePercent: number; // Merma global de corte y confección (ej: 5%)
  safetyStockDaysDefault: number; // Días de stock de seguridad (ej: 15 días)
  growthRatePercent: number; // Crecimiento proyectado vs histórico (%)
  demandMode: 'target_driven' | 'history_driven' | 'custom_mix';
  scenarioMultiplier: number; // Simulador What-If (ej: 1.0 = normal, 1.2 = +20%)
  leadTimeBufferDays: number;
}

export type MRPStatus = 'CRITICO' | 'REORDEN' | 'OPTIMO' | 'SOBRESTOCK';

export interface MRPResultItem {
  rawMaterial: RawMaterial;
  grossRequirement: number; // Demanda total teórica
  effectiveGrossRequirement: number; // Requerimiento considerando merma de corte
  currentStock: number;
  inTransitStock: number;
  availableStock: number; // Stock + Tránsito
  safetyStockRequired: number; // Stock de seguridad requerido
  netRequirement: number; // Déficit real
  suggestedPurchaseQty: number; // Ajustado a MOQ (Lote mínimo)
  totalEstimatedCost: number;
  daysOfCoverage: number; // Días de cobertura con el stock disponible
  status: MRPStatus;
  usedInGarments: {
    garmentName: string;
    garmentSku: string;
    consumption: number;
    demand: number;
  }[];
}

export interface SalesRecord {
  id: string;
  date: string;
  garmentSku: string;
  garmentName: string;
  unitsSold: number;
  channel: string;
  revenue: number;
}

export interface ProductionRecord {
  id: string;
  orderNumber: string;
  garmentSku: string;
  garmentName: string;
  unitsPlanned: number;
  unitsFinished: number;
  status: 'Programada' | 'En Corte' | 'En Confección' | 'Terminada';
  startDate: string;
  estimatedEndDate: string;
}

export interface PurchaseOrderItem {
  rawMaterialId: string;
  rawMaterialSku: string;
  rawMaterialName: string;
  category: MaterialCategory;
  quantity: number;
  unit: MaterialUnit;
  unitCost: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: 'Borrador' | 'Emitida' | 'En Tránsito' | 'Recibida';
  notes?: string;
}

export interface AIAnalysisRecommendation {
  title: string;
  description: string;
  priority: 'Alta' | 'Media' | 'Baja';
  category: 'Telas' | 'Avíos' | 'Corte & Costos' | 'Planificación';
}

export interface AIAnalysisResponse {
  summary: string;
  riskLevel: 'ALTO' | 'MEDIO' | 'BAJO';
  bottleneckSummary?: string;
  recommendations: AIAnalysisRecommendation[];
  supplierNegotiationTips?: string;
  scrapOptimizationTip?: string;
  cashflowStrategy?: string;
  isFallback?: boolean;
}

export type PermissionKey =
  | 'view_dashboard'
  | 'view_mrp'
  | 'edit_mrp_stock'
  | 'manage_purchase_orders' // Crear, emitir, cambiar estado y autorizar OC
  | 'view_tech_packs' // Ver BOM, tiempos de ciclo, operaciones y calidad
  | 'edit_tech_packs' // Modificar consumos BOM, mermas, rutas SAM y checkpoints
  | 'view_demand_forecast' // Ver metas de ventas e histórico
  | 'edit_sales_targets' // Modificar unidades meta y proyecciones
  | 'manage_production_cycles' // Modificar horizonte, temporadas, factores de crecimiento
  | 'view_costing' // Ver comparador Taller vs Maquila
  | 'edit_costing_rates' // Modificar tarifas MOD, CIF y satélites
  | 'manage_users' // Crear usuarios, cambiar claves y asignar permisos
  | 'import_export_csv'; // Cargar o descargar bases de datos CSV

export type UserRole =
  | 'Administrador'
  | 'Comercial'
  | 'Ingenieria_BOM'
  | 'Compras_MRP'
  | 'Produccion_Taller'
  | 'Calidad_QC'
  | 'Personalizado';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  username: string;
  password?: string;
  role: UserRole;
  department: string;
  position: string;
  avatarColor?: string;
  permissions: PermissionKey[];
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}
