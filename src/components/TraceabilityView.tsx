import React, { useState } from 'react';
import {
  GitCommit,
  Layers,
  Factory,
  Package,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Scissors,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Building,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { UnifiedDatabase } from '../services/unifiedDatabase';
import { formatCOP } from '../utils/formatters';

export const TraceabilityView: React.FC = () => {
  const products = UnifiedDatabase.getProductos();
  const ops = UnifiedDatabase.getOrdenesProduccion();
  const [selectedSku, setSelectedSku] = useState<string>(products.length > 0 ? products[0].SKU_Prenda : 'BH01');

  const selectedProd = products.find((p) => p.SKU_Prenda.toUpperCase() === selectedSku.toUpperCase());
  const selectedFicha = UnifiedDatabase.getFichasTecnicas().find(
    (f) => f.SKU_Prenda.toUpperCase() === selectedSku.toUpperCase()
  );
  const selectedBOM = UnifiedDatabase.getBOMItems().filter(
    (b) => b.SKU_Prenda.toUpperCase() === selectedSku.toUpperCase()
  );
  const productSales = UnifiedDatabase.getVentasHistoricas().filter(
    (v) => v.SKU_Prenda.toUpperCase() === selectedSku.toUpperCase()
  );
  const relatedOPs = ops.filter((o) => o.SKU_Prenda.toUpperCase() === selectedSku.toUpperCase());
  const activeOP = relatedOPs.length > 0 ? relatedOPs[0] : null;
  const qcLogs = UnifiedDatabase.getControlCalidad().filter(
    (q) => q.SKU_Prenda?.toUpperCase() === selectedSku.toUpperCase() || q.numero_orden === activeOP?.numero_orden
  );

  // Materials needed for active OP
  const opMaterials = activeOP ? UnifiedDatabase.calculateOrderMaterials(selectedSku, activeOP.cantidad_planificada) : [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-[#E6E1D8] p-5 sm:p-6 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#3A5A40] text-white flex items-center justify-center shadow-xs">
              <GitCommit className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[#1C211D]">
                  Trazabilidad Integral del Flujo Productivo
                </h2>
                <span className="px-2 py-0.5 bg-[#EBF2EC] text-[#3A5A40] text-[10px] font-bold rounded-full border border-[#D4E3D7]">
                  End-to-End
                </span>
              </div>
              <p className="text-xs text-[#5F6B61]">
                Visualice el ciclo de vida completo: Venta Histórica → Demanda → BOM → Insumos → Salida Inventario → Etapas MES → Calidad → Costo Final.
              </p>
            </div>
          </div>

          {/* Product selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-[#5F6B61] whitespace-nowrap">
              Prenda a Trazar:
            </label>
            <select
              value={selectedSku}
              onChange={(e) => setSelectedSku(e.target.value)}
              className="px-3 py-2 bg-[#FAF8F5] border border-[#D5CEC2] rounded-xl text-xs font-bold text-[#1C211D] focus:ring-2 focus:ring-[#3A5A40] focus:outline-hidden cursor-pointer"
            >
              {products.map((p) => (
                <option key={p.id_producto} value={p.SKU_Prenda}>
                  {p.SKU_Prenda} — {p.Nombre_Prenda}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 8-Stage Interactive Traceability Journey */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Step 1: Demanda & Ventas */}
        <div className="bg-white border border-[#E6E1D8] p-4 rounded-xl shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#F2EEE6]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EBF2EC] text-[#3A5A40] flex items-center justify-center font-bold text-xs">
                1
              </div>
              <span className="text-xs font-bold text-[#1C211D]">Venta & Demanda</span>
            </div>
            <TrendingUp className="w-4 h-4 text-[#3A5A40]" />
          </div>
          <div className="space-y-1.5 text-xs">
            <p className="text-[#5F6B61]">
              Meta de Producción Ciclo: <strong className="text-[#1C211D]">{selectedProd?.Meta_Ventas_Ciclo.toLocaleString()} unds</strong>
            </p>
            <p className="text-[#5F6B61]">
              PVP de Venta: <strong className="text-[#1C211D]">{formatCOP(selectedProd?.PVP_COP || 0)}</strong>
            </p>
            <p className="text-[#5F6B61]">
              Histórico registrado: <strong className="text-[#1C211D]">{productSales.reduce((s, v) => s + v.Unidades_Vendidas, 0)} unds</strong> ({productSales.length} transacciones)
            </p>
          </div>
        </div>

        {/* Step 2: Ficha Técnica & SAM */}
        <div className="bg-white border border-[#E6E1D8] p-4 rounded-xl shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#F2EEE6]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EBF2EC] text-[#3A5A40] flex items-center justify-center font-bold text-xs">
                2
              </div>
              <span className="text-xs font-bold text-[#1C211D]">Ficha Técnica</span>
            </div>
            <Scissors className="w-4 h-4 text-[#3A5A40]" />
          </div>
          <div className="space-y-1.5 text-xs">
            <p className="text-[#5F6B61]">
              Tiempo Corte: <strong className="text-[#1C211D]">{selectedFicha?.Tiempo_Corte_Min || 1.2} min</strong>
            </p>
            <p className="text-[#5F6B61]">
              SAM Confección: <strong className="text-[#1C211D]">{selectedFicha?.SAM_Confeccion_Min || 8.5} min</strong>
            </p>
            <p className="text-[#5F6B61]">
              Tiempo Acabados: <strong className="text-[#1C211D]">{selectedFicha?.Tiempo_Acabados_Min || 1.5} min</strong>
            </p>
            <p className="text-[#5F6B61]">
              Tarifa Minuto: <strong className="text-[#1C211D]">${selectedFicha?.Tarifa_Minuto_Interno_COP || 280} COP/min</strong>
            </p>
          </div>
        </div>

        {/* Step 3: BOM & Consumo de Insumos */}
        <div className="bg-white border border-[#E6E1D8] p-4 rounded-xl shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#F2EEE6]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EBF2EC] text-[#3A5A40] flex items-center justify-center font-bold text-xs">
                3
              </div>
              <span className="text-xs font-bold text-[#1C211D]">Explosión BOM</span>
            </div>
            <Layers className="w-4 h-4 text-[#3A5A40]" />
          </div>
          <div className="space-y-1.5 text-xs">
            <p className="text-[#5F6B61]">
              Total Insumos BOM: <strong className="text-[#1C211D]">{selectedBOM.length} materiales</strong>
            </p>
            <p className="text-[#5F6B61]">
              Costo Materiales/Prenda: <strong className="text-[#1C211D]">{formatCOP(selectedBOM.reduce((s, b) => s + b.costo_material_por_prenda, 0))}</strong>
            </p>
            <p className="text-[11px] text-[#5F6B61] line-clamp-2">
              Bases: {selectedBOM.map((b) => b.SKU_Material).join(', ')}
            </p>
          </div>
        </div>

        {/* Step 4: Orden de Producción */}
        <div className="bg-white border border-[#E6E1D8] p-4 rounded-xl shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#F2EEE6]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EBF2EC] text-[#3A5A40] flex items-center justify-center font-bold text-xs">
                4
              </div>
              <span className="text-xs font-bold text-[#1C211D]">Orden de Producción</span>
            </div>
            <Factory className="w-4 h-4 text-[#3A5A40]" />
          </div>
          <div className="space-y-1.5 text-xs">
            {activeOP ? (
              <>
                <p className="text-[#5F6B61]">
                  OP Activa: <strong className="text-[#1C211D]">{activeOP.numero_orden}</strong>
                </p>
                <p className="text-[#5F6B61]">
                  Lote Planificado: <strong className="text-[#1C211D]">{activeOP.cantidad_planificada} unds</strong>
                </p>
                <span className="inline-block px-2 py-0.5 bg-[#EBF2EC] text-[#3A5A40] text-[10px] font-bold rounded-full">
                  Estado: {activeOP.estado}
                </span>
              </>
            ) : (
              <p className="text-[#5F6B61]">No hay OPs activas para esta referencia.</p>
            )}
          </div>
        </div>

        {/* Step 5: Salida de Inventario (Kardex) */}
        <div className="bg-white border border-[#E6E1D8] p-4 rounded-xl shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#F2EEE6]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EBF2EC] text-[#3A5A40] flex items-center justify-center font-bold text-xs">
                5
              </div>
              <span className="text-xs font-bold text-[#1C211D]">Salida Kardex</span>
            </div>
            <Package className="w-4 h-4 text-[#3A5A40]" />
          </div>
          <div className="space-y-1.5 text-xs">
            <p className="text-[#5F6B61]">
              Descuento automático: <strong className="text-[#1C211D]">100% sincronizado</strong>
            </p>
            <p className="text-[#5F6B61]">
              Movimiento registrado: <strong className="text-[#1C211D]">Consumo producción</strong>
            </p>
            <p className="text-[#5F6B61]">
              Stock PT actual: <strong className="text-[#1C211D]">{selectedProd?.stock_producto_terminado || 0} unds</strong>
            </p>
          </div>
        </div>

        {/* Step 6: Etapas de Manufactura */}
        <div className="bg-white border border-[#E6E1D8] p-4 rounded-xl shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#F2EEE6]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EBF2EC] text-[#3A5A40] flex items-center justify-center font-bold text-xs">
                6
              </div>
              <span className="text-xs font-bold text-[#1C211D]">Etapas MES</span>
            </div>
            <Clock className="w-4 h-4 text-[#3A5A40]" />
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-[#5F6B61]">1. Corte:</span>
              <span className="font-bold text-emerald-700">Completada</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5F6B61]">2. Confección:</span>
              <span className="font-bold text-amber-700">{activeOP?.estado === 'En confección' ? 'En Proceso' : 'Pendiente'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5F6B61]">3. Acabados:</span>
              <span className="font-bold text-[#5F6B61]">Pendiente</span>
            </div>
          </div>
        </div>

        {/* Step 7: Control de Calidad (QC) */}
        <div className="bg-white border border-[#E6E1D8] p-4 rounded-xl shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#F2EEE6]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EBF2EC] text-[#3A5A40] flex items-center justify-center font-bold text-xs">
                7
              </div>
              <span className="text-xs font-bold text-[#1C211D]">Control Calidad</span>
            </div>
            <ShieldCheck className="w-4 h-4 text-[#3A5A40]" />
          </div>
          <div className="space-y-1.5 text-xs">
            <p className="text-[#5F6B61]">
              Inspecciones registradas: <strong className="text-[#1C211D]">{qcLogs.length} lotes</strong>
            </p>
            <p className="text-[#5F6B61]">
              Aprobadas: <strong className="text-emerald-700">{qcLogs.reduce((s, q) => s + q.cantidad_aprobada, 0)} unds</strong>
            </p>
            <p className="text-[#5F6B61]">
              Rechazos: <strong className="text-rose-700">{qcLogs.reduce((s, q) => s + q.cantidad_rechazada, 0)} unds</strong>
            </p>
          </div>
        </div>

        {/* Step 8: Costo Total & Margen */}
        <div className="bg-white border border-[#E6E1D8] p-4 rounded-xl shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#F2EEE6]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EBF2EC] text-[#3A5A40] flex items-center justify-center font-bold text-xs">
                8
              </div>
              <span className="text-xs font-bold text-[#1C211D]">Costo & Margen</span>
            </div>
            <DollarSign className="w-4 h-4 text-[#3A5A40]" />
          </div>
          <div className="space-y-1.5 text-xs">
            {(() => {
              const matCost = selectedBOM.reduce((s, b) => s + b.costo_material_por_prenda, 0);
              const laborMins = (selectedFicha?.Tiempo_Corte_Min || 1.2) + (selectedFicha?.SAM_Confeccion_Min || 8.5) + (selectedFicha?.Tiempo_Acabados_Min || 1.5);
              const laborCost = Math.round(laborMins * (selectedFicha?.Tarifa_Minuto_Interno_COP || 280));
              const overheadCost = Math.round(laborMins * 95);
              const totalCost = matCost + laborCost + overheadCost;
              const pvp = selectedProd?.PVP_COP || 1;
              const margin = Math.round(((pvp - totalCost) / pvp) * 100);

              return (
                <>
                  <p className="text-[#5F6B61]">
                    Costo Unitario Total: <strong className="text-[#1C211D]">{formatCOP(totalCost)}</strong>
                  </p>
                  <p className="text-[#5F6B61]">
                    Precio Venta (PVP): <strong className="text-[#1C211D]">{formatCOP(pvp)}</strong>
                  </p>
                  <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200">
                    Margen Estimado: {margin}%
                  </span>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Detailed BOM & Material Consumption Breakdown for the Product */}
      <div className="bg-white border border-[#E6E1D8] rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 bg-[#FAF8F5] border-b border-[#E6E1D8] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#3A5A40]" />
            <h3 className="text-sm font-bold text-[#1C211D]">
              Estructura BOM y Demanda de Materiales ({selectedSku} — {selectedProd?.Nombre_Prenda})
            </h3>
          </div>
          <span className="text-xs text-[#5F6B61]">
            Lote base: {activeOP?.cantidad_planificada || 500} prendas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E6E1D8] text-[#5F6B61] font-bold">
                <th className="px-4 py-3">SKU Insumo</th>
                <th className="px-4 py-3">Materia Prima</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3 text-right">Consumo / Prenda</th>
                <th className="px-4 py-3 text-right">Merma %</th>
                <th className="px-4 py-3 text-right">Requerido (Lote)</th>
                <th className="px-4 py-3 text-right">Stock Disponible</th>
                <th className="px-4 py-3 text-right">Costo Unitario</th>
                <th className="px-4 py-3 text-right">Costo en Prenda</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EEE6]">
              {selectedBOM.map((item) => {
                const mat = UnifiedDatabase.getMateriasPrimas().find(
                  (m) => m.SKU_Material.toUpperCase() === item.SKU_Material.toUpperCase()
                );
                const batchQty = activeOP?.cantidad_planificada || 500;
                const batchReq = Number((batchQty * item.Consumo_Por_Prenda * (1 + item.Merma_Corte_Porcentaje / 100)).toFixed(2));

                return (
                  <tr key={item.id_bom} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#3A5A40]">{item.SKU_Material}</td>
                    <td className="px-4 py-3 font-semibold text-[#1C211D]">{mat?.Nombre_Material || item.Nombre_Material}</td>
                    <td className="px-4 py-3 text-[#5F6B61]">{mat?.Categoria || item.Categoria_Material}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {item.Consumo_Por_Prenda} {item.Unidad_Medida}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{item.Merma_Corte_Porcentaje}%</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[#1C211D]">
                      {batchReq.toLocaleString()} {item.Unidad_Medida}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      <span className={mat && mat.Stock_Actual < batchReq ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
                        {mat?.Stock_Actual.toLocaleString()} {item.Unidad_Medida}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#5F6B61]">
                      {formatCOP(item.costo_material_unitario)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[#1C211D]">
                      {formatCOP(item.costo_material_por_prenda)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
