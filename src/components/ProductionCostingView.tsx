import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Layers,
  Scissors,
  Factory,
  Building,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { UnifiedDatabase } from '../services/unifiedDatabase';
import { formatCOP } from '../utils/formatters';

export const ProductionCostingView: React.FC = () => {
  const products = UnifiedDatabase.getProductos();
  const fichas = UnifiedDatabase.getFichasTecnicas();
  const boms = UnifiedDatabase.getBOMItems();
  const materials = UnifiedDatabase.getMateriasPrimas();

  const [selectedSku, setSelectedSku] = useState<string>(products.length > 0 ? products[0].SKU_Prenda : 'BH01');

  const selectedProd = products.find((p) => p.SKU_Prenda.toUpperCase() === selectedSku.toUpperCase());
  const selectedFicha = fichas.find((f) => f.SKU_Prenda.toUpperCase() === selectedSku.toUpperCase());
  const selectedBOM = boms.filter((b) => b.SKU_Prenda.toUpperCase() === selectedSku.toUpperCase());

  // Cost calculations for selected product
  const materialCost = selectedBOM.reduce((sum, b) => sum + b.costo_material_por_prenda, 0);

  const corteMin = selectedFicha?.Tiempo_Corte_Min || 1.2;
  const confeccionMin = selectedFicha?.SAM_Confeccion_Min || 8.5;
  const acabadosMin = selectedFicha?.Tiempo_Acabados_Min || 1.5;
  const totalLaborMins = corteMin + confeccionMin + acabadosMin;

  const internalMinuteRate = selectedFicha?.Tarifa_Minuto_Interno_COP || 280;
  const internalLaborCost = Math.round(totalLaborMins * internalMinuteRate);
  const internalOverheadRate = 95; // COP/min for CIF (servicios, depreciación, arriendo)
  const internalCIFCost = Math.round(totalLaborMins * internalOverheadRate);
  const totalInternalCost = materialCost + internalLaborCost + internalCIFCost;

  // External Satellite / Maquila cost
  const maquilaConfeccionUnit = selectedFicha?.Tarifa_Maquila_Confeccion_COP || 2600;
  const maquilaTotalCost = materialCost + Math.round(corteMin * internalMinuteRate) + maquilaConfeccionUnit + Math.round(acabadosMin * internalMinuteRate) + 300; // 300 transporte

  const pvp = selectedProd?.PVP_COP || 1;
  const internalMarginPct = Math.round(((pvp - totalInternalCost) / pvp) * 100);
  const maquilaMarginPct = Math.round(((pvp - maquilaTotalCost) / pvp) * 100);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E6E1D8] p-5 sm:p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#3A5A40] text-white flex items-center justify-center shadow-xs">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-[#1C211D]">
                Estructura de Costos de Producción & Margen
              </h2>
              <span className="px-2 py-0.5 bg-[#EBF2EC] text-[#3A5A40] text-[10px] font-bold rounded-full border border-[#D4E3D7]">
                Costeo Industrial vs Maquila
              </span>
            </div>
            <p className="text-xs text-[#5F6B61]">
              Desglose de Materia Prima (BOM), Mano de Obra Directa (SAM × Tarifa) y Costos Indirectos de Fabricación (CIF).
            </p>
          </div>
        </div>

        {/* Product selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-[#5F6B61]">Prenda:</label>
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

      {/* Comparison Grid: Taller Propio vs Maquila Externa */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scenario 1: Taller Propio */}
        <div className="bg-white border border-[#E6E1D8] rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2EEE6]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#EBF2EC] text-[#3A5A40] flex items-center justify-center font-bold">
                <Factory className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#1C211D]">Producción en Planta Propia</h3>
                <span className="text-[10px] text-[#5F6B61]">Taller Central (Corte + Confección + Terminado)</span>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black rounded-full">
              Margen {internalMarginPct}%
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-[#FAF8F5]">
              <span className="text-[#5F6B61] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#3A5A40]" /> Materia Prima (BOM):
              </span>
              <strong className="text-[#1C211D] font-mono">{formatCOP(materialCost)}</strong>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#FAF8F5]">
              <span className="text-[#5F6B61] flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-[#3A5A40]" /> Mano de Obra ({totalLaborMins} min @ ${internalMinuteRate}):
              </span>
              <strong className="text-[#1C211D] font-mono">{formatCOP(internalLaborCost)}</strong>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#FAF8F5]">
              <span className="text-[#5F6B61] flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#3A5A40]" /> CIF / Gastos de Planta:
              </span>
              <strong className="text-[#1C211D] font-mono">{formatCOP(internalCIFCost)}</strong>
            </div>

            <div className="flex justify-between items-center pt-2 text-sm">
              <span className="font-bold text-[#1C211D]">Costo Total Unitario:</span>
              <strong className="text-base font-black text-[#3A5A40] font-mono">{formatCOP(totalInternalCost)}</strong>
            </div>

            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE6DF] space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[#5F6B61]">Precio Venta al Público (PVP):</span>
                <strong className="text-[#1C211D] font-mono">{formatCOP(pvp)}</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#5F6B61]">Utilidad Bruta por Prenda:</span>
                <strong className="text-emerald-700 font-mono font-bold">{formatCOP(pvp - totalInternalCost)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Scenario 2: Maquila / Satélite Externo */}
        <div className="bg-white border border-[#E6E1D8] rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F2EEE6]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] text-[#5F6B61] flex items-center justify-center font-bold">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#1C211D]">Producción en Satélite / Maquila</h3>
                <span className="text-[10px] text-[#5F6B61]">Corte interno + Confección externa</span>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-black rounded-full">
              Margen {maquilaMarginPct}%
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-[#FAF8F5]">
              <span className="text-[#5F6B61] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#5F6B61]" /> Materia Prima (BOM):
              </span>
              <strong className="text-[#1C211D] font-mono">{formatCOP(materialCost)}</strong>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#FAF8F5]">
              <span className="text-[#5F6B61] flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-[#5F6B61]" /> Tarifa Confección Satélite:
              </span>
              <strong className="text-[#1C211D] font-mono">{formatCOP(maquilaConfeccionUnit)}</strong>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-[#FAF8F5]">
              <span className="text-[#5F6B61] flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#5F6B61]" /> Corte Interno + Transporte + Terminado:
              </span>
              <strong className="text-[#1C211D] font-mono">
                {formatCOP(Math.round(corteMin * internalMinuteRate) + Math.round(acabadosMin * internalMinuteRate) + 300)}
              </strong>
            </div>

            <div className="flex justify-between items-center pt-2 text-sm">
              <span className="font-bold text-[#1C211D]">Costo Total Maquila:</span>
              <strong className="text-base font-black text-[#82530C] font-mono">{formatCOP(maquilaTotalCost)}</strong>
            </div>

            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE6DF] space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[#5F6B61]">Precio Venta al Público (PVP):</span>
                <strong className="text-[#1C211D] font-mono">{formatCOP(pvp)}</strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#5F6B61]">Utilidad Bruta por Prenda:</span>
                <strong className="text-amber-800 font-mono font-bold">{formatCOP(pvp - maquilaTotalCost)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Products Comparative Matrix */}
      <div className="bg-white border border-[#E6E1D8] rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 bg-[#FAF8F5] border-b border-[#E6E1D8]">
          <h3 className="text-sm font-bold text-[#1C211D]">Matriz Comparativa de Costos por Referencia (Catálogo Completo)</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#E6E1D8] text-[#5F6B61] font-bold">
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Prenda</th>
                <th className="px-4 py-3 text-right">Insumos (BOM)</th>
                <th className="px-4 py-3 text-right">MOD + CIF</th>
                <th className="px-4 py-3 text-right">Costo Interno</th>
                <th className="px-4 py-3 text-right">Costo Maquila</th>
                <th className="px-4 py-3 text-right">PVP</th>
                <th className="px-4 py-3 text-right">Margen Interno</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EEE6]">
              {products.map((p) => {
                const prodBoms = boms.filter((b) => b.SKU_Prenda.toUpperCase() === p.SKU_Prenda.toUpperCase());
                const prodFicha = fichas.find((f) => f.SKU_Prenda.toUpperCase() === p.SKU_Prenda.toUpperCase());
                const mCost = prodBoms.reduce((s, b) => s + b.costo_material_por_prenda, 0);

                const cMin = prodFicha?.Tiempo_Corte_Min || 1.2;
                const confMin = prodFicha?.SAM_Confeccion_Min || 8.5;
                const aMin = prodFicha?.Tiempo_Acabados_Min || 1.5;
                const totalMins = cMin + confMin + aMin;
                const rate = prodFicha?.Tarifa_Minuto_Interno_COP || 280;

                const laborCif = Math.round(totalMins * (rate + 95));
                const totalInt = mCost + laborCif;
                const totalMaq = mCost + Math.round(cMin * rate) + (prodFicha?.Tarifa_Maquila_Confeccion_COP || 2600) + Math.round(aMin * rate) + 300;
                const margin = Math.round(((p.PVP_COP - totalInt) / p.PVP_COP) * 100);

                return (
                  <tr key={p.id_producto} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#3A5A40]">{p.SKU_Prenda}</td>
                    <td className="px-4 py-3 font-semibold text-[#1C211D]">{p.Nombre_Prenda}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCOP(mCost)}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCOP(laborCif)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[#1C211D]">{formatCOP(totalInt)}</td>
                    <td className="px-4 py-3 text-right font-mono text-[#82530C]">{formatCOP(totalMaq)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[#3A5A40]">{formatCOP(p.PVP_COP)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200">
                        {margin}%
                      </span>
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
