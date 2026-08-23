import React, { useState } from 'react';
import { CompanyTenant, AppUser } from '../types';
import { formatCOP } from '../utils/formatters';
import { ROLE_DEFAULT_PERMISSIONS } from '../utils/permissions';
import {
  Building,
  Plus,
  CheckCircle2,
  Download,
  Upload,
  Trash2,
  Edit2,
  X,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Database,
  RefreshCw,
  FolderArchive,
  Layers,
  Scissors,
  DollarSign,
  MapPin,
  FileSpreadsheet,
} from 'lucide-react';

interface CompanyManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: CompanyTenant[];
  activeCompanyId: string;
  onSelectCompany: (companyId: string) => void;
  onRegisterCompany: (newCompany: CompanyTenant, adminUser?: AppUser) => void;
  onUpdateCompany: (updatedCompany: CompanyTenant) => void;
  onDeleteCompany: (companyId: string) => void;
  onExportAllDatabase: () => void;
  onImportDatabase: (fileContent: string) => void;
  onResetToDemoCompanies: () => void;
}

const TEXTILE_SPECIALTIES = [
  'Camisería & Moda Ejecutiva',
  'Pantalonería & Denim Pesado',
  'Ropa Deportiva & Tejido de Punto',
  'Dotaciones Industriales & Paquetería',
  'Ropa Infantil & Bebés',
  'Moda Femenina & Vestidos',
  'Ropa Interior & Corsetería',
  'Chaquetería & Ropa Exterior',
  'Uniformes Médicos & Quirúrgicos',
  'Otro Sector Textil',
];

const COLOMBIAN_CITIES = [
  'Medellín, Antioquia',
  'Bogotá D.C.',
  'Cali, Valle del Cauca',
  'Ibagué, Tolima',
  'Bucaramanga, Santander',
  'Pereira / Dosquebradas, Risaralda',
  'Barranquilla, Atlántico',
  'Cúcuta, Norte de Santander',
  'Manizales, Caldas',
  'Otra Ciudad / País',
];

const BRAND_COLORS = [
  '#3A5A40', // Olive Green
  '#1E40AF', // Royal Blue
  '#D97706', // Amber / Gold
  '#7C3AED', // Violet
  '#059669', // Emerald
  '#DC2626', // Crimson Red
  '#0891B2', // Cyan
  '#4B5563', // Slate Charcoal
];

export const CompanyManagerModal: React.FC<CompanyManagerModalProps> = ({
  isOpen,
  onClose,
  companies,
  activeCompanyId,
  onSelectCompany,
  onRegisterCompany,
  onUpdateCompany,
  onDeleteCompany,
  onExportAllDatabase,
  onImportDatabase,
  onResetToDemoCompanies,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'register' | 'backup'>('list');
  const [editingCompany, setEditingCompany] = useState<CompanyTenant | null>(null);

  // Form State for Registering / Editing Company
  const [name, setName] = useState<string>('');
  const [nit, setNit] = useState<string>('');
  const [tradeName, setTradeName] = useState<string>('');
  const [specialty, setSpecialty] = useState<string>(TEXTILE_SPECIALTIES[0]);
  const [city, setCity] = useState<string>(COLOMBIAN_CITIES[0]);
  const [currency, setCurrency] = useState<string>('COP');
  const [brandColor, setBrandColor] = useState<string>(BRAND_COLORS[0]);
  const [description, setDescription] = useState<string>('');
  const [initialDataTemplate, setInitialDataTemplate] = useState<'blank' | 'demo'>('blank');

  // Initial Admin User Form
  const [adminName, setAdminName] = useState<string>('');
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [adminUsername, setAdminUsername] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('textil2026');

  // Import Status
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOpenRegister = () => {
    setEditingCompany(null);
    setName('');
    setNit('');
    setTradeName('');
    setSpecialty(TEXTILE_SPECIALTIES[0]);
    setCity(COLOMBIAN_CITIES[0]);
    setCurrency('COP');
    setBrandColor(BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)]);
    setDescription('');
    setInitialDataTemplate('blank');
    setAdminName('');
    setAdminEmail('');
    setAdminUsername('');
    setAdminPassword('textil2026');
    setActiveTab('register');
  };

  const handleOpenEdit = (comp: CompanyTenant) => {
    setEditingCompany(comp);
    setName(comp.name);
    setNit(comp.nit);
    setTradeName(comp.tradeName || '');
    setSpecialty(comp.specialty);
    setCity(comp.city);
    setCurrency(comp.currency);
    setBrandColor(comp.brandColor || BRAND_COLORS[0]);
    setDescription(comp.description || '');
    setActiveTab('register');
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !nit.trim()) {
      alert('Por favor ingresa la Razón Social y el NIT de la empresa.');
      return;
    }

    if (editingCompany) {
      const updated: CompanyTenant = {
        ...editingCompany,
        name: name.trim(),
        nit: nit.trim(),
        tradeName: tradeName.trim() || name.trim(),
        specialty,
        city,
        currency,
        brandColor,
        description: description.trim(),
        updatedAt: new Date().toISOString().split('T')[0],
      };
      onUpdateCompany(updated);
      setActiveTab('list');
      setEditingCompany(null);
    } else {
      const newCompanyId = `emp-${Date.now().toString(36)}`;
      let initialAdminUser: AppUser | undefined = undefined;

      if (adminName.trim() && adminUsername.trim()) {
        initialAdminUser = {
          id: `USR-${Date.now().toString(36)}`,
          name: adminName.trim(),
          email: adminEmail.trim() || `${adminUsername.trim()}@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.co`,
          username: adminUsername.trim().toLowerCase(),
          password: adminPassword || 'admin123',
          role: 'Administrador',
          department: 'Dirección General & Operaciones',
          position: 'Administrador General de Empresa',
          avatarColor: brandColor,
          permissions: ROLE_DEFAULT_PERMISSIONS['Administrador'],
          isActive: true,
          companyId: newCompanyId,
          createdAt: new Date().toISOString().split('T')[0],
        };
      }

      const newCompany: CompanyTenant = {
        id: newCompanyId,
        name: name.trim(),
        nit: nit.trim(),
        tradeName: tradeName.trim() || name.trim(),
        specialty,
        city,
        country: 'Colombia',
        currency,
        brandColor,
        description: description.trim(),
        createdAt: new Date().toISOString().split('T')[0],
        garments: [],
        rawMaterials: [],
        salesRecords: [],
        cycleConfig: {
          id: `CYCLE-${newCompanyId}-01`,
          name: `Campaña Inicial ${name.trim()} (3 Meses)`,
          durationMonths: 3,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          season: 'general',
          defaultScrapRatePercent: specialty.includes('Denim') ? 6.5 : specialty.includes('Punto') ? 4.8 : 5.0,
          safetyStockDaysDefault: 15,
          growthRatePercent: 0,
          demandMode: 'target_driven',
          scenarioMultiplier: 1.0,
          leadTimeBufferDays: 7,
        },
        purchaseOrders: [],
        productionOrders: [],
      };

      onRegisterCompany(newCompany, initialAdminUser);
      onSelectCompany(newCompanyId);
      setActiveTab('list');
      setEditingCompany(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportStatus(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        onImportDatabase(content);
        setImportStatus('¡Base de datos importada exitosamente!');
        setTimeout(() => setImportStatus(null), 4000);
      } catch (err: any) {
        setImportError(`Error al procesar el archivo: ${err.message || 'Formato JSON inválido'}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-[#E6E1D8] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E6E1D8] flex items-center justify-between bg-[#FAF8F5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3A5A40] text-white flex items-center justify-center shadow-xs">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#1C211D]">
                  Gestión Multi-Empresa & Sedes Textiles
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF3ED] text-[#2D4632] border border-[#C8DEC9]">
                  {companies.length} {companies.length === 1 ? 'Empresa' : 'Empresas'}
                </span>
              </div>
              <p className="text-xs text-[#5F6B61]">
                Administra múltiples empresas independientes, asigna usuarios y genera bases de datos para análisis comparativos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8F9990] hover:text-[#1C211D] hover:bg-[#F2EFE9] rounded-lg transition-colors cursor-pointer"
            id="btn-close-company-manager"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-[#E6E1D8] bg-[#FAF8F5] text-xs font-semibold">
          <button
            onClick={() => {
              setActiveTab('list');
              setEditingCompany(null);
            }}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'list'
                ? 'border-[#3A5A40] text-[#3A5A40] font-bold'
                : 'border-transparent text-[#5F6B61] hover:text-[#1C211D]'
            }`}
            id="tab-company-list"
          >
            <Building className="w-4 h-4" />
            <span>Empresas Registradas ({companies.length})</span>
          </button>

          <button
            onClick={handleOpenRegister}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'register'
                ? 'border-[#3A5A40] text-[#3A5A40] font-bold'
                : 'border-transparent text-[#5F6B61] hover:text-[#1C211D]'
            }`}
            id="tab-company-register"
          >
            <Plus className="w-4 h-4" />
            <span>{editingCompany ? 'Editar Empresa' : 'Registrar Nueva Empresa'}</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'backup'
                ? 'border-[#3A5A40] text-[#3A5A40] font-bold'
                : 'border-transparent text-[#5F6B61] hover:text-[#1C211D]'
            }`}
            id="tab-company-backup"
          >
            <Database className="w-4 h-4" />
            <span>Copias de Seguridad & Vercel</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: LIST OF COMPANIES */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#1C211D]">Empresas en el Sistema</h3>
                  <p className="text-xs text-[#5F6B61]">
                    Selecciona una empresa para activar su espacio de trabajo o regístrala para comparativos
                  </p>
                </div>
                <button
                  onClick={handleOpenRegister}
                  className="px-3 py-1.5 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                  id="btn-register-new-company-from-list"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva Empresa</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {companies.map((comp) => {
                  const isActive = comp.id === activeCompanyId;
                  const totalStockValue = (comp.rawMaterials || []).reduce(
                    (acc, m) => acc + (m.currentStock || 0) * (m.unitCost || 0),
                    0
                  );

                  return (
                    <div
                      key={comp.id}
                      className={`relative rounded-xl border p-4 transition-all flex flex-col justify-between ${
                        isActive
                          ? 'border-[#3A5A40] bg-[#F4F8F5] shadow-sm ring-1 ring-[#3A5A40]'
                          : 'border-[#E6E1D8] bg-white hover:border-[#C4BDB0] hover:shadow-xs'
                      }`}
                    >
                      {/* Active Badge */}
                      {isActive && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#3A5A40] text-white text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Activa</span>
                        </div>
                      )}

                      <div>
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-xl text-white font-black text-sm flex items-center justify-center shrink-0 shadow-2xs"
                            style={{ backgroundColor: comp.brandColor || '#3A5A40' }}
                          >
                            {comp.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="pr-12">
                            <h4 className="text-sm font-bold text-[#1C211D] leading-tight">
                              {comp.name}
                            </h4>
                            <p className="text-[11px] text-[#5F6B61] flex items-center gap-1 mt-0.5">
                              <span className="font-mono font-medium">NIT: {comp.nit}</span>
                              <span>•</span>
                              <span>{comp.city}</span>
                            </p>
                            <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#EBE7DF] text-[#4A544C]">
                              {comp.specialty}
                            </span>
                          </div>
                        </div>

                        {comp.description && (
                          <p className="text-xs text-[#5F6B61] mt-2.5 line-clamp-2 italic">
                            "{comp.description}"
                          </p>
                        )}

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#E6E1D8] text-center">
                          <div className="bg-[#FAF8F5] p-2 rounded-lg">
                            <span className="text-[10px] text-[#5F6B61] block font-medium">Prendas</span>
                            <span className="text-xs font-bold text-[#1C211D]">
                              {(comp.garments || []).length}
                            </span>
                          </div>
                          <div className="bg-[#FAF8F5] p-2 rounded-lg">
                            <span className="text-[10px] text-[#5F6B61] block font-medium">Insumos</span>
                            <span className="text-xs font-bold text-[#1C211D]">
                              {(comp.rawMaterials || []).length}
                            </span>
                          </div>
                          <div className="bg-[#FAF8F5] p-2 rounded-lg">
                            <span className="text-[10px] text-[#5F6B61] block font-medium">Valor Inv.</span>
                            <span className="text-[11px] font-bold text-[#3A5A40] truncate block">
                              {formatCOP(totalStockValue)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-[#E6E1D8]">
                        {!isActive ? (
                          <button
                            onClick={() => {
                              onSelectCompany(comp.id);
                              onClose();
                            }}
                            className="px-3 py-1.5 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-lg text-xs font-bold flex-1 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            id={`btn-select-company-${comp.id}`}
                          >
                            <span>Activar Empresa</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <div className="text-xs font-bold text-[#3A5A40] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Trabajando en esta empresa</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(comp)}
                            className="p-1.5 text-[#5F6B61] hover:text-[#1C211D] hover:bg-[#EBE7DF] rounded-lg transition-colors cursor-pointer"
                            title="Editar Datos Fiscales"
                            id={`btn-edit-company-${comp.id}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {companies.length > 1 && (
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `¿Estás seguro de eliminar "${comp.name}" y toda su información asociada?`
                                  )
                                ) {
                                  onDeleteCompany(comp.id);
                                }
                              }}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar Empresa"
                              id={`btn-delete-company-${comp.id}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: REGISTER / EDIT COMPANY */}
          {activeTab === 'register' && (
            <form onSubmit={handleSaveCompany} className="space-y-5">
              <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E6E1D8] flex items-center gap-3">
                <Building className="w-5 h-5 text-[#3A5A40] shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-[#1C211D]">
                    {editingCompany ? 'Editar Información de la Empresa' : 'Registro de Nueva Empresa Textil'}
                  </h4>
                  <p className="text-[11px] text-[#5F6B61]">
                    {editingCompany
                      ? 'Actualiza los datos fiscales y sede de esta unidad de negocio'
                      : 'Crea un espacio de trabajo aislado con su propio catálogo de prendas, insumos, órdenes de producción y usuarios'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Razón Social */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#1C211D] mb-1">
                    Razón Social / Nombre de la Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Confecciones & Diseños Andinos S.A.S."
                    className="w-full px-3 py-2 text-xs border border-[#D5CEC2] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3A5A40] bg-white"
                    id="input-company-name"
                  />
                </div>

                {/* NIT / Identificación */}
                <div>
                  <label className="block text-xs font-bold text-[#1C211D] mb-1">
                    NIT / Identificación Tributaria *
                  </label>
                  <input
                    type="text"
                    required
                    value={nit}
                    onChange={(e) => setNit(e.target.value)}
                    placeholder="Ej. 901.452.880-1"
                    className="w-full px-3 py-2 text-xs border border-[#D5CEC2] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3A5A40] bg-white font-mono"
                    id="input-company-nit"
                  />
                </div>

                {/* Nombre Comercial */}
                <div>
                  <label className="block text-xs font-bold text-[#1C211D] mb-1">
                    Nombre Comercial / Marca (Opcional)
                  </label>
                  <input
                    type="text"
                    value={tradeName}
                    onChange={(e) => setTradeName(e.target.value)}
                    placeholder="Ej. Andina Apparel"
                    className="w-full px-3 py-2 text-xs border border-[#D5CEC2] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3A5A40] bg-white"
                    id="input-company-tradename"
                  />
                </div>

                {/* Especialidad Textil */}
                <div>
                  <label className="block text-xs font-bold text-[#1C211D] mb-1">
                    Especialidad / Sector Textil *
                  </label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#D5CEC2] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3A5A40] bg-white"
                    id="select-company-specialty"
                  >
                    {TEXTILE_SPECIALTIES.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ciudad / Sede */}
                <div>
                  <label className="block text-xs font-bold text-[#1C211D] mb-1">
                    Ciudad / Sede Principal *
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#D5CEC2] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3A5A40] bg-white"
                    id="select-company-city"
                  >
                    {COLOMBIAN_CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Color de Marca */}
                <div>
                  <label className="block text-xs font-bold text-[#1C211D] mb-1">
                    Color Distintivo de Marca
                  </label>
                  <div className="flex items-center gap-2">
                    {BRAND_COLORS.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setBrandColor(col)}
                        className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                          brandColor === col ? 'ring-2 ring-offset-2 ring-[#1C211D] scale-110' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                </div>

                {/* Moneda Base */}
                <div>
                  <label className="block text-xs font-bold text-[#1C211D] mb-1">
                    Moneda Operativa
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#D5CEC2] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3A5A40] bg-white"
                    id="select-company-currency"
                  >
                    <option value="COP">COP - Pesos Colombianos ($)</option>
                    <option value="USD">USD - Dólares Estadounidenses (US$)</option>
                    <option value="MXN">MXN - Pesos Mexicanos (Mex$)</option>
                  </select>
                </div>

                {/* Descripción */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#1C211D] mb-1">
                    Descripción / Enfoque de Manufactura
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Breve reseña sobre líneas de producto, capacidad de planta o modelo de negocio..."
                    className="w-full px-3 py-2 text-xs border border-[#D5CEC2] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3A5A40] bg-white resize-none"
                    id="input-company-description"
                  />
                </div>
              </div>

              {/* Initial Admin User Section (Only for new company) */}
              {!editingCompany && (
                <div className="mt-4 pt-4 border-t border-[#E6E1D8]">
                  <h4 className="text-xs font-bold text-[#1C211D] mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#3A5A40]" />
                    <span>Usuario Administrador Inicial para esta Empresa</span>
                  </h4>
                  <p className="text-[11px] text-[#5F6B61] mb-3">
                    Se creará una cuenta de Administrador con acceso completo a esta empresa
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E6E1D8]">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#1C211D] mb-1">
                        Nombre del Responsable *
                      </label>
                      <input
                        type="text"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="Ej. Carolina Gómez"
                        className="w-full px-2.5 py-1.5 text-xs border border-[#D5CEC2] rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#3A5A40]"
                        id="input-admin-name"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#1C211D] mb-1">
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="ej. gerencia@empresa.co"
                        className="w-full px-2.5 py-1.5 text-xs border border-[#D5CEC2] rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#3A5A40]"
                        id="input-admin-email"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#1C211D] mb-1">
                        Nombre de Usuario para Login *
                      </label>
                      <input
                        type="text"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        placeholder="ej. cgomez"
                        className="w-full px-2.5 py-1.5 text-xs border border-[#D5CEC2] rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#3A5A40]"
                        id="input-admin-username"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#1C211D] mb-1">
                        Contraseña Inicial *
                      </label>
                      <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Contraseña segura"
                        className="w-full px-2.5 py-1.5 text-xs border border-[#D5CEC2] rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#3A5A40]"
                        id="input-admin-password"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6E1D8]">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('list');
                    setEditingCompany(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-[#5F6B61] hover:bg-[#F2EFE9] rounded-lg transition-colors cursor-pointer"
                  id="btn-cancel-company-form"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                  id="btn-save-company-submit"
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>{editingCompany ? 'Guardar Cambios' : 'Registrar Empresa & Crear Base de Datos'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: BACKUP, RESTORE & VERCEL */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              {importStatus && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{importStatus}</span>
                </div>
              )}

              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Vercel Deployment Notice */}
              <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E6E1D8]">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#3A5A40] text-white flex items-center justify-center shrink-0">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1C211D]">
                      Compatibilidad de Despliegue en Vercel & Nube
                    </h4>
                    <p className="text-xs text-[#5F6B61] mt-1 leading-relaxed">
                      Al desplegar en <strong>Vercel</strong>, todas las empresas, fichas técnicas, órdenes de producción, inventarios y usuarios se persisten localmente con alta confiabilidad. Puedes descargar copias de seguridad completas en formato <code>.json</code> para migrar entre dispositivos o compartirlas con tu equipo.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Export Card */}
                <div className="p-4 rounded-xl border border-[#E6E1D8] bg-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[#3A5A40] font-bold text-xs">
                      <Download className="w-4 h-4" />
                      <span>Exportar Respaldo Completo (JSON)</span>
                    </div>
                    <p className="text-xs text-[#5F6B61] mt-1.5">
                      Descarga un archivo con todas las empresas registradas, usuarios, catálogo de prendas, BOMs e historial de OPs.
                    </p>
                  </div>
                  <button
                    onClick={onExportAllDatabase}
                    className="mt-4 w-full py-2 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                    id="btn-export-database-json"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar Backup JSON</span>
                  </button>
                </div>

                {/* Import Card */}
                <div className="p-4 rounded-xl border border-[#E6E1D8] bg-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[#1C211D] font-bold text-xs">
                      <Upload className="w-4 h-4 text-[#3A5A40]" />
                      <span>Restaurar Base de Datos (JSON)</span>
                    </div>
                    <p className="text-xs text-[#5F6B61] mt-1.5">
                      Carga un archivo de copia de seguridad previamente exportado para restaurar empresas y datos al instante.
                    </p>
                  </div>
                  <label className="mt-4 w-full py-2 bg-white hover:bg-[#FAF8F5] text-[#1C211D] border border-[#D5CEC2] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-[#3A5A40]" />
                    <span>Seleccionar Archivo JSON</span>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="input-import-database-json"
                    />
                  </label>
                </div>
              </div>

              {/* Reset to Demo Benchmarking Companies */}
              <div className="p-4 rounded-xl border border-[#E6E1D8] bg-[#FAF8F5] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#1C211D]">
                    Cargar Empresas Modelo para Comparativos Inmediatos
                  </h4>
                  <p className="text-xs text-[#5F6B61] mt-0.5">
                    Restaura las 3 empresas de referencia (Camisería Andina, Denim del Caribe y SportTex Activewear) para explorar el módulo de Benchmarking.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        '¿Deseas restaurar las 3 empresas de demostración colombianas para análisis comparativo?'
                      )
                    ) {
                      onResetToDemoCompanies();
                      onClose();
                    }
                  }}
                  className="px-3 py-1.5 bg-white border border-[#D5CEC2] hover:bg-[#F2EFE9] text-[#1C211D] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer shadow-2xs"
                  id="btn-load-demo-companies"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#3A5A40]" />
                  <span>Cargar Demos</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
