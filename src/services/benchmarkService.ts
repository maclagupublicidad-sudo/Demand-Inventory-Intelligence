import { CompanyTenant, CompanyComparativeMetrics } from '../types';

/**
 * Calculates standardized textile KPIs and comparative benchmark metrics
 * for a single company tenant based on its actual BOMs, inventory, OPs, and cycle data.
 */
export function computeCompanyComparativeMetrics(company: CompanyTenant): CompanyComparativeMetrics {
  const garments = company.garments || [];
  const rawMaterials = company.rawMaterials || [];
  const productionOrders = company.productionOrders || [];
  const purchaseOrders = company.purchaseOrders || [];

  // Total Stock Value (COP)
  const totalStockValueCOP = rawMaterials.reduce(
    (sum, m) => sum + (m.currentStock || 0) * (m.unitCost || 0),
    0
  );

  // Average Profit Margin (%)
  let totalMargin = 0;
  let marginCount = 0;
  let totalSewingSAM = 0;
  let samCount = 0;
  let totalCycleDays = 0;
  let cycleCount = 0;
  let totalSellingPrice = 0;
  let totalCostEstimate = 0;
  let totalTargetUnits = 0;
  let totalRevenueProjected = 0;

  garments.forEach((g) => {
    if (g.retailPrice > 0) {
      totalSellingPrice += g.retailPrice;
      totalCostEstimate += g.costEstimate || 0;
      const margin =
        g.costing?.internalProfitMarginPercent ||
        ((g.retailPrice - (g.costEstimate || 0)) / g.retailPrice) * 100;
      totalMargin += margin;
      marginCount++;
    }

    if (g.productionTimes?.sewingSAM) {
      totalSewingSAM += g.productionTimes.sewingSAM;
      samCount++;
    }

    if (g.productionTimes?.totalCycleDays) {
      totalCycleDays += g.productionTimes.totalCycleDays;
      cycleCount++;
    }

    const targets = g.targetSales || 0;
    totalTargetUnits += targets;
    totalRevenueProjected += targets * (g.retailPrice || 0);
  });

  const averageProfitMarginPercent = marginCount > 0 ? totalMargin / marginCount : 0;
  const averageSewingSAMMinutes = samCount > 0 ? totalSewingSAM / samCount : 0;
  const averageProductionCycleDays = cycleCount > 0 ? totalCycleDays / cycleCount : 0;
  const averageSellingPrice = garments.length > 0 ? totalSellingPrice / garments.length : 0;
  const estimatedManufacturingCostAverage =
    garments.length > 0 ? totalCostEstimate / garments.length : 0;

  // Theoretical Scrap Average (from company default and BOM)
  let bomScrapSum = 0;
  let bomScrapCount = 0;
  garments.forEach((g) => {
    (g.bom || []).forEach((b) => {
      bomScrapSum += b.wastePercent || 0;
      bomScrapCount++;
    });
  });
  const averageTheoreticalScrapPercent =
    bomScrapCount > 0
      ? bomScrapSum / bomScrapCount
      : company.cycleConfig?.defaultScrapRatePercent || 5.0;

  // Actual Scrap Average (from OPs scrap logs)
  let actualScrapSum = 0;
  let actualScrapCount = 0;
  productionOrders.forEach((op) => {
    (op.scrapLogs || []).forEach((scr) => {
      if (scr.actualScrapPercent > 0) {
        actualScrapSum += scr.actualScrapPercent;
        actualScrapCount++;
      }
    });
  });

  const averageActualScrapPercent =
    actualScrapCount > 0
      ? actualScrapSum / actualScrapCount
      : averageTheoreticalScrapPercent * 1.04; // Baseline estimated slight variance

  // Scrap Efficiency Score (Higher is better, 100% when actual <= theoretical)
  const scrapVariance = averageActualScrapPercent - averageTheoreticalScrapPercent;
  const scrapEfficiencyScore = Math.max(
    50,
    Math.min(100, 100 - scrapVariance * 8)
  );

  // Supplier Lead Time Average
  let totalLeadDays = 0;
  rawMaterials.forEach((m) => {
    totalLeadDays += m.leadTimeDays || 14;
  });
  const averageSupplierLeadTimeDays =
    rawMaterials.length > 0 ? totalLeadDays / rawMaterials.length : 14;

  // Active Orders Count & On-Time Delivery Rate
  const activeOrdersCount = productionOrders.filter(
    (op) => op.status !== 'Completada' && op.status !== 'Detenida'
  ).length;

  const completedOps = productionOrders.filter((op) => op.status === 'Completada');
  const onTimeDeliveryRatePercent =
    completedOps.length > 0
      ? Math.round(
          (completedOps.filter((op) => {
            if (!op.actualCompletionDate) return true;
            return new Date(op.actualCompletionDate) <= new Date(op.targetCompletionDate);
          }).length /
            completedOps.length) *
            100
        )
      : 92; // Benchmark default

  return {
    companyId: company.id,
    companyName: company.name,
    nit: company.nit,
    specialty: company.specialty,
    city: company.city,
    brandColor: company.brandColor || '#3A5A40',
    totalGarments: garments.length,
    totalRawMaterials: rawMaterials.length,
    totalStockValueCOP,
    averageProfitMarginPercent: Number(averageProfitMarginPercent.toFixed(1)),
    averageTheoreticalScrapPercent: Number(averageTheoreticalScrapPercent.toFixed(1)),
    averageActualScrapPercent: Number(averageActualScrapPercent.toFixed(1)),
    scrapEfficiencyScore: Number(scrapEfficiencyScore.toFixed(0)),
    averageSewingSAMMinutes: Number(averageSewingSAMMinutes.toFixed(1)),
    averageProductionCycleDays: Number(averageProductionCycleDays.toFixed(1)),
    averageSupplierLeadTimeDays: Number(averageSupplierLeadTimeDays.toFixed(1)),
    activeOrdersCount,
    onTimeDeliveryRatePercent,
    totalProjectedDemandUnits: totalTargetUnits,
    totalRevenueProjectedCOP: totalRevenueProjected,
    estimatedManufacturingCostAverage: Number(estimatedManufacturingCostAverage.toFixed(0)),
    averageSellingPrice: Number(averageSellingPrice.toFixed(0)),
  };
}

/**
 * Generates an executive textile benchmark comparison CSV file
 */
export function exportCompaniesBenchmarkCSV(companies: CompanyTenant[]): string {
  const headers = [
    'Empresa / Razon Social',
    'NIT',
    'Especialidad Textil',
    'Sede / Ciudad',
    'Prendas Catalogo',
    'Insumos Registrados',
    'Valor Inventario Bodega (COP)',
    'Margen Bruto Promedio (%)',
    'Merma Teorica (%)',
    'Merma Real Medida (%)',
    'Score Eficiencia Corte (%)',
    'SAM Promedio Confeccion (min)',
    'Ciclo Promedio Fabricacion (dias)',
    'Lead Time Promedio Proveedores (dias)',
    'Cumplimiento OTD / Entregas (%)',
    'Unidades Proyectadas Campana',
    'Venta Proyectada (COP)',
  ];

  const rows = companies.map((c) => {
    const m = computeCompanyComparativeMetrics(c);
    return [
      `"${m.companyName.replace(/"/g, '""')}"`,
      `"${m.nit}"`,
      `"${m.specialty}"`,
      `"${m.city}"`,
      m.totalGarments,
      m.totalRawMaterials,
      m.totalStockValueCOP,
      `${m.averageProfitMarginPercent}%`,
      `${m.averageTheoreticalScrapPercent}%`,
      `${m.averageActualScrapPercent}%`,
      `${m.scrapEfficiencyScore}%`,
      m.averageSewingSAMMinutes,
      m.averageProductionCycleDays,
      m.averageSupplierLeadTimeDays,
      `${m.onTimeDeliveryRatePercent}%`,
      m.totalProjectedDemandUnits,
      m.totalRevenueProjectedCOP,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
