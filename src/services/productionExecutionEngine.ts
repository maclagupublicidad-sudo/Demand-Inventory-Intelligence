import {
  Garment,
  RawMaterial,
  ProductionOrder,
  PurchaseOrder,
  ProductionCycleConfig,
  LiveBottleneckAlert,
  TimeSeriesDataPoint,
  SupplierPerformanceMetric,
  ExecutionDashboardMetrics,
  MaterialScrapLog,
} from '../types';

/**
 * Calculates live dashboard execution metrics from current system state
 */
export function calculateExecutionDashboardMetrics(
  productionOrders: ProductionOrder[],
  rawMaterials: RawMaterial[],
  purchaseOrders: PurchaseOrder[]
): ExecutionDashboardMetrics {
  const activeOrders = productionOrders.filter(
    (o) => o.status !== 'Completada' && o.status !== 'Detenida'
  );

  const totalActiveOPs = activeOrders.length;
  const totalUnitsInPipeline = activeOrders.reduce((sum, o) => sum + o.unitsTarget, 0);
  const totalUnitsCompleted = productionOrders.reduce((sum, o) => sum + o.unitsFinished, 0);
  const totalDefective = productionOrders.reduce((sum, o) => sum + o.unitsDefective, 0);

  const overallYieldPercent =
    totalUnitsCompleted > 0
      ? Math.max(0, Math.min(100, ((totalUnitsCompleted - totalDefective) / totalUnitsCompleted) * 100))
      : 100;

  // Aggregate Scrap Logs
  const allScrapLogs = productionOrders.flatMap((o) => o.scrapLogs || []);
  let totalTheoreticalScrapSum = 0;
  let totalActualScrapSum = 0;
  let totalVarianceCostCOP = 0;

  if (allScrapLogs.length > 0) {
    allScrapLogs.forEach((log) => {
      totalTheoreticalScrapSum += log.standardScrapPercent;
      totalActualScrapSum += log.actualScrapPercent;
      totalVarianceCostCOP += log.varianceCostCOP;
    });
  }

  const theoreticalScrapPercent =
    allScrapLogs.length > 0 ? totalTheoreticalScrapSum / allScrapLogs.length : 5.0;
  const averageActualScrapPercent =
    allScrapLogs.length > 0 ? totalActualScrapSum / allScrapLogs.length : 5.2;

  // Calculate Supplier OTIF
  const supplierMetrics = calculateSupplierPerformance(purchaseOrders, rawMaterials);
  const overallOTIFPercent =
    supplierMetrics.length > 0
      ? supplierMetrics.reduce((sum, s) => sum + s.otifScorePercent, 0) / supplierMetrics.length
      : 95;

  const bottlenecks = detectLiveBottlenecks(productionOrders, rawMaterials, purchaseOrders);
  const criticalBottlenecksCount = bottlenecks.filter((b) => b.severity === 'Crítico').length;

  return {
    totalActiveOPs,
    totalUnitsInPipeline,
    totalUnitsCompleted,
    overallYieldPercent,
    averageActualScrapPercent,
    theoreticalScrapPercent,
    scrapCostVarianceCOP: totalVarianceCostCOP,
    overallOTIFPercent,
    criticalBottlenecksCount,
  };
}

/**
 * Real-Time Bottleneck and Risk Detection Engine
 */
export function detectLiveBottlenecks(
  productionOrders: ProductionOrder[],
  rawMaterials: RawMaterial[],
  purchaseOrders: PurchaseOrder[]
): LiveBottleneckAlert[] {
  const alerts: LiveBottleneckAlert[] = [];
  const now = new Date();

  // 1. Check for Active OPs blocked by Material Shortage
  const activeOrders = productionOrders.filter(
    (o) => o.status === 'Programada' || o.status === 'En Corte' || o.status === 'En Confección'
  );

  activeOrders.forEach((op) => {
    // Check if scrap logs indicate severe overconsumption (> 3% excess)
    op.scrapLogs?.forEach((scrap) => {
      if (scrap.actualScrapPercent - scrap.standardScrapPercent > 3.0) {
        alerts.push({
          id: `scrap-${op.id}-${scrap.id}`,
          severity: 'Crítico',
          title: `Desviación Crítica de Merma en ${op.orderNumber}`,
          description: `El material ${scrap.rawMaterialName} registra ${scrap.actualScrapPercent.toFixed(1)}% de merma (estándar: ${scrap.standardScrapPercent.toFixed(1)}%). Causa: ${scrap.reason}. Sobrecosto: $${Math.abs(scrap.varianceCostCOP).toLocaleString('es-CO')} COP.`,
          impactArea: 'Corte',
          relatedId: op.id,
          recommendedAction: 'Revisar tizada de patrones, calibrar tensión de tendido o auditar calidad del rollo.',
          detectedAt: new Date().toISOString(),
        });
      }
    });

    // Check high defect rate (> 4% second quality)
    if (op.unitsFinished > 0 && (op.unitsDefective / (op.unitsFinished + op.unitsDefective)) * 100 > 4.0) {
      const defectRate = ((op.unitsDefective / (op.unitsFinished + op.unitsDefective)) * 100).toFixed(1);
      alerts.push({
        id: `qc-${op.id}`,
        severity: 'Alerta',
        title: `Alta Tasa de Segundas / Defectos en ${op.orderNumber}`,
        description: `La orden registra ${op.unitsDefective} prendas defectuosas (${defectRate}% del lote). Taller: ${op.assignedPlant}.`,
        impactArea: 'Calidad',
        relatedId: op.id,
        recommendedAction: 'Auditar puntos de control de costura y tolerancias de puntada.',
        detectedAt: new Date().toISOString(),
      });
    }
  });

  // 2. Check Overdue Purchase Orders
  purchaseOrders.forEach((po) => {
    if (po.status === 'Emitida' || po.status === 'En Tránsito') {
      const deliveryDate = new Date(po.expectedDeliveryDate);
      if (deliveryDate < now) {
        const daysLate = Math.ceil((now.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));
        alerts.push({
          id: `po-late-${po.id}`,
          severity: 'Crítico',
          title: `Orden de Compra con Retraso (${po.supplierName})`,
          description: `La OC por $${po.totalAmount.toLocaleString('es-CO')} COP tenía fecha pactada para ${po.expectedDeliveryDate} (${daysLate} días de retraso).`,
          impactArea: 'Abastecimiento',
          relatedId: po.id,
          recommendedAction: 'Contactar al proveedor inmediatamente para confirmar guía de despacho o flete express.',
          detectedAt: new Date().toISOString(),
        });
      }
    }
  });

  // 3. Check Critical Raw Material Stockouts (< 3 days coverage)
  rawMaterials.forEach((mat) => {
    if (mat.currentStock === 0 && mat.inTransitStock === 0) {
      alerts.push({
        id: `stockout-${mat.id}`,
        severity: 'Crítico',
        title: `Agotamiento Total de Inventario: ${mat.name}`,
        description: `El insumo ${mat.sku} (${mat.category}) se encuentra en 0 ${mat.unit}. Ningún lote en tránsito.`,
        impactArea: 'Abastecimiento',
        relatedId: mat.id,
        recommendedAction: `Generar de inmediato Orden de Compra por al menos el MOQ (${mat.minOrderQuantity} ${mat.unit}) a ${mat.supplierName}.`,
        detectedAt: new Date().toISOString(),
      });
    }
  });

  // Default informative alert if no critical issues found
  if (alerts.length === 0) {
    alerts.push({
      id: 'info-stable',
      severity: 'Informativo',
      title: 'Operación en Planta Estable',
      description: 'No se detectan cuellos de botella activos ni desabastecimientos inmediatos en las líneas de corte y confección.',
      impactArea: 'Confección',
      recommendedAction: 'Continuar con el monitoreo de ritmo diario y registro de eventos por lote.',
      detectedAt: new Date().toISOString(),
    });
  }

  return alerts;
}

/**
 * Generates Time-Series Simulation & Real-Time Projections
 */
export function generateTimeSeriesProjection(
  garments: Garment[],
  rawMaterials: RawMaterial[],
  productionOrders: ProductionOrder[],
  cycleConfig: ProductionCycleConfig,
  horizonDays: number = 60
): TimeSeriesDataPoint[] {
  const points: TimeSeriesDataPoint[] = [];
  const startDate = cycleConfig.startDate ? new Date(cycleConfig.startDate) : new Date();

  // Daily target demand rate
  const totalTargetUnits = garments.reduce((sum, g) => sum + g.targetSales, 0);
  const cycleDays = Math.max(30, (cycleConfig.durationMonths || 3) * 30);
  const dailyDemandRate = totalTargetUnits > 0 ? totalTargetUnits / cycleDays : 15;

  // Daily production planned rate
  const activeOPs = productionOrders.filter((o) => o.status !== 'Completada');
  const unitsInActiveOPs = activeOPs.reduce((sum, o) => sum + o.unitsTarget, 0);
  const dailyProductionPace = unitsInActiveOPs > 0 ? unitsInActiveOPs / 25 : dailyDemandRate * 1.05;

  // Total fabric stock currently
  const totalFabricMeters = rawMaterials
    .filter((m) => m.category === 'Tela')
    .reduce((sum, m) => sum + m.currentStock, 0);

  let cumDemand = 0;
  let cumPlannedProd = 0;
  let cumActualProd = productionOrders.reduce((sum, o) => sum + o.unitsFinished, 0);
  let fabricRemaining = totalFabricMeters;

  // Average fabric consumption per unit
  const avgFabricPerGarment = 1.45; // metros / prenda promedio

  for (let i = 0; i <= horizonDays; i += 3) {
    const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = currentDate.toISOString().split('T')[0];

    cumDemand = Math.round(i * dailyDemandRate);
    cumPlannedProd = Math.round(i * dailyProductionPace);

    // Simulate actual production ramp up with slight realistic variance
    if (i <= 15) {
      cumActualProd += Math.round(dailyProductionPace * 2.8);
    } else {
      cumActualProd += Math.round(dailyProductionPace * 3.0);
    }

    const intervalConsumption = dailyProductionPace * 3 * avgFabricPerGarment;
    fabricRemaining = Math.max(0, fabricRemaining - intervalConsumption);

    points.push({
      dayIndex: i,
      date: dateStr,
      dayLabel: `Día ${i}`,
      projectedDemandCum: cumDemand,
      projectedProductionCum: cumPlannedProd,
      actualProductionCum: cumActualProd,
      fabricStockProjected: Math.round(fabricRemaining),
      dailyBurnRate: Math.round(intervalConsumption / 3),
      activeBottlenecks: fabricRemaining < 200 ? 2 : 0,
    });
  }

  return points;
}

/**
 * Calculates Supplier Performance Matrix (OTIF, Lead Times, Variance)
 */
export function calculateSupplierPerformance(
  purchaseOrders: PurchaseOrder[],
  rawMaterials: RawMaterial[]
): SupplierPerformanceMetric[] {
  const supplierMap: Record<
    string,
    {
      category: string;
      totalOrders: number;
      completedOrders: number;
      onTimeDeliveries: number;
      leadTimes: number[];
      promisedLeadTimes: number[];
    }
  > = {};

  // Extract from raw materials master list
  rawMaterials.forEach((mat) => {
    if (!supplierMap[mat.supplierName]) {
      supplierMap[mat.supplierName] = {
        category: mat.category,
        totalOrders: 0,
        completedOrders: 0,
        onTimeDeliveries: 0,
        leadTimes: [],
        promisedLeadTimes: [mat.leadTimeDays],
      };
    }
  });

  // Extract from actual Purchase Orders
  purchaseOrders.forEach((po) => {
    if (!supplierMap[po.supplierName]) {
      supplierMap[po.supplierName] = {
        category: po.items[0]?.category || 'Tela',
        totalOrders: 0,
        completedOrders: 0,
        onTimeDeliveries: 0,
        leadTimes: [],
        promisedLeadTimes: [15],
      };
    }

    const s = supplierMap[po.supplierName];
    s.totalOrders += 1;

    if (po.status === 'Recibida') {
      s.completedOrders += 1;
      s.onTimeDeliveries += 1; // Assuming marked as received on time if completed
      s.leadTimes.push(14);
    } else if (po.status === 'En Tránsito') {
      s.leadTimes.push(16);
    }
  });

  return Object.entries(supplierMap).map(([name, data]) => {
    const avgPromised =
      data.promisedLeadTimes.length > 0
        ? data.promisedLeadTimes.reduce((a, b) => a + b, 0) / data.promisedLeadTimes.length
        : 15;
    const avgActual =
      data.leadTimes.length > 0
        ? data.leadTimes.reduce((a, b) => a + b, 0) / data.leadTimes.length
        : avgPromised + (name.includes('Import') ? 3 : 1);

    const otifScore =
      data.totalOrders > 0
        ? Math.round((data.onTimeDeliveries / data.totalOrders) * 100)
        : 95;

    const leadTimeVarianceDays = Math.round(avgActual - avgPromised);

    let status: 'Excelente' | 'Aceptable' | 'Riesgoso' = 'Excelente';
    if (otifScore < 85 || leadTimeVarianceDays > 4) {
      status = 'Riesgoso';
    } else if (otifScore < 92 || leadTimeVarianceDays > 1) {
      status = 'Aceptable';
    }

    return {
      supplierName: name,
      category: data.category as any,
      totalOrders: data.totalOrders || 1,
      completedOrders: data.completedOrders,
      onTimeDeliveries: data.onTimeDeliveries,
      averageLeadTimeDays: Math.round(avgActual),
      promisedLeadTimeDays: Math.round(avgPromised),
      leadTimeVarianceDays,
      otifScorePercent: otifScore,
      qualityCompliancePercent: status === 'Excelente' ? 98 : status === 'Aceptable' ? 92 : 84,
      status,
    };
  });
}
