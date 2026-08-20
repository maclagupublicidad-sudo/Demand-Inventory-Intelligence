import React, { useState, useMemo } from 'react';
import {
  initialRawMaterials,
  initialGarments,
  sampleSalesRecords,
  initialCycleConfig,
  initialPurchaseOrders,
} from './data/mockData';
import { INITIAL_USERS } from './data/mockUsers';
import {
  Garment,
  RawMaterial,
  SalesRecord,
  ProductionCycleConfig,
  PurchaseOrder,
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
import { CSVManagerModal } from './components/CSVManagerModal';
import { PurchaseOrderModal } from './components/PurchaseOrderModal';
import { AIIntelligencePanel } from './components/AIIntelligencePanel';
import { CycleManagementModal } from './components/CycleManagementModal';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { NewGarmentModal } from './components/NewGarmentModal';
import { NewMaterialModal } from './components/NewMaterialModal';
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

  // Main Domain State
  const [garments, setGarments] = useState<Garment[]>(initialGarments);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>(initialRawMaterials);
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>(sampleSalesRecords);
  const [cycleConfig, setCycleConfig] = useState<ProductionCycleConfig>(initialCycleConfig);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(initialPurchaseOrders);

  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isCSVModalOpen, setIsCSVModalOpen] = useState<boolean>(false);
  const [isCycleModalOpen, setIsCycleModalOpen] = useState<boolean>(false);
  const [isPOModalOpen, setIsPOModalOpen] = useState<boolean>(false);
  const [isAIAdvisorOpen, setIsAIAdvisorOpen] = useState<boolean>(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isNewGarmentOpen, setIsNewGarmentOpen] = useState<boolean>(false);
  const [isNewMaterialOpen, setIsNewMaterialOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState<boolean>(false);

  // Raw Materials Catalog Filter State
  const [materialSearch, setMaterialSearch] = useState('');
  const [materialCatFilter, setMaterialCatFilter] = useState('ALL');

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

  const handleAddGarment = (newGarment: Garment) => {
    setGarments((prev) => [newGarment, ...prev]);
  };

  const handleAddMaterial = (newMaterial: RawMaterial) => {
    setRawMaterials((prev) => [newMaterial, ...prev]);
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
    if (confirm('¿Desea restaurar todos los datos demo de confección y fichas técnicas?')) {
      setGarments(initialGarments);
      setRawMaterials(initialRawMaterials);
      setSalesRecords(sampleSalesRecords);
      setCycleConfig(initialCycleConfig);
      setPurchaseOrders(initialPurchaseOrders);
      setUsers(INITIAL_USERS);
      setCurrentUser(INITIAL_USERS[0]);
      localStorage.removeItem('textiliq_users');
      localStorage.removeItem('textiliq_current_user');
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

  // Filtered raw materials catalog
  const filteredCatalogMaterials = useMemo(() => {
    return rawMaterials.filter((m) => {
      const matchSearch =
        materialSearch === '' ||
        m.name.toLowerCase().includes(materialSearch.toLowerCase()) ||
        m.sku.toLowerCase().includes(materialSearch.toLowerCase()) ||
        m.supplierName.toLowerCase().includes(materialSearch.toLowerCase());
      const matchCat = materialCatFilter === 'ALL' || m.category === materialCatFilter;
      return matchSearch && matchCat;
    });
  }, [rawMaterials, materialSearch, materialCatFilter]);

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
                onFilterStatus={(status) => {
                  setStatusFilter(status);
                  setActiveTab('mrp_calculator');
                }}
                onOpenAIAdvisor={() => setIsAIAdvisorOpen(true)}
                onOpenPOModal={() => setIsPOModalOpen(true)}
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
              onUpdateGarment={handleUpdateGarmentFull}
              onOpenNewGarmentModal={() => setIsNewGarmentOpen(true)}
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
            <div className="bg-white rounded-xl border border-[#E6E1D8] shadow-xs overflow-hidden">
              <div className="p-5 border-b border-[#E6E1D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FCFBF9]">
                <div>
                  <h3 className="text-base font-bold text-[#1C211D] flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#3A5A40]" />
                    Maestro de Inventario de Materias Primas & Telas
                  </h3>
                  <p className="text-xs text-[#5F6B61] mt-0.5">
                    Control central de telas, avíos, botones, cremalleras, hilos y costos unitarios.
                  </p>
                </div>

                <button
                  onClick={() => setIsNewMaterialOpen(true)}
                  className="px-3.5 py-2 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                  id="btn-add-raw-material-modal"
                >
                  <Plus className="w-4 h-4" />
                  Nueva Materia Prima
                </button>
              </div>

              {/* Catalog Filters */}
              <div className="p-4 bg-[#FAF8F5] border-b border-[#E6E1D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-[#8F9990] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar insumo por SKU, nombre o proveedor..."
                    value={materialSearch}
                    onChange={(e) => setMaterialSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-white border border-[#D5CEC2] rounded-lg text-xs text-[#1C211D] placeholder-[#8F9990] focus:ring-1 focus:ring-[#3A5A40]"
                  />
                </div>

                <select
                  value={materialCatFilter}
                  onChange={(e) => setMaterialCatFilter(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-[#D5CEC2] rounded-lg text-xs font-medium text-[#1C211D] focus:ring-1 focus:ring-[#3A5A40]"
                >
                  <option value="ALL">Todas las Categorías</option>
                  <option value="Tela">Telas / Tejidos</option>
                  <option value="Avío / Fornitura">Avíos / Fornituras</option>
                  <option value="Hilo">Hilos / Hilados</option>
                  <option value="Entretela">Entretelas</option>
                  <option value="Empaque / Etiqueta">Empaque / Etiquetas</option>
                </select>
              </div>

              {/* Catalog Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] text-[#5F6B61] font-bold border-b border-[#E6E1D8] text-[10px] uppercase">
                    <tr>
                      <th className="p-3">SKU</th>
                      <th className="p-3">Materia Prima</th>
                      <th className="p-3">Categoría</th>
                      <th className="p-3 text-right">Stock Actual</th>
                      <th className="p-3 text-right">En Tránsito</th>
                      <th className="p-3 text-right">MOQ Proveedor</th>
                      <th className="p-3 text-right">Costo Unitario</th>
                      <th className="p-3 text-center">Proveedor & Lead Time</th>
                      <th className="p-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2EEE6]">
                    {filteredCatalogMaterials.map((mat) => (
                      <tr key={mat.id} className="hover:bg-[#FAF8F5]">
                        <td className="p-3 font-mono text-[11px] font-semibold text-[#5F6B61]">
                          {mat.sku}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-[#1C211D]">{mat.name}</div>
                          {mat.color && (
                            <div className="text-[10px] text-[#5F6B61]">Color: {mat.color}</div>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-[#F2EEE6] text-[#5F6B61] rounded text-[10px] font-medium">
                            {mat.category}
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-[#1C211D]">
                          {mat.currentStock.toLocaleString()} {mat.unit}
                        </td>
                        <td className="p-3 text-right text-[#3A5A40] font-medium">
                          {mat.inTransitStock.toLocaleString()} {mat.unit}
                        </td>
                        <td className="p-3 text-right text-[#5F6B61]">
                          {mat.minOrderQuantity} {mat.unit}
                        </td>
                        <td className="p-3 text-right font-bold text-[#1C211D]">
                          {formatCOP(mat.unitCost, false)} / {mat.unit}
                        </td>
                        <td className="p-3 text-center">
                          <div className="font-semibold text-[#1C211D]">{mat.supplierName}</div>
                          <div className="text-[10px] text-[#5F6B61] flex items-center justify-center gap-1">
                            <Clock className="w-3 h-3" />
                            {mat.leadTimeDays} días
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDeleteMaterial(mat.id)}
                            className="p-1 text-[#8F9990] hover:text-[#B33927] rounded transition-colors"
                            title="Eliminar insumo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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

      <NewGarmentModal
        isOpen={isNewGarmentOpen}
        onClose={() => setIsNewGarmentOpen(false)}
        rawMaterials={rawMaterials}
        onAddGarment={handleAddGarment}
      />

      <NewMaterialModal
        isOpen={isNewMaterialOpen}
        onClose={() => setIsNewMaterialOpen(false)}
        onAddMaterial={handleAddMaterial}
      />
    </div>
  );
}
