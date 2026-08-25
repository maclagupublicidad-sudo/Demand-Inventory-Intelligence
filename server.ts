import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Server-side Gemini AI Client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI Demand & Supply Intelligence Route
app.post("/api/gemini/analyze-demand", async (req, res) => {
  try {
    const {
      cycleMonths,
      totalGarmentsTarget,
      totalCostEstimate,
      criticalMaterialsCount,
      urgentMaterials,
      topGarments,
      materialCategoriesSummary,
      scrapRatePercent,
      safetyStockDays,
    } = req.body;

    const ai = getAIClient();

    if (!ai) {
      // Fallback deterministic smart insights if API key is not configured yet
      return res.json({
        success: true,
        isFallback: true,
        analysis: {
          summary: `Para el ciclo productivo de ${cycleMonths} meses con una meta de ${totalGarmentsTarget?.toLocaleString() || 0} prendas confeccionadas, se detectaron ${criticalMaterialsCount || 0} materias primas en nivel crítico o de reorden urgente.`,
          riskLevel: criticalMaterialsCount > 3 ? "ALTO" : criticalMaterialsCount > 0 ? "MEDIO" : "BAJO",
          recommendations: [
            {
              title: "Anticipar Orden de Telas Principales",
              description: `Los rollos de tejido principal presentan un lead time de 25-45 días. Emita las órdenes de compra en los primeros 7 días del ciclo para no frenar corte.`,
              priority: "Alta",
            },
            {
              title: "Control de Merma en Tizado",
              description: `La merma configurada es del ${scrapRatePercent || 5}%. Optimizar el software de tizado (nesting) al 88-92% de aprovechamiento puede ahorrar hasta un 2.5% de presupuesto en tela.`,
              priority: "Media",
            },
            {
              title: "Lote Mínimo de Insumos y Avíos",
              description: `Agrupe compras de botones, cremalleras e hilo 40/2 para alcanzar los MOQ de proveedores y reducir fletes de despacho.`,
              priority: "Media",
            },
            {
              title: `Buffer de Seguridad (${safetyStockDays || 15} días)`,
              description: `Mantener ${safetyStockDays || 15} días de stock de seguridad previene paradas de línea ante demoras aduaneras o de tintorería.`,
              priority: "Baja",
            },
          ],
          cashflowTip: `Presupuesto estimado de materias primas: $${Number(totalCostEstimate || 0).toLocaleString()}. Se sugiere negociar pago 40% anticipo y 60% contra entrega de telas.`,
        },
      });
    }

    const prompt = `
Eres un Director de Operaciones y Cadena de Suministro experto en la Industria de Confección Textil (Textile & Apparel Manufacturing Demand Planning & MRP).

Analiza los siguientes datos del plan de producción y cálculo de materias primas:
- Duración del Ciclo Productivo: ${cycleMonths} meses
- Meta Total de Producción de Prendas: ${totalGarmentsTarget} unidades
- Presupuesto Estimado de Compras: $${totalCostEstimate} USD
- Materias Primas en Estado Crítico / Reorden Urgente: ${criticalMaterialsCount} ítems
- Lista de Insumos Críticos: ${JSON.stringify(urgentMaterials || []).slice(0, 800)}
- Prendas Principales en Demanda: ${JSON.stringify(topGarments || []).slice(0, 600)}
- Resumen por Categoría de Materiales: ${JSON.stringify(materialCategoriesSummary || []).slice(0, 500)}
- Merma promedio de corte configurada: ${scrapRatePercent}%
- Días de Stock de Seguridad: ${safetyStockDays} días

Proporciona un diagnóstico estratégico y recomendaciones accionables en formato JSON estricto con las siguientes claves:
1. summary (resumen ejecutivo de 2 a 3 frases claras sobre la viabilidad del ciclo y puntos clave).
2. riskLevel ("ALTO", "MEDIO", o "BAJO").
3. bottleneckSummary (identificación precisa de cuellos de botella en telas, hilos o avíos).
4. recommendations (array de objetos con { "title": string, "description": string, "priority": "Alta" | "Media" | "Baja", "category": "Telas" | "Avíos" | "Corte & Costos" | "Planificación" }).
5. supplierNegotiationTips (1 consejo concreto para negociar con tejedurías o proveedores de insumos).
6. scrapOptimizationTip (1 consejo técnico sobre aprovechamiento de tela y tizado).
7. cashflowStrategy (estrategia de desembolsos en los meses del ciclo).
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        systemInstruction:
          "Eres un consultor senior en ingeniería textil, planificación de la demanda y MRP de confección. Responde siempre en español profesional, con terminología precisa de la confección textil (tizado, lead time, avíos, tejeduría, rollos, mermas, MOQ, fichas técnicas BOM).",
      },
    });

    const responseText = response.text || "{}";
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      parsedData = {
        summary: responseText,
        riskLevel: "MEDIO",
        recommendations: [],
      };
    }

    res.json({
      success: true,
      analysis: parsedData,
    });
  } catch (error: any) {
    console.error("Error in AI Demand Analysis:", error);
    res.status(500).json({
      success: false,
      error: error?.message || "Error al procesar el análisis de inteligencia de demanda.",
    });
  }
});

// Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TEXORA Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
