import React, { useState } from 'react';
import { HelpCircle, Info } from 'lucide-react';

export const TECH_TERMS_GLOSSARY: Record<
  string,
  { term: string; meaning: string; formulaOrExample?: string; category: 'Textil' | 'Financiero' | 'Cadena' | 'Calidad' }
> = {
  moq: {
    term: 'MOQ (Minimum Order Quantity / Lote Mínimo)',
    meaning: 'Cantidad mínima que el proveedor exige comprar en una sola orden de compra.',
    formulaOrExample: 'Ejemplo: Si necesitas 14 kg pero el MOQ es 50 kg, se deben ordenar 50 kg.',
    category: 'Cadena',
  },
  lead_time: {
    term: 'Lead Time (Tiempo de Entrega)',
    meaning: 'Número de días promedio que tarda el proveedor en despuchar y entregar la materia prima desde la emisión de la orden.',
    formulaOrExample: 'Ejemplo: 15 días significa que la tela llega 15 días después de enviar la orden.',
    category: 'Cadena',
  },
  rendimiento: {
    term: 'Rendimiento / Equivalencia de Compra a Uso',
    meaning: 'Cantidad de producto útil (metros, piezas) que se obtiene de 1 unidad de compra.',
    formulaOrExample: 'Ejemplo: 1 kg de tela = 2.50 metros útiles; 10 kg de tela = 25.0 metros para cortar.',
    category: 'Textil',
  },
  consumo: {
    term: 'Consumo Unitario',
    meaning: 'Cantidad exacta de tela o insumo necesaria para confeccionar una (1) sola prenda.',
    formulaOrExample: 'Ejemplo: 1.35 metros de tela por camisa ejecutiva.',
    category: 'Textil',
  },
  merma: {
    term: 'Merma de Corte & Confección (Scrap)',
    meaning: 'Porcentaje de material desperdiciado inevitablemente durante el trazo, tendido, corte y pruebas de costura.',
    formulaOrExample: 'Fórmula: Requerimiento Efectivo = Consumo Base × (1 + % Merma / 100).',
    category: 'Textil',
  },
  stock_seguridad: {
    term: 'Stock de Seguridad (Buffer)',
    meaning: 'Inventario de reserva mantenido en bodega para proteger la producción ante retrasos del proveedor o picos de demanda.',
    formulaOrExample: 'Fórmula: Días de Reserva × Consumo Diario Promedio.',
    category: 'Cadena',
  },
  sam: {
    term: 'SAM (Standard Allowed Minutes)',
    meaning: 'Minutos estándar de ingeniería requeridos por los operarios para cortar, ensamblar y terminar una prenda.',
    formulaOrExample: 'Ejemplo: 22.5 min/prenda = En 8 horas de trabajo se confeccionan ~21 prendas por puesto.',
    category: 'Textil',
  },
  bom: {
    term: 'BOM (Bill of Materials / Ficha Técnica)',
    meaning: 'Receta detallada con la lista completa de telas, hilos, botones, cierres y empaques necesarios para armar la prenda.',
    formulaOrExample: 'Estructura: Insumo + Consumo Unitario + % Merma + Proveedor + Costo.',
    category: 'Textil',
  },
  mod: {
    term: 'MOD (Mano de Obra Directa)',
    meaning: 'Costo económico del tiempo de los operarios de corte, costura y acabados asignados a la confección de la prenda.',
    formulaOrExample: 'Fórmula: SAM Total (minutos) × Tarifa por Minuto de Planta (COP/min).',
    category: 'Financiero',
  },
  cif: {
    term: 'CIF (Costos Indirectos de Fabricación)',
    meaning: 'Gastos de planta no medibles por prenda: energía eléctrica, mantenimiento de máquinas, arriendo y supervisión.',
    formulaOrExample: 'Fórmula: Minutos SAM × Tarifa CIF por Minuto.',
    category: 'Financiero',
  },
  pvp: {
    term: 'PVP (Precio de Venta al Público)',
    meaning: 'Precio comercial final al que se vende la prenda en tienda o al cliente mayorista.',
    formulaOrExample: 'Ejemplo: $89,000 COP por camisa ejecutiva.',
    category: 'Financiero',
  },
  utilidad: {
    term: 'Utilidad y Margen Bruto',
    meaning: 'Ganancia neta que queda después de descontar el costo total de fabricación (telas + MOD + CIF).',
    formulaOrExample: 'Fórmula: Utilidad COP = PVP - Costo Total; Margen % = (Utilidad / PVP) × 100.',
    category: 'Financiero',
  },
  cobertura: {
    term: 'Días de Cobertura de Inventario',
    meaning: 'Días que la fábrica puede continuar confeccionando prendas con el stock actual antes de quedarse sin material.',
    formulaOrExample: 'Fórmula: Stock Disponible / Consumo Diario de la Línea.',
    category: 'Cadena',
  },
  wip: {
    term: 'WIP (Work In Process / En Proceso)',
    meaning: 'Unidades de prendas que ya fueron cortadas y están actualmente en confección en los talleres.',
    formulaOrExample: 'Descuenta del requerimiento neto de compra de tela nueva.',
    category: 'Textil',
  },
  pt: {
    term: 'PT (Producto Terminado)',
    meaning: 'Prendas 100% confeccionadas, planchadas y empacadas en bodega listas para entrega.',
    formulaOrExample: 'Disponible de inmediato para despacho sin requerir nueva producción.',
    category: 'Textil',
  },
  mrp: {
    term: 'MRP (Material Requirements Planning)',
    meaning: 'Cálculo automatizado de necesidades de materiales para cumplir con el plan de producción sin sobrestock ni faltantes.',
    formulaOrExample: 'Fórmula: Requerimiento Neto = Demanda + Stock Seguridad - Stock Disponible.',
    category: 'Cadena',
  },
};

interface TechTermTooltipProps {
  termKey: keyof typeof TECH_TERMS_GLOSSARY | string;
  children?: React.ReactNode;
  iconOnly?: boolean;
  className?: string;
}

export const TechTermTooltip: React.FC<TechTermTooltipProps> = ({
  termKey,
  children,
  iconOnly = false,
  className = '',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const normalizedKey = termKey.toLowerCase().replace(/[^a-z_]/g, '_');
  const termData = TECH_TERMS_GLOSSARY[normalizedKey] || {
    term: termKey,
    meaning: 'Término técnico de producción y costeo textil.',
    formulaOrExample: undefined,
    category: 'Textil' as const,
  };

  return (
    <span
      className={`relative inline-flex items-center gap-1 group cursor-help ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={(e) => {
        e.stopPropagation();
        setShowTooltip(!showTooltip);
      }}
    >
      {children}
      <span className="text-[#8F9990] hover:text-[#3A5A40] transition-colors">
        <Info className="w-3.5 h-3.5 inline-block opacity-75 group-hover:opacity-100" />
      </span>

      {showTooltip && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 sm:w-72 p-3 bg-[#1C211D] text-white text-[11px] rounded-xl shadow-xl border border-white/10 pointer-events-none animate-in fade-in zoom-in-95 duration-150"
          style={{ whiteSpace: 'normal' }}
        >
          <span className="block font-bold text-white mb-1 border-b border-white/15 pb-1">
            {termData.term}
          </span>
          <span className="block text-stone-300 leading-relaxed mb-1.5 font-normal">
            {termData.meaning}
          </span>
          {termData.formulaOrExample && (
            <span className="block text-[10px] bg-white/10 p-1.5 rounded-lg text-emerald-300 font-mono">
              💡 {termData.formulaOrExample}
            </span>
          )}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1C211D]" />
        </span>
      )}
    </span>
  );
};
