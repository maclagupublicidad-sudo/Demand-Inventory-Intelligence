import React, { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Shield,
  Layers,
  Scissors,
  RefreshCw,
  X,
  Send,
  Lightbulb,
} from 'lucide-react';
import { AIAnalysisResponse, MRPResultItem, ProductionCycleConfig, Garment } from '../types';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">IA Asesor de Cadena de Suministro Textil</h3>
                <span className="text-[10px] bg-purple-500/30 text-purple-200 border border-purple-400/40 px-2 py-0.5 rounded-full font-medium">
                  Gemini 3.7 Flash
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Auditoría inteligente de abastecimiento, prevención de paradas de corte y optimización de compras.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-slate-50/50">
          {!analysis && !loading && (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-4 max-w-lg mx-auto shadow-xs">
              <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-indigo-600" />
              </div>
              <h4 className="text-base font-bold text-slate-900">
                Diagnóstico de Demanda & MRP con IA
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                El modelo analizará sus {garments.length} líneas de confección, los {mrpSummary.items.length} insumos de fichas técnicas, los tiempos de entrega de tejedurías y el presupuesto de compras para detectar cuellos de botella y ahorros en mermas.
              </p>
              <button
                onClick={runAnalysis}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all hover:scale-102 flex items-center gap-2 mx-auto"
                id="btn-run-ai-diagnosis"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                Ejecutar Diagnóstico Estratégico
              </button>
            </div>
          )}

          {loading && (
            <div className="p-12 text-center space-y-4 bg-white rounded-2xl border border-slate-200 max-w-md mx-auto shadow-xs">
              <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">Analizando Datos de Demanda y Fichas Técnicas...</h4>
              <p className="text-xs text-slate-500">
                Calculando riesgos de abastecimiento de telas, lead times y opciones de consolidación de órdenes.
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <strong className="block font-bold">Error al consultar IA:</strong>
                {error}
              </div>
            </div>
          )}

          {analysis && (
            <div className="space-y-6">
              {/* Executive Summary Card */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Resumen Ejecutivo del Ciclo ({cycleConfig.durationMonths} Meses)
                  </span>
                  <span
                    className={`text-xs font-black px-3 py-1 rounded-full border ${
                      analysis.riskLevel === 'ALTO'
                        ? 'bg-rose-100 border-rose-300 text-rose-800'
                        : analysis.riskLevel === 'MEDIO'
                        ? 'bg-amber-100 border-amber-300 text-amber-800'
                        : 'bg-emerald-100 border-emerald-300 text-emerald-800'
                    }`}
                  >
                    Nivel de Riesgo: {analysis.riskLevel}
                  </span>
                </div>
                <p className="text-sm text-slate-800 leading-relaxed font-medium">
                  {analysis.summary}
                </p>

                {analysis.bottleneckSummary && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900 font-medium">
                    <strong>Cuellos de Botella Detectados:</strong> {analysis.bottleneckSummary}
                  </div>
                )}
              </div>

              {/* Recommendations Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Recomendaciones Accionables de Producción & Compras
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis.recommendations?.map((rec, i) => {
                    const priorityBadges: Record<string, string> = {
                      Alta: 'bg-rose-100 text-rose-800',
                      Media: 'bg-amber-100 text-amber-800',
                      Baja: 'bg-blue-100 text-blue-800',
                    };

                    return (
                      <div
                        key={i}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-2"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-slate-900">{rec.title}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                priorityBadges[rec.priority] || 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              Prioridad {rec.priority}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{rec.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Technical Strategy Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.scrapOptimizationTip && (
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-200 p-4 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                      <Scissors className="w-4 h-4 text-indigo-600" />
                      Aprovechamiento de Tela & Tizado
                    </div>
                    <p className="text-xs text-indigo-800 leading-relaxed font-medium">
                      {analysis.scrapOptimizationTip}
                    </p>
                  </div>
                )}

                {analysis.supplierNegotiationTips && (
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-4 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      Estrategia de Negociación con Tejedurías
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                      {analysis.supplierNegotiationTips}
                    </p>
                  </div>
                )}
              </div>

              {analysis.cashflowStrategy && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-xs text-slate-700 space-y-1">
                  <strong className="block font-bold text-slate-900">
                    Estrategia de Flujo de Caja para Compras:
                  </strong>
                  <p className="leading-relaxed">{analysis.cashflowStrategy}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Cerrar
          </button>

          {analysis && (
            <button
              onClick={runAnalysis}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
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
