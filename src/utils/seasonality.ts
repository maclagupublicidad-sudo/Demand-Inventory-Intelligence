import { Garment } from '../types';

export type SeasonType = 'general' | 'primavera_verano' | 'otono_invierno' | 'navidad_findeano' | 'escolar';

export interface SeasonInfo {
  id: SeasonType;
  name: string;
  badge: string;
  description: string;
  categoryMultipliers: Record<string, number>;
  defaultMultiplier: number;
}

export const SEASONS_CONFIG: Record<SeasonType, SeasonInfo> = {
  general: {
    id: 'general',
    name: 'Línea Continua / Estándar',
    badge: '1.0x Base',
    description: 'Demanda regular balanceada para prendas de catálogo permanente todo el año.',
    categoryMultipliers: {
      'Camisería': 1.0,
      'Pantalonería / Denim': 1.0,
      'Tejido de Punto': 1.0,
      'Vestidos & Faldas': 1.0,
      'Chaquetería': 1.0,
      'Sport / Ropa Deportiva': 1.0,
    },
    defaultMultiplier: 1.0,
  },
  primavera_verano: {
    id: 'primavera_verano',
    name: 'Primavera - Verano',
    badge: '☀️ Verano (+30%)',
    description: 'Pico en tejidos livianos, t-shirts, poleras, camisería de lino y vestidos.',
    categoryMultipliers: {
      'Camisería': 1.25,
      'Pantalonería / Denim': 0.95,
      'Tejido de Punto': 1.40,
      'Vestidos & Faldas': 1.45,
      'Chaquetería': 0.60,
      'Sport / Ropa Deportiva': 1.25,
    },
    defaultMultiplier: 1.20,
  },
  otono_invierno: {
    id: 'otono_invierno',
    name: 'Otoño - Invierno',
    badge: '❄️ Invierno (+35%)',
    description: 'Pico en chaquetería, abrigos, denim pesado, drill y líneas térmicas.',
    categoryMultipliers: {
      'Camisería': 0.90,
      'Pantalonería / Denim': 1.25,
      'Tejido de Punto': 1.10,
      'Vestidos & Faldas': 0.70,
      'Chaquetería': 1.65,
      'Sport / Ropa Deportiva': 1.05,
    },
    defaultMultiplier: 1.15,
  },
  navidad_findeano: {
    id: 'navidad_findeano',
    name: 'Fin de Año & Navidad (Alta)',
    badge: '🎁 Temporada Alta (+40%)',
    description: 'Máximo pico comercial de compras navideñas y festividades en todas las líneas.',
    categoryMultipliers: {
      'Camisería': 1.45,
      'Pantalonería / Denim': 1.40,
      'Tejido de Punto': 1.35,
      'Vestidos & Faldas': 1.50,
      'Chaquetería': 1.30,
      'Sport / Ropa Deportiva': 1.30,
    },
    defaultMultiplier: 1.40,
  },
  escolar: {
    id: 'escolar',
    name: 'Temporada Escolar & Dotaciones',
    badge: '🎒 Escolar (+30%)',
    description: 'Incremento focalizado en camisería institucional, polos de piqué y pantalones.',
    categoryMultipliers: {
      'Camisería': 1.45,
      'Pantalonería / Denim': 1.30,
      'Tejido de Punto': 1.40,
      'Vestidos & Faldas': 0.85,
      'Chaquetería': 1.15,
      'Sport / Ropa Deportiva': 1.35,
    },
    defaultMultiplier: 1.25,
  },
};

export function getCategorySeasonMultiplier(category: string, season: SeasonType = 'general'): number {
  const cfg = SEASONS_CONFIG[season] || SEASONS_CONFIG.general;
  return cfg.categoryMultipliers[category] || cfg.defaultMultiplier;
}

export function computeGarmentProjectedDemand(
  garment: Garment,
  durationMonths: number,
  season: SeasonType = 'general',
  growthRatePercent: number = 5
): number {
  const categoryMult = getCategorySeasonMultiplier(garment.category, season);
  const growthMult = 1 + (growthRatePercent || 0) / 100;
  
  // Base monthly demand: use historicalMonthlyAverage if available, else derive from previous target
  const monthlyBase = garment.historicalMonthlyAverage > 0
    ? garment.historicalMonthlyAverage
    : Math.max(10, Math.round(garment.targetSales / Math.max(1, durationMonths)));

  return Math.max(10, Math.round(monthlyBase * Math.max(1, durationMonths) * categoryMult * growthMult));
}
