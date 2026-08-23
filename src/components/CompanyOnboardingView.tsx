import React, { useState } from 'react';
import {
  Scissors,
  Building,
  User,
  Mail,
  Lock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  HelpCircle,
  Package,
  Factory,
  Database,
  RefreshCw,
} from 'lucide-react';
import { CompanyTenant, AppUser, ProductionCycleConfig } from '../types';

const TEXTILE_SPECIALTIES = [
  'Confección Infantil & Bebé',
  'Camisería & Moda Masculina',
  'Ropa Deportiva & Athleisure',
  'Pantalones & Jeanswear / Denim',
  'Vestidos & Moda Femenina',
  'Dotación Empresarial & Uniformes',
  'Ropa Interior & Corsetería',
  'Tejido de Punto & Suéteres',
  'Paquetería & Ropa de Hogar',
];

const COLOMBIAN_CITIES = [
  'Medellín, Antioquia',
  'Bogotá, D.C.',
  'Cali, Valle del Cauca',
  'Bucaramanga, Santander',
  'Ibagué, Tolima',
  'Pereira, Risaralda',
  'Barranquilla, Atlántico',
  'Cúcuta, Norte de Santander',
  'Manizales, Caldas',
];

const BRAND_COLORS = [
  '#3A5A40',
  '#1E40AF',
  '#B45309',
  '#4C1D95',
  '#BE123C',
  '#0F766E',
  '#374151',
  '#C2410C',
];

interface CompanyOnboardingViewProps {
  onRegisterCleanCompany: (company: CompanyTenant, adminUser: AppUser) => void;
  onLoadDemoMode: () => void;
  onOpenButtonTour: () => void;
}

export const CompanyOnboardingView: React.FC<CompanyOnboardingViewProps> = ({
  onRegisterCleanCompany,
  onLoadDemoMode,
  onOpenButtonTour,
}) => {
  // Form fields
  const [companyName, setCompanyName] = useState<string>('');
  const [brandName, setBrandName] = useState<string>('');
  const [nit, setNit] = useState<string>('');
  const [city, setCity] = useState<string>(COLOMBIAN_CITIES[0] || 'Medellín, Antioquia');
  const [specialty, setSpecialty] = useState<string>(TEXTILE_SPECIALTIES[0] || 'Confección Infantil');
  const [brandColor, setBrandColor] = useState<string>(BRAND_COLORS[0] || '#3A5A40');
  
  // Administrator User Fields
  const [adminName, setAdminName] = useState<string>('');
  const [adminRoleTitle, setAdminRoleTitle] = useState<string>('Gerente General & Operaciones');
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [adminPin, setAdminPin] = useState<string>('1234');

  // Cycle configuration
  const [cycleMonths, setCycleMonths] = useState<number>(3);
  const [cycleSeason, setCycleSeason] = useState<string>('inicio_ano_escolar');

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!companyName.trim()) {
      errors.companyName = 'Ingresa el nombre o razón social de la empresa.';
    }
    if (!nit.trim()) {
      errors.nit = 'Ingresa el NIT o documento tributario.';
    }
    if (!adminName.trim()) {
      errors.adminName = 'Ingresa el nombre del administrador responsable.';
    }
    if (!adminEmail.trim() || !adminEmail.includes('@')) {
      errors.adminEmail = 'Ingresa un correo electrónico corporativo válido.';
    }
    if (!adminPin.trim() || adminPin.length < 4) {
      errors.adminPin = 'El PIN o contraseña de acceso debe tener mínimo 4 dígitos.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const companyId = `comp-${Date.now()}`;
    const adminUserId = `user-admin-${Date.now()}`;

    const cycleConfig: ProductionCycleConfig = {
      id: `cycle-${Date.now()}`,
      name: `Ciclo ${cycleMonths}M - ${companyName}`,
      durationMonths: cycleMonths,
      startDate: new Date().toISOString().substring(0, 10),
      season: (cycleSeason as any) || 'general',
      defaultScrapRatePercent: 5,
      safetyStockDaysDefault: 15,
      growthRatePercent: 10,
      demandMode: 'target_driven',
      scenarioMultiplier: 1.0,
      leadTimeBufferDays: 7,
    };

    const newAdminUser: AppUser = {
      id: adminUserId,
      name: adminName.trim(),
      email: adminEmail.trim().toLowerCase(),
      username: adminEmail.trim().toLowerCase().split('@')[0] || 'admin',
      password: adminPin.trim(),
      role: 'Administrador',
      department: 'Dirección General & Operaciones',
      position: adminRoleTitle.trim() || 'Gerente General',
      avatarColor: brandColor,
      isActive: true,
      companyId: companyId,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 10),
      permissions: [
        'view_dashboard',
        'view_mrp',
        'edit_mrp_stock',
        'manage_purchase_orders',
        'view_tech_packs',
        'edit_tech_packs',
        'view_demand_forecast',
        'edit_sales_targets',
        'manage_production_cycles',
        'view_production_execution',
        'manage_production_orders',
        'view_costing',
        'edit_costing_rates',
        'manage_users',
        'import_export_csv',
        'manage_companies',
        'view_company_benchmarks',
      ],
    };

    const newCompany: CompanyTenant = {
      id: companyId,
      name: companyName.trim(),
      tradeName: brandName.trim() || companyName.trim(),
      nit: nit.trim(),
      city: city,
      country: 'Colombia',
      currency: 'COP',
      specialty: specialty,
      brandColor: brandColor,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 10),
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      garments: [],
      rawMaterials: [],
      salesRecords: [],
      cycleConfig: cycleConfig,
      purchaseOrders: [],
      productionOrders: [],
      users: [newAdminUser],
    };

    onRegisterCleanCompany(newCompany, newAdminUser);
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] flex flex-col justify-between text-[#1C211D]">
      {/* Top Bar */}
      <header className="bg-white border-b border-[#E6E1D8] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#3A5A40] flex items-center justify-center text-white shadow-xs shrink-0">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-xl tracking-tight text-[#1C211D]">
                TEXORA
              </span>
              <span className="px-2 py-0.5 bg-[#EBF2EC] text-[#3A5A40] text-[10px] font-bold rounded-full border border-[#D4E3D7]">
                Inteligencia Textil
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <p className="text-xs font-semibold text-[#2D4632]">Inteligencia para la producción textil.</p>
              <span className="hidden sm:inline text-xs text-[#8F9990]">•</span>
              <p className="text-xs font-medium text-[#5F6B61]">Planifica. Compra. Produce. Controla.</p>
            </div>
          </div>
        </div>

        {/* Top Actions: Interactive Tour & Demo Mode */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenButtonTour}
            className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#EAE6DF] text-[#1C211D] border border-[#D5CEC2] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            id="onboarding-btn-tour"
          >
            <HelpCircle className="w-4 h-4 text-[#3A5A40]" />
            <span className="hidden sm:inline">Ver Demo de Botones</span>
            <span className="sm:hidden">Guía</span>
          </button>

          <button
            onClick={onLoadDemoMode}
            className="px-3.5 py-1.5 bg-white hover:bg-[#FAF8F5] text-[#3A5A40] border border-[#3A5A40] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            id="onboarding-btn-demo"
            title="Cargar catálogo con 3 empresas de ejemplo completas"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Explorar Modo Demo</span>
          </button>
        </div>
      </header>

      {/* Main Registration Content Container */}
      <main className="max-w-5xl mx-auto px-4 py-8 sm:py-12 w-full">
        {/* Welcome Hero Card */}
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <span className="px-3 py-1 bg-[#EBF3ED] text-[#2D4632] text-xs font-bold rounded-full border border-[#D4E3D7] inline-flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-[#3A5A40]" />
            Inicio Limpio para Confección y Manufactura
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-[#1C211D] tracking-tight">
            Registra tu Empresa Textil
          </h1>
          <p className="text-sm sm:text-base text-[#5F6B61]">
            Inicia con tu base de datos 100% limpia sin datos de prueba, lista para ingresar tus fichas técnicas (BOM), inventario de telas y órdenes de confección.
          </p>
        </div>

        {/* Registration Form Card */}
        <div className="bg-white rounded-3xl border border-[#E6E1D8] shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8 bg-[#FAF8F5] border-b border-[#E6E1D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-[#1C211D] flex items-center gap-2">
                <Database className="w-5 h-5 text-[#3A5A40]" />
                Datos de la Empresa & Usuario Administrador
              </h2>
              <p className="text-xs text-[#5F6B61] mt-0.5">
                Crea tu espacio de trabajo oficial con privilegios totales de administración
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs bg-[#EBF3ED] text-[#2D4632] px-3 py-1.5 rounded-xl border border-[#D4E3D7] font-semibold self-start sm:self-auto">
              <ShieldCheck className="w-4 h-4 text-[#3A5A40]" />
              <span>Espacio Privado & Aislado</span>
            </div>
          </div>

          <form onSubmit={handleRegisterSubmit} className="p-6 sm:p-8 space-y-8">
            {/* Section 1: Empresa & Taller */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-[#E6E1D8] pb-2">
                <Building className="w-4 h-4 text-[#3A5A40]" />
                <h3 className="text-sm font-black text-[#1C211D] uppercase tracking-wider">
                  1. Información de la Empresa Textil
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Razón Social */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-bold text-[#1C211D]">
                    Razón Social / Nombre Oficial de la Empresa *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Confecciones y Diseños La Cima S.A.S."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className={`w-full px-3.5 py-2.5 bg-[#FAF8F5] border rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#3A5A40] ${
                      formErrors.companyName ? 'border-red-500 bg-red-50' : 'border-[#D5CEC2]'
                    }`}
                  />
                  {formErrors.companyName && (
                    <p className="text-[11px] text-red-600 font-semibold">
                      {formErrors.companyName}
                    </p>
                  )}
                </div>

                {/* Marca Comercial */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1C211D]">
                    Marca Comercial / Nombre Corto
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: CimaWear"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#3A5A40]"
                  />
                </div>

                {/* NIT */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1C211D]">
                    NIT / Identificación Tributaria *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 901.458.320-1"
                    value={nit}
                    onChange={(e) => setNit(e.target.value)}
                    className={`w-full px-3.5 py-2.5 bg-[#FAF8F5] border rounded-xl text-sm font-mono focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#3A5A40] ${
                      formErrors.nit ? 'border-red-500 bg-red-50' : 'border-[#D5CEC2]'
                    }`}
                  />
                  {formErrors.nit && (
                    <p className="text-[11px] text-red-600 font-semibold">{formErrors.nit}</p>
                  )}
                </div>

                {/* Ciudad / Sede */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1C211D]">
                    Ciudad Sede (Colombia)
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#3A5A40]"
                  >
                    {COLOMBIAN_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Especialidad Textil */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1C211D]">
                    Línea / Especialidad de Confección
                  </label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#3A5A40]"
                  >
                    {TEXTILE_SPECIALTIES.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selector de Color de Marca */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-bold text-[#1C211D]">
                  Color Distintivo de Marca / Sede
                </label>
                <div className="flex items-center gap-3 flex-wrap">
                  {BRAND_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setBrandColor(c)}
                      className={`w-8 h-8 rounded-xl transition-transform cursor-pointer flex items-center justify-center ${
                        brandColor === c
                          ? 'ring-3 ring-offset-2 ring-[#3A5A40] scale-110 shadow-xs'
                          : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {brandColor === c && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 2: Administrador Principal */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-[#E6E1D8] pb-2">
                <User className="w-4 h-4 text-[#3A5A40]" />
                <h3 className="text-sm font-black text-[#1C211D] uppercase tracking-wider">
                  2. Usuario Administrador (Acceso Principal)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Nombre */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-bold text-[#1C211D]">
                    Nombre Completo del Administrador *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Carlos Alberto Restrepo"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className={`w-full px-3.5 py-2.5 bg-[#FAF8F5] border rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#3A5A40] ${
                      formErrors.adminName ? 'border-red-500 bg-red-50' : 'border-[#D5CEC2]'
                    }`}
                  />
                  {formErrors.adminName && (
                    <p className="text-[11px] text-red-600 font-semibold">{formErrors.adminName}</p>
                  )}
                </div>

                {/* Cargo */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-bold text-[#1C211D]">
                    Cargo / Puesto en la Organización
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Director General de Confección"
                    value={adminRoleTitle}
                    onChange={(e) => setAdminRoleTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#3A5A40]"
                  />
                </div>

                {/* Correo Electrónico */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-bold text-[#1C211D]">
                    Correo Electrónico Corporativo *
                  </label>
                  <input
                    type="email"
                    placeholder="Ej: admin@tuempresa.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className={`w-full px-3.5 py-2.5 bg-[#FAF8F5] border rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#3A5A40] ${
                      formErrors.adminEmail ? 'border-red-500 bg-red-50' : 'border-[#D5CEC2]'
                    }`}
                  />
                  {formErrors.adminEmail && (
                    <p className="text-[11px] text-red-600 font-semibold">
                      {formErrors.adminEmail}
                    </p>
                  )}
                </div>

                {/* PIN de Seguridad */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-bold text-[#1C211D]">
                    PIN de Acceso Rápido (4 a 6 dígitos) *
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="Ej: 1234"
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    className={`w-full px-3.5 py-2.5 bg-[#FAF8F5] border rounded-xl text-sm font-mono tracking-widest focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#3A5A40] ${
                      formErrors.adminPin ? 'border-red-500 bg-red-50' : 'border-[#D5CEC2]'
                    }`}
                  />
                  {formErrors.adminPin && (
                    <p className="text-[11px] text-red-600 font-semibold">{formErrors.adminPin}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Ciclo Comercial Inicial */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-[#E6E1D8] pb-2">
                <Calendar className="w-4 h-4 text-[#3A5A40]" />
                <h3 className="text-sm font-black text-[#1C211D] uppercase tracking-wider">
                  3. Horizonte de Producción Inicial
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1C211D]">
                    Duración del Ciclo de Abastecimiento MRP
                  </label>
                  <select
                    value={cycleMonths}
                    onChange={(e) => setCycleMonths(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#3A5A40]"
                  >
                    <option value={1}>1 Mes (Ciclo Mensual Corto / Reposición Rápida)</option>
                    <option value={2}>2 Meses (Bimestral)</option>
                    <option value={3}>3 Meses (Trimestral Estándar Colombiano)</option>
                    <option value={6}>6 Meses (Semestral - Colección Primavera/Otoño)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#1C211D]">
                    Temporada Comercial de Arranque
                  </label>
                  <select
                    value={cycleSeason}
                    onChange={(e) => setCycleSeason(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#3A5A40]"
                  >
                    <option value="inicio_ano_escolar">Inicio de Año / Temporada Escolar</option>
                    <option value="dia_de_la_madre">Día de la Madre / Especial Mayo</option>
                    <option value="amor_y_amistad">Amor y Amistad / Moda Septiembre</option>
                    <option value="navidad_fin_ano">Navidad y Fin de Año (Pico Textil)</option>
                    <option value="general">Temporada Regular / Básicos Continuos</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Action Buttons */}
            <div className="pt-4 border-t border-[#E6E1D8] flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={onOpenButtonTour}
                className="w-full sm:w-auto px-4 py-3 bg-[#FAF8F5] hover:bg-[#EAE6DF] text-[#1C211D] border border-[#D5CEC2] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-[#3A5A40]" />
                <span>¿Para qué sirve cada botón? Ver Guía</span>
              </button>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-xl text-sm font-black flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer"
                id="btn-register-company-submit"
              >
                <span>Registrar Empresa e Ingresar (Modo Limpio)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white p-5 rounded-2xl border border-[#E6E1D8] shadow-2xs space-y-2">
            <div className="p-2.5 rounded-xl bg-[#EBF3ED] w-fit">
              <Layers className="w-5 h-5 text-[#3A5A40]" />
            </div>
            <h4 className="font-bold text-sm text-[#1C211D]">Explosión MRP & BOM Exacto</h4>
            <p className="text-xs text-[#5F6B61] leading-relaxed">
              Calcula metros exactos de tela, conos de hilo y avíos restando existencias actuales en bodega.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E6E1D8] shadow-2xs space-y-2">
            <div className="p-2.5 rounded-xl bg-[#EBF3ED] w-fit">
              <Factory className="w-5 h-5 text-[#3A5A40]" />
            </div>
            <h4 className="font-bold text-sm text-[#1C211D]">Ejecución en Planta MES</h4>
            <p className="text-xs text-[#5F6B61] leading-relaxed">
              Audita mermas reales en corte, tiempos estándar SAM y avance de producción por operario.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E6E1D8] shadow-2xs space-y-2">
            <div className="p-2.5 rounded-xl bg-[#EBF3ED] w-fit">
              <ShieldCheck className="w-5 h-5 text-[#3A5A40]" />
            </div>
            <h4 className="font-bold text-sm text-[#1C211D]">Aislamiento & Permisos RBAC</h4>
            <p className="text-xs text-[#5F6B61] leading-relaxed">
              Roles diferenciados para Diseñadores, Jefes de Compras, Supervisores de Planta y Gerencia.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E6E1D8] px-4 py-4 text-center text-xs text-[#8F9990]">
        <span>TextilIQ — Sistema de Inteligencia de Demanda & MRP Textil en Colombia</span>
      </footer>
    </div>
  );
};
