import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Scissors,
  Layers,
  Package,
  Calendar,
  Factory,
  BarChart3,
  Users,
  Upload,
  Sliders,
  ShoppingCart,
  RefreshCw,
  Search,
  CheckCircle2,
  ArrowRight,
  Info,
  ShieldCheck,
  Building,
  Key,
  ExternalLink,
} from 'lucide-react';

interface ButtonTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
  onOpenCycleModal: () => void;
  onOpenAIAdvisor: () => void;
  onOpenSimulator: () => void;
  onOpenPOModal: () => void;
  onOpenCSVModal: () => void;
  onOpenCompanyManager: () => void;
  onOpenUserManagementModal: () => void;
}

interface TourStep {
  id: string;
  title: string;
  category: 'Encabezado' | 'MRP & Fichas' | 'Inventario' | 'Planta MES' | 'Empresas & Usuarios';
  buttonName: string;
  icon: React.ReactNode;
  badge: string;
  description: string;
  howToUse: string[];
  targetTab?: string;
  actionButtonText?: string;
  onAction?: () => void;
}

export const ButtonTourModal: React.FC<ButtonTourModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenCycleModal,
  onOpenAIAdvisor,
  onOpenSimulator,
  onOpenPOModal,
  onOpenCSVModal,
  onOpenCompanyManager,
  onOpenUserManagementModal,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [viewMode, setViewMode] = useState<'tour' | 'directory'>('tour');

  const tourSteps: TourStep[] = [
    {
      id: 'step-company-selector',
      title: 'Selector de Empresa & Multi-Sede',
      category: 'Encabezado',
      buttonName: 'Selector de Empresa (Header Superior)',
      icon: <Building className="w-5 h-5 text-[#3A5A40]" />,
      badge: 'Multi-Tenant',
      description:
        'Permite alternar al instante entre diferentes empresas textiles o sedes de producción registradas, manteniendo un aislamiento total de fichas técnicas, inventarios y costos.',
      howToUse: [
        'Haz clic para desplegar la lista de empresas registradas.',
        'Selecciona una sede para cargar de inmediato sus datos exclusivos.',
        'Accede al gestor para registrar una nueva empresa con su NIT y datos fiscales.',
      ],
      actionButtonText: 'Abrir Gestor de Empresas',
      onAction: () => {
        onClose();
        onOpenCompanyManager();
      },
    },
    {
      id: 'step-cycle-btn',
      title: 'Configurador de Ciclo Comercial & Temporadas',
      category: 'Encabezado',
      buttonName: 'Botón "Ciclo: Xm" / "Ajustar Ciclo"',
      icon: <Calendar className="w-5 h-5 text-[#3A5A40]" />,
      badge: 'Planificación',
      description:
        'Configura el horizonte temporal de producción (1 a 12 meses) y la temporada comercial activa (Día de la Madre, Amor y Amistad, Navidad, Escolar, etc.) con sus multiplicadores estacionales colombianos.',
      howToUse: [
        'Define cuántos meses de demanda se abastecerán en este ciclo productivo.',
        'Aplica estacionalidades comerciales para aumentar o moderar el pronóstico.',
        'Ajusta el colchón de seguridad de inventario para evitar quiebres de stock.',
      ],
      actionButtonText: 'Configurar Ciclo Ahora',
      onAction: () => {
        onClose();
        onOpenCycleModal();
      },
    },
    {
      id: 'step-ai-advisor',
      title: 'Asesor Textil Inteligente (IA)',
      category: 'Encabezado',
      buttonName: 'Botón "Asesor IA" (Header)',
      icon: <Sparkles className="w-5 h-5 text-[#3A5A40]" />,
      badge: 'Inteligencia Artificial',
      description:
        'Asistente especializado en ingeniería textil y supply chain que analiza tus datos en tiempo real para recomendar compras óptimas, detectar cuellos de botella y reducir mermas.',
      howToUse: [
        'Recibe diagnósticos automáticos sobre rollos de tela con merma crítica.',
        'Consulta sugerencias de abastecimiento antes de liberar órdenes a corte.',
        'Analiza la rentabilidad por prenda y el impacto del tiempo estándar SAM.',
      ],
      actionButtonText: 'Consultar Asesor IA',
      onAction: () => {
        onClose();
        onOpenAIAdvisor();
      },
    },
    {
      id: 'step-simulator',
      title: 'Simulador What-If de Escenarios',
      category: 'Encabezado',
      buttonName: 'Botón "Simulador" (Header)',
      icon: <Sliders className="w-5 h-5 text-[#D97706]" />,
      badge: 'Proyecciones',
      description:
        'Permite simular variaciones porcentuales de demanda (+20%, +50%, -30%) para evaluar de inmediato el costo adicional de materias primas y horas de confección requeridas.',
      howToUse: [
        'Mueve el control deslizante para simular picos o caídas en ventas.',
        'Compara en tiempo real la inversión en tela requerida vs. capacidad actual.',
        'Aplica o restablece el escenario según las decisiones de gerencia.',
      ],
      actionButtonText: 'Abrir Simulador',
      onAction: () => {
        onClose();
        onOpenSimulator();
      },
    },
    {
      id: 'step-pos-modal',
      title: 'Gestor de Órdenes de Compra (OC)',
      category: 'Inventario',
      buttonName: 'Botón "Órdenes de Compra" (Header)',
      icon: <ShoppingCart className="w-5 h-5 text-[#1E40AF]" />,
      badge: 'Abastecimiento',
      description:
        'Genera, aprueba y recepciona pedidos de insumos a proveedores textiles (Lafayette, Fabricato, Coats Cadena, etc.) calculando costos totales con IVA incluido.',
      howToUse: [
        'Crea órdenes de compra directamente desde los faltantes del cálculo MRP.',
        'Registra el número de factura del proveedor y fecha estimada de entrega.',
        'Al marcar como "Recepcionada", el stock de materia prima se incrementa automáticamente.',
      ],
      actionButtonText: 'Ver Órdenes de Compra',
      onAction: () => {
        onClose();
        onOpenPOModal();
      },
    },
    {
      id: 'step-csv-hub',
      title: 'Centro de Datos CSV (Importar / Exportar)',
      category: 'Encabezado',
      buttonName: 'Botón "CSV Hub" / "Centro CSV"',
      icon: <Upload className="w-5 h-5 text-[#3A5A40]" />,
      badge: 'Integración',
      description:
        'Permite cargar masivamente desde Excel o CSV tus prendas, lista de materiales, históricos de ventas y exportar reportes ejecutivos listos para contabilidad o ERP.',
      howToUse: [
        'Descarga las plantillas CSV preformateadas en español.',
        'Sube archivos con miles de registros en segundos sin perder datos.',
        'Exporta el cálculo completo de explosión de materiales a hojas de cálculo.',
      ],
      actionButtonText: 'Abrir CSV Hub',
      onAction: () => {
        onClose();
        onOpenCSVModal();
      },
    },
    {
      id: 'step-tab-dashboard',
      title: 'Panel Principal (Dashboard)',
      category: 'MRP & Fichas',
      buttonName: 'Pestaña "Dashboard"',
      icon: <BarChart3 className="w-5 h-5 text-[#3A5A40]" />,
      badge: 'Módulo',
      description:
        'Visión global del negocio textil: valor total de demanda proyectada, costo de materiales requeridos, índice de cobertura y prendas con mayor rotación.',
      howToUse: [
        'Visualiza el resumen financiero de venta estimada vs. costo de manufactura.',
        'Supervisa los insumos en estado crítico con stock insuficiente.',
        'Analiza gráficos de distribución de demanda por categoría textil.',
      ],
      targetTab: 'dashboard',
      actionButtonText: 'Ir a Dashboard',
      onAction: () => {
        onClose();
        onNavigateTab('dashboard');
      },
    },
    {
      id: 'step-tab-mrp',
      title: 'Explosión de Requerimientos MRP',
      category: 'MRP & Fichas',
      buttonName: 'Pestaña "Explosión MRP"',
      icon: <Layers className="w-5 h-5 text-[#3A5A40]" />,
      badge: 'Módulo Clave',
      description:
        'Motor algorítmico que multiplica la demanda neta de cada prenda por su consumo en la Ficha Técnica (BOM), restando el inventario disponible para calcular compras exactas.',
      howToUse: [
        'Revisa los insumos clasificados en Rojo (Crítico), Amarillo (Reorden) o Verde (OK).',
        'Filtra por tipo de material (Telas, Hilos, Botones, Cremalleras, Marquillas).',
        'Genera órdenes de compra automáticas con un solo clic sobre los faltantes.',
      ],
      targetTab: 'mrp_calculator',
      actionButtonText: 'Ir a Explosión MRP',
      onAction: () => {
        onClose();
        onNavigateTab('mrp_calculator');
      },
    },
    {
      id: 'step-tab-bom',
      title: 'Fichas Técnicas & Costeo (BOM)',
      category: 'MRP & Fichas',
      buttonName: 'Pestaña "Fichas Técnicas"',
      icon: <Scissors className="w-5 h-5 text-[#3A5A40]" />,
      badge: 'Diseño & Costos',
      description:
        'Crea y edita las especificaciones técnicas de cada prenda: matriz de consumo por metro/unidad, merma teórica de corte (%), tiempos estándar SAM de confección y costeo detallado.',
      howToUse: [
        'Usa el botón "+ Nueva Prenda" para registrar modelos con imagen y código SKU.',
        'Agrega insumos a la lista de materiales (BOM) con su rendimiento por prenda.',
        'Calcula el precio sugerido de venta al público según el margen deseado (65%-75%).',
      ],
      targetTab: 'fichas_tecnicas',
      actionButtonText: 'Ir a Fichas Técnicas',
      onAction: () => {
        onClose();
        onNavigateTab('fichas_tecnicas');
      },
    },
    {
      id: 'step-tab-inventory',
      title: 'Inventario de Materias Primas',
      category: 'Inventario',
      buttonName: 'Pestaña "Inventario Insumos"',
      icon: <Package className="w-5 h-5 text-[#3A5A40]" />,
      badge: 'Bodega',
      description:
        'Control de existencias físicas en bodega para telas (metros/kg), avíos y herrajes con seguimiento de lote, ancho útil, proveedor y tiempos de reposición (lead time).',
      howToUse: [
        'Registra entradas o salidas manuales de insumos con el botón "Ajuste de Stock".',
        'Crea nuevos materiales con precio unitario en Pesos Colombianos (COP).',
        'Configura el punto mínimo de reorden para disparar alertas preventivas.',
      ],
      targetTab: 'inventario_materiales',
      actionButtonText: 'Ir a Inventario',
      onAction: () => {
        onClose();
        onNavigateTab('inventario_materiales');
      },
    },
    {
      id: 'step-tab-mes',
      title: 'Ejecución en Planta & Trazabilidad (MES)',
      category: 'Planta MES',
      buttonName: 'Pestaña "Ejecución en Planta"',
      icon: <Factory className="w-5 h-5 text-[#3A5A40]" />,
      badge: 'Producción Real',
      description:
        'Sistema de control en piso de fábrica para registrar el avance de Órdenes de Producción (OP) a través de Corte, Confección, Lavandería, Acabados y Empaque con cálculo de merma real.',
      howToUse: [
        'Crea Órdenes de Producción (OP) asignando tallas y colores programados.',
        'Registra unidades cortadas y metros consumidos para auditar la merma real vs. teórica.',
        'Controla tiempos muertos y eficiencia de operarios en minutos SAM.',
      ],
      targetTab: 'execution',
      actionButtonText: 'Ir a Planta MES',
      onAction: () => {
        onClose();
        onNavigateTab('execution');
      },
    },
    {
      id: 'step-tab-benchmark',
      title: 'Comparativo & Benchmarking Textil',
      category: 'Empresas & Usuarios',
      buttonName: 'Pestaña "Comparativo & Benchmark"',
      icon: <BarChart3 className="w-5 h-5 text-[#1E40AF]" />,
      badge: 'Analítica Directiva',
      description:
        'Compara el rendimiento financiero y operativo entre todas las empresas o sedes registradas: ranking de rentabilidad, eficiencia de corte y optimización de SAM.',
      howToUse: [
        'Analiza qué sede tiene menor desperdicio de tela en tizada.',
        'Compara la rotación de capital circulante en inventario de telas.',
        'Descarga informes consolidados en formato CSV para la junta directiva.',
      ],
      targetTab: 'benchmark',
      actionButtonText: 'Ir a Benchmarking',
      onAction: () => {
        onClose();
        onNavigateTab('benchmark');
      },
    },
    {
      id: 'step-user-management',
      title: 'Gestión de Personal & Control de Acceso (RBAC)',
      category: 'Empresas & Usuarios',
      buttonName: 'Menú de Usuario / "Personal & Permisos"',
      icon: <Users className="w-5 h-5 text-[#3A5A40]" />,
      badge: 'Seguridad',
      description:
        'Crea usuarios y asigna roles granulares (Administrador, Gerente de Producción, Diseñador BOM, Jefe de Compras, Supervisor de Planta, Auditor de Calidad) protegiendo módulos críticos.',
      howToUse: [
        'Define quién puede modificar fichas técnicas o aprobar compras.',
        'Establece PINes de acceso para cambio rápido de operador en planta.',
        'Activa o desactiva usuarios sin borrar su historial de operaciones.',
      ],
      actionButtonText: 'Administrar Usuarios',
      onAction: () => {
        onClose();
        onOpenUserManagementModal();
      },
    },
  ];

  if (!isOpen) return null;

  const currentStep = tourSteps[currentStepIndex];

  const filteredSteps = tourSteps.filter((step) => {
    const matchesCategory =
      selectedCategory === 'TODOS' || step.category === selectedCategory;
    const matchesSearch =
      step.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      step.buttonName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      step.description.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = ['TODOS', 'Encabezado', 'MRP & Fichas', 'Inventario', 'Planta MES', 'Empresas & Usuarios'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl border border-[#E6E1D8] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#E6E1D8] bg-[#FAF8F5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#EBF3ED] text-[#2D4632] shadow-2xs">
              <HelpCircle className="w-5 h-5 text-[#3A5A40]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[#1C211D]">
                  Demo Interactiva & Guía de Botones TextilIQ
                </h2>
                <span className="px-2 py-0.5 bg-[#3A5A40] text-white text-[10px] font-bold rounded-full">
                  Guía Oficial
                </span>
              </div>
              <p className="text-xs text-[#5F6B61] mt-0.5">
                Conoce para qué sirve cada botón, módulo y herramienta de la plataforma
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-[#EBE7DF] p-0.5 rounded-xl text-xs font-bold">
              <button
                onClick={() => setViewMode('tour')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'tour'
                    ? 'bg-white text-[#1C211D] shadow-2xs'
                    : 'text-[#5F6B61] hover:text-[#1C211D]'
                }`}
              >
                Tour Guiado
              </button>
              <button
                onClick={() => setViewMode('directory')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'directory'
                    ? 'bg-white text-[#1C211D] shadow-2xs'
                    : 'text-[#5F6B61] hover:text-[#1C211D]'
                }`}
              >
                Directorio ({tourSteps.length})
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#5F6B61] hover:text-[#1C211D] hover:bg-[#EAE6DF] transition-colors cursor-pointer"
              id="btn-close-tour-modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TOUR MODE */}
        {viewMode === 'tour' && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
            {/* Progress bar and indicators */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#3A5A40]">
                  Paso {currentStepIndex + 1} de {tourSteps.length}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#EBF3ED] text-[#2D4632] font-bold text-[11px]">
                  {currentStep.category}
                </span>
              </div>
              <div className="w-full h-2 bg-[#FAF8F5] rounded-full overflow-hidden border border-[#E6E1D8]">
                <div
                  className="h-full bg-[#3A5A40] transition-all duration-300 rounded-full"
                  style={{
                    width: `${((currentStepIndex + 1) / tourSteps.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Step Content Card */}
            <div className="bg-[#FAF8F5] rounded-2xl p-5 sm:p-6 border border-[#E6E1D8] space-y-5 shadow-xs">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-white border border-[#E6E1D8] shadow-2xs">
                    {currentStep.icon}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-[#8F9990] uppercase tracking-wider block">
                      {currentStep.badge}
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-[#1C211D] leading-tight">
                      {currentStep.title}
                    </h3>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-xl bg-white border border-[#D5CEC2] text-xs font-mono font-bold text-[#1C211D] shrink-0 hidden sm:inline-block">
                  {currentStep.buttonName}
                </span>
              </div>

              {/* Mobile button name pill */}
              <div className="sm:hidden">
                <span className="px-2.5 py-1 rounded-lg bg-white border border-[#D5CEC2] text-xs font-mono font-bold text-[#1C211D] inline-block">
                  {currentStep.buttonName}
                </span>
              </div>

              <div className="bg-white rounded-xl p-4 border border-[#E6E1D8]">
                <h4 className="text-xs font-bold text-[#5F6B61] uppercase tracking-wider mb-1">
                  ¿Para qué sirve este botón / módulo?
                </h4>
                <p className="text-sm text-[#1C211D] leading-relaxed font-medium">
                  {currentStep.description}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#1C211D] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#3A5A40]" />
                  ¿Cómo utilizarlo en tu taller o empresa?
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {currentStep.howToUse.map((instruction, idx) => (
                    <li
                      key={idx}
                      className="bg-white p-3 rounded-xl border border-[#E6E1D8] text-xs text-[#4A544C] leading-relaxed"
                    >
                      <span className="w-5 h-5 rounded-full bg-[#EBF3ED] text-[#2D4632] font-bold text-[10px] inline-flex items-center justify-center mr-1.5 mb-1">
                        {idx + 1}
                      </span>
                      {instruction}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Direct Action Shortcut */}
            {currentStep.onAction && (
              <div className="flex items-center justify-between p-3.5 bg-[#EBF3ED] rounded-xl border border-[#D4E3D7]">
                <div className="flex items-center gap-2 text-xs text-[#233829] font-semibold">
                  <Info className="w-4 h-4 text-[#3A5A40] shrink-0" />
                  <span>Puedes probar y abrir esta herramienta ahora mismo:</span>
                </div>
                <button
                  onClick={currentStep.onAction}
                  className="px-3.5 py-1.5 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-transform active:scale-95 cursor-pointer"
                >
                  <span>{currentStep.actionButtonText || 'Abrir Herramienta'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* DIRECTORY MODE */}
        {viewMode === 'directory' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Search & Category Filter */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8F9990] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar botón, módulo o función..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#3A5A40]"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#3A5A40] text-white'
                        : 'bg-[#FAF8F5] text-[#5F6B61] hover:bg-[#EAE6DF]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredSteps.map((step, idx) => (
                <div
                  key={step.id}
                  className="bg-white p-4 rounded-xl border border-[#E6E1D8] shadow-2xs hover:border-[#3A5A40] transition-all space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-[#FAF8F5] border border-[#E6E1D8]">
                          {step.icon}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm text-[#1C211D]">
                            {step.title}
                          </h4>
                          <span className="text-[10px] font-mono text-[#5F6B61]">
                            {step.buttonName}
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#EBF3ED] text-[#2D4632]">
                        {step.category}
                      </span>
                    </div>

                    <p className="text-xs text-[#5F6B61] mt-2 leading-relaxed line-clamp-2">
                      {step.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#F2EEE6] flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        const originalIndex = tourSteps.findIndex((s) => s.id === step.id);
                        if (originalIndex !== -1) {
                          setCurrentStepIndex(originalIndex);
                          setViewMode('tour');
                        }
                      }}
                      className="text-xs font-bold text-[#3A5A40] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ver detalles paso a paso</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {step.onAction && (
                      <button
                        onClick={step.onAction}
                        className="px-2.5 py-1 bg-[#FAF8F5] hover:bg-[#3A5A40] hover:text-white text-[#1C211D] rounded-lg text-[11px] font-bold border border-[#D5CEC2] transition-colors cursor-pointer"
                      >
                        Abrir
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Bottom Footer Navigation */}
        <div className="p-4 sm:p-5 border-t border-[#E6E1D8] bg-[#FAF8F5] flex items-center justify-between gap-3">
          {viewMode === 'tour' ? (
            <>
              <button
                onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentStepIndex === 0}
                className="px-4 py-2 bg-white border border-[#D5CEC2] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FAF8F5] text-[#1C211D] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>

              {/* Step indicator dots */}
              <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto max-w-[300px]">
                {tourSteps.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentStepIndex(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                      idx === currentStepIndex
                        ? 'bg-[#3A5A40] w-6'
                        : 'bg-[#D5CEC2] hover:bg-[#A39C91]'
                    }`}
                    title={`Paso ${idx + 1}`}
                  />
                ))}
              </div>

              {currentStepIndex < tourSteps.length - 1 ? (
                <button
                  onClick={() =>
                    setCurrentStepIndex((prev) => Math.min(tourSteps.length - 1, prev + 1))
                  }
                  className="px-4 py-2 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="px-5 py-2 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>¡Listo! Comenzar a Operar</span>
                </button>
              )}
            </>
          ) : (
            <div className="w-full flex items-center justify-between">
              <span className="text-xs text-[#5F6B61]">
                Mostrando {filteredSteps.length} botones y funciones clave
              </span>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#3A5A40] text-white rounded-xl text-xs font-bold hover:bg-[#2D4632] cursor-pointer"
              >
                Cerrar Guía
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
