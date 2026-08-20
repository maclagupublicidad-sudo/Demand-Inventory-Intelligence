# 🧵 TextilIQ Demand & MRP — Intelligence & Production Management Platform

> **Plataforma Integral de Inteligencia de Demanda, Cálculo MRP, Fichas Técnicas (BOM/SAM), Costeo Taller vs. Maquila y Control de Accesos por Roles (RBAC) para la Industria de Confección Textil.**

---

## 📋 Tabla de Contenido

1. [Visión General del Sistema](#-visión-general-del-sistema)
2. [Arquitectura Tecnológica & Stack](#-arquitectura-tecnológica--stack)
3. [Módulos & Funcionalidades Principales](#-módulos--funcionalidades-principales)
   - [1. Dashboard Ejecutivo & Centro de Alertas](#1-dashboard-ejecutivo--centro-de-alertas)
   - [2. Proyección de Demanda & Estacionalidad Dinámica](#2-proyección-de-demanda--estacionalidad-dinámica)
   - [3. Fichas Técnicas (Tech Packs), BOM & Tiempos SAM](#3-fichas-técnicas-tech-packs-bom--tiempos-sam)
   - [4. Simulador de Costeo: Taller Propio vs. Maquila Satélite](#4-simulador-de-costeo-taller-propio-vs-maquila-satélite)
   - [5. Motor de Cálculo MRP (Material Requirements Planning)](#5-motor-de-cálculo-mrp-material-requirements-planning)
   - [6. Gestión de Órdenes de Compra & Abastecimiento](#6-gestión-de-órdenes-de-compra--abastecimiento)
   - [7. Sistema de Control de Acceso por Roles (RBAC)](#7-sistema-de-control-de-acceso-por-roles-rbac)
   - [8. Simulador de Escenarios "What-If" & Asistente IA](#8-simulador-de-escenarios-what-if--asistente-ia)
   - [9. Integración CSV Bidireccional & Exportación PDF](#9-integración-csv-bidireccional--exportación-pdf)
4. [Estructura del Proyecto y Detalle de Archivos](#-estructura-del-proyecto-y-detalle-de-archivos)
5. [Cuentas de Usuario y Matriz de Permisos](#-cuentas-de-usuario-y-matriz-de-permisos)
6. [Modelos Matemáticos y Fórmulas del Motor](#-modelos-matemáticos-y-fórmulas-del-motor)
7. [Instalación, Ejecución & Despliegue](#-instalación-ejecución--despliegue)
8. [Configuración de Entorno](#-configuración-de-entorno)

---

## 🚀 Visión General del Sistema

**TextilIQ** resuelve los desafíos críticos de la cadena de suministro y manufactura en empresas de confección:
- **Quiebres de stock** de materias primas críticas (telas principales, sesgos, botones, cremalleras).
- **Sobrecostos y mermas descontroladas** en procesos de tizado y corte.
- **Incertidumbre en costos de fabricación**, permitiendo simular en tiempo real la rentabilidad entre confección en **taller interno** versus tercerización en **talleres satélites (maquila)**.
- **Falta de trazabilidad técnica**, centralizando fichas de diseño, rutas operacionales con tiempos estándar (SAM), matriz de prevención de defectos y puntos de control de calidad (QC).
- **Descoordinación interdepartamental**, aplicando un control de acceso por roles (RBAC) donde cada área (Comercial, Ingeniería, Compras, Producción, Calidad, Gerencia) opera con permisos específicos y credenciales individuales.

---

## 🛠️ Arquitectura Tecnológica & Stack

| Capa | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Frontend Framework** | `React 19` + `TypeScript 5.8` | Componentes funcionales, hooks estrictos y tipado integral |
| **Build & Dev Server** | `Vite 6` + `TSX` + `Esbuild` | Empaquetado rápido, SSR/HMR proxy y bundling CommonJS (`dist/server.cjs`) |
| **Backend & Servidor** | `Express 4.21` (Node.js) | Enrutador API, middleware SPA y aislamiento de secretos |
| **Estilos & Diseño** | `Tailwind CSS 4` | Paleta minimalista y productiva en **Blanco Marfil** (`#FAF8F5`, `#FCFBF9`), bordes sutiles y acentos en **Verde Seco Textil** (`#3A5A40`, `#2D4632`) |
| **Animaciones & UI** | `Motion (Framer Motion 12)` | Transiciones fluidas, modales contextuales y micro-interacciones |
| **Iconografía** | `Lucide React` | Iconos vectoriales semánticos y accesibles |
| **Generación Documental** | `jsPDF` | Generación e impresión de Fichas Técnicas (Tech Packs) en formato PDF |
| **Procesamiento de Datos** | `PapaParse` | Parser y serializador de archivos CSV con validación y auto-mapeo |
| **Inteligencia Artificial** | `@google/genai` | Asesor experto en optimización de compras y balance de producción textil |
| **Formato Monetario** | `COP ($ Pesos Colombianos)` | Adaptado a la estructura de costos y compras de la industria nacional |

---

## 📦 Módulos & Funcionalidades Principales

### 1. Dashboard Ejecutivo & Centro de Alertas
- **Métricas Clave en Tiempo Real**: Total de prendas proyectadas en el ciclo, inversión requerida en materias primas (COP), ítems en estado crítico de desabastecimiento y disponibilidad de inventario.
- **Tarjetas de Estado del Inventario**: Segmentación automática en 4 estados operativos:
  - 🔴 **Crítico**: Stock insuficiente para cubrir la demanda del ciclo.
  - 🟡 **Punto de Reorden**: Inventario por debajo del umbral de seguridad + tiempo de entrega del proveedor (*Lead Time*).
  - 🟢 **Óptimo**: Niveles de existencias en rango adecuado.
  - 🔵 **Sobrestock**: Exceso de inventario inmovilizado.
- **Top 5 Insumos con Mayor Inversión**: Desglose gráfico de los materiales que concentran el mayor presupuesto del ciclo.

### 2. Proyección de Demanda & Estacionalidad Comercial de Colombia
- **Configuración de Ciclos**: Horizontes de planeación flexibles (1, 3, 6, 12 meses o duración personalizada en días).
- **Selector de Temporadas Comerciales Adaptadas a Colombia**:
  - 🎒 **Inicio de Año / Temporada Escolar** *(Enero - Febrero)*: Alta demanda de uniformes, camisería básica, pantalones escolares y dotaciones (+65% camisas y pantalones).
  - 💐 **Día de la Mujer** *(Marzo)*: Repunte comercial en blusas, vestidos y tejido de punto liviano (+20% vestidos).
  - 👑 **Día de la Madre** *(Mayo)*: Mayor pico de moda femenina, blusas de alta rotación, pantalones casuales y vestidos de diseño (+40% vestidos, +30% blusas).
  - 👔 **Día del Padre** *(Junio)*: Fuerte incremento en camisería formal, polos, bermudas y chaquetas masculinas (+40% camisas, +25% chaquetas).
  - ❤️ **Amor y Amistad** *(Septiembre)*: Colecciones de moda casual, vestidos de fiesta, prendas estampadas y dotaciones empresariales (+25% vestidos, +15% camisas).
  - 🎄 **Fin de Año / Navidad** *(Noviembre - Diciembre)*: Temporada pico anual, estrenos, gala, lino, chaquetas y alta confección (+50% general).
  - ⚙️ **Regular / Todo el Año**: Producción balanceada de línea básica y reposición continua.
- **Ajuste Masivo de Metas**: Multiplicadores porcentuales por categoría de prenda (+10%, +25%, -15%).
- **Cálculo Automático Basado en Históricos**: Proyección basada en promedios históricos ajustados por tasa de crecimiento y estacionalidad.

### 3. Fichas Técnicas (Tech Packs), BOM & Tiempos SAM
- **Explosión de Estructura de Materiales (BOM - Bill of Materials)**:
  - Registro de telas principales, forros, botones, cremalleras, hilos de costura, etiquetas y empaques.
  - Consumo unitario con definición de **% de merma de corte específica por insumo**.
- **Desglose de Tiempos de Fabricación (SAM)**:
  - Minutos de Corte por prenda (*Min/Garment*).
  - Minutos Estándar Permitidos de Confección (**Sewing SAM**).
  - Minutos de Acabados, Ojalado, Botón, Plancha y Empaque.
  - Cálculo de días totales de ciclo productivo y tamaño de lote estándar.
- **Ruta Operacional de Confección**:
  - Secuencia de operaciones numeradas paso a paso.
  - Departamento (Corte, Preparación, Ensamble, Terminación, Empaque).
  - Maquinaria requerida (Plana 1 Aguja, Overlock 4 Hilos, Cerradora de Codo, Fusionadora, Ojaladora, etc.).
  - SAM por operación y notas técnicas críticas.
- **Matriz de Control de Calidad & Prevención de Defectos (QC)**:
  - Identificación de defectos potenciales por operación (ej: descalce de líneas, revirado de costura, descarrilamiento de pespunte).
  - Instrucciones preventivas de calibración de guías y tensión de hilo.
  - Métrica de tolerancia técnica (ej: `+/- 1.5mm`, `10-12 SPI`).
  - Nivel de severidad (Alta, Media, Baja).

### 4. Simulador de Costeo: Taller Propio vs. Maquila Satélite
- **Costeo Integral de Producción**:
  - Costo de materia prima directa (telas + avíos calculados dinámicamente según el BOM).
  - **Taller Interno**: Mano de Obra Directa (MOD) según SAM y tarifa por minuto + Costos Indirectos de Fabricación (CIF / Minuto).
  - **Maquila Externa**: Tarifas satélite de corte, confección por ensamble, acabados/plancha y fletes logísticos.
- **Comparativa Financiera**:
  - Visualización lado a lado de Costo Unitario Interno vs. Costo Maquila.
  - Margen de ganancia bruto proyectado en cada escenario frente al Precio de Venta Sugerido (PVP).
  - Recomendación automática del modelo de fabricación más rentable según el volumen del lote.

### 5. Motor de Cálculo MRP (Material Requirements Planning)
- **Cálculo de Requerimiento Bruto Efectivo**:
  $$\text{Consumo Efectivo} = \sum (\text{Demanda Prenda} \times \text{Consumo BOM} \times (1 + \text{Merma}))$$
- **Evaluación de Inventario Disponible**:
  $$\text{Stock Disponible} = \text{Stock Físico Actual} + \text{Stock en Tránsito}$$
- **Stock de Seguridad Dinámico**: Calculado en función de los días de cobertura requeridos y el consumo promedio diario.
- **Cálculo de Requerimiento Neto & Sugerencia de Compra**:
  - Identificación de déficit real.
  - Redondeo y ajuste automático al **Lote Mínimo de Compra (MOQ - Minimum Order Quantity)** del proveedor.
  - Cálculo de días de cobertura de inventario y costo total proyectado en COP.

### 6. Gestión de Órdenes de Compra & Abastecimiento
- **Generación Automática desde MRP**: Convierte los insumos en déficit crítico en órdenes de compra agrupadas automáticamente por proveedor.
- **Creación Manual de Órdenes**: Formulario intuitivo para emitir pedidos directos a proveedores con campos en COP, selección de fechas de entrega y condiciones de pago.
- **Filtros por Estado Operativo**:
  - `Borrador` → `Emitida` → `Confirmada` → `En Tránsito` → `Recibida` → `Cancelada`.
- **Recepción de Mercancía**: Al marcar una orden como `Recibida`, el sistema actualiza automáticamente las existencias en el inventario maestro.

### 7. Sistema de Control de Acceso por Roles (RBAC)
- **Autenticación con Usuario y Clave Única**: Cada usuario ingresa con sus credenciales y se almacena la última fecha/hora de sesión.
- **6 Cuentas Preconfiguradas para Cada Área de la Empresa**:
  - 👑 **Administrador General / Dirección**: Control total sin restricciones.
  - 📈 **Comercial & Ventas**: Acceso a histórico de ventas, metas y pronósticos.
  - 🧵 **Ingeniería Textil & BOM**: Acceso a fichas técnicas, consumos, SAM y calidad.
  - 📦 **Compras & Abastecimiento**: Acceso a MRP, inventarios y emisión de OCs.
  - 🏭 **Jefe de Producción & Satélites**: Acceso a costeo de taller, balanceo y parámetros de ciclo.
  - 🔍 **Auditor de Calidad (QC)**: Acceso a fichas técnicas y checkpoints de calidad.
- **Panel de Administración de Usuarios**:
  - Creación, edición y suspensión de usuarios.
  - Matriz granular de **13 permisos independientes**.
- **Pantalla de Protección Contextual (`AccessRestricted`)**: Bloqueo elegante con información del permiso necesario y atajo para cambio de usuario.

### 8. Simulador de Escenarios "What-If" & Asistente IA
- **Simulador What-If**:
  - Variación de demanda general (multiplicador de 0.5x a 2.0x).
  - Incremento o reducción de merma promedio de confección (1% a 20%).
  - Días de colchón de seguridad (*Lead Time Buffer Days*).
  - Recálculo instantáneo del presupuesto MRP sin alterar la base de datos principal hasta confirmación.
- **Asistente de Inteligencia Textil**:
  - Diagnóstico automatizado de la planeación.
  - Detección de cuellos de botella en proveedores de tela con tiempos de entrega prolongados.
  - Consejos de optimización de tizado y balanceo de líneas.

### 9. Integración CSV Bidireccional & Exportación PDF
- **Importación Flexible**: Carga de archivos CSV con detección inteligente de columnas para Ventas, Materias Primas y Fichas Técnicas (BOM).
- **Modos de Carga**: Modo Fusión (*Merge/Upsert*) o Reemplazo Completo (*Full Overwrite*).
- **Descarga de Plantillas**: Plantillas CSV oficiales listas para diligenciar en Excel.
- **Exportación de Fichas Técnicas a PDF**: Generación de documentos formales de Tech Pack listos para imprimir o entregar a los talleres satélites.

---

## 📂 Estructura del Proyecto y Detalle de Archivos

```
├── .env.example                     # Variables de entorno documentadas del proyecto
├── .gitignore                       # Configuración de exclusión de Git
├── index.html                       # Documento HTML principal con fuentes tipográficas
├── metadata.json                    # Metadatos del applet y configuración de permisos
├── package.json                     # Manifiesto de dependencias, scripts de build y start
├── server.ts                        # Servidor backend Express con middleware Vite y APIs
├── tsconfig.json                    # Configuración estricta de compilación TypeScript
├── vite.config.ts                   # Configuración del empaquetador Vite con plugin Tailwind
│
└── src/
    ├── main.tsx                     # Punto de entrada de React 19
    ├── App.tsx                      # Componente raíz con orquestación de estado y vistas
    ├── index.css                    # Estilos globales y directivas de Tailwind CSS
    │
    ├── components/                  # Componentes modulares de interfaz de usuario
    │   ├── AccessRestricted.tsx     # Vista de acceso denegado por permisos insuficientes
    │   ├── AIIntelligencePanel.tsx  # Panel modal con el Asistente IA de Abastecimiento
    │   ├── BOMExplosionView.tsx     # Fichas Técnicas: BOM, Tiempos SAM, Routing, QC y Costeo
    │   ├── CSVManagerModal.tsx      # Centro de importación y exportación de archivos CSV
    │   ├── CycleControlBar.tsx      # Barra superior de parámetros de ciclo y temporadas
    │   ├── CycleManagementModal.tsx # Modal de configuración avanzada del horizonte de producción
    │   ├── DashboardOverview.tsx    # Panel ejecutivo con KPIs, estados de stock y gráficos
    │   ├── DemandForecastingView.tsx# Vista de metas de venta, estacionalidad y proyecciones
    │   ├── Header.tsx               # Cabecera principal con navegación y perfil de usuario activo
    │   ├── LoginModal.tsx           # Modal de autenticación con credenciales y switch rápido
    │   ├── MRPCalculatorTable.tsx   # Tabla maestra del cálculo de requerimientos de materiales
    │   ├── NewGarmentModal.tsx      # Formulario para registrar nuevas prendas en el catálogo
    │   ├── NewMaterialModal.tsx     # Formulario para registrar nuevas materias primas / telas
    │   ├── PurchaseOrderModal.tsx   # Gestor de órdenes de compra, filtros y creación manual
    │   ├── UserManagementModal.tsx  # Panel de administración de usuarios y matriz de permisos
    │   └── WhatIfSimulator.tsx      # Simulador de escenarios de demanda y estrés de merma
    │
    ├── data/                        # Conjuntos de datos iniciales y mocks realistas
    │   ├── mockData.ts              # Catálogo de prendas, telas, ventas históricas y órdenes
    │   └── mockUsers.ts             # Usuarios predefinidos con claves y roles departamentales
    │
    ├── services/                    # Motores de lógica empresarial y procesamiento
    │   ├── csvParser.ts             # Parser de archivos CSV con auto-detección y validación
    │   ├── mrpEngine.ts             # Motor matemático de cálculo de requerimientos de materiales
    │   └── pdfExporter.ts           # Motor de generación y maquetación de Tech Packs en PDF
    │
    ├── types/                       # Definiciones de tipos e interfaces TypeScript
    │   └── index.ts                 # Interfaces para RawMaterial, Garment, BOM, MRP, RBAC, etc.
    │
    └── utils/                       # Funciones de utilidad y lógica auxiliar
        ├── formatters.ts            # Formateadores monetarios en Pesos Colombianos (COP) y números
        ├── permissions.ts           # Lógica de verificación RBAC (`hasPermission`) y roles
        └── seasonality.ts           # Algoritmos de estacionalidad y curvas de demanda
```

---

## 👥 Cuentas de Usuario y Matriz de Permisos

El sistema incluye las siguientes credenciales preconfiguradas para pruebas y operación:

| Nombre | Usuario | Contraseña | Rol / Departamento | Permisos Asignados |
| :--- | :--- | :--- | :--- | :--- |
| **Carlos Mendoza** | `admin` | `admin123` | **Administrador General** *(Dirección)* | Acceso total a todos los módulos y configuración (13 permisos) |
| **Valentina Restrepo** | `ventas` | `ventas123` | **Comercial & Ventas** *(Ventas)* | Dashboard, Vista de Demanda, Modificación de Metas, Exportar CSV |
| **Andrés Morales** | `ingenieria` | `ingenieria123` | **Ingeniería Textil & BOM** *(Diseño)* | Fichas Técnicas, Edición de BOM, Tiempos SAM, QC, Ver Costeo |
| **Mariana Giraldo** | `compras` | `compras123` | **Compras & Abastecimiento** *(Supply)* | Dashboard, MRP, Inventario de Insumos, Gestión de Órdenes de Compra |
| **Héctor Fabio Vélez** | `produccion` | `produccion123` | **Jefe de Producción** *(Planta)* | Dashboard, Fichas Técnicas, Costeo Taller vs. Maquila, Parámetros Ciclo |
| **Claudia Osorio** | `calidad` | `calidad123` | **Auditor de Calidad** *(QC)* | Dashboard, Fichas Técnicas (Lectura), Control de Calidad |

---

## 📐 Modelos Matemáticos y Fórmulas del Motor

### 1. Cálculo de Requerimiento Bruto Efectivo ($RGB_i$)
Para una materia prima $i$, considerando todas las prendas $j$ que la consumen en su BOM:
$$RGB_i = \sum_{j=1}^{N} \left[ \text{Demanda Proyectada}_j \times \text{Consumo Unitario}_{i,j} \times \left(1 + \frac{\text{Merma}_{i,j} + \text{Merma Global}}{100}\right) \right]$$

### 2. Stock de Seguridad Requerido ($SS_i$)
$$SS_i = \left( \frac{RGB_i}{\text{Días del Ciclo}} \right) \times (\text{Días Stock Seguridad}_i + \text{Colchón Buffer})$$

### 3. Requerimiento Neto de Compra ($RN_i$)
$$\text{Stock Disponible}_i = \text{Stock Físico}_i + \text{Stock en Tránsito}_i$$
$$RN_i = \max(0, RGB_i + SS_i - \text{Stock Disponible}_i)$$

### 4. Sugerencia de Compra Ajustada al Lote Mínimo ($SC_i$)
$$SC_i = \begin{cases} 
0 & \text{si } RN_i = 0 \\
\text{MOQ}_i & \text{si } 0 < RN_i \le \text{MOQ}_i \\
\left\lceil \frac{RN_i}{\text{MOQ}_i} \right\rceil \times \text{MOQ}_i & \text{si } RN_i > \text{MOQ}_i 
\end{cases}$$

### 5. Costeo de Mano de Obra Directa (MOD) & CIF
$$\text{SAM Total} = \text{Minutos Corte} + \text{SAM Confección} + \text{Minutos Acabados}$$
$$\text{Costo MOD Interno} = \text{SAM Total} \times \text{Tarifa Minuto Planta (COP)}$$
$$\text{Costo CIF Interno} = \text{SAM Total} \times \text{Tarifa Indirectos (COP)}$$
$$\text{Costo Unitario Taller} = \text{Costo Insumos BOM} + \text{Costo MOD Interno} + \text{Costo CIF Interno}$$

---

## 💻 Instalación, Ejecución & Despliegue

### Requisitos Previos
- **Node.js**: Versión 18.x o superior.
- **npm** o **bun** instalado.

### 1. Clonar el repositorio e instalar dependencias
```bash
git clone <URL_DEL_REPOSITORIO>
cd textiliq-demand-mrp
npm install
```

### 2. Ejecutar en modo desarrollo
```bash
npm run dev
```
La aplicación estará disponible de forma inmediata en `http://localhost:3000`.

### 3. Validación y verificación de código (Linter)
```bash
npm run lint
```

### 4. Compilación para producción
```bash
npm run build
```
Este comando compilará el frontend estático con Vite en `/dist` y generará el servidor backend optimizado y empaquetado en `/dist/server.cjs`.

### 5. Iniciar en entorno de producción
```bash
npm run start
```

---

## 🔒 Configuración de Entorno

Cree un archivo `.env` en la raíz del proyecto tomando como base `.env.example`:

```env
# Puerto del servidor (obligatorio 3000 en el entorno de contenedores)
PORT=3000

# Clave de API de Gemini para el Asistente Inteligente Textil
GEMINI_API_KEY=tu_clave_de_gemini_aqui
```

> **Nota de Seguridad**: La variable `GEMINI_API_KEY` se procesa exclusivamente en el backend (`server.ts`) y **nunca** se expone al navegador web del cliente.

---

## 📄 Licencia & Créditos

Desarrollado para la industria textil y de confección como una solución integral de planeación de producción, costeo y control de inventarios. Todos los derechos reservados. 🧵🇨🇴
