import React, { useState } from 'react';
import {
  Layers,
  Calendar,
  Sparkles,
  Upload,
  RefreshCw,
  ShoppingCart,
  Sliders,
  Scissors,
  Package,
  LayoutDashboard,
  ShieldCheck,
  User,
  Users,
  LogOut,
  Lock,
  ChevronDown,
  Key,
} from 'lucide-react';
import { ProductionCycleConfig, AppUser } from '../types';
import { ROLE_LABELS, hasPermission } from '../utils/permissions';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cycleConfig: ProductionCycleConfig;
  currentUser: AppUser | null;
  onOpenCycleModal: () => void;
  onOpenCSVModal: () => void;
  onOpenAIAdvisor: () => void;
  onOpenSimulator: () => void;
  onOpenPOModal: () => void;
  onOpenLoginModal: () => void;
  onOpenUserManagementModal: () => void;
  criticalCount: number;
  onResetDemoData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  cycleConfig,
  currentUser,
  onOpenCycleModal,
  onOpenCSVModal,
  onOpenAIAdvisor,
  onOpenSimulator,
  onOpenPOModal,
  onOpenLoginModal,
  onOpenUserManagementModal,
  criticalCount,
  onResetDemoData,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);

  const roleMeta = currentUser ? ROLE_LABELS[currentUser.role] || ROLE_LABELS.Personalizado : null;
  const canManageUsers = hasPermission(currentUser, 'manage_users');
  const canManageCycles = hasPermission(currentUser, 'manage_production_cycles');
  const canViewPOs = hasPermission(currentUser, 'view_mrp') || hasPermission(currentUser, 'manage_purchase_orders');
  const canImportCSV = hasPermission(currentUser, 'import_export_csv');

  return (
    <header className="bg-[#FFFFFF] border-b border-[#E6E1D8] sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#3A5A40] flex items-center justify-center text-white shadow-xs">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-[#1C211D]">TextilIQ</span>
                <span className="px-2 py-0.5 bg-[#EBF2EC] text-[#3A5A40] text-[10px] font-bold rounded-full uppercase tracking-wider border border-[#D4E3D7]">
                  Demand & Inventory
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 bg-[#E4ECE6] text-[#2D4736] text-[10px] font-bold rounded-full uppercase tracking-wider border border-[#CDDCD0]">
                  Live Analysis
                </span>
              </div>
              <p className="text-[11px] text-[#5F6B61] hidden md:block">
                Plataforma Textil MRP & Inteligencia de Demanda Comercial en Colombia
              </p>
            </div>
          </div>

          {/* Active Cycle Badge */}
          <div className="hidden xl:flex items-center bg-[#FAF8F5] rounded-lg px-3 py-1.5 border border-[#E6E1D8]">
            <Calendar className="w-3.5 h-3.5 text-[#3A5A40] mr-2" />
            <span className="text-xs text-[#5F6B61] mr-1.5 font-medium">Ciclo Activo:</span>
            <span className="text-xs font-semibold text-[#1C211D] mr-2.5">
              {cycleConfig.durationMonths} Meses ({cycleConfig.name})
            </span>
            {canManageCycles && (
              <button
                onClick={onOpenCycleModal}
                className="text-[11px] font-semibold text-[#3A5A40] hover:text-[#2D4632] bg-white border border-[#E6E1D8] hover:border-[#D5CEC2] px-2 py-0.5 rounded shadow-2xs transition-colors flex items-center gap-1"
                id="header-edit-cycle-btn"
              >
                <Sliders className="w-3 h-3" />
                Ajustar
              </button>
            )}
          </div>

          {/* Action Toolbar & User Session */}
          <div className="flex items-center space-x-2">
            {/* AI Advisor Button */}
            <button
              onClick={onOpenAIAdvisor}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3A5A40] hover:bg-[#2D4632] text-white text-xs font-semibold shadow-xs transition-colors"
              id="header-ai-advisor-btn"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>IA Asesor</span>
            </button>

            {/* What-If Simulator Button */}
            {canManageCycles && (
              <button
                onClick={onOpenSimulator}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  cycleConfig.scenarioMultiplier !== 1.0
                    ? 'bg-[#FDF8EE] text-[#82530C] border-[#F7E4BF]'
                    : 'bg-white hover:bg-[#FAF8F5] text-[#1C211D] border-[#E6E1D8]'
                }`}
                id="header-simulator-btn"
              >
                <Sliders className="w-3.5 h-3.5 text-[#3A5A40]" />
                <span>Simulador</span>
              </button>
            )}

            {/* Purchase Orders Button */}
            {canViewPOs && (
              <button
                onClick={onOpenPOModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#FAF8F5] text-[#1C211D] text-xs font-medium border border-[#E6E1D8] transition-colors"
                id="header-pos-btn"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-[#5F6B61]" />
                <span className="hidden sm:inline">Órdenes</span>
              </button>
            )}

            {/* CSV Import Button */}
            {canImportCSV && (
              <button
                onClick={onOpenCSVModal}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#FAF8F5] text-[#1C211D] text-xs font-medium border border-[#E6E1D8] transition-colors"
                id="header-csv-hub-btn"
              >
                <Upload className="w-3.5 h-3.5 text-[#3A5A40]" />
                <span>CSV</span>
              </button>
            )}

            {/* Reset Demo Data Button */}
            <button
              onClick={onResetDemoData}
              title="Restaurar datos demo"
              className="p-1.5 rounded-lg bg-white hover:bg-[#FAF8F5] text-[#5F6B61] hover:text-[#1C211D] border border-[#E6E1D8] transition-colors"
              id="header-reset-demo-btn"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* USER PROFILE & PERMISSIONS POPOVER */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl border border-[#E6E1D8] hover:border-[#D5CEC2] bg-[#FAF8F5] hover:bg-white transition-all shadow-2xs group"
                  id="header-user-profile-btn"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-2xs"
                    style={{ backgroundColor: currentUser.avatarColor || roleMeta?.color || '#3A5A40' }}
                  >
                    {currentUser.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>

                  <div className="text-left hidden md:block">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-[#1C211D] leading-none">
                        {currentUser.name.split(' ')[0]}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${roleMeta?.badgeBg}`}
                      >
                        {roleMeta?.title.split(' ')[0]}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#5F6B61] leading-none block mt-0.5">
                      {currentUser.position}
                    </span>
                  </div>

                  <ChevronDown className="w-3.5 h-3.5 text-[#8F9990] group-hover:text-[#1C211D] transition-colors" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-[#E6E1D8] shadow-xl z-50 p-3 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                      {/* User Info Header */}
                      <div className="pb-3 border-b border-[#E6E1D8]">
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-xs"
                            style={{ backgroundColor: currentUser.avatarColor || roleMeta?.color }}
                          >
                            {currentUser.name
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#1C211D]">{currentUser.name}</p>
                            <p className="text-[10px] text-[#5F6B61] font-mono">@{currentUser.username}</p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block ${roleMeta?.badgeBg}`}
                          >
                            {roleMeta?.title}
                          </div>
                          <p className="text-[11px] text-[#5F6B61]">{currentUser.department}</p>
                          <p className="text-[10px] text-[#8F9990]">
                            Permisos asignados: <strong>{currentUser.permissions.length} módulos</strong>
                          </p>
                        </div>
                      </div>

                      {/* Menu Actions */}
                      <div className="space-y-1 text-xs">
                        {canManageUsers && (
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onOpenUserManagementModal();
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#EBF2EC] text-[#233829] font-bold flex items-center gap-2 transition-colors"
                          >
                            <Users className="w-4 h-4 text-[#3A5A40]" />
                            Gestión de Personal & Permisos
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenLoginModal();
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#FAF8F5] text-[#1C211D] font-semibold flex items-center gap-2 transition-colors"
                        >
                          <Key className="w-4 h-4 text-[#5F6B61]" />
                          Cambiar de Usuario / Iniciar Sesión
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-t border-[#E6E1D8] pt-1.5 pb-2 overflow-x-auto">
          <nav className="flex space-x-1 sm:space-x-2">
            {/* Dashboard */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-[#EBF2EC] text-[#233829] font-bold'
                  : 'text-[#5F6B61] hover:text-[#1C211D] hover:bg-[#FAF8F5]'
              }`}
              id="nav-tab-dashboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
              {!hasPermission(currentUser, 'view_dashboard') && (
                <Lock className="w-3 h-3 text-[#8F9990]" />
              )}
            </button>

            {/* Explosión MRP */}
            <button
              onClick={() => setActiveTab('mrp_calculator')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'mrp_calculator'
                  ? 'bg-[#EBF2EC] text-[#233829] font-bold'
                  : 'text-[#5F6B61] hover:text-[#1C211D] hover:bg-[#FAF8F5]'
              }`}
              id="nav-tab-mrp"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Explosión MRP</span>
              {!hasPermission(currentUser, 'view_mrp') ? (
                <Lock className="w-3 h-3 text-[#8F9990]" />
              ) : (
                criticalCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-[#B33927] text-white text-[10px] font-bold rounded-full">
                    {criticalCount}
                  </span>
                )
              )}
            </button>

            {/* Fichas Técnicas (BOM) */}
            <button
              onClick={() => setActiveTab('fichas_tecnicas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'fichas_tecnicas'
                  ? 'bg-[#EBF2EC] text-[#233829] font-bold'
                  : 'text-[#5F6B61] hover:text-[#1C211D] hover:bg-[#FAF8F5]'
              }`}
              id="nav-tab-bom"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Fichas Técnicas (BOM)</span>
              {!hasPermission(currentUser, 'view_tech_packs') && (
                <Lock className="w-3 h-3 text-[#8F9990]" />
              )}
            </button>

            {/* Metas & Ciclos */}
            <button
              onClick={() => setActiveTab('metas_ventas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'metas_ventas'
                  ? 'bg-[#EBF2EC] text-[#233829] font-bold'
                  : 'text-[#5F6B61] hover:text-[#1C211D] hover:bg-[#FAF8F5]'
              }`}
              id="nav-tab-forecasting"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Metas & Ciclos</span>
              {!hasPermission(currentUser, 'view_demand_forecast') && (
                <Lock className="w-3 h-3 text-[#8F9990]" />
              )}
            </button>

            {/* Inventario Insumos */}
            <button
              onClick={() => setActiveTab('inventario_materiales')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'inventario_materiales'
                  ? 'bg-[#EBF2EC] text-[#233829] font-bold'
                  : 'text-[#5F6B61] hover:text-[#1C211D] hover:bg-[#FAF8F5]'
              }`}
              id="nav-tab-materials"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Inventario Insumos</span>
              {!hasPermission(currentUser, 'view_mrp') && (
                <Lock className="w-3 h-3 text-[#8F9990]" />
              )}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
