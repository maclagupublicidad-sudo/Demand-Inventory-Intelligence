# 🧵 TEXORA — Inteligencia para la producción textil

> **Planifica. Compra. Produce. Controla.**  
> Plataforma integral Multi-Empresa de Inteligencia de Demanda, Cálculo MRP de Confección, Fichas Técnicas (BOM/SAM/QC), Costeo Taller vs. Maquila, Ejecución en Planta (MES), Benchmarking Inter-Empresas y Control de Accesos por Roles (RBAC).

---

## 📋 Tabla de Contenido

1. [Visión General](#-visión-general)
2. [Arquitectura Tecnológica & Stack](#-arquitectura-tecnológica--stack)
3. [Módulos & Funcionalidades Principales](#-módulos--funcionalidades-principales)
   - [1. Modo Onboarding Limpio & Multi-Empresa](#1-modo-onboarding-limpio--multi-empresa)
   - [2. Dashboard Ejecutivo & Centro de Alertas](#2-dashboard-ejecutivo--centro-de-alertas)
   - [3. Proyección de Demanda & Estacionalidad Textil](#3-proyección-de-demanda--estacionalidad-textil)
   - [4. Fichas Técnicas (Tech Packs), BOM & Tiempos SAM](#4-fichas-técnicas-tech-packs-bom--tiempos-sam)
   - [5. Simulador de Costeo: Taller Propio vs. Maquila Satélite](#5-simulador-de-costeo-taller-propio-vs-maquila-satélite)
   - [6. Motor de Cálculo MRP (Material Requirements Planning)](#6-motor-de-cálculo-mrp-material-requirements-planning)
   - [7. Ejecución en Planta & Control de Piso (MES)](#7-ejecución-en-planta--control-de-piso-mes)
   - [8. Benchmarking Comparativo Inter-Empresas](#8-benchmarking-comparativo-inter-empresas)
   - [9. Gestión de Órdenes de Compra & Abastecimiento](#9-gestión-de-órdenes-de-compra--abastecimiento)
   - [10. Demo Interactiva & Guía de Botones](#10-demo-interactiva--guía-de-botones)
   - [11. Control de Acceso por Roles (RBAC)](#11-control-de-acceso-por-roles-rbac)
   - [12. Simulador "What-If" & Asesor IA Gemini](#12-simulador-what-if--asesor-ia-gemini)
   - [13. Centro de Datos CSV & Exportación PDF](#13-centro-de-datos-csv--exportación-pdf)
4. [Estructura del Proyecto](#-estructura-del-proyecto)
5. [Cuentas de Usuario y Matriz de Permisos](#-cuentas-de-usuario-y-matriz-de-permisos)
6. [Modelos Matemáticos y Fórmulas del Motor](#-modelos-matemáticos-y-fórmulas-del-motor)
7. [Instalación, Ejecución & Despliegue en GitHub](#-instalación-ejecución--despliegue-en-github)
8. [Variables de Entorno](#-variables-de-entorno)

---

## 🚀 Visión General

**TEXORA** es la solución tecnológica diseñada para resolver los desafíos más críticos en la cadena de confección y manufactura textil:

- **Planifica**: Proyecta la demanda por colecciones y temporadas comerciales, calculando lotes óptimos con amortiguadores de estacionalidad.
- **Compra**: Motor MRP determinístico que calcula consumos netos de rollos de tela, forros, avíos e hilos, ajustando automáticamente al Lote Mínimo de Compra (MOQ) y emitiendo órdenes de compra agrupadas.
- **Produce**: Gestión integral de Fichas Técnicas (BOM), tiempos estándar de confección (SAM), rutas de costura por maquinaria y órdenes de producción (OP) en piso de planta con auditoría de mermas en tiempo real.
- **Controla**: Comparativas de rentabilidad (Taller Interno vs. Maquila Satélite), control de calidad (QC) con tolerancias milimétricas, benchmarking comparativo y seguridad granular basada en roles (RBAC).

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

### 1. Modo Onboarding Limpio & Multi-Empresa
- **Registro de Empresa Limpio**: Permite registrar una nueva empresa textil desde cero con 0 datos de prueba residuales, configurando Razón Social, Marca, NIT, Ciudad, Especialidad, Color corporativo y Usuario Administrador.
- **Selector y Administrador de Sedes**: Cambio instantáneo entre múltiples empresas registradas con aislamiento de datos en almacenamiento local.
- **Modo Demo Disponible**: Opción de cargar empresas de muestra preconfiguradas para demostraciones o capacitación técnica.

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

### 5. Simulador de Costeo: Taller Propio vs. Maquila Satélite
- **Costeo Integral**: Materia prima directa (telas + avíos del BOM).
- **Taller Interno**: Mano de Obra Directa (MOD) según SAM y tarifa por minuto + Costos Indirectos de Fabricación (CIF / Minuto).
- **Maquila Externa**: Tarifas satélite de corte, ensamble, terminación y fletes.
- **Comparativa Financiera**: Visualización de costo unitario y margen bruto proyectado frente al PVP.

### 6. Motor de Cálculo MRP (Material Requirements Planning)
- **Consumo Efectivo Bruto**: Suma de demanda por consumos unitarios ajustados por merma de corte.
- **Stock de Seguridad Dinámico**: Basado en días de cobertura y consumo promedio diario.
- **Requerimiento Neto & Sugerencia de Compra**: Ajuste automático al Lote Mínimo de Compra (MOQ) del proveedor y cálculo de costo proyectado en COP.

### 7. Ejecución en Planta & Control de Piso (MES)
- **Órdenes de Producción (OP)**: Emisión, asignación de taller y seguimiento de avance en tiempo real.
- **Registro por Etapas**: Corte, Confección/Ensamble, Lavandería/Tintorería, Terminación y Empaque.
- **Auditoría de Mermas**: Comparación de unidades cortadas vs. unidades de primera calidad producidas.

### 8. Benchmarking Comparativo Inter-Empresas
- **Comparativa de Rendimiento**: Métricas cruzadas de eficiencia de tizado, productividad SAM, costo promedio por prenda y rotación de inventarios entre empresas y sedes.

### 9. Gestión de Órdenes de Compra & Abastecimiento
- **Generación Automática**: Conversión de déficits de materiales en órdenes de compra agrupadas por proveedor.
- **Recepción de Mercancía**: Al marcar como `Recibida`, el sistema actualiza automáticamente el inventario físico disponible.

### 10. Demo Interactiva & Guía de Botones
- **Tour de Botones**: Guía explicativa con buscador integrado para conocer la función y ubicación de cada botón, modal y herramienta del sistema.

### 11. Control de Acceso por Roles (RBAC)
- **Autenticación Segura**: Múltiples roles preconfigurados (Administrador, Comercial, Ingeniería, Compras, Producción, Calidad) con matriz de 13 permisos granulares.

### 12. Simulador "What-If" & Asesor IA Gemini
- **Simulación Dinámica**: Variación de demanda, estrés de merma de corte y colchón de seguridad de proveedores.
- **Asesor IA**: Recomendaciones estratégicas impulsadas por Gemini API para mitigar cuellos de botella y optimizar compras.

### 13. Centro de Datos CSV & Exportación PDF
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

1. **Paso 1 — Materias Primas (`1_Inventario_Materias_Primas.csv`)**:
   - Establece el catálogo maestro con **costo unitario real en COP**, lote mínimo de compra (**MOQ**), tiempo de entrega (**Lead Time**), **Stock Actual** y proveedor.
   - Permite que el sistema reconozca cada SKU de insumo antes de que sea referenciado en una prenda.

2. **Paso 2 — Fichas Técnicas (`2_Fichas_Tecnicas_BOM.csv`)**:
   - Enlaza cada prenda con sus insumos requeridos, consumos unitarios y % de merma de corte.
   - Si las materias primas ya están cargadas, la ficha técnica hereda automáticamente los costos y proveedores oficiales, evitando advertencias de *insumos no registrados*.

3. **Paso 3 — Ventas Históricas / Metas (`3_Ventas_Historicas.csv`)**:
   - Define el volumen de prendas que alimentará el motor de cálculo MRP y la explosión de materiales para el ciclo.

> 💡 **Carga Múltiple Simultánea**: Si arrastra los 3 archivos a la vez en el modal, el motor de TEXORA los ordenará y procesará automáticamente en la secuencia ideal (Materias Primas ➔ BOM ➔ Ventas).

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
    │   ├── CSVManagerModal.tsx      # Importador / Exportador CSV
    │   ├── CompanyBenchmarkView.tsx # Benchmarking inter-empresas
    │   ├── CompanyManagerModal.tsx  # Administrador de empresas y sedes
    │   ├── CompanyOnboardingView.tsx# Registro de empresa en modo limpio
    │   ├── CycleControlBar.tsx      # Barra de control de ciclo
    │   ├── CycleManagementModal.tsx # Configuración de ciclo y temporadas
    │   ├── DashboardOverview.tsx    # Dashboard principal con KPIs
    │   ├── DemandForecastingView.tsx# Proyección de demanda y ventas
    │   ├── GarmentModal.tsx         # Detalle y edición de prendas
    │   ├── Header.tsx               # Barra superior con navegación y perfiles
    │   ├── InventoryMovementModal.tsx# Ajustes manuales de inventario
    │   ├── LoginModal.tsx           # Autenticación y cambio de usuario
    │   ├── MRPCalculatorTable.tsx   # Tabla maestra del motor MRP
    │   ├── MaterialModal.tsx        # Detalle y edición de materias primas
    │   ├── NewGarmentModal.tsx      # Creación de nuevas prendas
    │   ├── NewMaterialModal.tsx     # Creación de nuevos insumos
    │   ├── NewProductionOrderModal.tsx # Emisión de órdenes de producción (OP)
    │   ├── ProductionExecutionView.tsx # Módulo MES de control de piso
    │   ├── PurchaseOrderModal.tsx   # Gestión de órdenes de compra
    │   ├── RawMaterialsManager.tsx  # Catálogo maestro de insumos
    │   ├── RecordStageModal.tsx     # Registro de avances y mermas por etapa
    │   ├── UserManagementModal.tsx  # Gestión de usuarios y permisos RBAC
    │   └── WhatIfSimulator.tsx      # Simulador de escenarios What-If
    │
    ├── data/                        # Datos iniciales y mocks
    ├── services/                    # Motores de cálculo MRP, CSV y PDF
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

## 💻 Instalación, Ejecución & Despliegue en GitHub

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

### 3. Iniciar el servidor de desarrollo
```bash
npm run dev
```
Abre tu navegador en `http://localhost:3000`.

### 4. Validar código con TypeScript
```bash
npm run lint
```

### 5. Compilar para producción
```bash
npm run build
```
Este comando genera:
- Los archivos web estáticos optimizados en `dist/`.
- El servidor backend compilado y empaquetado en `dist/server.cjs`.

### 6. Ejecutar en producción
```bash
npm run start
```

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
