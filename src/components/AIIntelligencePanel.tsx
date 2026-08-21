import React, { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  DollarSign,
  Scissors,
  RefreshCw,
  X,
} from 'lucide-react';
import { AIAnalysisResponse, ProductionCycleConfig, Garment } from '../types';
import { MRPSummary } from '../services/mrpEngine';

interface AIIntelligencePanelProps {
  isOpen: boolean;
  onClose: () => void;
  mrpSummary: MRPSummary;
  cycleConfig: ProductionCycleConfig;
  garments: Garment[];
}

export const AIIntelligencePanel: React.FC<AIIntelligencePanelProps> = ({
  isOpen,
  onClose,
  mrpSummary,
  cycleConfig,
  garments,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const criticalMaterials = mrpSummary.items
        .filter((i) => i.status === 'CRITICO' || i.status === 'REORDEN')
        .map((i) => ({
          sku: i.rawMaterial.sku,
          name: i.rawMaterial.name,
          category: i.rawMaterial.category,
          deficit: i.netRequirement,
          unit: i.rawMaterial.unit,
          cost: i.totalEstimatedCost,
          leadTime: i.rawMaterial.leadTimeDays,
          supplier: i.rawMaterial.supplierName,
        }));

      const topGarments = garments.map((g) => ({
        name: g.name,
        targetSales: g.targetSales,
        category: g.category,
      }));

      const response = await fetch('/api/gemini/analyze-demand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cycleMonths: cycleConfig.durationMonths,
          totalGarmentsTarget: mrpSummary.totalGarmentsPlanned,
          totalCostEstimate: mrpSummary.totalInvestmentUSD,
          criticalMaterialsCount: mrpSummary.criticalItemsCount,
          urgentMaterials: criticalMaterials,
          topGarments,
          materialCategoriesSummary: mrpSummary.categoryCostBreakdown,
          scrapRatePercent: cycleConfig.defaultScrapRatePercent,
          safetyStockDays: cycleConfig.safetyStockDaysDefault,
        }),
      });

      const data = await response.json();
      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
      } else {
        throw new Error(data.error || 'No se pudo generar el análisis');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Error de conexión con el servicio de IA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-[#E6E1D8] overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#3A5A40] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-[#E6E1D8]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">IA Asesor de Cadena Textil</h3>
                <span className="text-[10px] bg-white/20 text-white border border-white/30 px-2 py-0.5 rounded-full font-medium">
                  Gemini Flash
                </span>
              </div>
              <p className="text-[11px] text-white/80">
                Auditoría inteligente de abastecimiento, prevención de paradas y optimización de compras.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1 bg-[#FAF8F5]">
          {!analysis && !loading && (
            <div className="p-6 sm:p-8 text-center bg-white rounded-2xl border border-[#E6E1D8] space-y-4 max-w-lg mx-auto shadow-xs">
              <div className="w-14 h-14 rounded-full bg-[#EBF2EC] text-[#3A5A40] flex items-center justify-center mx-auto">
                <Sparkles className="w-7 h-7" />
              </div>
              <h4 className="text-sm sm:text-base font-bold text-[#1C211D]">
                Diagnóstico de Demanda & MRP con IA
              </h4>
              <p className="text-xs text-[#5F6B61] leading-relaxed">
                El modelo analizará sus {garments.length} líneas de confección, los {mrpSummary.items.length} insumos de fichas técnicas, los tiempos de entrega de proveedores y el presupuesto de compras para detectar cuellos de botella y oportunidades de optimización.
              </p>
              <button
                onClick={runAnalysis}
                className="px-6 py-2.5 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 flex items-center gap-2 mx-auto"
                id="btn-run-ai-diagnosis"
              >
                <Sparkles className="w-4 h-4 text-[#FAF8F5]" />
                Ejecutar Diagnóstico Estratégico
              </button>
            </div>
          )}

          {loading && (
            <div className="p-10 text-center space-y-4 bg-white rounded-2xl border border-[#E6E1D8] max-w-md mx-auto shadow-xs">
              <div className="w-10 h-10 rounded-full border-3 border-[#3A5A40] border-t-transparent animate-spin mx-auto" />
              <h4 className="text-xs sm:text-sm font-bold text-[#1C211D]">Analizando Datos de Demanda y Fichas Técnicas...</h4>
              <p className="text-[11px] text-[#5F6B61]">
                Calculando riesgos de abastecimiento de telas, lead times y consolidación de compras.
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-[#FDF2F0] border border-[#F8D4CF] rounded-xl text-[#B33927] text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <div>
                <strong className="block font-bold">Error al consultar IA:</strong>
                {error}
              </div>
            </div>
          )}

          {analysis && (
            <div className="space-y-4 sm:space-y-5 text-xs">
              {/* Executive Summary Card */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E6E1D8] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#5F6B61] uppercase tracking-wider">
                    Resumen Ejecutivo del Ciclo ({cycleConfig.durationMonths} Meses)
                  </span>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${
                      analysis.riskLevel === 'ALTO'
                        ? 'bg-[#FDF2F0] border-[#F8D4CF] text-[#B33927]'
                        : analysis.riskLevel === 'MEDIO'
                        ? 'bg-[#FCF6E8] border-[#F2DEB0] text-[#8A5016]'
                        : 'bg-[#EBF2EC] border-[#D4E3D7] text-[#233829]'
                    }`}
                  >
                    Riesgo: {analysis.riskLevel}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#1C211D] leading-relaxed font-medium">
                  {analysis.summary}
                </p>

                {analysis.bottleneckSummary && (
                  <div className="p-3 bg-[#FCF6E8] border border-[#F2DEB0] rounded-lg text-xs text-[#8A5016] font-medium">
                    <strong>Cuellos de Botella:</strong> {analysis.bottleneckSummary}
                  </div>
                )}
              </div>

              {/* Recommendations Grid */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-[#1C211D] uppercase tracking-wider">
                  Recomendaciones Accionables
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {analysis.recommendations?.map((rec, i) => {
                    const priorityBadges: Record<string, string> = {
                      Alta: 'bg-[#FDF2F0] text-[#B33927] border-[#F8D4CF]',
                      Media: 'bg-[#FCF6E8] text-[#8A5016] border-[#F2DEB0]',
                      Baja: 'bg-[#EBF2EC] text-[#233829] border-[#D4E3D7]',
                    };

                    return (
                      <div
                        key={i}
                        className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E6E1D8] shadow-xs flex flex-col justify-between space-y-2"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-[#1C211D]">{rec.title}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                priorityBadges[rec.priority] || 'bg-[#FAF8F5] text-[#5F6B61] border-[#E6E1D8]'
                              }`}
                            >
                              Prioridad {rec.priority}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#5F6B61] leading-relaxed">{rec.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Technical Strategy Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analysis.scrapOptimizationTip && (
                  <div className="bg-white border border-[#E6E1D8] p-3.5 sm:p-4 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#1C211D]">
                      <Scissors className="w-4 h-4 text-[#3A5A40]" />
                      Aprovechamiento de Tela & Tizado
                    </div>
                    <p className="text-[11px] text-[#5F6B61] leading-relaxed">
                      {analysis.scrapOptimizationTip}
                    </p>
                  </div>
                )}

                {analysis.supplierNegotiationTips && (
                  <div className="bg-white border border-[#E6E1D8] p-3.5 sm:p-4 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#1C211D]">
                      <DollarSign className="w-4 h-4 text-[#3A5A40]" />
                      Estrategia con Proveedores
                    </div>
                    <p className="text-[11px] text-[#5F6B61] leading-relaxed">
                      {analysis.supplierNegotiationTips}
                    </p>
                  </div>
                )}
              </div>

              {analysis.cashflowStrategy && (
                <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E6E1D8] shadow-xs text-xs text-[#5F6B61] space-y-1">
                  <strong className="block font-bold text-[#1C211D]">
                    Estrategia de Flujo de Caja:
                  </strong>
                  <p className="leading-relaxed text-[11px]">{analysis.cashflowStrategy}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-[#E6E1D8] bg-[#FCFBF9] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#5F6B61] hover:text-[#1C211D]"
          >
            Cerrar
          </button>

          {analysis && (
            <button
              onClick={runAnalysis}
              className="px-4 py-2 bg-[#3A5A40] hover:bg-[#2D4632] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Re-analizar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
