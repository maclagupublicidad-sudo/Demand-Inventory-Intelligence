export type MaterialCategory =
  | 'Tela'
  | 'Avío / Fornitura'
  | 'Hilo'
  | 'Elástico'
  | 'Sesgo / Cinta'
  | 'Estampación / Tinta'
  | 'Empaque / Etiqueta'
  | 'Entretela'
  | 'Botón / Broche'
  | 'Cremallera'
  | 'Otro';

export type MaterialUnit = 'm' | 'kg' | 'unidades' | 'yardas' | 'conos' | 'gruesas' | 'docenas' | 'rollos' | 'paquetes' | 'cm' | 'cajas' | 'millares';

export interface RawMaterial {
  id: string;
  sku: string;
  name: string;
  category: MaterialCategory;
  unit: MaterialUnit; // Unidad de compra principal (ej: 'kg', 'rollos', 'm', 'conos')
  currentStock: number;
  inTransitStock: number;
  safetyStockDays: number;
  minOrderQuantity: number; // MOQ
  unitCost: number; // COP/unit (Precio por unidad de compra)
  supplierName: string;
  leadTimeDays: number;
  description?: string;
  color?: string;
  widthMeters?: number; // Para telas (ej. 1.50m)
  weightGsm?: number; // Para telas gramos/m2
  isActive?: boolean; // Estado activo / inactivo
  // =========================================================
  // CONVERSIÓN Y RENDIMIENTO DE MATERIA PRIMA (COMPRA vs USO)
  // =========================================================
  purchaseUnit?: MaterialUnit; // Unidad en que se compra (ej: 'kg', 'rollos', 'conos', 'paquetes')
  usageUnit?: MaterialUnit; // Unidad en que se consume en la prenda (ej: 'm', 'cm', 'unidades', 'conos')
  yieldFactor?: number; // Factor de rendimiento: cuántas unidades de uso rinde 1 unidad de compra (ej: 1 kg tela = 2.50 m; 1 rollo = 100 m; 1 cono = 5000 m; 1 kg elástico = 35 m)
  yieldDescription?: string; // Explicación legible de la conversión (ej: "1 kg rinde 2.50 metros útiles")
  defaultWastePercent?: number; // Merma promedio del material (%)
}

export interface BOMItem {
  rawMaterialId: string;
  rawMaterialName: string;
  category: MaterialCategory;
  quantityPerGarment: number; // Consumo unitario en unidad de confección (ej: 1.35 metros de tela, 10 botones)
  unit: MaterialUnit;
  wastePercent: number; // Merma de corte específica para este componente (%)
  notes?: string; // Observaciones del insumo (ej: "Ubicación: Cuello y pechera")
  // Equivalencia calculada automática
  equivalentPurchaseQty?: number; // Consumo equivalente en unidad de compra (ej: 1.35 m / 2.50 = 0.54 kg)
  purchaseUnit?: MaterialUnit; // Unidad de compra relacionada
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
  operationName?: string;
  stage?: 'Corte' | 'Costura' | 'Plancha' | 'Empaque Final' | string;
  parameter?: string;
  tolerance?: string;
  potentialDefect: string; // ej: "Descarrilamiento de pespunte", "Descalce de líneas", "Revirado de tela"
  preventionInstruction?: string; // ej: "Utilizar guía 1/16, revisar tensión de hilo inferior"
  toleranceMetric?: string; // ej: "+/- 1.5mm de margen", "10-12 puntadas por pulgada (SPI)"
  severity: 'Alta' | 'Media' | 'Baja' | 'Menor' | 'Mayor' | 'Crítico';
}

export type OperationRouting = ProductionOperation;
export type GarmentCosting = ProductionCosting;

export interface ProductionCosting {
  rawMaterialsCost?: number; // Costo total telas + avíos (COP)
  rawMaterialCost?: number;
  internalLaborRatePerMinute?: number; // Tarifa minuto planta interna (COP/min)
  laborCostPerMinute?: number;
  internalOverheadRatePerMinute?: number; // Costos indirectos CIF (COP/min)
  overheadCostPerMinute?: number;
  internalLaborCost?: number; // Total MOD interno
  directLaborCost?: number;
  internalOverheadCost?: number; // Total CIF interno
  overheadCost?: number;
  totalInternalCost: number; // Costo unitario total taller propio (Telas + MOD + CIF)

  maquilaCuttingRate?: number; // Tarifa de corte satélite (COP/u)
  maquilaSewingRate?: number; // Tarifa de confección satélite (COP/u)
  maquilaFinishingRate?: number; // Tarifa de plancha/acabados satélite (COP/u)
  maquilaLogisticsCost?: number; // Fletes y empaque satélite (COP/u)
  totalMaquilaCost?: number; // Costo unitario total maquila externa
  maquilaRates?: {
    cuttingCostPerUnit?: number;
    sewingCostPerUnit?: number;
    finishingCostPerUnit?: number;
    transportPerUnit?: number;
    totalMaquilaUnitCost?: number;
  };

  recommendedSellingPrice?: number; // Precio de venta recomendado (COP)
  internalProfitMarginPercent?: number; // Margen de ganancia en producción interna (%)
  maquilaProfitMarginPercent?: number; // Margen de ganancia en producción maquila (%)
  targetMarginPercent?: number;
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
  isActive?: boolean; // Estado activo / desactivado de la prenda
  description?: string; // Descripción comercial o técnica
  referenceCode?: string; // Código de colección o referencia
  targetMarginPercent?: number; // Margen de ganancia objetivo personalizado (%)
}

export type CycleDuration = '1_month' | '3_months' | '6_months' | '12_months' | 'custom';

export interface ProductionCycleConfig {
  id: string;
  name: string;
  durationMonths: number;
  customDays?: number;
  startDate: string;
  endDate?: string;
  season?: 'general' | 'inicio_ano_escolar' | 'dia_mujer' | 'dia_madre' | 'dia_padre' | 'amor_amistad' | 'fin_de_ano'; // Temporada comercial colombiana activa
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
  // Requerimientos en unidad de consumo / producción
  grossRequirement: number; // Demanda total teórica en unidad de uso (ej. metros)
  effectiveGrossRequirement: number; // Requerimiento considerando merma de corte en unidad de uso
  usageUnit: MaterialUnit;
  // Stock y conversión
  currentStock: number; // En unidad de compra (ej: 10 kg)
  currentStockInUsageUnit: number; // En unidad de uso (ej: 25.0 m)
  inTransitStock: number; // En unidad de compra
  inTransitStockInUsageUnit: number; // En unidad de uso
  availableStock: number; // Stock + Tránsito en unidad de compra
  availableStockInUsageUnit: number; // Stock + Tránsito en unidad de uso
  yieldFactor: number; // Rendimiento: 1 unidad compra = N unidades uso
  conversionFormula: string; // Explicación de la conversión
  // Necesidades y sugerencia de compra
  safetyStockRequired: number; // Stock de seguridad en unidad de compra
  safetyStockRequiredInUsageUnit: number; // Stock de seguridad en unidad de uso
  netRequirement: number; // Déficit en unidad de compra
  netRequirementInUsageUnit: number; // Déficit en unidad de uso
  suggestedPurchaseQty: number; // Cantidad a comprar ajustada a MOQ en unidad de compra (ej: kg o rollos)
  totalEstimatedCost: number; // Costo total en COP
  daysOfCoverage: number; // Días de cobertura
  status: MRPStatus;
  usedInGarments: {
    garmentName: string;
    garmentSku: string;
    consumption: number;
    unit: MaterialUnit;
    demand: number;
    totalUsage: number;
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

export type ProductionOrderStatus =
  | 'Programada'
  | 'En Corte'
  | 'En Confección'
  | 'En Terminación'
  | 'Control Calidad'
  | 'Completada'
  | 'Detenida';

export type ProductionStage =
  | 'Programación'
  | 'Corte'
  | 'Confección'
  | 'Lavandería / Acabados'
  | 'Calidad'
  | 'Empaque';

export interface ProductionStageLog {
  id: string;
  timestamp: string;
  stage: ProductionStage;
  unitsProcessed: number;
  unitsDefective?: number;
  operatorOrWorkshop: string;
  notes?: string;
  recordedBy: string;
}

export type ScrapVarianceReason =
  | 'Fallas en rollo / orillos'
  | 'Merma de trazo / tendido'
  | 'Reprocesos costura'
  | 'Descalce de patrones'
  | 'Consumo estándar exacto'
  | 'Ahorro optimizado en tizada'
  | 'Otro';

export interface MaterialScrapLog {
  id: string;
  rawMaterialId: string;
  rawMaterialSku: string;
  rawMaterialName: string;
  category: MaterialCategory;
  unit: MaterialUnit;
  unitsProduced: number;
  theoreticalConsumption: number; // Consumo teórico según BOM
  actualConsumption: number; // Consumo real medido en mesa/planta
  standardScrapPercent: number; // % merma teórica
  actualScrapPercent: number; // % merma real obtenida
  varianceQty: number; // actual - theoretical
  unitCostCOP: number;
  varianceCostCOP: number; // Desviación económica (+ sobrecosto / - ahorro)
  reason: ScrapVarianceReason;
  recordedAt: string;
  lotNumber?: string;
}

export interface ProductionOrder {
  id: string;
  orderNumber: string; // ej: OP-2026-001
  garmentId: string;
  garmentSku: string;
  garmentName: string;
  batchLotNumber: string; // ej: LOTE-CAM-001
  unitsTarget: number;
  unitsCut: number;
  unitsSewn: number;
  unitsFinished: number;
  unitsDefective: number; // Unidades defectuosas / segundas
  status: ProductionOrderStatus;
  assignedPlant: string; // ej: Taller Central, Satélite Bello, etc.
  startDate: string;
  targetCompletionDate: string;
  actualCompletionDate?: string;
  priority: 'Alta' | 'Normal' | 'Urgente';
  notes?: string;
  stageLogs: ProductionStageLog[];
  scrapLogs: MaterialScrapLog[];
}

export interface LiveBottleneckAlert {
  id: string;
  severity: 'Crítico' | 'Alerta' | 'Informativo';
  title: string;
  description: string;
  impactArea: 'Abastecimiento' | 'Corte' | 'Confección' | 'Calidad' | 'Financiero';
  relatedId?: string;
  recommendedAction: string;
  detectedAt: string;
}

export interface TimeSeriesDataPoint {
  dayIndex: number;
  date: string;
  dayLabel: string;
  projectedDemandCum: number;
  projectedProductionCum: number;
  actualProductionCum: number;
  fabricStockProjected: number;
  dailyBurnRate: number;
  activeBottlenecks: number;
}

export interface SupplierPerformanceMetric {
  supplierName: string;
  category: MaterialCategory;
  totalOrders: number;
  completedOrders: number;
  onTimeDeliveries: number;
  averageLeadTimeDays: number;
  promisedLeadTimeDays: number;
  leadTimeVarianceDays: number; // Prometido vs real
  otifScorePercent: number; // On-Time In-Full score %
  qualityCompliancePercent: number;
  status: 'Excelente' | 'Aceptable' | 'Riesgoso';
}

export interface ExecutionDashboardMetrics {
  totalActiveOPs: number;
  totalUnitsInPipeline: number;
  totalUnitsCompleted: number;
  overallYieldPercent: number; // Eficiencia de prendas de 1ra calidad
  averageActualScrapPercent: number;
  theoreticalScrapPercent: number;
  scrapCostVarianceCOP: number; // Sobrecosto neto de merma
  overallOTIFPercent: number;
  criticalBottlenecksCount: number;
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
  | 'view_production_execution' // Ver Ejecución en Planta, OPs y Analítica Temporal
  | 'manage_production_orders' // Crear OPs, registrar avances de corte/costura y mermas
  | 'view_costing' // Ver comparador Taller vs Maquila
  | 'edit_costing_rates' // Modificar tarifas MOD, CIF y satélites
  | 'manage_users' // Crear usuarios, cambiar claves y asignar permisos
  | 'import_export_csv' // Cargar o descargar bases de datos CSV
  | 'manage_companies' // Registrar y administrar empresas y sedes
  | 'view_company_benchmarks'; // Ver comparativos y benchmarking inter-empresas

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
  companyId?: string; // ID de la empresa asociada ('ALL' para Super Admin global)
  lastLogin?: string;
  createdAt: string;
}

export interface CompanyTenant {
  id: string;
  name: string; // Razón Social de la empresa
  nit: string; // NIT / RUT / Identificación Fiscal
  tradeName?: string; // Nombre de Marca / Comercial
  specialty: string; // Especialidad textil (Camisería, Denim, Ropa Deportiva, etc.)
  city: string; // Ciudad / Sede principal (Medellín, Bogotá, etc.)
  country: string; // País (ej: Colombia)
  currency: string; // Moneda base (COP, USD, MXN)
  brandColor?: string; // Color distintivo para badges
  description?: string;
  createdAt: string;
  updatedAt?: string;
  garments: Garment[];
  rawMaterials: RawMaterial[];
  salesRecords: SalesRecord[];
  cycleConfig: ProductionCycleConfig;
  purchaseOrders: PurchaseOrder[];
  productionOrders: ProductionOrder[];
  users?: AppUser[];
}

export interface CompanyComparativeMetrics {
  companyId: string;
  companyName: string;
  nit: string;
  specialty: string;
  city: string;
  brandColor: string;
  totalGarments: number;
  totalRawMaterials: number;
  totalStockValueCOP: number;
  averageProfitMarginPercent: number;
  averageTheoreticalScrapPercent: number;
  averageActualScrapPercent: number;
  scrapEfficiencyScore: number; // 0-100%
  averageSewingSAMMinutes: number;
  averageProductionCycleDays: number;
  averageSupplierLeadTimeDays: number;
  activeOrdersCount: number;
  onTimeDeliveryRatePercent: number;
  totalProjectedDemandUnits: number;
  totalRevenueProjectedCOP: number;
  estimatedManufacturingCostAverage: number;
  averageSellingPrice: number;
}

