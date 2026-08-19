import { PermissionKey, UserRole, AppUser } from '../types';

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  description: string;
  category: 'General' | 'Ventas' | 'Ingeniería' | 'Abastecimiento' | 'Producción' | 'Seguridad';
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  {
    key: 'view_dashboard',
    label: 'Ver Panel Principal (Dashboard)',
    description: 'Visualizar métricas globales, alertas de inventario y estado del ciclo.',
    category: 'General',
  },
  {
    key: 'view_demand_forecast',
    label: 'Ver Metas de Ventas y Demanda',
    description: 'Acceder a proyecciones de demanda e historial de ventas.',
    category: 'Ventas',
  },
  {
    key: 'edit_sales_targets',
    label: 'Modificar Metas de Venta de Prendas',
    description: 'Ajustar cantidades meta, proyecciones por canal y recalcular pronósticos.',
    category: 'Ventas',
  },
  {
    key: 'view_tech_packs',
    label: 'Ver Fichas Técnicas & BOM',
    description: 'Consultar estructura de materiales, tiempos SAM, operaciones y calidad.',
    category: 'Ingeniería',
  },
  {
    key: 'edit_tech_packs',
    label: 'Editar Fichas Técnicas & Operaciones',
    description: 'Modificar consumos de telas/avíos, mermas, rutas de confección y puntos de calidad.',
    category: 'Ingeniería',
  },
  {
    key: 'view_mrp',
    label: 'Ver Planificador MRP',
    description: 'Consultar requerimientos brutos, netos, existencias y cálculo de déficit.',
    category: 'Abastecimiento',
  },
  {
    key: 'edit_mrp_stock',
    label: 'Ajustar Inventarios de Insumos',
    description: 'Modificar stock actual, tránsito, MOQ y stock de seguridad en bodegas.',
    category: 'Abastecimiento',
  },
  {
    key: 'manage_purchase_orders',
    label: 'Gestionar Órdenes de Compra (OC)',
    description: 'Generar pedidos a proveedores, emitir OC, registrar tránsitos y recepciones.',
    category: 'Abastecimiento',
  },
  {
    key: 'view_costing',
    label: 'Ver Costeo de Producción',
    description: 'Consultar comparativa de costos de fabricación interna vs maquila satélite.',
    category: 'Producción',
  },
  {
    key: 'edit_costing_rates',
    label: 'Modificar Tarifas de Taller & Maquila',
    description: 'Ajustar costo por minuto planta, costos indirectos CIF y tarifas de corte/confección externa.',
    category: 'Producción',
  },
  {
    key: 'manage_production_cycles',
    label: 'Configurar Horizonte & Temporadas',
    description: 'Cambiar horizonte de planificación, multiplicadores estacionales y simulación What-If.',
    category: 'Producción',
  },
  {
    key: 'manage_users',
    label: 'Administrar Usuarios y Permisos',
    description: 'Crear personal, asignar contraseñas, definir roles y restringir accesos.',
    category: 'Seguridad',
  },
  {
    key: 'import_export_csv',
    label: 'Importar / Exportar Datos CSV',
    description: 'Cargar o descargar bases de datos maestras de ventas, insumos y fichas técnicas.',
    category: 'General',
  },
];

export const ALL_PERMISSIONS: PermissionKey[] = PERMISSION_DEFINITIONS.map((p) => p.key);

export const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  Administrador: [
    'view_dashboard',
    'view_demand_forecast',
    'edit_sales_targets',
    'view_tech_packs',
    'edit_tech_packs',
    'view_mrp',
    'edit_mrp_stock',
    'manage_purchase_orders',
    'view_costing',
    'edit_costing_rates',
    'manage_production_cycles',
    'manage_users',
    'import_export_csv',
  ],
  Comercial: [
    'view_dashboard',
    'view_demand_forecast',
    'edit_sales_targets',
    'view_tech_packs',
    'import_export_csv',
  ],
  Ingenieria_BOM: [
    'view_dashboard',
    'view_tech_packs',
    'edit_tech_packs',
    'view_costing',
    'import_export_csv',
  ],
  Compras_MRP: [
    'view_dashboard',
    'view_mrp',
    'edit_mrp_stock',
    'manage_purchase_orders',
    'view_tech_packs',
    'import_export_csv',
  ],
  Produccion_Taller: [
    'view_dashboard',
    'view_tech_packs',
    'view_costing',
    'edit_costing_rates',
    'manage_production_cycles',
  ],
  Calidad_QC: [
    'view_dashboard',
    'view_tech_packs',
    'edit_tech_packs',
  ],
  Personalizado: [
    'view_dashboard',
  ],
};

export const ROLE_LABELS: Record<UserRole, { title: string; dept: string; color: string; badgeBg: string; textBg: string }> = {
  Administrador: {
    title: 'Administrador General',
    dept: 'Dirección General & Operaciones',
    color: '#4F46E5',
    badgeBg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    textBg: 'bg-indigo-600',
  },
  Comercial: {
    title: 'Comercial & Ventas',
    dept: 'Ventas & Estrategia Comercial',
    color: '#0891B2',
    badgeBg: 'bg-cyan-50 border-cyan-200 text-cyan-700',
    textBg: 'bg-cyan-600',
  },
  Ingenieria_BOM: {
    title: 'Ingeniería Textil & BOM',
    dept: 'Diseño, Patronaje & Fichas Técnicas',
    color: '#7C3AED',
    badgeBg: 'bg-purple-50 border-purple-200 text-purple-700',
    textBg: 'bg-purple-600',
  },
  Compras_MRP: {
    title: 'Compras & Abastecimiento',
    dept: 'Supply Chain & Bodega de Insumos',
    color: '#D97706',
    badgeBg: 'bg-amber-50 border-amber-200 text-amber-700',
    textBg: 'bg-amber-600',
  },
  Produccion_Taller: {
    title: 'Jefe de Producción & Satélites',
    dept: 'Planta de Confección & Maquilas',
    color: '#059669',
    badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    textBg: 'bg-emerald-600',
  },
  Calidad_QC: {
    title: 'Auditor de Calidad (QC)',
    dept: 'Control de Calidad & Procesos',
    color: '#DC2626',
    badgeBg: 'bg-rose-50 border-rose-200 text-rose-700',
    textBg: 'bg-rose-600',
  },
  Personalizado: {
    title: 'Rol Personalizado',
    dept: 'Área Especial',
    color: '#4B5563',
    badgeBg: 'bg-gray-50 border-gray-200 text-gray-700',
    textBg: 'bg-gray-600',
  },
};

export function hasPermission(user: AppUser | null | undefined, permission: PermissionKey): boolean {
  if (!user || !user.isActive) return false;
  if (user.role === 'Administrador') return true;
  return user.permissions.includes(permission);
}
