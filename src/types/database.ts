import { MaterialCategory, MaterialUnit } from './index';

// ============================================================================
// ENTIDADES RELACIONALES DEL SISTEMA PRODUCTIVO TEXTIL (15 TABLAS PRINCIPALES)
// ============================================================================

// TABLA 1 — PRODUCTOS (Fila única por producto)
export interface TablaProducto {
  id_producto: string;
  SKU_Prenda: string; // UNIQUE
  Nombre_Prenda: string;
  Categoria_Prenda: string;
  Meta_Ventas_Ciclo: number;
  PVP_COP: number;
  estado: 'Activo' | 'Inactivo' | 'Descontinuado';
  stock_producto_terminado?: number;
  unidades_en_proceso?: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

// TABLA 2 — MATERIAS_PRIMAS (Inventario de insumos)
export interface TablaMateriaPrima {
  id_material: string;
  SKU_Material: string; // UNIQUE
  Nombre_Material: string;
  Categoria: MaterialCategory;
  Unidad_Medida: MaterialUnit; // Unidad de compra/almacenamiento
  Stock_Actual: number;
  En_Transito: number;
  Stock_Seguridad_Dias: number;
  MOQ_Lote_Minimo: number;
  Costo_Unitario_COP: number;
  Proveedor: string;
  Lead_Time_Dias: number;
  estado: 'Activo' | 'Inactivo';
  fecha_actualizacion: string;
  // Conversión técnica de uso
  unidad_uso?: MaterialUnit;
  factor_rendimiento?: number; // 1 unidad compra = N unidades uso
  merma_estandar_pct?: number;
  ancho_metros?: number;
  gramaje_gsm?: number;
  color?: string;
  descripcion?: string;
}

// TABLA 3 — FICHA_TECNICA (General de confección por producto: 1 PRODUCTO -> 1 FICHA)
export interface TablaFichaTecnica {
  id_ficha: string;
  id_producto: string;
  SKU_Prenda: string;
  Tiempo_Corte_Min: number;
  SAM_Confeccion_Min: number;
  Tiempo_Acabados_Min: number;
  Tarifa_Minuto_Interno_COP: number;
  Tarifa_Maquila_Corte_COP: number;
  Tarifa_Maquila_Confeccion_COP: number;
  Tarifa_Maquila_Acabados_COP: number;
  Merma_Corte_Porcentaje: number;
  Notas_Ficha_Tecnica: string;
  version: string;
  estado: 'Vigente' | 'En Revision' | 'Obsoleta';
  fecha_actualizacion: string;
}

// TABLA 4 — FICHA_TECNICA_MATERIALES / BOM (1 PRODUCTO -> N MATERIALES, 1 MATERIAL -> N PRODUCTOS)
export interface TablaBOMItem {
  id_bom: string;
  id_producto: string;
  id_material: string;
  SKU_Prenda: string;
  SKU_Material: string;
  Nombre_Material?: string;
  Categoria_Material?: MaterialCategory;
  Consumo_Por_Prenda: number;
  Unidad_Medida: MaterialUnit;
  Merma_Corte_Porcentaje: number;
  costo_material_unitario: number;
  costo_material_por_prenda: number; // Consumo × (1 + Merma/100) × Costo Unitario
}

// TABLA 5 — VENTAS_HISTORICAS (PRODUCTO 1 -> N VENTAS)
export interface TablaVentaHistorica {
  id_venta: string;
  Fecha: string;
  SKU_Prenda: string;
  id_producto: string;
  Nombre_Prenda: string;
  Unidades_Vendidas: number;
  Canal: string; // E-Commerce, Retail, Mayorista, Boutique, etc.
  Ingreso_Total_COP: number;
}

// TABLA 6 — PROVEEDORES
export interface TablaProveedor {
  id_proveedor: string;
  nombre_proveedor: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  ciudad?: string;
  tiempo_entrega_dias: number;
  estado: 'Activo' | 'Inactivo' | 'Bloqueado';
  observaciones?: string;
}

// TABLA 7 — ORDENES_DE_COMPRA (Abastecimiento)
export interface TablaOrdenCompra {
  id_orden_compra: string;
  numero_orden: string; // ej: OC-2026-001
  id_proveedor: string;
  nombre_proveedor: string;
  fecha_orden: string;
  fecha_estimada_entrega: string;
  fecha_recepcion_real?: string;
  estado: 'Borrador' | 'Pendiente' | 'Ordenada' | 'En tránsito' | 'Recibida' | 'Cancelada';
  costo_total_COP: number;
  observaciones?: string;
}

// TABLA 8 — DETALLE_ORDEN_COMPRA
export interface TablaDetalleOrdenCompra {
  id_detalle: string;
  id_orden_compra: string;
  id_material: string;
  SKU_Material: string;
  Nombre_Material: string;
  cantidad: number;
  Unidad_Medida: MaterialUnit;
  costo_unitario_COP: number;
  subtotal_COP: number;
}

// TABLA 9 — INVENTARIO_MOVIMIENTOS (Kardex estricto)
export type TipoMovimientoInventario =
  | 'Entrada'
  | 'Salida'
  | 'Ajuste'
  | 'Ajuste inventario'
  | 'Consumo producción'
  | 'Devolución'
  | 'Recepción compra';

export interface TablaInventarioMovimiento {
  id_movimiento: string;
  id_material: string;
  SKU_Material: string;
  Nombre_Material: string;
  tipo_movimiento: TipoMovimientoInventario;
  cantidad: number;
  stock_anterior: number;
  stock_posterior: number;
  costo_unitario_COP: number;
  referencia: string; // OP, Factura, Remisión o Motivo
  fecha: string;
  usuario: string;
  observaciones?: string;
}

// TABLA 10 — ORDENES_PRODUCCION (Fabricación de lotes)
export type EstadoOrdenProduccion =
  | 'Borrador'
  | 'Planificada'
  | 'Materiales pendientes'
  | 'Lista para producir'
  | 'En corte'
  | 'En confección'
  | 'En acabados'
  | 'Control de calidad'
  | 'Terminada'
  | 'Cerrada'
  | 'Cancelada';

export interface TablaOrdenProduccion {
  id_orden_produccion: string;
  numero_orden: string; // ej: OP-2026-001
  id_producto: string;
  SKU_Prenda: string;
  Nombre_Prenda: string;
  cantidad_planificada: number;
  cantidad_producida: number;
  cantidad_rechazada: number;
  fecha_creacion: string;
  fecha_inicio?: string;
  fecha_entrega_estimada: string;
  fecha_cierre?: string;
  prioridad: 'Normal' | 'Alta' | 'Urgente';
  estado: EstadoOrdenProduccion;
  planta_asignada?: string;
  costo_estimado: number;
  costo_real: number;
  observaciones?: string;
}

// TABLA 11 — DETALLE_PRODUCCION (Etapas del MES)
export type EtapaProduccion = 'Corte' | 'Confección' | 'Acabados' | 'Control de calidad' | 'Empaque';

export interface TablaDetalleProduccion {
  id_detalle: string;
  id_orden_produccion: string;
  etapa: EtapaProduccion;
  cantidad: number;
  tiempo_estimado_min: number;
  tiempo_real_min: number;
  costo_estimado: number;
  costo_real: number;
  estado: 'Pendiente' | 'En Proceso' | 'Completada';
  fecha_inicio?: string;
  fecha_fin?: string;
  responsable: string;
  observaciones?: string;
}

// TABLA 12 — CONSUMO_MATERIALES_PRODUCCION (Descuento automático según BOM)
export interface TablaConsumoMaterialProduccion {
  id_consumo: string;
  id_orden_produccion: string;
  id_material: string;
  SKU_Material: string;
  Nombre_Material: string;
  cantidad_planificada: number; // cantidad_planificada × Consumo × (1 + Merma/100)
  cantidad_consumida: number;
  unidad_medida: MaterialUnit;
  costo_unitario: number;
  costo_total: number;
  fecha: string;
}

// TABLA 13 — CONTROL_CALIDAD (Inspección de lotes)
export interface TablaControlCalidad {
  id_control: string;
  id_orden_produccion: string;
  numero_orden?: string;
  SKU_Prenda?: string;
  cantidad_inspeccionada: number;
  cantidad_aprobada: number;
  cantidad_rechazada: number;
  porcentaje_rechazo: number;
  motivo_rechazo: string;
  observaciones?: string;
  responsable: string;
  fecha: string;
}

// TABLA 14 — COSTOS_PRODUCCION (Cálculo real de fabricación)
export interface TablaCostosProduccion {
  id_costo: string;
  id_orden_produccion: string;
  SKU_Prenda?: string;
  costo_materiales: number;
  costo_corte: number;
  costo_confeccion: number;
  costo_acabados: number;
  costo_maquila: number;
  costo_empaque: number;
  otros_costos: number;
  costo_total: number;
  costo_unitario: number;
  margen_estimado_pct?: number;
  fecha_actualizacion: string;
}

// TABLA 15 — PLANIFICACION_DEMANDA
export interface TablaPlanificacionDemanda {
  id_proyeccion: string;
  SKU_Prenda: string;
  Nombre_Prenda?: string;
  periodo: string;
  ventas_historicas: number;
  demanda_proyectada: number;
  stock_disponible: number;
  produccion_recomendada: number;
  fecha_generacion: string;
}

// ============================================================================
// RESUMEN DE ALERTAS EN TIEMPO REAL
// ============================================================================
export interface AlertaProductiva {
  id: string;
  tipo:
    | 'STOCK_MINIMO'
    | 'MATERIAL_INSUFICIENTE_OP'
    | 'MATERIAL_EN_TRANSITO'
    | 'ORDEN_COMPRA_ATRASADA'
    | 'PRODUCTO_ALTA_DEMANDA'
    | 'PRODUCTO_BAJA_ROTACION'
    | 'PRODUCCION_ATRASADA'
    | 'EXCESO_INVENTARIO'
    | 'ALTO_DESPERDICIO'
    | 'ALTO_RECHAZO_CALIDAD'
    | 'INCREMENTO_COSTOS';
  severidad: 'Critica' | 'Advertencia' | 'Informativa';
  titulo: string;
  descripcion: string;
  entidad_relacionada?: string;
  accion_recomendada: string;
  fecha: string;
}
