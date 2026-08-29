# 🧵 TEXORA — Inteligencia para la producción textil

> **Planifica. Compra. Produce. Controla.**  
> Plataforma integral Multi-Empresa de Inteligencia de Demanda, Cálculo MRP de Confección, Fichas Técnicas (BOM/SAM/QC), Costeo Taller vs. Maquila, Kardex de Inventario, Directorio de Proveedores, Control de Calidad (QC), Trazabilidad End-to-End, Ejecución en Planta (MES), Benchmarking Inter-Empresas y Control de Accesos por Roles (RBAC).

---

## 📋 Tabla de Contenido

1. [Visión General](#-visión-general)
2. [Arquitectura Tecnológica & Stack](#-arquitectura-tecnológica--stack)
3. [Módulos & Funcionalidades Principales](#-módulos--funcionalidades-principales)
   - [1. Modo Onboarding Limpio & Multi-Empresa (Restablecimiento a Ceros)](#1-modo-onboarding-limpio--multi-empresa-restablecimiento-a-ceros)
   - [2. Dashboard Ejecutivo & Centro de Alertas](#2-dashboard-ejecutivo--centro-de-alertas)
   - [3. Proyección de Demanda & Estacionalidad Textil](#3-proyección-de-demanda--estacionalidad-textil)
   - [4. Fichas Técnicas (Tech Packs), BOM & Tiempos SAM](#4-fichas-técnicas-tech-packs-bom--tiempos-sam)
   - [5. Conversión de Unidades de Compra a Unidades de Confección](#5-conversión-de-unidades-de-compra-a-unidades-de-confección)
   - [6. Motor de Cálculo MRP (Material Requirements Planning)](#6-motor-de-cálculo-mrp-material-requirements-planning)
   - [7. Kardex de Inventario & Movimientos de Stock](#7-kardex-de-inventario--movimientos-de-stock)
   - [8. Directorio Maestro de Proveedores](#8-directorio-maestro-de-proveedores)
   - [9. Ejecución en Planta & Control de Piso (MES)](#9-ejecución-en-planta--control-de-piso-mes)
   - [10. Control de Calidad & Inspecciones (QC)](#10-control-de-calidad--inspecciones-qc)
   - [11. Costeo de Producción: Taller Propio vs. Maquila Satélite](#11-costeo-de-producción-taller-propio-vs-maquila-satélite)
   - [12. Trazabilidad Integral End-to-End](#12-trazabilidad-integral-end-to-end)
   - [13. Benchmarking Comparativo Inter-Empresas](#13-benchmarking-comparativo-inter-empresas)
   - [14. Gestión de Órdenes de Compra & Abastecimiento](#14-gestión-de-órdenes-de-compra--abastecimiento)
   - [15. Demo Interactiva & Guía de Botones](#15-demo-interactiva--guía-de-botones)
   - [16. Control de Acceso por Roles (RBAC)](#16-control-de-acceso-por-roles-rbac)
   - [17. Simulador "What-If" & Asesor IA Gemini](#17-simulador-what-if--asesor-ia-gemini)
   - [18. Centro de Datos CSV & Exportación PDF](#18-centro-de-datos-csv--exportación-pdf)
4. [Guía de Importación CSV y Secuencia Recomendada (1 ➔ 2 ➔ 3)](#-guía-de-importación-csv-y-secuencia-recomendada)
5. [Estructura del Proyecto](#-estructura-del-proyecto)
6. [Cuentas de Usuario y Matriz de Permisos](#-cuentas-de-usuario-y-matriz-de-permisos)
7. [Modelos Matemáticos y Fórmulas del Motor](#-modelos-matemáticos-y-fórmulas-del-motor)
8. [Instalación, Ejecución & Despliegue en Producción (Cloud Run, Docker, VPS)](#-instalación-ejecución--despliegue-en-producción)
9. [Puesta en Marcha en Ceros (Ready to Deploy)](#-puesta-en-marcha-en-ceros-ready-to-deploy)
10. [Variables de Entorno](#-variables-de-entorno)

---

## 🚀 Visión General

**TEXORA** es la solución tecnológica de software modular diseñada específicamente para resolver los desafíos operativos y financieros más críticos en la manufactura y confección textil:

- **Planifica**: Proyecta la demanda por colecciones y temporadas comerciales (Escolar, Día de la Madre, Amor y Amistad, Navidad), calculando lotes óptimos con amortiguadores de estacionalidad.
- **Compra**: Motor MRP determinístico que calcula consumos netos de rollos de tela, forros, avíos e hilos, ajustando automáticamente al Lote Mínimo de Compra (MOQ) y emitiendo órdenes de compra agrupadas.
- **Produce**: Gestión integral de Fichas Técnicas (BOM), tiempos estándar de confección (SAM), balanceo de líneas y órdenes de producción (OP) en piso de planta con auditoría de mermas en tiempo real.
- **Controla**: Comparativas de rentabilidad (Taller Interno vs. Maquila Satélite), control de calidad (QC) con tolerancias milimétricas, trazabilidad total de lote de tela a prenda y seguridad granular basada en roles (RBAC).

---

## 🛠️ Arquitectura Tecnológica & Stack

| Capa | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Frontend Framework** | `React 19` + `TypeScript 5.8` | Componentes funcionales modulares, hooks reactivos y tipado estricto |
| **Build & Dev Server** | `Vite 6` + `TSX` + `Esbuild` | Empaquetado optimizado, SSR/HMR proxy y bundling CommonJS (`dist/server.cjs`) |
| **Backend & Servidor** | `Express 4.21` (Node.js) | Enrutador API `/api/*`, middleware SPA y aislamiento de secretos de API |
| **Estilos & Diseño** | `Tailwind CSS 4` | Paleta sobria en **Blanco Marfil** (`#FAF8F5`), neutros de alto contraste y acentos en **Verde Seco Textil** (`#3A5A40`, `#2D4632`) |
| **Animaciones & UI** | `Motion (Framer Motion 12)` | Transiciones fluidas, modales contextuales y micro-interacciones |
| **Iconografía** | `Lucide React` | Iconos vectoriales semánticos y accesibles |
| **Generación Documental** | `jsPDF` | Generación e impresión de Fichas Técnicas (Tech Packs) en formato PDF |
| **Procesamiento de Datos** | `PapaParse` | Parser y serializador bidireccional de archivos CSV con validación y auto-mapeo |
| **Inteligencia Artificial** | `@google/genai` (Gemini 3.7 Flash) | Asesor experto en optimización de compras, mermas de tizado y balance de producción textil |
| **Ecosistema Monetario** | `COP ($ Pesos Colombianos)` | Adaptado a la estructura de costos y compras de la industria textil |

---

## 📦 Módulos & Funcionalidades Principales

### 1. Modo Onboarding Limpio & Multi-Empresa (Restablecimiento a Ceros)
- **Registro de Empresa Limpio**: Permite registrar una nueva empresa textil desde cero con 0 datos de prueba residuales, configurando Razón Social, Marca, NIT, Ciudad, Especialidad, Color corporativo y Usuario Administrador.
- **Selector y Administrador de Sedes**: Cambio instantáneo entre múltiples empresas registradas con aislamiento de datos en almacenamiento local.
- **Restablecer a Ceros para Despliegue**: Botón accesible desde el perfil de usuario para reiniciar el entorno a estado limpio para producción.
- **Modo Demo Disponible**: Opción de cargar empresas de muestra preconfiguradas para demostraciones, pruebas o capacitación técnica.

### 2. Dashboard Ejecutivo & Centro de Alertas
- **Métricas en Tiempo Real**: Total de prendas proyectadas en el ciclo, inversión requerida en materias primas (COP), ítems en estado crítico de desabastecimiento y disponibilidad de inventario.
- **Segmentación de Inventario**:
  - 🔴 **Crítico**: Stock insuficiente para cubrir la demanda del ciclo.
  - 🟡 **Punto de Reorden**: Inventario por debajo del umbral de seguridad + tiempo de entrega del proveedor (*Lead Time*).
  - 🟢 **Óptimo**: Niveles de existencias en rango adecuado.
  - 🔵 **Sobrestock**: Exceso de inventario inmovilizado.
- **Top Insumos con Mayor Inversión**: Desglose gráfico de los materiales que concentran el mayor presupuesto del ciclo.

### 3. Proyección de Demanda & Estacionalidad Textil
- **Configuración de Ciclos**: Horizontes de planeación flexibles (1, 3, 6, 12 meses o duración personalizada en días).
- **Selector de Temporadas Comerciales**:
  - 🎒 **Temporada Escolar / Inicio de Año** *(Ene - Feb)*: Uniformes y camisería (+65% camisas y pantalones).
  - 💐 **Día de la Mujer** *(Marzo)*: Blusas y vestidos (+20% vestidos).
  - 👑 **Día de la Madre** *(Mayo)*: Mayor pico de moda femenina (+40% vestidos, +30% blusas).
  - 👔 **Día del Padre** *(Junio)*: Camisería formal y chaquetas (+40% camisas, +25% chaquetas).
  - ❤️ **Amor y Amistad** *(Septiembre)*: Moda casual y dotaciones (+25% vestidos, +15% camisas).
  - 🎄 **Fin de Año / Navidad** *(Nov - Dic)*: Temporada alta general (+50% general).
  - ⚙️ **Regular / Todo el Año**: Producción balanceada de reposición continua.
- **Ajuste Masivo de Metas**: Multiplicadores porcentuales por categoría de prenda (+10%, +25%, -15%).

### 4. Fichas Técnicas (Tech Packs), BOM & Tiempos SAM
- **Estructura de Materiales (BOM)**: Registro de telas principales, forros, botones, cremalleras, hilos, etiquetas y empaques con % de merma de corte individual.
- **Desglose de Tiempos de Fabricación (SAM)**: Minutos de corte, confección (*Sewing SAM*), ojalado, botón, plancha y empaque.
- **Ruta Operacional de Confección**: Secuencia detallada de operaciones por maquinaria (Plana, Overlock, Cerradora de Codo, Fusionadora, etc.).
- **Matriz de Calidad & Prevención de Defectos (QC)**: Chequeo de tolerancias milimétricas y puntos críticos de inspección.

### 5. Conversión de Unidades de Compra a Unidades de Confección
- **Dualidad de Unidades**: Soporte para insumos que se compran en una unidad comercial y se consumen en otra durante el corte y la costura:
  - **Telas en Rollo**: Compra en `rollos` ➔ Consumo en `metros` (ej. 1 rollo = 100 m).
  - **Tejido de Punto**: Compra en `kg` ➔ Consumo en `metros` con factor de rendimiento (ej. 1 kg = 2.65 m).
  - **Botones & Broches**: Compra en `gruesas` o `docenas` ➔ Consumo en `unidades` (ej. 1 gruesa = 144 unidades).
  - **Hilos & Hilazas**: Compra en `cajas` ➔ Consumo en `conos` (ej. 1 caja = 12 conos).
  - **Etiquetas**: Compra en `millares` ➔ Consumo en `unidades` (ej. 1 millar = 1000 unidades).
- **Calculadora Interactiva de Lotes en Ficha Técnica**: Simulación instantánea del consumo total para 1, 10, 50, 100, 500 o $N$ prendas con validación de cobertura de stock en bodega.
- **Glosario Textil Integrado (Tooltips)**: Explicación contextual de términos clave (*MOQ, Lead Time, Merma, SAM, BOM, Requerimiento Bruto y Neto*) sin saturar la interfaz.

### 6. Motor de Cálculo MRP (Material Requirements Planning)
- **Consumo Efectivo Bruto**: Suma de demanda por consumos unitarios ajustados por merma de corte y factores de conversión de unidades.
- **Stock de Seguridad Dinámico**: Basado en días de cobertura y consumo promedio diario.
- **Requerimiento Neto & Sugerencia de Compra**: Ajuste automático al Lote Mínimo de Compra (MOQ) del proveedor y cálculo de costo proyectado en COP.
- **Emisión Rápida de Órdenes**: Generación directa de órdenes de compra con selección múltiple o masiva de materias primas en déficit.

### 7. Kardex de Inventario & Movimientos de Stock
- **Auditoría Permanente de Movimientos**: Registro de todas las transacciones de entrada, salida, consumo de producción (OP), ajustes de inventario físico y devoluciones a proveedores.
- **Trazabilidad de Saldos y Costos**: Registro de costo unitario, valor total, referencia documental (OC, OP, Factura) y usuario responsable.
- **Filtros Avanzados**: Búsqueda por SKU de material, rango de fechas, tipo de movimiento y motivo de ajuste.

### 8. Directorio Maestro de Proveedores
- **Catálogo de Proveedores Homologados**: Ficha comercial con NIT, contacto, teléfono, ciudad, condición de pago (crédito/contado) y calificación de cumplimiento.
- **Parámetros de Cadena de Suministro**: Lead Time contractual, histórico de entregas a tiempo y portafolio de insumos suministrados vinculados a la base de datos relacional.

### 9. Ejecución en Planta & Control de Piso (MES)
- **Órdenes de Producción (OP)**: Emisión, asignación de taller interno o maquila satélite y seguimiento de avance en tiempo real.
- **Ruta de Control por 5 Etapas**:
  1. ✂️ **Corte y Habilitación**: Registro de tendido, tizado y unidades cortadas reales.
  2. 🪡 **Confección & Ensamble**: Avance de costura, control de SAM y balance de módulos.
  3. 🧼 **Lavandería / Tintorería / Estampación**: Procesos húmedos y acabados especiales.
  4. 🏷️ **Terminación, Ojal y Botón**: Colocación de herrajes, presillas y plancha.
  5. 📦 **Empaque & Despacho**: Auditoría final y empaque en bolsas individuales.
- **Auditoría de Mermas**: Comparación de unidades programadas vs. cortadas vs. prendas de primera calidad obtenidas.

### 10. Control de Calidad & Inspecciones (QC)
- **Inspección de Lotes y Muestreo AQL**: Registro de muestras inspeccionadas por orden de producción.
- **Clasificación de Calidad**: Conteo de prendas conformes (Primera Calidad), prendas de Segunda y prendas Rechazadas / Destruidas.
- **Tipificación de Defectos Textil**: Defectos de tela (barras, motas, tono), defectos de costura (costuras reventadas, puntadas sueltas, fruncido), defectos de medidas y manchas de aceite/suciedad.

### 11. Costeo de Producción: Taller Propio vs. Maquila Satélite
- **Costeo Integral de Materia Prima**: Telas principales, forros, sesgos, elásticos, botones, cremalleras, hilos y empaques del BOM con mermas de corte.
- **Costeo de Taller Propio**:
  - Mano de Obra Directa (MOD) según SAM (Corte, Confección y Acabados) y tarifa por minuto de planta.
  - Costos Indirectos de Fabricación (CIF) por minuto (servicios, depreciación de maquinaria, supervisión).
- **Costeo de Maquila Satélite**:
  - Tarifas externas por operación: Corte externo, Confección satélite, Acabados y Transporte/Fletes.
- **Comparativa Financiera y Margen Bruto**: Simulación de utilidad unitaria y margen bruto (%) frente al Precio de Venta al Público (PVP).

### 12. Trazabilidad Integral End-to-End
- **Genealogía de Fabricación**: Seguimiento bidireccional desde el rollo de tela y lote de avíos hasta la orden de producción y prendas terminadas.
- **Auditoría de Cumplimiento**: Registro de fecha, lote, taller asignado, operador y resultado de inspección técnica.

### 13. Benchmarking Comparativo Inter-Empresas
- **Comparativa de Rendimiento**: Métricas cruzadas de eficiencia de tizado, productividad SAM, costo promedio por prenda y rotación de inventarios entre empresas y sedes.

### 14. Gestión de Órdenes de Compra & Abastecimiento
- **Generación Automática**: Conversión de déficits de materiales en órdenes de compra agrupadas por proveedor.
- **Recepción de Mercancía**: Al marcar como `Recibida`, el sistema actualiza automáticamente el inventario físico disponible y genera el asiento correspondiente en el Kardex.

### 15. Demo Interactiva & Guía de Botones
- **Tour de Botones**: Guía explicativa con buscador integrado para conocer la función y ubicación de cada botón, modal y herramienta del sistema.

### 16. Control de Acceso por Roles (RBAC)
- **Autenticación Segura**: Múltiples roles preconfigurados (Administrador, Comercial, Ingeniería, Compras, Producción, Calidad) con matriz de 17 permisos granulares.

### 17. Simulador "What-If" & Asesor IA Gemini
- **Simulación Dinámica**: Variación de demanda (+/-50%), estrés de merma de corte y colchón de seguridad de proveedores.
- **Asesor IA**: Recomendaciones estratégicas impulsadas por Gemini API para mitigar cuellos de botella y optimizar compras.

### 18. Centro de Datos CSV & Exportación PDF
- **Importación/Exportación CSV**: Soporte de Ventas, Insumos y Fichas Técnicas con plantillas descargables y asistente paso a paso con previsualización editable.
- **Flujo Secuencial Inteligente (1 ➔ 2 ➔ 3)**: El sistema incluye detección automática de orden de dependencias para garantizar consistencia relacional y cálculo de costos sin advertencias.
- **Exportación Tech Pack PDF**: Documentos técnicos formales con formato listo para impresión y entrega a talleres satélites.

---

## 📑 Guía de Importación CSV y Secuencia Recomendada

Para garantizar la integridad total de los cálculos MRP, costeo de prendas y evitar advertencias de insumos no encontrados, se recomienda seguir el siguiente **flujo de carga secuencial**:

```
 ┌───────────────────────────┐      ┌───────────────────────────┐      ┌───────────────────────────┐
 │   1. MATERIAS PRIMAS      │ ───> │ 2. FICHAS TÉCNICAS (BOM)  │ ───> │  3. VENTAS / DEMANDA      │
 │ (Telas, Hilos, Botones)   │      │ (Consumos, Mermas, SAM)   │      │ (Metas por Colección)     │
 └───────────────────────────┘      └───────────────────────────┘      └───────────────────────────┘
```

### ¿Por qué seguir este orden?

1. **Paso 1 — Materias Primas (`1_plantilla_materias_primas_insumos.csv`)**:
   - Establece el catálogo maestro con **costo unitario real en COP**, unidad de compra y uso, lote mínimo de compra (**MOQ**), tiempo de entrega (**Lead Time**), **Stock Actual**, merma de defecto, ancho, gramaje y proveedor.
   - Permite que el sistema reconozca cada SKU de insumo antes de que sea referenciado en una prenda.

2. **Paso 2 — Fichas Técnicas (`2_plantilla_fichas_tecnicas_BOM.csv`)**:
   - Enlaza cada prenda con sus insumos requeridos, consumos unitarios, % de merma de corte, tiempos SAM de confección, tarifas de maquila y precio de venta (PVP).
   - Si las materias primas ya están cargadas, la ficha técnica hereda automáticamente los costos y proveedores oficiales, garantizando costeo exacto.

3. **Paso 3 — Ventas Históricas / Metas (`3_plantilla_ventas_historicas_demanda.csv`)**:
   - Define el volumen de prendas que alimentará el motor de cálculo MRP y la explosión de materiales para el ciclo productivo.

> 💡 **Carga Múltiple Simultánea**: Si arrastra los 3 archivos a la vez en el modal, el motor de TEXORA los ordenará y procesará automáticamente en la secuencia ideal (Materias Primas ➔ BOM ➔ Ventas). Además, puede descargar individualmente cada una de las 3 plantillas o el pack completo con 1 solo clic.

---

## 📂 Estructura del Proyecto

```
texora/
├── .env.example                     # Variables de entorno documentadas
├── .gitignore                       # Exclusiones de Git
├── index.html                       # Documento HTML principal
├── metadata.json                    # Metadatos oficiales de TEXORA
├── package.json                     # Scripts de npm, dependencias y build
├── server.ts                        # Servidor Express y endpoints de IA
├── tsconfig.json                    # Configuración TypeScript
├── vite.config.ts                   # Configuración Vite + Tailwind CSS 4
│
└── src/
    ├── main.tsx                     # Entry point de React
    ├── App.tsx                      # Estado principal y orquestación de vistas
    ├── index.css                    # Directivas de Tailwind CSS
    │
    ├── components/                  # Componentes modulares
    │   ├── AccessRestricted.tsx     # Pantalla de acceso restringido RBAC
    │   ├── AIIntelligencePanel.tsx  # Asesor de IA con Gemini
    │   ├── BOMExplosionView.tsx     # Fichas Técnicas, BOM, SAM, QC y Costeo
    │   ├── ButtonTourModal.tsx      # Demo interactiva y guía de botones
    │   ├── CSVManagerModal.tsx      # Importador / Exportador CSV y Asistente
    │   ├── CompanyBenchmarkView.tsx # Benchmarking inter-empresas
    │   ├── CompanyManagerModal.tsx  # Administrador de empresas y sedes
    │   ├── CompanyOnboardingView.tsx# Registro de empresa en modo limpio
    │   ├── CycleControlBar.tsx      # Barra de control de ciclo en meses
    │   ├── CycleManagementModal.tsx # Configuración de ciclo y temporadas
    │   ├── DashboardOverview.tsx    # Dashboard principal con KPIs
    │   ├── DemandForecastingView.tsx# Proyección de demanda y ventas
    │   ├── GarmentModal.tsx         # Detalle y edición de prendas
    │   ├── Header.tsx               # Barra superior con navegación y perfiles
    │   ├── InventoryKardexView.tsx  # Kardex y auditoría de movimientos de stock
    │   ├── InventoryMovementModal.tsx# Ajustes manuales de inventario
    │   ├── LoginModal.tsx           # Autenticación y cambio de usuario
    │   ├── MRPCalculatorTable.tsx   # Tabla maestra del motor MRP
    │   ├── MaterialModal.tsx        # Detalle y edición de materias primas
    │   ├── NewGarmentModal.tsx      # Creación de nuevas prendas
    │   ├── NewMaterialModal.tsx     # Creación de nuevos insumos
    │   ├── NewProductionOrderModal.tsx # Emisión de órdenes de producción (OP)
    │   ├── ProductionCostingView.tsx # Comparador Taller Propio vs. Maquila
    │   ├── ProductionExecutionView.tsx # Módulo MES de control de piso
    │   ├── PurchaseOrderModal.tsx   # Gestión de órdenes de compra
    │   ├── QualityControlView.tsx   # Control de calidad, muestreo e inspecciones
    │   ├── RawMaterialsManager.tsx  # Catálogo maestro de insumos
    │   ├── RecordStageModal.tsx     # Registro de avances y mermas por etapa
    │   ├── SuppliersManagerView.tsx # Directorio maestro de proveedores
    │   ├── TraceabilityView.tsx     # Trazabilidad integral de lote a producto
    │   ├── UserManagementModal.tsx  # Gestión de usuarios y permisos RBAC
    │   └── WhatIfSimulator.tsx      # Simulador de escenarios What-If
    │
    ├── data/                        # Datos iniciales y mocks para demo
    ├── services/                    # Motores MRP, CSV, PDF y unifiedDatabase
    ├── types/                       # Definiciones TypeScript
    └── utils/                       # Formateadores, permisos y estacionalidad
```

---

## 👥 Cuentas de Usuario y Matriz de Permisos

| Usuario | Contraseña | Rol / Departamento | Permisos Principales |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | **Administrador General** | Acceso total a todos los módulos y gestión de empresas |
| `ventas` | `ventas123` | **Comercial & Ventas** | Demanda, metas de venta, proyecciones y exportación |
| `ingenieria` | `ingenieria123` | **Ingeniería Textil & BOM** | Fichas técnicas, consumos, tiempos SAM y calidad |
| `compras` | `compras123` | **Compras & Abastecimiento** | MRP, inventarios, emisión y recepción de órdenes de compra |
| `produccion` | `produccion123` | **Jefe de Producción** | Ejecución en planta (MES), órdenes de producción y costeo |
| `calidad` | `calidad123` | **Auditor de Calidad (QC)** | Fichas técnicas y puntos de control de calidad |

---

## 📐 Modelos Matemáticos y Fórmulas del Motor

### 1. Consumo Bruto Efectivo ($RGB_i$)
$$RGB_i = \sum_{j=1}^{N} \left[ \text{Demanda Prenda}_j \times \text{Consumo BOM}_{i,j} \times \left(1 + \frac{\text{Merma}_{i,j} + \text{Merma Global}}{100}\right) \right]$$

### 2. Stock de Seguridad Requerido ($SS_i$)
$$SS_i = \left( \frac{RGB_i}{\text{Días del Ciclo}} \right) \times (\text{Días Stock Seguridad}_i + \text{Buffer})$$

### 3. Requerimiento Neto de Compra ($RN_i$)
$$\text{Stock Disponible}_i = \text{Stock Físico}_i + \text{Stock en Tránsito}_i$$
$$RN_i = \max(0, RGB_i + SS_i - \text{Stock Disponible}_i)$$

### 4. Sugerencia de Compra Ajustada al Lote Mínimo ($SC_i$)
$$SC_i = \begin{cases} 
0 & \text{si } RN_i = 0 \\
\text{MOQ}_i & \text{si } 0 < RN_i \le \text{MOQ}_i \\
\left\lceil \frac{RN_i}{\text{MOQ}_i} \right\rceil \times \text{MOQ}_i & \text{si } RN_i > \text{MOQ}_i 
\end{cases}$$

---

## 💻 Instalación, Ejecución & Despliegue en Producción

### Requisitos
- **Node.js**: Versión 18.x, 20.x o 22.x
- **npm** o **bun**

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/texora.git
cd texora
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Iniciar el servidor de desarrollo local
```bash
npm run dev
```
Abre tu navegador en `http://localhost:3000`.

### 4. Validar código con TypeScript & Linter
```bash
npm run lint
```

### 5. Compilar para producción
```bash
npm run build
```
Este comando ejecuta:
1. `vite build`: Minifica y optimiza los activos React para el frontend en `dist/`.
2. `esbuild server.ts`: Empaqueta el backend Express en `dist/server.cjs` (CJS autónomo de alto rendimiento).

### 6. Ejecutar en producción (Contenedor o VPS)
```bash
npm run start
```

### 7. Despliegue en Cloud Run / Docker
La aplicación incluye configuración lista para contenedores en puertos estándar de producción:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
```

---

## 🚀 Puesta en Marcha en Ceros (Ready to Deploy)

Para entregar la aplicación a un cliente final o desplegarla en un entorno productivo limpio:

1. **Estado Inicial Limpio**: La aplicación arranca automáticamente en la pantalla de **Onboarding de Empresa** cuando no existen registros previos.
2. **Registro de la Empresa**:
   - Ingresa la Razón Social y Marca.
   - Especifica el NIT y Ciudad/Sede principal.
   - Define la especialidad textil (Camisería, Denim, Ropa Deportiva, Infantil, etc.).
   - Crea las credenciales del Administrador General.
3. **Carga de Datos Reales (Flujo Recomendado 1 ➔ 2 ➔ 3)**:
   - **Paso 1**: Cargar o registrar el inventario de **Materias Primas e Insumos** (con sus unidades de compra y de confección).
   - **Paso 2**: Registrar las **Fichas Técnicas / Tech Packs (BOM)** asociando los insumos registrados.
   - **Paso 3**: Ingresar las **Metas de Ventas / Demanda** para el ciclo de producción.
   - El motor MRP calculará de inmediato la explosión de materiales, órdenes de compra sugeridas y presupuesto requerido.
4. **Restablecimiento Rápido**: En caso de haber realizado pruebas y querer entregar el sistema limpio, utiliza la opción **Restablecer a Ceros (Despliegue)** desde el menú de usuario en la barra superior.

---

## 🔒 Variables de Entorno

Configura tu archivo `.env` en la raíz del proyecto (basado en `.env.example`):

```env
# Clave de API de Google Gemini para el asistente inteligente
GEMINI_API_KEY=tu_clave_de_gemini_aqui

# Puerto del servidor (3000 por defecto)
PORT=3000
```

---

## 📄 Licencia

Desarrollado para la industria textil y de confección como una plataforma integral de planeación de producción, costeo y control de inventarios. Todos los derechos reservados. 🧵🇨🇴
