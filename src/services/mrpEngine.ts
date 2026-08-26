import { Garment, RawMaterial, ProductionCycleConfig, MRPResultItem, MRPStatus } from '../types';
import { computeGarmentProjectedDemand } from '../utils/seasonality';

export interface MRPSummary {
  items: MRPResultItem[];
  totalInvestmentUSD: number;
  criticalItemsCount: number;
  reorderItemsCount: number;
  optimalItemsCount: number;
  overstockItemsCount: number;
  totalFabricsMetersNeeded: number;
  totalFabricsKgNeeded: number;
  totalTrimsUnitsNeeded: number;
  totalThreadConesNeeded: number;
  totalSafetyStockCostUSD: number;
  totalScrapCostUSD: number;
  categoryCostBreakdown: {
    category: string;
    totalCost: number;
    itemsCount: number;
    percentage: number;
  }[];
  totalGarmentsPlanned: number;
}

export function calculateMRP(
  garments: Garment[],
  rawMaterials: RawMaterial[],
  cycleConfig: ProductionCycleConfig
): MRPSummary {
  const cycleDays = Math.max(30, (cycleConfig.durationMonths || 3) * 30);
  const scenarioMultiplier = cycleConfig.scenarioMultiplier || 1.0;
  const scrapRateConfig = cycleConfig.defaultScrapRatePercent !== undefined ? cycleConfig.defaultScrapRatePercent : 5.0;
  const leadTimeBufferDays = cycleConfig.leadTimeBufferDays || 0;

  // Build a lookup map of all materials by id, by uppercase SKU, and by uppercase name
  const effectiveMaterialsMap = new Map<string, RawMaterial>();
  const idToMat = new Map<string, RawMaterial>();
  const skuToMat = new Map<string, RawMaterial>();

  rawMaterials.forEach((mat) => {
    effectiveMaterialsMap.set(mat.id, mat);
    idToMat.set(mat.id.toLowerCase(), mat);
    skuToMat.set(mat.sku.toUpperCase(), mat);
    skuToMat.set(mat.name.toUpperCase(), mat);
  });

  // Map to accumulate material requirements
  const materialReqMap = new Map<
    string,
    {
      grossReq: number;
      effectiveGrossReq: number;
      usedIn: {
        garmentName: string;
        garmentSku: string;
        consumption: number;
        demand: number;
      }[];
    }
  >();

  // Helper to resolve material for a BOM item
  const resolveMaterial = (rawMaterialId: string, rawMaterialName?: string): RawMaterial => {
    let found =
      effectiveMaterialsMap.get(rawMaterialId) ||
      idToMat.get(rawMaterialId.toLowerCase()) ||
      skuToMat.get(rawMaterialId.toUpperCase());

    if (!found && rawMaterialName) {
      found = skuToMat.get(rawMaterialName.toUpperCase());
    }

    if (!found) {
      const cleanSku = rawMaterialId.replace(/^MAT-/, '') || 'INSU-AUTO';
      const synthesized: RawMaterial = {
        id: rawMaterialId.startsWith('MAT-') ? rawMaterialId : `MAT-${cleanSku}`,
        sku: cleanSku,
        name: rawMaterialName || cleanSku,
        category: cleanSku.startsWith('AVI-') ? 'Avío / Fornitura' : cleanSku.startsWith('HIL-') ? 'Hilo' : 'Tela',
        unit: 'm',
        currentStock: 0,
        inTransitStock: 0,
        safetyStockDays: 15,
        minOrderQuantity: 10,
        unitCost: 15000,
        supplierName: 'Proveedor Pendiente',
        leadTimeDays: 15,
      };
      effectiveMaterialsMap.set(synthesized.id, synthesized);
      idToMat.set(synthesized.id.toLowerCase(), synthesized);
      skuToMat.set(synthesized.sku.toUpperCase(), synthesized);
      return synthesized;
    }
    return found;
  };

  // Initialize requirements map for all existing materials
  effectiveMaterialsMap.forEach((mat) => {
    materialReqMap.set(mat.id, {
      grossReq: 0,
      effectiveGrossReq: 0,
      usedIn: [],
    });
  });

  let totalGarmentsPlanned = 0;

  // Explode BOMs for each garment
  garments.forEach((garment) => {
    let garmentDemand = garment.targetSales;
    if (cycleConfig.demandMode === 'history_driven') {
      garmentDemand = computeGarmentProjectedDemand(
        garment,
        cycleConfig.durationMonths,
        cycleConfig.season || 'general',
        cycleConfig.growthRatePercent
      );
    }
    // Apply What-If scenario multiplier
    garmentDemand = Math.round(garmentDemand * scenarioMultiplier);
    totalGarmentsPlanned += garmentDemand;

    // In apparel, Net Production Demand = Target - FinishedGoods - WIP
    const netGarmentCutDemand = Math.max(0, garmentDemand - garment.finishedGoodsStock - garment.productionWIP);

    garment.bom.forEach((bomItem) => {
      const mat = resolveMaterial(bomItem.rawMaterialId, bomItem.rawMaterialName);

      let entry = materialReqMap.get(mat.id);
      if (!entry) {
        entry = {
          grossReq: 0,
          effectiveGrossReq: 0,
          usedIn: [],
        };
        materialReqMap.set(mat.id, entry);
      }

      // Theoretical net consumption
      const theoretical = bomItem.quantityPerGarment * netGarmentCutDemand;

      // Scrap rate: Scale baseline waste with the active scenario scrap rate
      const itemBaseScrap = bomItem.wastePercent !== undefined && bomItem.wastePercent > 0 ? bomItem.wastePercent : 5.0;
      // Proportional scaling: (base * scenarioScrap) / 5.0
      const scaledScrapPercent = (itemBaseScrap * scrapRateConfig) / 5.0;
      const wasteFactor = 1 + scaledScrapPercent / 100;
      const effective = theoretical * wasteFactor;

      entry.grossReq += theoretical;
      entry.effectiveGrossReq += effective;
      entry.usedIn.push({
        garmentName: garment.name,
        garmentSku: garment.sku,
        consumption: bomItem.quantityPerGarment,
        demand: netGarmentCutDemand,
      });
    });
  });

  let totalInvestmentUSD = 0;
  let criticalItemsCount = 0;
  let reorderItemsCount = 0;
  let optimalItemsCount = 0;
  let overstockItemsCount = 0;
  let totalFabricsMetersNeeded = 0;
  let totalFabricsKgNeeded = 0;
  let totalTrimsUnitsNeeded = 0;
  let totalThreadConesNeeded = 0;
  let totalSafetyStockCostUSD = 0;
  let totalScrapCostUSD = 0;

  const categoryTotals: Record<string, { totalCost: number; count: number }> = {};

  const allMaterialsList = Array.from(effectiveMaterialsMap.values());

  const items: MRPResultItem[] = allMaterialsList.map((mat) => {
    const data = materialReqMap.get(mat.id) || { grossReq: 0, effectiveGrossReq: 0, usedIn: [] };
    const yieldFactor = mat.yieldFactor && mat.yieldFactor > 0 ? mat.yieldFactor : 1.0;
    const usageUnit = mat.usageUnit || mat.unit;
    const purchaseUnit = mat.purchaseUnit || mat.unit;
    const conversionFormula =
      yieldFactor !== 1.0 || purchaseUnit !== usageUnit
        ? `1 ${purchaseUnit} = ${yieldFactor} ${usageUnit}`
        : `1 ${purchaseUnit} = 1 ${usageUnit}`;

    const grossReq = Number(data.grossReq.toFixed(2));
    const effectiveGrossReq = Number(data.effectiveGrossReq.toFixed(2));

    // Stocks in purchase unit
    const currentStock = mat.currentStock;
    const inTransitStock = mat.inTransitStock;
    const availableStock = currentStock + inTransitStock;

    // Stocks converted to usage unit (e.g., kg -> meters)
    const currentStockInUsageUnit = Number((currentStock * yieldFactor).toFixed(2));
    const inTransitStockInUsageUnit = Number((inTransitStock * yieldFactor).toFixed(2));
    const availableStockInUsageUnit = Number((availableStock * yieldFactor).toFixed(2));

    // Daily consumption rate in usage unit
    const dailyConsumptionUsage = effectiveGrossReq > 0 ? effectiveGrossReq / cycleDays : 0;
    const dailyConsumptionPurchase = yieldFactor > 0 ? dailyConsumptionUsage / yieldFactor : 0;

    // Safety stock: based on material safety stock days + buffer days
    const totalSafetyDays = (mat.safetyStockDays || cycleConfig.safetyStockDaysDefault || 15) + leadTimeBufferDays;
    const safetyStockRequiredInUsageUnit = Number((dailyConsumptionUsage * totalSafetyDays).toFixed(2));
    const safetyStockRequired = Number((dailyConsumptionPurchase * totalSafetyDays).toFixed(2));

    // Scrap additional requirement
    const scrapAdditionalQtyUsage = Math.max(0, effectiveGrossReq - grossReq);
    const scrapAdditionalQtyPurchase = yieldFactor > 0 ? scrapAdditionalQtyUsage / yieldFactor : 0;
    totalScrapCostUSD += scrapAdditionalQtyPurchase * mat.unitCost;
    totalSafetyStockCostUSD += safetyStockRequired * mat.unitCost;

    // Real net shortage calculation in usage unit and purchase unit
    const targetStockLevelUsage = effectiveGrossReq + safetyStockRequiredInUsageUnit;
    const netRequirementInUsageUnit = Math.max(0, targetStockLevelUsage - availableStockInUsageUnit);
    const netRequirement = yieldFactor > 0 ? Number((netRequirementInUsageUnit / yieldFactor).toFixed(2)) : 0;

    // Rounded purchase quantity in purchase units respecting MOQ
    let suggestedPurchaseQty = 0;
    if (netRequirement > 0) {
      const moq = mat.minOrderQuantity || 1;
      suggestedPurchaseQty = Math.ceil(netRequirement / moq) * moq;
      suggestedPurchaseQty = Number(suggestedPurchaseQty.toFixed(2));
    }

    const totalEstimatedCost = Number((suggestedPurchaseQty * mat.unitCost).toFixed(2));
    totalInvestmentUSD += totalEstimatedCost;

    // Days of coverage
    const daysOfCoverage =
      dailyConsumptionUsage > 0 ? Math.round(availableStockInUsageUnit / dailyConsumptionUsage) : 999;

    // Status logic
    let status: MRPStatus = 'OPTIMO';
    if (availableStockInUsageUnit < effectiveGrossReq * 0.45 && effectiveGrossReq > 0) {
      status = 'CRITICO';
      criticalItemsCount++;
    } else if (availableStockInUsageUnit < targetStockLevelUsage && netRequirementInUsageUnit > 0) {
      status = 'REORDEN';
      reorderItemsCount++;
    } else if (daysOfCoverage > cycleDays * 2.0 && effectiveGrossReq > 0) {
      status = 'SOBRESTOCK';
      overstockItemsCount++;
    } else {
      status = 'OPTIMO';
      optimalItemsCount++;
    }

    // Material categories specific totals
    if (mat.category === 'Tela') {
      if (mat.unit === 'm' || mat.unit === 'yardas') {
        totalFabricsMetersNeeded += suggestedPurchaseQty;
      } else if (mat.unit === 'kg') {
        totalFabricsKgNeeded += suggestedPurchaseQty;
      }
    } else if (mat.category === 'Avío / Fornitura' || mat.category === 'Empaque / Etiqueta') {
      if (mat.unit === 'unidades') {
        totalTrimsUnitsNeeded += suggestedPurchaseQty;
      }
    } else if (mat.category === 'Hilo') {
      totalThreadConesNeeded += suggestedPurchaseQty;
    }

    // Aggregate category costs
    if (!categoryTotals[mat.category]) {
      categoryTotals[mat.category] = { totalCost: 0, count: 0 };
    }
    categoryTotals[mat.category].totalCost += totalEstimatedCost;
    categoryTotals[mat.category].count += 1;

    return {
      rawMaterial: mat,
      grossRequirement: grossReq,
      effectiveGrossRequirement: effectiveGrossReq,
      usageUnit,
      currentStock,
      currentStockInUsageUnit,
      inTransitStock,
      inTransitStockInUsageUnit,
      availableStock,
      availableStockInUsageUnit,
      yieldFactor,
      conversionFormula,
      safetyStockRequired,
      safetyStockRequiredInUsageUnit: Number(safetyStockRequiredInUsageUnit.toFixed(2)),
      netRequirement,
      netRequirementInUsageUnit: Number(netRequirementInUsageUnit.toFixed(2)),
      suggestedPurchaseQty,
      totalEstimatedCost,
      daysOfCoverage,
      status,
      usedInGarments: data.usedIn.map((u) => ({
        ...u,
        unit: usageUnit,
        totalUsage: Number((u.consumption * u.demand).toFixed(2)),
      })),
    };
  });

  // Calculate category breakdown percentages
  const categoryCostBreakdown = Object.keys(categoryTotals).map((cat) => {
    const item = categoryTotals[cat];
    return {
      category: cat,
      totalCost: Number(item.totalCost.toFixed(2)),
      itemsCount: item.count,
      percentage: totalInvestmentUSD > 0 ? Number(((item.totalCost / totalInvestmentUSD) * 100).toFixed(1)) : 0,
    };
  });

  return {
    items,
    totalInvestmentUSD: Number(totalInvestmentUSD.toFixed(2)),
    criticalItemsCount,
    reorderItemsCount,
    optimalItemsCount,
    overstockItemsCount,
    totalFabricsMetersNeeded: Number(totalFabricsMetersNeeded.toFixed(2)),
    totalFabricsKgNeeded: Number(totalFabricsKgNeeded.toFixed(2)),
    totalTrimsUnitsNeeded: Math.round(totalTrimsUnitsNeeded),
    totalThreadConesNeeded: Math.round(totalThreadConesNeeded),
    totalSafetyStockCostUSD: Number(totalSafetyStockCostUSD.toFixed(2)),
    totalScrapCostUSD: Number(totalScrapCostUSD.toFixed(2)),
    categoryCostBreakdown,
    totalGarmentsPlanned,
  };
}
