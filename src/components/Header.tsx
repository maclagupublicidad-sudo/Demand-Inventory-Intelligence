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
  Users,
  Lock,
  ChevronDown,
  Key,
  Menu,
  X,
  ShieldCheck,
  Factory,
  Activity,
  Building,
  BarChart3,
  Plus,
  ArrowRight,
  Database,
} from 'lucide-react';
import { ProductionCycleConfig, AppUser, CompanyTenant } from '../types';
import { ROLE_LABELS, hasPermission } from '../utils/permissions';
import { SEASONS_CONFIG, SeasonType } from '../utils/seasonality';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cycleConfig: ProductionCycleConfig;
  currentUser: AppUser | null;
  companies: CompanyTenant[];
  activeCompanyId: string;
  onSelectCompany: (companyId: string) => void;
  onOpenCompanyManager: () => void;
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
  companies,
  activeCompanyId,
  onSelectCompany,
  onOpenCompanyManager,
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
  const [isCompanyMenuOpen, setIsCompanyMenuOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const activeCompany = companies.find((c) => c.id === activeCompanyId) || companies[0];

  const roleMeta = currentUser ? ROLE_LABELS[currentUser.role] || ROLE_LABELS.Personalizado : null;
  const canManageUsers = hasPermission(currentUser, 'manage_users');
  const canManageCompanies = hasPermission(currentUser, 'manage_companies');
  const canManageCycles = hasPermission(currentUser, 'manage_production_cycles');
  const canViewPOs = hasPermission(currentUser, 'view_mrp') || hasPermission(currentUser, 'manage_purchase_orders');
  const canImportCSV = hasPermission(currentUser, 'import_export_csv');

  const currentSeason = (cycleConfig.season || 'inicio_ano_escolar') as SeasonType;
  const seasonInfo = SEASONS_CONFIG[currentSeason] || SEASONS_CONFIG.general;

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-[#FFFFFF] border-b border-[#E6E1D8] sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Logo & Company Selector */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#3A5A40] flex items-center justify-center text-white shadow-xs shrink-0">
              <Scissors className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-[#1C211D] truncate">
                  TextilIQ
                </span>
                <span className="px-1.5 sm:px-2 py-0.5 bg-[#EBF2EC] text-[#3A5A40] text-[9px] sm:text-[10px] font-bold rounded-full uppercase tracking-wider border border-[#D4E3D7] whitespace-nowrap">
                  Multi-Tenant
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#5F6B61] hidden lg:block truncate">
                MRP, Fichas Técnicas & Analítica Comparativa Textil
              </p>
            </div>

            {/* Active Company Selector Dropdown */}
            <div className="relative ml-1 sm:ml-2">
              <button
                onClick={() => setIsCompanyMenuOpen(!isCompanyMenuOpen)}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-xl border border-[#D5CEC2] hover:border-[#3A5A40] bg-[#FAF8F5] hover:bg-white transition-all shadow-2xs cursor-pointer group"
                id="header-company-selector-btn"
                title="Cambiar empresa activa o registrar nueva"
              >
                <div
                  className="w-5 h-5 rounded-md text-white text-[10px] font-black flex items-center justify-center shadow-2xs shrink-0"
                  style={{ backgroundColor: activeCompany?.brandColor || '#3A5A40' }}
                >
                  {activeCompany?.name.substring(0, 2).toUpperCase() || 'EM'}
                </div>
                <div className="text-left hidden sm:block max-w-[120px] md:max-w-[170px] truncate">
                  <span className="text-xs font-bold text-[#1C211D] block truncate leading-none">
                    {activeCompany?.name || 'Seleccionar Empresa'}
                  </span>
                  <span className="text-[9px] text-[#5F6B61] truncate block leading-tight mt-0.5 font-mono">
                    {activeCompany?.city ? `${activeCompany.city.split(',')[0]}` : 'Colombia'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#8F9990] group-hover:text-[#1C211D] transition-colors shrink-0" />
              </button>

              {/* Company Dropdown Menu */}
              {isCompanyMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsCompanyMenuOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl border border-[#E6E1D8] shadow-2xl z-50 p-3 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2 py-1.5 border-b border-[#E6E1D8] flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-[#1C211D] block">Empresas Registradas</span>
                        <span className="text-[10px] text-[#5F6B61]">Selecciona tu espacio de trabajo</span>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#EBF3ED] text-[#2D4632]">
                        {companies.length}
                      </span>
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-1">
                      {companies.map((comp) => {
                        const isSelected = comp.id === activeCompanyId;
                        return (
                          <button
                            key={comp.id}
                            onClick={() => {
                              onSelectCompany(comp.id);
                              setIsCompanyMenuOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#EBF2EC] text-[#233829] font-bold'
                                : 'hover:bg-[#FAF8F5] text-[#1C211D]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <div
                                className="w-6 h-6 rounded-lg text-white text-[10px] font-bold flex items-center justify-center shrink-0"
                                style={{ backgroundColor: comp.brandColor || '#3A5A40' }}
                              >
                                {comp.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate leading-tight">{comp.name}</p>
                                <p className="text-[10px] text-[#5F6B61] truncate font-mono">
                                  NIT: {comp.nit} • {comp.specialty}
                                </p>
                              </div>
                            </div>
                            {isSelected && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#3A5A40] text-white shrink-0">
                                Activa
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-2 border-t border-[#E6E1D8] space-y-1">
                      <button
                        onClick={() => {
                          setIsCompanyMenuOpen(false);
                          onOpenCompanyManager();
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#EAE6DF] text-[#1C211D] text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
                        id="header-open-company-manager-btn"
                      >
                        <span className="flex items-center gap-2">
                          <Building className="w-3.5 h-3.5 text-[#3A5A40]" />
                          Administrar / Registrar Empresas
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#5F6B61]" />
                      </button>

                      <button
                        onClick={() => {
                          setIsCompanyMenuOpen(false);
                          setActiveTab('benchmark');
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-[#FAF8F5] text-[#1C211D] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                        id="header-go-to-benchmark-btn"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-[#1E40AF]" />
                        Ver Comparativo Inter-Empresas
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Active Cycle Badge (Desktop / Tablet) */}
          <div className="hidden lg:flex items-center bg-[#FAF8F5] rounded-lg px-2.5 py-1 border border-[#E6E1D8] text-xs">
            <Calendar className="w-3.5 h-3.5 text-[#3A5A40] mr-1.5 shrink-0" />
            <span className="text-[#5F6B61] mr-1 font-medium hidden xl:inline">Ciclo:</span>
            <span className="font-semibold text-[#1C211D] mr-2 truncate max-w-[150px] xl:max-w-[200px]">
              {cycleConfig.durationMonths}m • {seasonInfo.name.split(' ')[0]}
            </span>
            {canManageCycles && (
              <button
                onClick={onOpenCycleModal}
                className="text-[10px] font-bold text-[#3A5A40] hover:text-[#2D4632] bg-white border border-[#E6E1D8] hover:border-[#D5CEC2] px-1.5 py-0.5 rounded shadow-2xs transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                id="header-edit-cycle-btn"
              >
                <Sliders className="w-2.5 h-2.5" />
                Ajustar
              </button>
            )}
          </div>

          {/* Action Toolbar & User Session */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* AI Advisor Button */}
            <button
              onClick={onOpenAIAdvisor}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#3A5A40] hover:bg-[#2D4632] active:scale-95 text-white text-xs font-semibold shadow-xs transition-all touch-manipulation cursor-pointer"
              id="header-ai-advisor-btn"
              title="Consultar Asesor IA Textil"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200 shrink-0" />
              <span className="hidden xs:inline sm:inline">IA Asesor</span>
            </button>

            {/* What-If Simulator Button (Desktop / Tablet) */}
            {canManageCycles && (
              <button
                onClick={onOpenSimulator}
                className={`hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors touch-manipulation cursor-pointer ${
                  cycleConfig.scenarioMultiplier !== 1.0
                    ? 'bg-[#FDF8EE] text-[#82530C] border-[#F7E4BF]'
                    : 'bg-white hover:bg-[#FAF8F5] text-[#1C211D] border-[#E6E1D8]'
                }`}
                id="header-simulator-btn"
              >
                <Sliders className="w-3.5 h-3.5 text-[#3A5A40]" />
                <span className="hidden lg:inline">Simulador</span>
              </button>
            )}

            {/* Purchase Orders Button */}
            {canViewPOs && (
              <button
                onClick={onOpenPOModal}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white hover:bg-[#FAF8F5] active:scale-95 text-[#1C211D] text-xs font-medium border border-[#E6E1D8] transition-all touch-manipulation cursor-pointer"
                id="header-pos-btn"
                title="Gestión de Órdenes de Compra"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-[#5F6B61]" />
                <span className="hidden md:inline">Órdenes</span>
              </button>
            )}

            {/* CSV Import Button (Desktop) */}
            {canImportCSV && (
              <button
                onClick={onOpenCSVModal}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#FAF8F5] text-[#1C211D] text-xs font-medium border border-[#E6E1D8] transition-colors cursor-pointer"
                id="header-csv-hub-btn"
                title="Centro de Importación y Exportación CSV"
              >
                <Upload className="w-3.5 h-3.5 text-[#3A5A40]" />
                <span>CSV</span>
              </button>
            )}

            {/* Reset Demo Data Button */}
            <button
              onClick={onResetDemoData}
              title="Restaurar datos de empresa activa"
              className="p-1.5 rounded-lg bg-white hover:bg-[#FAF8F5] active:scale-95 text-[#5F6B61] hover:text-[#1C211D] border border-[#E6E1D8] transition-all touch-manipulation cursor-pointer"
              id="header-reset-demo-btn"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* USER PROFILE & PERMISSIONS POPOVER */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 p-1 sm:pl-2 sm:pr-2.5 sm:py-1 rounded-xl border border-[#E6E1D8] hover:border-[#D5CEC2] bg-[#FAF8F5] hover:bg-white active:scale-95 transition-all shadow-2xs group touch-manipulation cursor-pointer"
                  id="header-user-profile-btn"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-2xs shrink-0"
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
                      <span className="text-xs font-bold text-[#1C211D] leading-none truncate max-w-[90px]">
                        {currentUser.name.split(' ')[0]}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${roleMeta?.badgeBg}`}
                      >
                        {roleMeta?.title.split(' ')[0]}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#5F6B61] leading-none block mt-0.5 truncate max-w-[120px]">
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
                    <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl border border-[#E6E1D8] shadow-2xl z-50 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                      {/* User Info Header */}
                      <div className="pb-3 border-b border-[#E6E1D8]">
                        <div className="flex items-center gap-2.5 mb-2">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-xs shrink-0"
                            style={{ backgroundColor: currentUser.avatarColor || roleMeta?.color }}
                          >
                            {currentUser.name
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#1C211D] truncate">{currentUser.name}</p>
                            <p className="text-[10px] text-[#5F6B61] font-mono">@{currentUser.username}</p>
                          </div>
                        </div>

                        <div className="space-y-1 bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EAE6DF]">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-[#5F6B61] font-medium">Rol Asignado:</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${roleMeta?.badgeBg}`}
                            >
                              {roleMeta?.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#5F6B61]">Área: <strong>{currentUser.department}</strong></p>
                          <p className="text-[10px] text-[#8F9990]">
                            Permisos activos: <strong>{currentUser.permissions.length} módulos</strong>
                          </p>
                        </div>
                      </div>

                      {/* Menu Actions */}
                      <div className="space-y-1 text-xs">
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenCompanyManager();
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FAF8F5] text-[#1C211D] font-bold flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <Building className="w-4 h-4 text-[#3A5A40]" />
                          Gestión de Empresas & Sedes
                        </button>

                        {canManageUsers && (
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onOpenUserManagementModal();
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#EBF2EC] text-[#233829] font-bold flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Users className="w-4 h-4 text-[#3A5A40]" />
                            Personal & Control de Acceso
                          </button>
                        )}

                        {canImportCSV && (
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onOpenCSVModal();
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FAF8F5] text-[#1C211D] font-semibold flex items-center gap-2.5 transition-colors lg:hidden cursor-pointer"
                          >
                            <Upload className="w-4 h-4 text-[#3A5A40]" />
                            Centro de Datos CSV
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenLoginModal();
                          }}
                          className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#FAF8F5] text-[#1C211D] font-semibold flex items-center gap-2.5 transition-colors border-t border-[#F2EEE6] mt-1 pt-2 cursor-pointer"
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

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-lg border border-[#E6E1D8] text-[#5F6B61] hover:text-[#1C211D] hover:bg-[#FAF8F5] md:hidden transition-colors cursor-pointer"
              aria-label="Abrir menú de navegación"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Tab Navigation (Desktop / Tablet Scrollable Tabs) */}
        <div className="hidden md:flex items-center justify-between border-t border-[#E6E1D8] pt-1.5 pb-2 overflow-x-auto scrollbar-none">
          <nav className="flex space-x-1 sm:space-x-1.5">
            {/* Dashboard */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-[#EBF2EC] text-[#233829] font-bold shadow-2xs'
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'mrp_calculator'
                  ? 'bg-[#EBF2EC] text-[#233829] font-bold shadow-2xs'
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
                  <span className="ml-1 px-1.5 py-0.2 bg-[#B33927] text-white text-[10px] font-bold rounded-full animate-pulse">
                    {criticalCount}
                  </span>
                )
              )}
            </button>

            {/* Fichas Técnicas (BOM) */}
            <button
              onClick={() => setActiveTab('fichas_tecnicas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'fichas_tecnicas'
                  ? 'bg-[#EBF2EC] text-[#233829] font-bold shadow-2xs'
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'metas_ventas'
                  ? 'bg-[#EBF2EC] text-[#233829] font-bold shadow-2xs'
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'inventario_materiales'
                  ? 'bg-[#EBF2EC] text-[#233829] font-bold shadow-2xs'
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

            {/* Ejecución en Planta & Analítica Temporal (MES) */}
            <button
              onClick={() => setActiveTab('execution')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'execution'
                  ? 'bg-[#EBF2EC] text-[#233829] font-bold shadow-2xs'
                  : 'text-[#5F6B61] hover:text-[#1C211D] hover:bg-[#FAF8F5]'
              }`}
              id="nav-tab-execution"
            >
              <Factory className="w-3.5 h-3.5" />
              <span>Ejecución en Planta</span>
              <span className="flex h-2 w-2 relative ml-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              {!hasPermission(currentUser, 'view_production_execution') && (
                <Lock className="w-3 h-3 text-[#8F9990]" />
              )}
            </button>

            {/* Comparativo Inter-Empresas & Benchmarking */}
            <button
              onClick={() => setActiveTab('benchmark')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'benchmark'
                  ? 'bg-[#EBF2EC] text-[#233829] font-bold shadow-2xs ring-1 ring-[#C8DEC9]'
                  : 'text-[#5F6B61] hover:text-[#1C211D] hover:bg-[#FAF8F5]'
              }`}
              id="nav-tab-benchmark"
            >
              <BarChart3 className="w-3.5 h-3.5 text-[#1E40AF]" />
              <span>Comparativo & Benchmark</span>
              <span className="px-1.5 py-0.2 bg-[#FAF8F5] border border-[#E6E1D8] text-[9px] font-bold rounded-full text-[#4A544C]">
                {companies.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Mobile Dropdown Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[#E6E1D8] py-3 space-y-2 animate-in slide-in-from-top-2 duration-150">
            {/* Quick Company Info on Mobile */}
            <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#E6E1D8] flex items-center justify-between text-xs mb-2">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <Building className="w-4 h-4 text-[#3A5A40] shrink-0" />
                <div className="min-w-0">
                  <p className="font-bold text-[#1C211D] truncate leading-none">
                    {activeCompany.name}
                  </p>
                  <p className="text-[10px] text-[#5F6B61] mt-0.5 truncate font-mono">
                    NIT: {activeCompany.nit} • {activeCompany.specialty}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenCompanyManager();
                }}
                className="px-2 py-1 bg-white border border-[#D5CEC2] rounded-lg text-[10px] font-bold text-[#3A5A40] shrink-0 cursor-pointer"
              >
                Cambiar
              </button>
            </div>

            {/* Mobile Nav Links */}
            <div className="grid grid-cols-1 gap-1">
              <button
                onClick={() => handleNavClick('dashboard')}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-[#EBF2EC] text-[#233829]'
                    : 'text-[#5F6B61] hover:bg-[#FAF8F5]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4 text-[#3A5A40]" />
                  Panel Principal (Dashboard)
                </span>
              </button>

              <button
                onClick={() => handleNavClick('mrp_calculator')}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                  activeTab === 'mrp_calculator'
                    ? 'bg-[#EBF2EC] text-[#233829]'
                    : 'text-[#5F6B61] hover:bg-[#FAF8F5]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-[#3A5A40]" />
                  Explosión de Requerimientos MRP
                </span>
                {criticalCount > 0 && (
                  <span className="px-2 py-0.5 bg-[#B33927] text-white text-[10px] font-bold rounded-full">
                    {criticalCount} críticos
                  </span>
                )}
              </button>

              <button
                onClick={() => handleNavClick('fichas_tecnicas')}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                  activeTab === 'fichas_tecnicas'
                    ? 'bg-[#EBF2EC] text-[#233829]'
                    : 'text-[#5F6B61] hover:bg-[#FAF8F5]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Scissors className="w-4 h-4 text-[#3A5A40]" />
                  Fichas Técnicas & Tiempos SAM
                </span>
              </button>

              <button
                onClick={() => handleNavClick('metas_ventas')}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                  activeTab === 'metas_ventas'
                    ? 'bg-[#EBF2EC] text-[#233829]'
                    : 'text-[#5F6B61] hover:bg-[#FAF8F5]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-[#3A5A40]" />
                  Metas de Demanda & Temporadas
                </span>
              </button>

              <button
                onClick={() => handleNavClick('inventario_materiales')}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                  activeTab === 'inventario_materiales'
                    ? 'bg-[#EBF2EC] text-[#233829]'
                    : 'text-[#5F6B61] hover:bg-[#FAF8F5]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-[#3A5A40]" />
                  Inventario de Materias Primas
                </span>
              </button>

              <button
                onClick={() => handleNavClick('execution')}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                  activeTab === 'execution'
                    ? 'bg-[#EBF2EC] text-[#233829]'
                    : 'text-[#5F6B61] hover:bg-[#FAF8F5]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Factory className="w-4 h-4 text-[#3A5A40]" />
                  Ejecución en Planta & Analítica
                </span>
              </button>

              <button
                onClick={() => handleNavClick('benchmark')}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                  activeTab === 'benchmark'
                    ? 'bg-[#EBF2EC] text-[#233829]'
                    : 'text-[#5F6B61] hover:bg-[#FAF8F5]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-[#1E40AF]" />
                  Comparativo Inter-Empresas
                </span>
                <span className="px-2 py-0.5 bg-[#FAF8F5] border border-[#E6E1D8] text-[10px] font-bold rounded-full">
                  {companies.length} sedes
                </span>
              </button>
            </div>

            {/* Extra Mobile Actions */}
            <div className="pt-2 border-t border-[#E6E1D8] flex items-center gap-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenCompanyManager();
                }}
                className="flex-1 py-2 bg-white border border-[#D5CEC2] rounded-lg text-xs font-bold text-[#1C211D] flex items-center justify-center gap-1.5"
              >
                <Building className="w-3.5 h-3.5 text-[#3A5A40]" />
                Empresas
              </button>
              {canImportCSV && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenCSVModal();
                  }}
                  className="flex-1 py-2 bg-white border border-[#D5CEC2] rounded-lg text-xs font-bold text-[#1C211D] flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-[#3A5A40]" />
                  CSV Hub
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

