import React, { useState, useMemo } from 'react';
import { CompanyTenant, CompanyComparativeMetrics } from '../types';
import {
  computeCompanyComparativeMetrics,
  exportCompaniesBenchmarkCSV,
} from '../services/benchmarkService';
import { formatCOP } from '../utils/formatters';
import {
  Building,
  TrendingUp,
  Scissors,
  Clock,
  DollarSign,
  Award,
  BarChart3,
  Download,
  Plus,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface CompanyBenchmarkViewProps {
  companies: CompanyTenant[];
  activeCompanyId: string;
  onSelectCompany: (companyId: string) => void;
  onOpenCompanyManager: () => void;
}

export const CompanyBenchmarkView: React.FC<CompanyBenchmarkViewProps> = ({
  companies,
  activeCompanyId,
  onSelectCompany,
  onOpenCompanyManager,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'margin' | 'scrap' | 'sam' | 'inventory'>('margin');

  // Compute metrics for all companies
  const metricsList: CompanyComparativeMetrics[] = useMemo(() => {
    return companies.map((comp) => computeCompanyComparativeMetrics(comp));
  }, [companies]);

  // Leaders calculation
  const leaderMargin = useMemo(() => {
    if (!metricsList.length) return null;
    return [...metricsList].sort((a, b) => b.averageProfitMarginPercent - a.averageProfitMarginPercent)[0];
  }, [metricsList]);

  const leaderScrap = useMemo(() => {
    if (!metricsList.length) return null;
    return [...metricsList].sort((a, b) => b.scrapEfficiencyScore - a.scrapEfficiencyScore)[0];
  }, [metricsList]);

  const leaderSAM = useMemo(() => {
    if (!metricsList.length) return null;
    return [...metricsList].sort((a, b) => a.averageSewingSAMMinutes - b.averageSewingSAMMinutes)[0];
  }, [metricsList]);

  const totalConsolidatedInventoryCOP = useMemo(() => {
    return metricsList.reduce((acc, m) => acc + m.totalStockValueCOP, 0);
  }, [metricsList]);

  const handleDownloadCSV = () => {
    const csvContent = exportCompaniesBenchmarkCSV(companies);
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `textiliq_comparativo_empresas_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E6E1D8] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#EBF3ED] text-[#2D4632]">
              <BarChart3 className="w-5 h-5 text-[#3A5A40]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1C211D]">
              Comparativo Inter-Empresas & Benchmarking Textil
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#5F6B61] mt-1 max-w-3xl">
            Compara rendimientos operativos, márgenes de ganancia, auditoría de mermas y tiempos estándar SAM entre múltiples empresas y sedes registradas en el sistema.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownloadCSV}
            className="px-3.5 py-2 bg-white border border-[#D5CEC2] hover:bg-[#FAF8F5] text-[#1C211D] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer active:scale-95"
            id="btn-export-benchmark-csv"
          >
            <Download className="w-3.5 h-3.5 text-[#3A5A40]" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={onOpenCompanyManager}
            className="px-4 py-2 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
            id="btn-add-company-from-benchmark"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Gestionar Empresas</span>
          </button>
        </div>
      </div>

      {/* KPI Leader Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Margen Bruto */}
        <div className="bg-white rounded-2xl p-4 border border-[#E6E1D8] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5F6B61] uppercase tracking-wider">
              Líder en Margen Bruto
            </span>
            <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#1C211D]">
              {leaderMargin ? `${leaderMargin.averageProfitMarginPercent}%` : '0%'}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: leaderMargin?.brandColor || '#3A5A40' }}
              />
              <span className="text-xs font-bold text-[#3A5A40] truncate">
                {leaderMargin?.companyName || 'Sin datos'}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-[#5F6B61] mt-2 pt-2 border-t border-[#E6E1D8]">
            Mayor rentabilidad promedio por prenda
          </p>
        </div>

        {/* Card 2: Eficiencia de Corte */}
        <div className="bg-white rounded-2xl p-4 border border-[#E6E1D8] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5F6B61] uppercase tracking-wider">
              Mejor Eficiencia de Corte
            </span>
            <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
              <Scissors className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#1C211D]">
              {leaderScrap ? `${leaderScrap.scrapEfficiencyScore} pts` : '0 pts'}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: leaderScrap?.brandColor || '#3A5A40' }}
              />
              <span className="text-xs font-bold text-[#1E40AF] truncate">
                {leaderScrap?.companyName || 'Sin datos'}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-[#5F6B61] mt-2 pt-2 border-t border-[#E6E1D8]">
            Merma real contenida ({leaderScrap?.averageActualScrapPercent || 0}%)
          </p>
        </div>

        {/* Card 3: SAM Confección */}
        <div className="bg-white rounded-2xl p-4 border border-[#E6E1D8] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5F6B61] uppercase tracking-wider">
              Menor SAM de Confección
            </span>
            <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#1C211D]">
              {leaderSAM ? `${leaderSAM.averageSewingSAMMinutes} min` : '0 min'}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: leaderSAM?.brandColor || '#3A5A40' }}
              />
              <span className="text-xs font-bold text-[#D97706] truncate">
                {leaderSAM?.companyName || 'Sin datos'}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-[#5F6B61] mt-2 pt-2 border-t border-[#E6E1D8]">
            Ciclo de ensamble y costura más ágil
          </p>
        </div>

        {/* Card 4: Inventario Consolidado */}
        <div className="bg-white rounded-2xl p-4 border border-[#E6E1D8] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5F6B61] uppercase tracking-wider">
              Inventario Total Consolidado
            </span>
            <div className="p-1.5 bg-purple-50 text-purple-700 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[#1C211D]">
              {formatCOP(totalConsolidatedInventoryCOP)}
            </div>
            <div className="text-xs font-medium text-[#5F6B61] mt-1">
              Suma de materias primas en {companies.length} empresas
            </div>
          </div>
          <p className="text-[11px] text-[#5F6B61] mt-2 pt-2 border-t border-[#E6E1D8]">
            Capital circulante en bodegas de insumos
          </p>
        </div>
      </div>

      {/* Side-by-Side Matrix Table */}
      <div className="bg-white rounded-2xl border border-[#E6E1D8] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E6E1D8] flex items-center justify-between bg-[#FAF8F5]">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-[#1C211D]">
              Matriz Comparativa Inter-Empresas
            </h3>
            <p className="text-xs text-[#5F6B61]">
              Indicadores clave normalizados por empresa y unidad operativa
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-[#EBE7DF] text-[#4A544C] rounded-lg">
            {metricsList.length} Unidades Registradas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF8F5] text-[#5F6B61] font-bold border-b border-[#E6E1D8]">
                <th className="py-3 px-4">Empresa / Sede</th>
                <th className="py-3 px-3">Especialidad</th>
                <th className="py-3 px-3 text-center">Catálogo</th>
                <th className="py-3 px-3 text-right">Margen Prom.</th>
                <th className="py-3 px-3 text-right">Merma Real vs Teórica</th>
                <th className="py-3 px-3 text-right">SAM Confección</th>
                <th className="py-3 px-3 text-right">Lead Time Prov.</th>
                <th className="py-3 px-3 text-right">Valor Stock</th>
                <th className="py-3 px-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E1D8]">
              {metricsList.map((m) => {
                const isActive = m.companyId === activeCompanyId;
                const isScrapAlert = m.averageActualScrapPercent > m.averageTheoreticalScrapPercent;

                return (
                  <tr
                    key={m.companyId}
                    className={`transition-colors hover:bg-[#FAF8F5] ${
                      isActive ? 'bg-[#F4F8F5]' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs"
                          style={{ backgroundColor: m.brandColor }}
                        >
                          {m.companyName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#1C211D]">{m.companyName}</span>
                            {isActive && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#3A5A40] text-white">
                                Activa
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#5F6B61] block font-mono">
                            NIT: {m.nit} • {m.city}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#E6E1D8] text-[#4A544C] font-semibold text-[11px]">
                        {m.specialty}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-center font-bold text-[#1C211D]">
                      {m.totalGarments} prendas
                    </td>

                    <td className="py-3.5 px-3 text-right font-black text-[#1C211D]">
                      <span
                        className={`px-2 py-0.5 rounded-md text-xs ${
                          m.averageProfitMarginPercent >= 65
                            ? 'bg-emerald-50 text-emerald-700 font-black'
                            : 'bg-amber-50 text-amber-700 font-bold'
                        }`}
                      >
                        {m.averageProfitMarginPercent}%
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span
                          className={`font-bold ${
                            isScrapAlert ? 'text-amber-700' : 'text-emerald-700'
                          }`}
                        >
                          {m.averageActualScrapPercent}%
                        </span>
                        <span className="text-[#8F9990] text-[10px]">
                          (meta {m.averageTheoreticalScrapPercent}%)
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-right font-semibold text-[#1C211D]">
                      {m.averageSewingSAMMinutes} min
                    </td>

                    <td className="py-3.5 px-3 text-right text-[#5F6B61]">
                      {m.averageSupplierLeadTimeDays} días
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono font-bold text-[#3A5A40]">
                      {formatCOP(m.totalStockValueCOP)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {!isActive ? (
                        <button
                          onClick={() => onSelectCompany(m.companyId)}
                          className="px-2.5 py-1 bg-white border border-[#D5CEC2] hover:bg-[#3A5A40] hover:text-white text-[#1C211D] rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                          id={`btn-benchmark-activate-${m.companyId}`}
                        >
                          Activar
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-[#3A5A40] flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Seleccionada</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Graphical Comparative Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Margen Bruto Comparativo */}
        <div className="bg-white rounded-2xl p-5 border border-[#E6E1D8] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-sm text-[#1C211D]">
                Comparación de Margen Bruto Promedio (%)
              </h4>
              <p className="text-xs text-[#5F6B61]">Rentabilidad sobre precio de venta al público</p>
            </div>
            <TrendingUp className="w-4 h-4 text-[#3A5A40]" />
          </div>

          <div className="space-y-3.5">
            {metricsList.map((m) => (
              <div key={m.companyId} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#1C211D] truncate max-w-[200px]">
                    {m.companyName}
                  </span>
                  <span className="font-black text-[#3A5A40]">
                    {m.averageProfitMarginPercent}%
                  </span>
                </div>
                <div className="w-full h-3 bg-[#FAF8F5] rounded-full overflow-hidden border border-[#E6E1D8]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, m.averageProfitMarginPercent)}%`,
                      backgroundColor: m.brandColor || '#3A5A40',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Tiempos SAM de Confección */}
        <div className="bg-white rounded-2xl p-5 border border-[#E6E1D8] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-sm text-[#1C211D]">
                Comparación de SAM de Confección (Minutos)
              </h4>
              <p className="text-xs text-[#5F6B61]">Tiempo estándar promedio requerido por prenda</p>
            </div>
            <Clock className="w-4 h-4 text-[#D97706]" />
          </div>

          <div className="space-y-3.5">
            {metricsList.map((m) => {
              const maxSAM = 45; // baseline scale
              const percent = Math.min(100, (m.averageSewingSAMMinutes / maxSAM) * 100);

              return (
                <div key={m.companyId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#1C211D] truncate max-w-[200px]">
                      {m.companyName}
                    </span>
                    <span className="font-bold text-[#D97706]">
                      {m.averageSewingSAMMinutes} min / prenda
                    </span>
                  </div>
                  <div className="w-full h-3 bg-[#FAF8F5] rounded-full overflow-hidden border border-[#E6E1D8]">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-[#D97706]"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Textile Best Practice Recommendations & Gap Analysis */}
      <div className="bg-[#FAF8F5] rounded-2xl p-5 border border-[#E6E1D8]">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-[#3A5A40]" />
          <h4 className="text-sm font-bold text-[#1C211D]">
            Diagnóstico de Brechas & Mejores Prácticas Textiles
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-[#4A544C]">
          <div className="bg-white p-3.5 rounded-xl border border-[#E6E1D8]">
            <span className="font-bold text-[#1C211D] block mb-1">
              🎯 Optimización de Tizada & Corte
            </span>
            <p className="text-[#5F6B61] leading-relaxed">
              Las empresas del sector Denim presentan mermas de corte más elevadas (6.5% - 7.2%). Se sugiere implementar tizado computarizado para reducir desperdicio de tela en rollos de 1.65m.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-[#E6E1D8]">
            <span className="font-bold text-[#1C211D] block mb-1">
              ⚡ Balanceo de Línea & SAM
            </span>
            <p className="text-[#5F6B61] leading-relaxed">
              En Tejido de Punto y Ropa Deportiva, los tiempos SAM son menores (16 - 18 min), lo que permite rotaciones rápidas de lote con menor inventario en proceso (WIP).
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-[#E6E1D8]">
            <span className="font-bold text-[#1C211D] block mb-1">
              📦 Cobertura de Stock MRP
            </span>
            <p className="text-[#5F6B61] leading-relaxed">
              Sincronizar los puntos de reorden con los lead times reales de proveedores colombianos (14 a 21 días) evita capital ocioso en telas importadas de alto costo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
