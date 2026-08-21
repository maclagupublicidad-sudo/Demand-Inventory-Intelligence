import React, { useState, useMemo, useEffect } from 'react';
import {
  initialRawMaterials,
  initialGarments,
  sampleSalesRecords,
  initialCycleConfig,
  initialPurchaseOrders,
  initialProductionOrders,
  DEMO_RAW_MATERIALS,
  DEMO_GARMENTS,
  DEMO_SALES_RECORDS,
  DEMO_PURCHASE_ORDERS,
  DEMO_PRODUCTION_ORDERS,
} from './data/mockData';
import { INITIAL_USERS } from './data/mockUsers';
import {
  Garment,
  RawMaterial,
  SalesRecord,
  ProductionCycleConfig,
  PurchaseOrder,
  ProductionOrder,
  ProductionStageLog,
  MaterialScrapLog,
  BOMItem,
  MRPResultItem,
  AppUser,
} from './types';
import { calculateMRP } from './services/mrpEngine';
import { formatCOP } from './utils/formatters';
import { computeGarmentProjectedDemand } from './utils/seasonality';
import { hasPermission } from './utils/permissions';
import { Header } from './components/Header';
import { CycleControlBar } from './components/CycleControlBar';
import { DashboardOverview } from './components/DashboardOverview';
import { MRPCalculatorTable } from './components/MRPCalculatorTable';
import { BOMExplosionView } from './components/BOMExplosionView';
import { DemandForecastingView } from './components/DemandForecastingView';
import { ProductionExecutionView } from './components/ProductionExecutionView';
import { CSVManagerModal } from './components/CSVManagerModal';
import { PurchaseOrderModal } from './components/PurchaseOrderModal';
import { AIIntelligencePanel } from './components/AIIntelligencePanel';
import { CycleManagementModal } from './components/CycleManagementModal';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { GarmentModal } from './components/GarmentModal';
import { RawMaterialsManager } from './components/RawMaterialsManager';
import { LoginModal } from './components/LoginModal';
import { UserManagementModal } from './components/UserManagementModal';
import { AccessRestricted } from './components/AccessRestricted';
import {
  Layers,
  Package,
  Plus,
  Edit2,
  Trash2,
  Clock,
  DollarSign,
  Search,
  ShoppingCart,
  Download,
} from 'lucide-react';

export default function App() {
  // User & RBAC State
  const [users, setUsers] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem('textiliq_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing stored users', e);
      }
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('textiliq_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing current user', e);
      }
    }
    return INITIAL_USERS[0];
  });

  // Main Domain State with LocalStorage Persistence
  const [garments, setGarments] = useState<Garment[]>(() => {
    const saved = localStorage.getItem('textiliq_garments');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialGarments;
  });

  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>(() => {
    const saved = localStorage.getItem('textiliq_materials');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialRawMaterials;
  });

  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>(() => {
    const saved = localStorage.getItem('textiliq_sales');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return sampleSalesRecords;
  });

  const [cycleConfig, setCycleConfig] = useState<ProductionCycleConfig>(() => {
    const saved = localStorage.getItem('textiliq_cycle');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialCycleConfig;
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem('textiliq_orders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialPurchaseOrders;
  });

  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>(() => {
    const saved = localStorage.getItem('textiliq_production_orders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialProductionOrders;
  });

  // Automatically save domain state changes
  useEffect(() => {
    localStorage.setItem('textiliq_garments', JSON.stringify(garments));
  }, [garments]);

  useEffect(() => {
    localStorage.setItem('textiliq_materials', JSON.stringify(rawMaterials));
  }, [rawMaterials]);

  useEffect(() => {
    localStorage.setItem('textiliq_sales', JSON.stringify(salesRecords));
  }, [salesRecords]);

  useEffect(() => {
    localStorage.setItem('textiliq_cycle', JSON.stringify(cycleConfig));
  }, [cycleConfig]);

  useEffect(() => {
    localStorage.setItem('textiliq_orders', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem('textiliq_production_orders', JSON.stringify(productionOrders));
  }, [productionOrders]);

  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isCSVModalOpen, setIsCSVModalOpen] = useState<boolean>(false);
  const [isCycleModalOpen, setIsCycleModalOpen] = useState<boolean>(false);
  const [isPOModalOpen, setIsPOModalOpen] = useState<boolean>(false);
  const [isAIAdvisorOpen, setIsAIAdvisorOpen] = useState<boolean>(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isGarmentModalOpen, setIsGarmentModalOpen] = useState<boolean>(false);
  const [editingGarment, setEditingGarment] = useState<Garment | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState<boolean>(false);

  // Core MRP calculation memoized
  const mrpSummary = useMemo(() => {
    return calculateMRP(garments, rawMaterials, cycleConfig);
  }, [garments, rawMaterials, cycleConfig]);

  // Handlers for state mutations
  const handleUpdateCycleConfig = (updated: Partial<ProductionCycleConfig>) => {
    setCycleConfig((prev) => {
      const nextConfig = { ...prev, ...updated };
      const durationChanged = updated.durationMonths !== undefined && updated.durationMonths !== prev.durationMonths;
      const seasonChanged = updated.season !== undefined && updated.season !== prev.season;
      const growthChanged = updated.growthRatePercent !== undefined && updated.growthRatePercent !== prev.growthRatePercent;

      if (durationChanged || seasonChanged || growthChanged) {
        setGarments((prevGarments) =>
          prevGarments.map((g) => {
            const newTarget = computeGarmentProjectedDemand(
              g,
              nextConfig.durationMonths,
              nextConfig.season || 'general',
              nextConfig.growthRatePercent
            );
            return {
              ...g,
              targetSales: newTarget,
            };
          })
        );
      }

      return nextConfig;
    });
  };

  const handleRecalculateAllTargets = () => {
    setGarments((prevGarments) =>
      prevGarments.map((g) => ({
        ...g,
        targetSales: computeGarmentProjectedDemand(
          g,
          cycleConfig.durationMonths,
          cycleConfig.season || 'general',
          cycleConfig.growthRatePercent
        ),
      }))
    );
  };

  const handleUpdateMaterialStock = (
    materialId: string,
    newCurrentStock: number,
    newInTransit: number
  ) => {
    setRawMaterials((prev) =>
      prev.map((m) =>
        m.id === materialId
          ? { ...m, currentStock: newCurrentStock, inTransitStock: newInTransit }
          : m
      )
    );
  };

  const handleUpdateGarmentTarget = (garmentId: string, newTarget: number) => {
    setGarments((prev) =>
      prev.map((g) => (g.id === garmentId ? { ...g, targetSales: newTarget } : g))
    );
  };

  const handleBatchAdjustTargets = (percentChange: number) => {
    const factor = 1 + percentChange / 100;
    setGarments((prev) =>
      prev.map((g) => ({
        ...g,
        targetSales: Math.max(10, Math.round(g.targetSales * factor)),
      }))
    );
  };

  const handleUpdateGarmentBOM = (garmentId: string, updatedBOM: BOMItem[]) => {
    setGarments((prev) =>
      prev.map((g) => (g.id === garmentId ? { ...g, bom: updatedBOM } : g))
    );
  };

  const handleUpdateGarmentFull = (updatedGarment: Garment) => {
    setGarments((prev) =>
      prev.map((g) => (g.id === updatedGarment.id ? updatedGarment : g))
    );
  };

  const handleImportSales = (newSales: SalesRecord[], mode: 'merge' | 'replace') => {
    setSalesRecords((prev) => (mode === 'replace' ? newSales : [...newSales, ...prev]));

    // Calculate historical monthly average from sales for each garment
    const salesBySku: Record<string, { totalUnits: number; count: number; name: string }> = {};
    newSales.forEach((s) => {
      const skuKey = s.garmentSku.toUpperCase();
      if (!salesBySku[skuKey]) {
        salesBySku[skuKey] = { totalUnits: 0, count: 0, name: s.garmentName };
      }
      salesBySku[skuKey].totalUnits += s.unitsSold;
      salesBySku[skuKey].count += 1;
    });

    // Update garments with new sales projections
    setGarments((prevGarments) => {
      const updated = prevGarments.map((g) => {
        const stats = salesBySku[g.sku.toUpperCase()];
        if (stats) {
          const avgMonthly = Math.max(10, Math.round(stats.totalUnits / Math.max(1, stats.count)));
          const target = Math.round(avgMonthly * cycleConfig.durationMonths * (1 + cycleConfig.growthRatePercent / 100));
          return {
            ...g,
            historicalMonthlyAverage: avgMonthly,
            targetSales: target,
          };
        }
        return g;
      });

      // Auto-create any garment that was in the sales CSV but not in catalog
      const existingSkus = new Set(prevGarments.map((g) => g.sku.toUpperCase()));
      const newGarmentsToCreate: Garment[] = [];

      Object.entries(salesBySku).forEach(([skuKey, data]) => {
        if (!existingSkus.has(skuKey)) {
          const avgMonthly = Math.max(10, Math.round(data.totalUnits / Math.max(1, data.count)));
          newGarmentsToCreate.push({
            id: `GAR-${skuKey}`,
            sku: skuKey,
            name: data.name || skuKey,
            category: 'Confección General',
            targetSales: Math.round(avgMonthly * cycleConfig.durationMonths * (1 + cycleConfig.growthRatePercent / 100)),
            historicalMonthlyAverage: avgMonthly,
            retailPrice: 45.0,
            costEstimate: 16.0,
            finishedGoodsStock: 0,
            productionWIP: 0,
            bom: [],
          });
        }
      });

      return [...updated, ...newGarmentsToCreate];
    });
  };

  const handleImportMaterials = (importedMats: RawMaterial[], mode: 'merge' | 'replace') => {
    if (mode === 'replace') {
      setRawMaterials(importedMats);
    } else {
      setRawMaterials((prev) => {
        const map = new Map<string, RawMaterial>();
        // Index existing by uppercase SKU and ID
        prev.forEach((m) => map.set(m.sku.toUpperCase(), m));
        // Overwrite or append with imported
        importedMats.forEach((m) => map.set(m.sku.toUpperCase(), m));
        return Array.from(map.values());
      });
    }
  };

  const handleImportBOMs = (
    importedGarments: Garment[],
    discoveredMaterials: RawMaterial[],
    mode: 'merge' | 'replace'
  ) => {
    // 1. Ensure any newly discovered materials from the BOM are added to rawMaterials
    if (discoveredMaterials.length > 0) {
      setRawMaterials((prev) => {
        const existing = new Set(prev.map((m) => m.sku.toUpperCase()));
        const toAdd = discoveredMaterials.filter((m) => !existing.has(m.sku.toUpperCase()));
        return [...prev, ...toAdd];
      });
    }

    // 2. Update garments catalog
    if (mode === 'replace') {
      setGarments(importedGarments);
    } else {
      setGarments((prev) => {
        const map = new Map<string, Garment>();
        prev.forEach((g) => map.set(g.sku.toUpperCase(), g));
        importedGarments.forEach((g) => {
          const existing = map.get(g.sku.toUpperCase());
          if (existing) {
            map.set(g.sku.toUpperCase(), {
              ...existing,
              name: g.name || existing.name,
              category: g.category || existing.category,
              targetSales: g.targetSales || existing.targetSales,
              bom: g.bom && g.bom.length > 0 ? g.bom : existing.bom,
            });
          } else {
            map.set(g.sku.toUpperCase(), g);
          }
        });
        return Array.from(map.values());
      });
    }
  };

  const handleImportAllDatasets = (
    newSales: SalesRecord[],
    newMaterials: RawMaterial[],
    newGarments: Garment[],
    mode: 'merge' | 'replace'
  ) => {
    if (newMaterials.length > 0) {
      handleImportMaterials(newMaterials, mode);
    }
    if (newGarments.length > 0) {
      handleImportBOMs(newGarments, [], mode);
    }
    if (newSales.length > 0) {
      handleImportSales(newSales, mode);
    }
  };

  const handleSaveGarment = (garment: Garment) => {
    setGarments((prev) => {
      const exists = prev.some((g) => g.id === garment.id);
      if (exists) {
        return prev.map((g) => (g.id === garment.id ? garment : g));
      }
      return [garment, ...prev];
    });
  };

  const handleToggleGarmentActive = (garmentId: string) => {
    setGarments((prev) =>
      prev.map((g) => (g.id === garmentId ? { ...g, isActive: g.isActive === false ? true : false } : g))
    );
  };

  const handleDeleteGarment = (garmentId: string) => {
    setGarments((prev) => prev.filter((g) => g.id !== garmentId));
  };

  const handleOpenNewGarmentModal = () => {
    setEditingGarment(null);
    setIsGarmentModalOpen(true);
  };

  const handleOpenEditGarmentModal = (garment: Garment) => {
    setEditingGarment(garment);
    setIsGarmentModalOpen(true);
  };

  const handleAddMaterial = (newMaterial: RawMaterial) => {
    setRawMaterials((prev) => [newMaterial, ...prev]);
  };

  const handleUpdateMaterial = (updatedMaterial: RawMaterial) => {
    setRawMaterials((prev) =>
      prev.map((m) => (m.id === updatedMaterial.id ? updatedMaterial : m))
    );
  };

  const handleToggleMaterialActive = (materialId: string) => {
    setRawMaterials((prev) =>
      prev.map((m) =>
        m.id === materialId
          ? { ...m, isActive: m.isActive === false ? true : false }
          : m
      )
    );
  };

  const handleDeleteMaterial = (materialId: string) => {
    setRawMaterials((prev) => prev.filter((m) => m.id !== materialId));
  };

  const handleApplyWhatIf = (multiplier: number, scrapRate: number, bufferDays: number) => {
    setCycleConfig((prev) => ({
      ...prev,
      scenarioMultiplier: multiplier,
      defaultScrapRatePercent: scrapRate,
      leadTimeBufferDays: bufferDays,
    }));
  };

  const handleResetDemoData = () => {
    const choice = confirm(
      '¿Desea restaurar los datos de ejemplo (DEMO)?\n\nPresione ACEPTAR para cargar datos de prueba, o CANCELAR para mantener el sistema limpio.'
    );
    if (choice) {
      setGarments(DEMO_GARMENTS);
      setRawMaterials(DEMO_RAW_MATERIALS);
      setSalesRecords(DEMO_SALES_RECORDS);
      setPurchaseOrders(DEMO_PURCHASE_ORDERS);
      setProductionOrders(DEMO_PRODUCTION_ORDERS);
      setCycleConfig(initialCycleConfig);
      setUsers(INITIAL_USERS);
      setCurrentUser(INITIAL_USERS[0]);
    }
  };

  const handleClearAllData = () => {
    if (confirm('¿Está seguro de que desea vaciar todos los datos y dejar el sistema completamente en blanco para producción?')) {
      setGarments([]);
      setRawMaterials([]);
      setSalesRecords([]);
      setPurchaseOrders([]);
      setProductionOrders([]);
      localStorage.removeItem('textiliq_garments');
      localStorage.removeItem('textiliq_materials');
      localStorage.removeItem('textiliq_sales');
      localStorage.removeItem('textiliq_orders');
      localStorage.removeItem('textiliq_production_orders');
    }
  };

  // Production Orders & Shopfloor MES Handlers
  const handleAddProductionOrder = (newOrder: ProductionOrder) => {
    setProductionOrders((prev) => [newOrder, ...prev]);

    // Update garment WIP stock
    setGarments((prev) =>
      prev.map((g) =>
        g.id === newOrder.garmentId
          ? { ...g, productionWIP: (g.productionWIP || 0) + newOrder.unitsTarget }
          : g
      )
    );
  };

  const handleUpdateProductionOrder = (updatedOrder: ProductionOrder) => {
    setProductionOrders((prev) =>
      prev.map((op) => (op.id === updatedOrder.id ? updatedOrder : op))
    );
  };

  const handleDeleteProductionOrder = (orderId: string) => {
    setProductionOrders((prev) => prev.filter((op) => op.id !== orderId));
  };

  const handleRecordStageLog = (
    orderId: string,
    stageLog: ProductionStageLog,
    updatedOPCounts: {
      unitsCut?: number;
      unitsSewn?: number;
      unitsFinished?: number;
      unitsDefective?: number;
      status?: ProductionOrder['status'];
    }
  ) => {
    setProductionOrders((prev) =>
      prev.map((op) => {
        if (op.id !== orderId) return op;
        return {
          ...op,
          ...updatedOPCounts,
          stageLogs: [stageLog, ...(op.stageLogs || [])],
        };
      })
    );

    // If finished goods were recorded, update garment finished goods inventory
    if (updatedOPCounts.unitsFinished && updatedOPCounts.unitsFinished > 0) {
      const targetOp = productionOrders.find((o) => o.id === orderId);
      if (targetOp) {
        setGarments((prev) =>
          prev.map((g) =>
            g.id === targetOp.garmentId
              ? {
                  ...g,
                  finishedGoodsStock: (g.finishedGoodsStock || 0) + stageLog.unitsProcessed,
                  productionWIP: Math.max(0, (g.productionWIP || 0) - stageLog.unitsProcessed),
                }
              : g
          )
        );
      }
    }
  };

  const handleRecordScrapLog = (
    orderId: string,
    scrapLog: MaterialScrapLog,
    deductRawMaterialStock = true
  ) => {
    setProductionOrders((prev) =>
      prev.map((op) => {
        if (op.id !== orderId) return op;
        return {
          ...op,
          scrapLogs: [scrapLog, ...(op.scrapLogs || [])],
        };
      })
    );

    // If deductRawMaterialStock is true, adjust the current physical inventory of the raw material
    if (deductRawMaterialStock && scrapLog.actualConsumption > 0) {
      setRawMaterials((prev) =>
        prev.map((m) =>
          m.id === scrapLog.rawMaterialId
            ? {
                ...m,
                currentStock: Math.max(0, m.currentStock - scrapLog.actualConsumption),
              }
            : m
        )
      );
    }
  };

  // User Management Handlers
  const handleLogin = (user: AppUser) => {
    const updatedUser = {
      ...user,
      lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('textiliq_current_user', JSON.stringify(updatedUser));

    setUsers((prev) => {
      const next = prev.map((u) => (u.id === user.id ? updatedUser : u));
      localStorage.setItem('textiliq_users', JSON.stringify(next));
      return next;
    });
  };

  const handleSaveUser = (userToSave: AppUser) => {
    setUsers((prev) => {
      const exists = prev.some((u) => u.id === userToSave.id);
      const updated = exists
        ? prev.map((u) => (u.id === userToSave.id ? userToSave : u))
        : [userToSave, ...prev];
      localStorage.setItem('textiliq_users', JSON.stringify(updated));
      return updated;
    });

    if (currentUser?.id === userToSave.id) {
      setCurrentUser(userToSave);
      localStorage.setItem('textiliq_current_user', JSON.stringify(userToSave));
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => {
      const updated = prev.filter((u) => u.id !== userId);
      localStorage.setItem('textiliq_users', JSON.stringify(updated));
      return updated;
    });
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers((prev) => {
      const updated = prev.map((u) =>
        u.id === userId ? { ...u, isActive: !u.isActive } : u
      );
      localStorage.setItem('textiliq_users', JSON.stringify(updated));
      return updated;
    });
  };

  // Generate Purchase Orders automatically grouped by supplier
  const handleCreatePOsFromMRP = (itemsToOrder: MRPResultItem[]) => {
    const supplierGroups: Record<string, MRPResultItem[]> = {};

    itemsToOrder.forEach((item) => {
      if (item.suggestedPurchaseQty > 0) {
        const supplier = item.rawMaterial.supplierName;
        if (!supplierGroups[supplier]) {
          supplierGroups[supplier] = [];
        }
        supplierGroups[supplier].push(item);
      }
    });

    const newOrders: PurchaseOrder[] = Object.entries(supplierGroups).map(
      ([supplier, items], index) => {
        const orderItems = items.map((i) => ({
          rawMaterialId: i.rawMaterial.id,
          rawMaterialSku: i.rawMaterial.sku,
          rawMaterialName: i.rawMaterial.name,
          category: i.rawMaterial.category,
          quantity: i.suggestedPurchaseQty,
          unit: i.rawMaterial.unit,
          unitCost: i.rawMaterial.unitCost,
          subtotal: i.suggestedPurchaseQty * i.rawMaterial.unitCost,
        }));

        const totalAmount = orderItems.reduce((s, i) => s + i.subtotal, 0);

        const today = new Date();
        const maxLeadDays = Math.max(...items.map((i) => i.rawMaterial.leadTimeDays));
        const estimatedDelivery = new Date(today.getTime() + maxLeadDays * 24 * 60 * 60 * 1000);

        return {
          id: `OC-TEX-${Date.now().toString().slice(-4)}-${index + 1}`,
          supplierName: supplier,
          orderDate: today.toISOString().split('T')[0],
          expectedDeliveryDate: estimatedDelivery.toISOString().split('T')[0],
          status: 'Borrador',
          items: orderItems,
          totalAmount,
          notes: `Generado automáticamente por el motor MRP para el ciclo de ${cycleConfig.durationMonths} meses.`,
        };
      }
    );

    setPurchaseOrders((prev) => [...newOrders, ...prev]);
    setIsPOModalOpen(true);
  };

  const handleUpdateOrderStatus = (
    orderId: string,
    newStatus: 'Borrador' | 'Emitida' | 'En Tránsito' | 'Recibida'
  ) => {
    setPurchaseOrders((prev) =>
      prev.map((po) => {
        if (po.id === orderId) {
          // If changing to "En Tránsito", update materials inTransitStock
          if (newStatus === 'En Tránsito' && po.status !== 'En Tránsito') {
            po.items.forEach((item) => {
              setRawMaterials((mats) =>
                mats.map((m) =>
                  m.id === item.rawMaterialId
                    ? { ...m, inTransitStock: m.inTransitStock + item.quantity }
                    : m
                )
              );
            });
          }
          return { ...po, status: newStatus };
        }
        return po;
      })
    );
  };

  const handleAddManualOrder = (newOrder: PurchaseOrder) => {
    setPurchaseOrders((prev) => [newOrder, ...prev]);

    // If order was created in 'En Tránsito', immediately increase in-transit stock for materials
    if (newOrder.status === 'En Tránsito') {
      newOrder.items.forEach((item) => {
        setRawMaterials((mats) =>
          mats.map((m) =>
            m.id === item.rawMaterialId
              ? { ...m, inTransitStock: m.inTransitStock + item.quantity }
              : m
          )
        );
      });
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    setPurchaseOrders((prev) => prev.filter((po) => po.id !== orderId));
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col font-sans text-[#1C211D] selection:bg-[#3A5A40] selection:text-white">
      {/* Top Main Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cycleConfig={cycleConfig}
        currentUser={currentUser}
        onOpenCycleModal={() => setIsCycleModalOpen(true)}
        onOpenCSVModal={() => setIsCSVModalOpen(true)}
        onOpenAIAdvisor={() => setIsAIAdvisorOpen(true)}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onOpenPOModal={() => setIsPOModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenUserManagementModal={() => setIsUserManagementModalOpen(true)}
        criticalCount={mrpSummary.criticalItemsCount}
        onResetDemoData={handleResetDemoData}
      />

      {/* Production Cycle Control & Parameters Bar */}
      <CycleControlBar
        cycleConfig={cycleConfig}
        onUpdateCycleConfig={handleUpdateCycleConfig}
        totalGarmentsPlanned={mrpSummary.totalGarmentsPlanned}
        totalInvestmentUSD={mrpSummary.totalInvestmentUSD}
      />

      {/* Main App Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Tab 1: Dashboard Overview */}
        {activeTab === 'dashboard' && (
          !hasPermission(currentUser, 'view_dashboard') ? (
            <AccessRestricted
              moduleName="Panel Principal (Dashboard)"
              requiredPermission="view_dashboard"
              currentUser={currentUser}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
              onOpenUserManagementModal={() => setIsUserManagementModalOpen(true)}
            />
          ) : (
            <div className="space-y-6">
              <DashboardOverview
                mrpSummary={mrpSummary}
                cycleConfig={cycleConfig}
                productionOrders={productionOrders}
                onFilterStatus={(status) => {
                  setStatusFilter(status);
                  setActiveTab('mrp_calculator');
                }}
                onOpenAIAdvisor={() => setIsAIAdvisorOpen(true)}
                onOpenPOModal={() => setIsPOModalOpen(true)}
                onOpenNewGarment={handleOpenNewGarmentModal}
                onOpenNewMaterial={() => setActiveTab('inventario_materiales')}
                onOpenCSVModal={() => setIsCSVModalOpen(true)}
                onNavigateToExecution={() => setActiveTab('execution')}
              />

              {/* Quick Preview of the MRP Table */}
              <MRPCalculatorTable
                items={mrpSummary.items}
                onUpdateMaterialStock={handleUpdateMaterialStock}
                onGenerateSelectedPOs={(selectedIds) => {
                  const selectedItems = mrpSummary.items.filter((i) =>
                    selectedIds.includes(i.rawMaterial.id)
                  );
                  handleCreatePOsFromMRP(selectedItems);
                }}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
              />
            </div>
          )
        )}

        {/* Tab 2: MRP Calculator Table Detail View */}
        {activeTab === 'mrp_calculator' && (
          !hasPermission(currentUser, 'view_mrp') ? (
            <AccessRestricted
              moduleName="Planificador MRP & Abastecimiento"
              requiredPermission="view_mrp"
              currentUser={currentUser}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
              onOpenUserManagementModal={() => setIsUserManagementModalOpen(true)}
            />
          ) : (
            <MRPCalculatorTable
              items={mrpSummary.items}
              onUpdateMaterialStock={handleUpdateMaterialStock}
              onGenerateSelectedPOs={(selectedIds) => {
                const selectedItems = mrpSummary.items.filter((i) =>
                  selectedIds.includes(i.rawMaterial.id)
                );
                handleCreatePOsFromMRP(selectedItems);
              }}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />
          )
        )}

        {/* Tab 3: Fichas Técnicas & BOM Explosion */}
        {activeTab === 'fichas_tecnicas' && (
          !hasPermission(currentUser, 'view_tech_packs') ? (
            <AccessRestricted
              moduleName="Fichas Técnicas, Tiempos SAM & Costeo"
              requiredPermission="view_tech_packs"
              currentUser={currentUser}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
              onOpenUserManagementModal={() => setIsUserManagementModalOpen(true)}
            />
          ) : (
            <BOMExplosionView
              garments={garments}
              rawMaterials={rawMaterials}
              onUpdateGarmentBOM={handleUpdateGarmentBOM}
              onUpdateGarment={handleSaveGarment}
              onToggleGarmentActive={handleToggleGarmentActive}
              onDeleteGarment={handleDeleteGarment}
              onOpenNewGarmentModal={handleOpenNewGarmentModal}
              onOpenEditGarmentModal={handleOpenEditGarmentModal}
            />
          )
        )}

        {/* Tab 4: Metas de Ventas & Proyección de Demanda */}
        {activeTab === 'metas_ventas' && (
          !hasPermission(currentUser, 'view_demand_forecast') ? (
            <AccessRestricted
              moduleName="Metas de Ventas & Proyección de Demanda"
              requiredPermission="view_demand_forecast"
              currentUser={currentUser}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
              onOpenUserManagementModal={() => setIsUserManagementModalOpen(true)}
            />
          ) : (
            <DemandForecastingView
              garments={garments}
              cycleConfig={cycleConfig}
              salesRecords={salesRecords}
              onUpdateGarmentTarget={handleUpdateGarmentTarget}
              onBatchAdjustTargets={handleBatchAdjustTargets}
              onUpdateCycleConfig={handleUpdateCycleConfig}
              onRecalculateAllTargets={handleRecalculateAllTargets}
              onOpenCycleModal={() => setIsCycleModalOpen(true)}
            />
          )
        )}

        {/* Tab 5: Maestro de Inventario de Materias Primas */}
        {activeTab === 'inventario_materiales' && (
          !hasPermission(currentUser, 'view_mrp') ? (
            <AccessRestricted
              moduleName="Inventario de Materias Primas & Telas"
              requiredPermission="view_mrp"
              currentUser={currentUser}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
              onOpenUserManagementModal={() => setIsUserManagementModalOpen(true)}
            />
          ) : (
            <RawMaterialsManager
              materials={rawMaterials}
              garments={garments}
              onAddMaterial={handleAddMaterial}
              onUpdateMaterial={handleUpdateMaterial}
              onToggleMaterialActive={handleToggleMaterialActive}
              onDeleteMaterial={handleDeleteMaterial}
              onOpenCSVModal={() => setIsCSVModalOpen(true)}
            />
          )
        )}

        {/* Tab 6: Ejecución en Planta & Analítica Temporal (MES & Trazabilidad) */}
        {activeTab === 'execution' && (
          !hasPermission(currentUser, 'view_production_execution') ? (
            <AccessRestricted
              moduleName="Ejecución en Planta & Analítica Temporal (MES)"
              requiredPermission="view_production_execution"
              currentUser={currentUser}
              onOpenLoginModal={() => setIsLoginModalOpen(true)}
              onOpenUserManagementModal={() => setIsUserManagementModalOpen(true)}
            />
          ) : (
            <ProductionExecutionView
              productionOrders={productionOrders}
              garments={garments}
              rawMaterials={rawMaterials}
              purchaseOrders={purchaseOrders}
              cycleConfig={cycleConfig}
              currentUser={currentUser}
              onAddProductionOrder={handleAddProductionOrder}
              onUpdateProductionOrder={handleUpdateProductionOrder}
              onDeleteProductionOrder={handleDeleteProductionOrder}
              onRecordStageLog={handleRecordStageLog}
              onRecordScrapLog={handleRecordScrapLog}
            />
          )
        )}
      </main>

      {/* Footer info bar */}
      <footer className="bg-white border-t border-[#E6E1D8] py-3 px-6 text-center text-xs text-[#5F6B61] flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#1C211D]">TextilIQ Demand & MRP</span>
          <span>•</span>
          <span>Plataforma Textil MRP & Inteligencia de Demanda Comercial en Colombia</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-[#8F9990]">
          <span>{garments.length} prendas</span>
          <span>{rawMaterials.length} materias primas</span>
          <span>{users.filter((u) => u.isActive).length} usuarios activos</span>
          <span>Ciclo: {cycleConfig.durationMonths} meses</span>
        </div>
      </footer>

      {/* Modals & Dialogs */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        users={users}
        currentUser={currentUser}
        onLogin={handleLogin}
      />

      <UserManagementModal
        isOpen={isUserManagementModalOpen}
        onClose={() => setIsUserManagementModalOpen(false)}
        users={users}
        currentUser={currentUser}
        onSaveUser={handleSaveUser}
        onDeleteUser={handleDeleteUser}
        onToggleUserStatus={handleToggleUserStatus}
      />

      <CSVManagerModal
        isOpen={isCSVModalOpen}
        onClose={() => setIsCSVModalOpen(false)}
        onImportSales={handleImportSales}
        onImportMaterials={handleImportMaterials}
        onImportBOMs={handleImportBOMs}
        onImportAllDatasets={handleImportAllDatasets}
        rawMaterials={rawMaterials}
        garments={garments}
        salesRecords={salesRecords}
      />

      <PurchaseOrderModal
        isOpen={isPOModalOpen}
        onClose={() => setIsPOModalOpen(false)}
        mrpItems={mrpSummary.items}
        purchaseOrders={purchaseOrders}
        rawMaterials={rawMaterials}
        onCreatePurchaseOrdersFromMRP={handleCreatePOsFromMRP}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onAddManualOrder={handleAddManualOrder}
        onDeleteOrder={handleDeleteOrder}
      />

      <AIIntelligencePanel
        isOpen={isAIAdvisorOpen}
        onClose={() => setIsAIAdvisorOpen(false)}
        mrpSummary={mrpSummary}
        cycleConfig={cycleConfig}
        garments={garments}
      />

      <CycleManagementModal
        isOpen={isCycleModalOpen}
        onClose={() => setIsCycleModalOpen(false)}
        cycleConfig={cycleConfig}
        onSaveCycleConfig={(updated) => setCycleConfig(updated)}
      />

      <WhatIfSimulator
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        cycleConfig={cycleConfig}
        garments={garments}
        rawMaterials={rawMaterials}
        mrpSummary={mrpSummary}
        onApplyScenario={handleApplyWhatIf}
      />

      <GarmentModal
        isOpen={isGarmentModalOpen}
        onClose={() => {
          setIsGarmentModalOpen(false);
          setEditingGarment(null);
        }}
        rawMaterials={rawMaterials}
        onSaveGarment={handleSaveGarment}
        garmentToEdit={editingGarment}
      />
    </div>
  );
}
