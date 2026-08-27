import {
  TablaProducto,
  TablaMateriaPrima,
  TablaFichaTecnica,
  TablaBOMItem,
  TablaVentaHistorica,
  TablaProveedor,
  TablaOrdenCompra,
  TablaDetalleOrdenCompra,
  TablaInventarioMovimiento,
  TablaOrdenProduccion,
  TablaDetalleProduccion,
  TablaConsumoMaterialProduccion,
  TablaControlCalidad,
  TablaCostosProduccion,
  TablaPlanificacionDemanda,
  AlertaProductiva,
  TipoMovimientoInventario,
  EstadoOrdenProduccion,
  EtapaProduccion,
} from '../types/database';
import {
  REAL_MATERIAS_PRIMAS,
  REAL_PRODUCTOS,
  REAL_FICHAS_TECNICAS,
  REAL_BOM_ITEMS,
  REAL_VENTAS_HISTORICAS,
  REAL_PROVEEDORES,
  buildGarmentsFromRelational,
  buildRawMaterialsFromRelational,
  buildSalesFromRelational,
} from '../data/realTextileData';
import { Garment, RawMaterial, SalesRecord, ProductionOrder, PurchaseOrder } from '../types';

// Storage Keys in LocalStorage
const STORAGE_KEYS = {
  PRODUCTOS: 'textiliq_rel_productos_v2',
  MATERIAS_PRIMAS: 'textiliq_rel_materias_v2',
  FICHAS_TECNICAS: 'textiliq_rel_fichas_v2',
  BOM_ITEMS: 'textiliq_rel_bom_v2',
  VENTAS_HISTORICAS: 'textiliq_rel_ventas_v2',
  PROVEEDORES: 'textiliq_rel_proveedores_v2',
  ORDENES_COMPRA: 'textiliq_rel_ordenes_compra_v2',
  DETALLE_ORDENES_COMPRA: 'textiliq_rel_detalles_compra_v2',
  MOVIMIENTOS_INVENTARIO: 'textiliq_rel_movimientos_v2',
  ORDENES_PRODUCCION: 'textiliq_rel_ordenes_produccion_v2',
  DETALLE_PRODUCCION: 'textiliq_rel_detalles_produccion_v2',
  CONSUMOS_PRODUCCION: 'textiliq_rel_consumos_produccion_v2',
  CONTROL_CALIDAD: 'textiliq_rel_control_calidad_v2',
  COSTOS_PRODUCCION: 'textiliq_rel_costos_produccion_v2',
  PLANIFICACION_DEMANDA: 'textiliq_rel_planificacion_v2',
  SEEDED_FLAG: 'textiliq_rel_db_seeded_v2',
};

// Safe JSON get/set helpers
function getStored<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultVal;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Error reading ${key} from storage:`, err);
    return defaultVal;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

export class UnifiedDatabase {
  // Initialize Database with real seed if not already present
  public static initDatabase(forceReset = false): void {
    const isSeeded = localStorage.getItem(STORAGE_KEYS.SEEDED_FLAG);
    if (!isSeeded || forceReset) {
      this.seedInitialRealData();
    }
  }

  public static seedInitialRealData(): void {
    setStored(STORAGE_KEYS.PRODUCTOS, REAL_PRODUCTOS);
    setStored(STORAGE_KEYS.MATERIAS_PRIMAS, REAL_MATERIAS_PRIMAS);
    setStored(STORAGE_KEYS.FICHAS_TECNICAS, REAL_FICHAS_TECNICAS);
    setStored(STORAGE_KEYS.BOM_ITEMS, REAL_BOM_ITEMS);
    setStored(STORAGE_KEYS.VENTAS_HISTORICAS, REAL_VENTAS_HISTORICAS);
    setStored(STORAGE_KEYS.PROVEEDORES, REAL_PROVEEDORES);

    // Generate initial sample production orders based on real garments
    const initialOPs: TablaOrdenProduccion[] = [
      {
        id_orden_produccion: 'op-001',
        numero_orden: 'OP-2026-001',
        id_producto: 'prod-bh01',
        SKU_Prenda: 'BH01',
        Nombre_Prenda: 'Boxer de Hombre Algodón Superior',
        cantidad_planificada: 500,
        cantidad_producida: 320,
        cantidad_rechazada: 8,
        fecha_creacion: '2026-08-01',
        fecha_inicio: '2026-08-05',
        fecha_entrega_estimada: '2026-08-30',
        prioridad: 'Alta',
        estado: 'En confección',
        planta_asignada: 'Taller Central - Módulo A',
        costo_estimado: 500 * 16500,
        costo_real: 320 * 16800,
        observaciones: 'Lote principal para reabastecimiento e-commerce',
      },
      {
        id_orden_produccion: 'op-002',
        numero_orden: 'OP-2026-002',
        id_producto: 'prod-ch01',
        SKU_Prenda: 'CH01',
        Nombre_Prenda: 'Camiseta Hombre Cuello Redondo',
        cantidad_planificada: 600,
        cantidad_producida: 0,
        cantidad_rechazada: 0,
        fecha_creacion: '2026-08-15',
        fecha_inicio: '2026-08-20',
        fecha_entrega_estimada: '2026-09-10',
        prioridad: 'Normal',
        estado: 'En corte',
        planta_asignada: 'Taller Central - Corte',
        costo_estimado: 600 * 22400,
        costo_real: 0,
        observaciones: 'Producción programada para canal Mayorista',
      },
      {
        id_orden_produccion: 'op-003',
        numero_orden: 'OP-2026-003',
        id_producto: 'prod-td01',
        SKU_Prenda: 'TD01',
        Nombre_Prenda: 'Trío Básico Dama Panty',
        cantidad_planificada: 400,
        cantidad_producida: 400,
        cantidad_rechazada: 5,
        fecha_creacion: '2026-07-10',
        fecha_inicio: '2026-07-15',
        fecha_entrega_estimada: '2026-08-10',
        fecha_cierre: '2026-08-12',
        prioridad: 'Normal',
        estado: 'Terminada',
        planta_asignada: 'Maquila Satélite Confecciones Medellín',
        costo_estimado: 400 * 26000,
        costo_real: 400 * 25800,
        observaciones: 'Lote completado e ingresado a producto terminado',
      },
    ];
    setStored(STORAGE_KEYS.ORDENES_PRODUCCION, initialOPs);

    // Initial production stage details
    const initialStages: TablaDetalleProduccion[] = [
      {
        id_detalle: 'det-op1-corte',
        id_orden_produccion: 'op-001',
        etapa: 'Corte',
        cantidad: 500,
        tiempo_estimado_min: 500 * 1.2,
        tiempo_real_min: 610,
        costo_estimado: 500 * 1.2 * 280,
        costo_real: 610 * 280,
        estado: 'Completada',
        fecha_inicio: '2026-08-05',
        fecha_fin: '2026-08-07',
        responsable: 'Carlos Ruiz',
      },
      {
        id_detalle: 'det-op1-conf',
        id_orden_produccion: 'op-001',
        etapa: 'Confección',
        cantidad: 500,
        tiempo_estimado_min: 500 * 8.5,
        tiempo_real_min: 320 * 8.6,
        costo_estimado: 500 * 8.5 * 280,
        costo_real: 320 * 8.6 * 280,
        estado: 'En Proceso',
        fecha_inicio: '2026-08-08',
        responsable: 'Margarita Pérez',
      },
    ];
    setStored(STORAGE_KEYS.DETALLE_PRODUCCION, initialStages);

    // Initial inventory movements (Initial Stock entries)
    const initialMovements: TablaInventarioMovimiento[] = REAL_MATERIAS_PRIMAS.map((m) => ({
      id_movimiento: `mov-init-${m.SKU_Material.toLowerCase()}`,
      id_material: m.id_material,
      SKU_Material: m.SKU_Material,
      Nombre_Material: m.Nombre_Material,
      tipo_movimiento: 'Entrada' as TipoMovimientoInventario,
      cantidad: m.Stock_Actual,
      stock_anterior: 0,
      stock_posterior: m.Stock_Actual,
      costo_unitario_COP: m.Costo_Unitario_COP,
      referencia: 'Saldo Inicial de Sistema CSV',
      fecha: '2026-08-26',
      usuario: 'Administrador Producción',
      observaciones: 'Inventario físico auditado y validado',
    }));
    setStored(STORAGE_KEYS.MOVIMIENTOS_INVENTARIO, initialMovements);

    // Initial purchase orders (En Tránsito)
    const initialPOs: TablaOrdenCompra[] = [
      {
        id_orden_compra: 'po-2026-001',
        numero_orden: 'OC-2026-001',
        id_proveedor: 'prov-01',
        nombre_proveedor: 'Textiles Fabricato / El Cóndor S.A.',
        fecha_orden: '2026-08-18',
        fecha_estimada_entrega: '2026-08-30',
        estado: 'En tránsito',
        costo_total_COP: 250 * 36000,
        observaciones: '250 kg de Algodón Licrado TM01 para soporte de OPs',
      },
      {
        id_orden_compra: 'po-2026-002',
        numero_orden: 'OC-2026-002',
        id_proveedor: 'prov-03',
        nombre_proveedor: 'Coltejer Textil Colombiana',
        fecha_orden: '2026-08-20',
        fecha_estimada_entrega: '2026-09-04',
        estado: 'En tránsito',
        costo_total_COP: 400 * 32000,
        observaciones: '400 kg de Algodón Peinado TM03 para camisetas',
      },
    ];
    setStored(STORAGE_KEYS.ORDENES_COMPRA, initialPOs);

    // Initial Quality control logs
    const initialQC: TablaControlCalidad[] = [
      {
        id_control: 'qc-001',
        id_orden_produccion: 'op-003',
        numero_orden: 'OP-2026-003',
        SKU_Prenda: 'TD01',
        cantidad_inspeccionada: 400,
        cantidad_aprobada: 395,
        cantidad_rechazada: 5,
        porcentaje_rechazo: 1.25,
        motivo_rechazo: 'Costura de sesgo desalineada en 5 unidades',
        responsable: 'Inspector Calidad - Planta',
        fecha: '2026-08-12',
      },
    ];
    setStored(STORAGE_KEYS.CONTROL_CALIDAD, initialQC);

    localStorage.setItem(STORAGE_KEYS.SEEDED_FLAG, 'true');
  }

  // ==========================================================================
  // PRODUCTOS (CRUD)
  // ==========================================================================
  public static getProductos(): TablaProducto[] {
    this.initDatabase();
    return getStored<TablaProducto[]>(STORAGE_KEYS.PRODUCTOS, []);
  }

  public static saveProducto(producto: TablaProducto): void {
    const list = this.getProductos();
    const index = list.findIndex((p) => p.SKU_Prenda.toUpperCase() === producto.SKU_Prenda.toUpperCase());
    if (index >= 0) {
      list[index] = { ...list[index], ...producto, fecha_actualizacion: new Date().toISOString().split('T')[0] };
    } else {
      list.push(producto);
    }
    setStored(STORAGE_KEYS.PRODUCTOS, list);
  }

  public static deleteProducto(sku: string): void {
    const list = this.getProductos().filter((p) => p.SKU_Prenda.toUpperCase() !== sku.toUpperCase());
    setStored(STORAGE_KEYS.PRODUCTOS, list);
  }

  // ==========================================================================
  // MATERIAS PRIMAS & KARDEX MOVIMIENTOS (CRUD + RELACIONAL)
  // ==========================================================================
  public static getMateriasPrimas(): TablaMateriaPrima[] {
    this.initDatabase();
    return getStored<TablaMateriaPrima[]>(STORAGE_KEYS.MATERIAS_PRIMAS, []);
  }

  public static saveMateriaPrima(materia: TablaMateriaPrima): void {
    const list = this.getMateriasPrimas();
    const index = list.findIndex((m) => m.SKU_Material.toUpperCase() === materia.SKU_Material.toUpperCase());
    if (index >= 0) {
      list[index] = { ...list[index], ...materia, fecha_actualizacion: new Date().toISOString().split('T')[0] };
    } else {
      list.push(materia);
    }
    setStored(STORAGE_KEYS.MATERIAS_PRIMAS, list);
  }

  // Strict stock adjustment with automatic Kardex log
  public static updateMaterialStock(params: {
    materialSku: string;
    newStock: number;
    newInTransit?: number;
    tipoMovimiento: TipoMovimientoInventario;
    referencia: string;
    usuario?: string;
    observaciones?: string;
  }): void {
    const list = this.getMateriasPrimas();
    const mat = list.find((m) => m.SKU_Material.toUpperCase() === params.materialSku.toUpperCase());
    if (!mat) return;

    const previousStock = mat.Stock_Actual;
    const diff = params.newStock - previousStock;
    mat.Stock_Actual = Math.max(0, params.newStock);
    if (params.newInTransit !== undefined) {
      mat.En_Transito = Math.max(0, params.newInTransit);
    }
    mat.fecha_actualizacion = new Date().toISOString().split('T')[0];
    setStored(STORAGE_KEYS.MATERIAS_PRIMAS, list);

    // Create movement log
    const movement: TablaInventarioMovimiento = {
      id_movimiento: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      id_material: mat.id_material,
      SKU_Material: mat.SKU_Material,
      Nombre_Material: mat.Nombre_Material,
      tipo_movimiento: params.tipoMovimiento,
      cantidad: Math.abs(diff),
      stock_anterior: previousStock,
      stock_posterior: mat.Stock_Actual,
      costo_unitario_COP: mat.Costo_Unitario_COP,
      referencia: params.referencia,
      fecha: new Date().toISOString().split('T')[0],
      usuario: params.usuario || 'Sistema',
      observaciones: params.observaciones,
    };

    const movs = this.getMovimientos();
    movs.unshift(movement);
    setStored(STORAGE_KEYS.MOVIMIENTOS_INVENTARIO, movs);
  }

  // ==========================================================================
  // FICHAS TÉCNICAS & BOM (1 PRODUCTO -> N MATERIALES)
  // ==========================================================================
  public static getFichasTecnicas(): TablaFichaTecnica[] {
    this.initDatabase();
    return getStored<TablaFichaTecnica[]>(STORAGE_KEYS.FICHAS_TECNICAS, []);
  }

  public static getBOMItems(): TablaBOMItem[] {
    this.initDatabase();
    return getStored<TablaBOMItem[]>(STORAGE_KEYS.BOM_ITEMS, []);
  }

  public static saveFichaTecnica(ficha: TablaFichaTecnica): void {
    const list = this.getFichasTecnicas();
    const index = list.findIndex((f) => f.SKU_Prenda.toUpperCase() === ficha.SKU_Prenda.toUpperCase());
    if (index >= 0) {
      list[index] = { ...list[index], ...ficha, fecha_actualizacion: new Date().toISOString().split('T')[0] };
    } else {
      list.push(ficha);
    }
    setStored(STORAGE_KEYS.FICHAS_TECNICAS, list);
  }

  public static saveBOMItem(item: TablaBOMItem): void {
    const list = this.getBOMItems();
    const index = list.findIndex(
      (b) =>
        b.SKU_Prenda.toUpperCase() === item.SKU_Prenda.toUpperCase() &&
        b.SKU_Material.toUpperCase() === item.SKU_Material.toUpperCase()
    );
    if (index >= 0) {
      list[index] = item;
    } else {
      list.push(item);
    }
    setStored(STORAGE_KEYS.BOM_ITEMS, list);
  }

  public static deleteBOMItem(skuPrenda: string, skuMaterial: string): void {
    const list = this.getBOMItems().filter(
      (b) =>
        !(
          b.SKU_Prenda.toUpperCase() === skuPrenda.toUpperCase() &&
          b.SKU_Material.toUpperCase() === skuMaterial.toUpperCase()
        )
    );
    setStored(STORAGE_KEYS.BOM_ITEMS, list);
  }

  // ==========================================================================
  // VENTAS HISTÓRICAS
  // ==========================================================================
  public static getVentasHistoricas(): TablaVentaHistorica[] {
    this.initDatabase();
    return getStored<TablaVentaHistorica[]>(STORAGE_KEYS.VENTAS_HISTORICAS, []);
  }

  public static addVentaHistorica(venta: TablaVentaHistorica): void {
    const list = this.getVentasHistoricas();
    list.unshift(venta);
    setStored(STORAGE_KEYS.VENTAS_HISTORICAS, list);
  }

  // ==========================================================================
  // PROVEEDORES
  // ==========================================================================
  public static getProveedores(): TablaProveedor[] {
    this.initDatabase();
    return getStored<TablaProveedor[]>(STORAGE_KEYS.PROVEEDORES, []);
  }

  public static saveProveedor(prov: TablaProveedor): void {
    const list = this.getProveedores();
    const index = list.findIndex((p) => p.nombre_proveedor.toUpperCase() === prov.nombre_proveedor.toUpperCase());
    if (index >= 0) {
      list[index] = prov;
    } else {
      list.push(prov);
    }
    setStored(STORAGE_KEYS.PROVEEDORES, list);
  }

  // ==========================================================================
  // ORDENES DE COMPRA (ABASTECIMIENTO)
  // ==========================================================================
  public static getOrdenesCompra(): TablaOrdenCompra[] {
    this.initDatabase();
    return getStored<TablaOrdenCompra[]>(STORAGE_KEYS.ORDENES_COMPRA, []);
  }

  public static saveOrdenCompra(po: TablaOrdenCompra): void {
    const list = this.getOrdenesCompra();
    const index = list.findIndex((p) => p.id_orden_compra === po.id_orden_compra);
    if (index >= 0) {
      list[index] = po;
    } else {
      list.unshift(po);
    }
    setStored(STORAGE_KEYS.ORDENES_COMPRA, list);
  }

  // Receive a purchase order -> increments stock of materials and logs Kardex entry
  public static receivePurchaseOrder(orderId: string, items: { sku: string; qty: number }[], user = 'Almacén'): void {
    const orders = this.getOrdenesCompra();
    const po = orders.find((o) => o.id_orden_compra === orderId);
    if (po) {
      po.estado = 'Recibida';
      po.fecha_recepcion_real = new Date().toISOString().split('T')[0];
      setStored(STORAGE_KEYS.ORDENES_COMPRA, orders);
    }

    const materials = this.getMateriasPrimas();
    items.forEach((item) => {
      const mat = materials.find((m) => m.SKU_Material.toUpperCase() === item.sku.toUpperCase());
      if (mat) {
        const prevStock = mat.Stock_Actual;
        const newStock = prevStock + item.qty;
        const newInTransit = Math.max(0, mat.En_Transito - item.qty);
        mat.Stock_Actual = newStock;
        mat.En_Transito = newInTransit;

        // Log Kardex
        this.updateMaterialStock({
          materialSku: mat.SKU_Material,
          newStock,
          newInTransit,
          tipoMovimiento: 'Recepción compra',
          referencia: po?.numero_orden || `OC-${orderId}`,
          usuario: user,
          observaciones: `Recepción de pedido proveedor: ${po?.nombre_proveedor || 'Proveedor'}`,
        });
      }
    });
  }

  // ==========================================================================
  // ORDENES DE PRODUCCIÓN & CONSUMO DE MATERIALES
  // ==========================================================================
  public static getOrdenesProduccion(): TablaOrdenProduccion[] {
    this.initDatabase();
    return getStored<TablaOrdenProduccion[]>(STORAGE_KEYS.ORDENES_PRODUCCION, []);
  }

  public static saveOrdenProduccion(op: TablaOrdenProduccion): void {
    const list = this.getOrdenesProduccion();
    const index = list.findIndex((o) => o.id_orden_produccion === op.id_orden_produccion);
    if (index >= 0) {
      list[index] = op;
    } else {
      list.unshift(op);
    }
    setStored(STORAGE_KEYS.ORDENES_PRODUCCION, list);
  }

  // Calculate material requirements for a production order based on BOM
  public static calculateOrderMaterials(
    skuPrenda: string,
    unitsToProduce: number
  ): {
    skuMaterial: string;
    nombreMaterial: string;
    categoria: string;
    consumoUnitario: number;
    mermaPct: number;
    totalRequerido: number;
    stockDisponible: number;
    stockEnTransito: number;
    faltante: number;
    costoUnitario: number;
    costoTotalEstimado: number;
    unidad: string;
  }[] {
    const boms = this.getBOMItems().filter((b) => b.SKU_Prenda.toUpperCase() === skuPrenda.toUpperCase());
    const materials = this.getMateriasPrimas();

    return boms.map((b) => {
      const mat = materials.find((m) => m.SKU_Material.toUpperCase() === b.SKU_Material.toUpperCase());
      const totalRequerido = Number((unitsToProduce * b.Consumo_Por_Prenda * (1 + b.Merma_Corte_Porcentaje / 100)).toFixed(2));
      const stock = mat ? mat.Stock_Actual : 0;
      const enTransito = mat ? mat.En_Transito : 0;
      const faltante = Math.max(0, totalRequerido - stock);
      const costoUnitario = mat ? mat.Costo_Unitario_COP : b.costo_material_unitario;

      return {
        skuMaterial: b.SKU_Material,
        nombreMaterial: mat ? mat.Nombre_Material : b.Nombre_Material || b.SKU_Material,
        categoria: mat ? mat.Categoria : (b.Categoria_Material || 'Tela'),
        consumoUnitario: b.Consumo_Por_Prenda,
        mermaPct: b.Merma_Corte_Porcentaje,
        totalRequerido,
        stockDisponible: stock,
        stockEnTransito: enTransito,
        faltante,
        costoUnitario,
        costoTotalEstimado: Math.round(totalRequerido * costoUnitario),
        unidad: b.Unidad_Medida,
      };
    });
  }

  // Start a production order: deducts required materials from inventory, creates Kardex logs, and moves status to "En corte"
  public static startProductionOrder(orderId: string, user = 'Jefe Producción'): boolean {
    const ops = this.getOrdenesProduccion();
    const op = ops.find((o) => o.id_orden_produccion === orderId);
    if (!op) return false;

    const reqs = this.calculateOrderMaterials(op.SKU_Prenda, op.cantidad_planificada);
    const materials = this.getMateriasPrimas();

    // Deduct stock for each required material
    reqs.forEach((r) => {
      const mat = materials.find((m) => m.SKU_Material.toUpperCase() === r.skuMaterial.toUpperCase());
      if (mat) {
        const newStock = Math.max(0, mat.Stock_Actual - r.totalRequerido);
        this.updateMaterialStock({
          materialSku: mat.SKU_Material,
          newStock,
          tipoMovimiento: 'Consumo producción',
          referencia: op.numero_orden,
          usuario: user,
          observaciones: `Consumo automático BOM para lote de ${op.cantidad_planificada} unds de ${op.SKU_Prenda}`,
        });
      }
    });

    op.estado = 'En corte';
    op.fecha_inicio = new Date().toISOString().split('T')[0];
    setStored(STORAGE_KEYS.ORDENES_PRODUCCION, ops);
    return true;
  }

  // Advance production order stage and log QC if finished
  public static advanceProductionStage(
    orderId: string,
    newStatus: EstadoOrdenProduccion,
    unitsCompleted?: number,
    unitsDefective = 0,
    user = 'Supervisor'
  ): void {
    const ops = this.getOrdenesProduccion();
    const op = ops.find((o) => o.id_orden_produccion === orderId);
    if (!op) return;

    op.estado = newStatus;
    if (unitsCompleted !== undefined) {
      op.cantidad_producida = unitsCompleted;
    }
    if (unitsDefective > 0) {
      op.cantidad_rechazada = (op.cantidad_rechazada || 0) + unitsDefective;
    }

    if (newStatus === 'Terminada' || newStatus === 'Cerrada') {
      op.fecha_cierre = new Date().toISOString().split('T')[0];
      // Increment finished goods in product table
      const prods = this.getProductos();
      const prod = prods.find((p) => p.SKU_Prenda.toUpperCase() === op.SKU_Prenda.toUpperCase());
      if (prod) {
        prod.stock_producto_terminado = (prod.stock_producto_terminado || 0) + op.cantidad_producida;
        prod.unidades_en_proceso = Math.max(0, (prod.unidades_en_proceso || 0) - op.cantidad_planificada);
        setStored(STORAGE_KEYS.PRODUCTOS, prods);
      }
    }

    setStored(STORAGE_KEYS.ORDENES_PRODUCCION, ops);
  }

  // ==========================================================================
  // CONTROL DE CALIDAD
  // ==========================================================================
  public static getControlCalidad(): TablaControlCalidad[] {
    this.initDatabase();
    return getStored<TablaControlCalidad[]>(STORAGE_KEYS.CONTROL_CALIDAD, []);
  }

  public static addControlCalidad(qc: TablaControlCalidad): void {
    const list = this.getControlCalidad();
    list.unshift(qc);
    setStored(STORAGE_KEYS.CONTROL_CALIDAD, list);
  }

  // ==========================================================================
  // KARDEX / MOVIMIENTOS
  // ==========================================================================
  public static getMovimientos(): TablaInventarioMovimiento[] {
    this.initDatabase();
    return getStored<TablaInventarioMovimiento[]>(STORAGE_KEYS.MOVIMIENTOS_INVENTARIO, []);
  }

  // ==========================================================================
  // MOTOR DE ALERTAS EN TIEMPO REAL
  // ==========================================================================
  public static calculateLiveAlerts(): AlertaProductiva[] {
    const alerts: AlertaProductiva[] = [];
    const materials = this.getMateriasPrimas();
    const products = this.getProductos();
    const ops = this.getOrdenesProduccion();
    const pos = this.getOrdenesCompra();
    const boms = this.getBOMItems();
    const sales = this.getVentasHistoricas();
    const qcList = this.getControlCalidad();

    // 1. Alert: Stock below safety stock
    materials.forEach((m) => {
      // Estimated daily consumption based on BOM & target sales (90 days cycle)
      let estimatedCycleDemand = 0;
      boms
        .filter((b) => b.SKU_Material.toUpperCase() === m.SKU_Material.toUpperCase())
        .forEach((b) => {
          const prod = products.find((p) => p.SKU_Prenda.toUpperCase() === b.SKU_Prenda.toUpperCase());
          const target = prod ? prod.Meta_Ventas_Ciclo : 1000;
          estimatedCycleDemand += target * b.Consumo_Por_Prenda * (1 + b.Merma_Corte_Porcentaje / 100);
        });

      const dailyConsumption = estimatedCycleDemand / 90;
      const safetyStockQty = dailyConsumption * m.Stock_Seguridad_Dias;

      if (m.Stock_Actual < safetyStockQty) {
        alerts.push({
          id: `alt-stock-min-${m.SKU_Material}`,
          tipo: 'STOCK_MINIMO',
          severidad: m.Stock_Actual === 0 ? 'Critica' : 'Advertencia',
          titulo: `Stock crítico: ${m.Nombre_Material} (${m.SKU_Material})`,
          descripcion: `Stock disponible (${m.Stock_Actual.toLocaleString()} ${m.Unidad_Medida}) por debajo del stock de seguridad calculado (${Math.round(safetyStockQty).toLocaleString()} ${m.Unidad_Medida} para ${m.Stock_Seguridad_Dias} días).`,
          entidad_relacionada: m.SKU_Material,
          accion_recomendada: `Generar Orden de Compra a ${m.Proveedor} por mínimo ${m.MOQ_Lote_Minimo} ${m.Unidad_Medida}.`,
          fecha: new Date().toISOString().split('T')[0],
        });
      }

      // 2. Alert: In-transit material
      if (m.En_Transito > 0) {
        alerts.push({
          id: `alt-transit-${m.SKU_Material}`,
          tipo: 'MATERIAL_EN_TRANSITO',
          severidad: 'Informativa',
          titulo: `En tránsito: ${m.Nombre_Material}`,
          descripcion: `Hay ${m.En_Transito.toLocaleString()} ${m.Unidad_Medida} en camino (Lead time estándar: ${m.Lead_Time_Dias} días).`,
          entidad_relacionada: m.SKU_Material,
          accion_recomendada: 'Monitorear remisión y fecha de llegada en Compras.',
          fecha: new Date().toISOString().split('T')[0],
        });
      }
    });

    // 3. Alert: Insufficient materials for planned production orders
    ops
      .filter((o) => o.estado === 'Planificada' || o.estado === 'Materiales pendientes')
      .forEach((o) => {
        const reqs = this.calculateOrderMaterials(o.SKU_Prenda, o.cantidad_planificada);
        const missing = reqs.filter((r) => r.faltante > 0);
        if (missing.length > 0) {
          const desc = missing
            .map((m) => `${m.nombreMaterial}: falta ${m.faltante.toLocaleString()} ${m.unidad}`)
            .join(', ');
          alerts.push({
            id: `alt-op-shortage-${o.id_orden_produccion}`,
            tipo: 'MATERIAL_INSUFICIENTE_OP',
            severidad: 'Critica',
            titulo: `Faltan insumos para ${o.numero_orden} (${o.SKU_Prenda})`,
            descripcion: `No se puede iniciar corte de ${o.cantidad_planificada} unds. Insumos faltantes: ${desc}.`,
            entidad_relacionada: o.numero_orden,
            accion_recomendada: 'Emitir orden de compra inmediata para los insumos faltantes.',
            fecha: new Date().toISOString().split('T')[0],
          });
        }
      });

    // 4. Alert: High rejection rate in quality control (>3%)
    qcList.forEach((qc) => {
      if (qc.porcentaje_rechazo > 3.0) {
        alerts.push({
          id: `alt-qc-high-${qc.id_control}`,
          tipo: 'ALTO_RECHAZO_CALIDAD',
          severidad: 'Advertencia',
          titulo: `Alto rechazo de calidad en ${qc.numero_orden || 'Lote'}: ${qc.porcentaje_rechazo}%`,
          descripcion: `Se rechazaron ${qc.cantidad_rechazada} de ${qc.cantidad_inspeccionada} prendas inspeccionadas. Motivo: ${qc.motivo_rechazo}.`,
          entidad_relacionada: qc.numero_orden,
          accion_recomendada: 'Auditar calibración de máquinas y corte en taller.',
          fecha: qc.fecha,
        });
      }
    });

    return alerts;
  }

  // ==========================================================================
  // GETTERS ADAPTADOS PARA COMPATIBILIDAD CON VISTAS DEL SISTEMA
  // ==========================================================================
  public static getLegacyGarments(): Garment[] {
    return buildGarmentsFromRelational(
      this.getProductos(),
      this.getFichasTecnicas(),
      this.getBOMItems(),
      this.getMateriasPrimas()
    );
  }

  public static getLegacyRawMaterials(): RawMaterial[] {
    return buildRawMaterialsFromRelational(this.getMateriasPrimas());
  }

  public static getLegacySalesRecords(): SalesRecord[] {
    return buildSalesFromRelational(this.getVentasHistoricas());
  }
}
