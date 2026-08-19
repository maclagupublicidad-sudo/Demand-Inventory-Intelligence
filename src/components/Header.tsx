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
    <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white shadow-xs">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-[#111827]">TextilIQ</span>
                <span className="px-2 py-0.5 bg-indigo-50 text-[#4F46E5] text-[10px] font-bold rounded-full uppercase tracking-wider border border-indigo-100">
                  Demand & Inventory
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  Live Analysis
                </span>
              </div>
              <p className="text-[11px] text-[#6B7280] hidden md:block">
                Plataforma de Inteligencia de Demanda, MRP & Control de Accesos
              </p>
            </div>
          </div>

          {/* Active Cycle Badge */}
          <div className="hidden xl:flex items-center bg-[#F9FAFB] rounded-lg px-3 py-1.5 border border-[#E5E7EB]">
            <Calendar className="w-3.5 h-3.5 text-[#4F46E5] mr-2" />
            <span className="text-xs text-[#6B7280] mr-1.5 font-medium">Ciclo Activo:</span>
            <span className="text-xs font-semibold text-[#111827] mr-2.5">
              {cycleConfig.durationMonths} Meses ({cycleConfig.name})
            </span>
            {canManageCycles && (
              <button
                onClick={onOpenCycleModal}
                className="text-[11px] font-semibold text-[#4F46E5] hover:text-[#4338CA] bg-white border border-[#E5E7EB] hover:border-[#D1D5DB] px-2 py-0.5 rounded shadow-2xs transition-colors flex items-center gap-1"
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold shadow-xs transition-colors"
              id="header-ai-advisor-btn"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>IA Asesor</span>
            </button>

            {/* What-If Simulator Button */}
            {canManageCycles && (
              <button
                onClick={onOpenSimulator}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  cycleConfig.scenarioMultiplier !== 1.0
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-white hover:bg-[#F9FAFB] text-[#374151] border-[#E5E7EB]'
                }`}
                id="header-simulator-btn"
              >
                <Sliders className="w-3.5 h-3.5 text-[#4F46E5]" />
                <span>Simulador</span>
              </button>
            )}

            {/* Purchase Orders Button */}
            {canViewPOs && (
              <button
                onClick={onOpenPOModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#F9FAFB] text-[#374151] hover:text-[#111827] text-xs font-medium border border-[#E5E7EB] transition-colors"
                id="header-pos-btn"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-[#6B7280]" />
                <span className="hidden sm:inline">Órdenes</span>
              </button>
            )}

            {/* CSV Import Button */}
            {canImportCSV && (
              <button
                onClick={onOpenCSVModal}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#F9FAFB] text-[#374151] hover:text-[#111827] text-xs font-medium border border-[#E5E7EB] transition-colors"
                id="header-csv-hub-btn"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>CSV</span>
              </button>
            )}

            {/* Reset Demo Data Button */}
            <button
              onClick={onResetDemoData}
              title="Restaurar datos demo"
              className="p-1.5 rounded-lg bg-white hover:bg-[#F9FAFB] text-[#6B7280] hover:text-[#111827] border border-[#E5E7EB] transition-colors"
              id="header-reset-demo-btn"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* USER PROFILE & PERMISSIONS POPOVER */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl border border-[#E5E7EB] hover:border-[#D1D5DB] bg-[#F9FAFB] hover:bg-white transition-all shadow-2xs group"
                  id="header-user-profile-btn"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-2xs"
                    style={{ backgroundColor: currentUser.avatarColor || roleMeta?.color || '#4F46E5' }}
                  >
                    {currentUser.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>

                  <div className="text-left hidden md:block">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-[#111827] leading-none">
                        {currentUser.name.split(' ')[0]}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${roleMeta?.badgeBg}`}
                      >
                        {roleMeta?.title.split(' ')[0]}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#6B7280] leading-none block mt-0.5">
                      {currentUser.position}
                    </span>
                  </div>

                  <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#111827] transition-colors" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-[#E5E7EB] shadow-xl z-50 p-3 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                      {/* User Info Header */}
                      <div className="pb-3 border-b border-[#E5E7EB]">
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
                            <p className="text-xs font-bold text-[#111827]">{currentUser.name}</p>
                            <p className="text-[10px] text-[#6B7280] font-mono">@{currentUser.username}</p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block ${roleMeta?.badgeBg}`}
                          >
                            {roleMeta?.title}
                          </div>
                          <p className="text-[11px] text-[#4B5563]">{currentUser.department}</p>
                          <p className="text-[10px] text-[#9CA3AF]">
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
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-indigo-50 text-indigo-700 font-bold flex items-center gap-2 transition-colors"
                          >
                            <Users className="w-4 h-4 text-[#4F46E5]" />
                            Gestión de Personal & Permisos
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenLoginModal();
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 text-[#374151] font-semibold flex items-center gap-2 transition-colors"
                        >
                          <Key className="w-4 h-4 text-[#6B7280]" />
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
        <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-1.5 pb-2 overflow-x-auto">
          <nav className="flex space-x-1 sm:space-x-2">
            {/* Dashboard */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-[#F3F4F6] text-[#4F46E5]'
                  : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB]'
              }`}
              id="nav-tab-dashboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
              {!hasPermission(currentUser, 'view_dashboard') && (
                <Lock className="w-3 h-3 text-[#9CA3AF]" />
              )}
            </button>

            {/* Explosión MRP */}
            <button
              onClick={() => setActiveTab('mrp_calculator')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'mrp_calculator'
                  ? 'bg-[#F3F4F6] text-[#4F46E5]'
                  : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB]'
              }`}
              id="nav-tab-mrp"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Explosión MRP</span>
              {!hasPermission(currentUser, 'view_mrp') ? (
                <Lock className="w-3 h-3 text-[#9CA3AF]" />
              ) : (
                criticalCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-bold rounded-full">
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
                  ? 'bg-[#F3F4F6] text-[#4F46E5]'
                  : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB]'
              }`}
              id="nav-tab-bom"
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Fichas Técnicas (BOM)</span>
              {!hasPermission(currentUser, 'view_tech_packs') && (
                <Lock className="w-3 h-3 text-[#9CA3AF]" />
              )}
            </button>

            {/* Metas & Ciclos */}
            <button
              onClick={() => setActiveTab('metas_ventas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'metas_ventas'
                  ? 'bg-[#F3F4F6] text-[#4F46E5]'
                  : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB]'
              }`}
              id="nav-tab-forecasting"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Metas & Ciclos</span>
              {!hasPermission(currentUser, 'view_demand_forecast') && (
                <Lock className="w-3 h-3 text-[#9CA3AF]" />
              )}
            </button>

            {/* Inventario Insumos */}
            <button
              onClick={() => setActiveTab('inventario_materiales')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'inventario_materiales'
                  ? 'bg-[#F3F4F6] text-[#4F46E5]'
                  : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB]'
              }`}
              id="nav-tab-materials"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Inventario Insumos</span>
              {!hasPermission(currentUser, 'view_mrp') && (
                <Lock className="w-3 h-3 text-[#9CA3AF]" />
              )}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
