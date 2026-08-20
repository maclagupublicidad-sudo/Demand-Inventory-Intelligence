import { Garment } from '../types';

export type SeasonType =
  | 'general'
  | 'inicio_ano_escolar'
  | 'dia_mujer'
  | 'dia_madre'
  | 'dia_padre'
  | 'amor_amistad'
  | 'fin_de_ano';

export interface SeasonInfo {
  id: SeasonType;
  name: string;
  badge: string;
  dates: string;
  description: string;
  categoryMultipliers: Record<string, number>;
  defaultMultiplier: number;
}

export const SEASONS_CONFIG: Record<SeasonType, SeasonInfo> = {
  general: {
    id: 'general',
    name: 'Línea Continua / Todo el Año',
    badge: '1.0x Regular',
    dates: 'Catálogo Anual Permanente',
    description: 'Demanda regular balanceada para prendas de reposición continua sin picos estacionales.',
    categoryMultipliers: {
      'Camisería': 1.0,
      'Pantalonería / Denim': 1.0,
      'Tejido de Punto': 1.0,
      'Vestidos & Faldas': 1.0,
      'Chaquetería': 1.0,
      'Sport / Ropa Deportiva': 1.0,
      'Pantalonería / Sport': 1.0,
    },
    defaultMultiplier: 1.0,
  },
  inicio_ano_escolar: {
    id: 'inicio_ano_escolar',
    name: 'Inicio de Año / Temporada Escolar',
    badge: '🎒 Escolar (+35%)',
    dates: 'Enero - Febrero (Regreso a Clases & Dotaciones)',
    description: 'Pico en dotaciones escolares y corporativas: camisería básica blanca y celeste, pantalones de dril, jeans y sudaderas.',
    categoryMultipliers: {
      'Camisería': 1.55,
      'Pantalonería / Denim': 1.40,
      'Tejido de Punto': 1.45,
      'Vestidos & Faldas': 0.85,
      'Chaquetería': 1.20,
      'Sport / Ropa Deportiva': 1.45,
      'Pantalonería / Sport': 1.45,
    },
    defaultMultiplier: 1.30,
  },
  dia_mujer: {
    id: 'dia_mujer',
    name: 'Día Internacional de la Mujer',
    badge: '🌸 Día de la Mujer (+25%)',
    dates: 'Marzo (8 de Marzo & Mes de la Mujer)',
    description: 'Auge en moda femenina: vestidos camiseros, blusas en lino, tops en tejido de punto y prendas de siluetas fluidas.',
    categoryMultipliers: {
      'Camisería': 1.30,
      'Pantalonería / Denim': 1.10,
      'Tejido de Punto': 1.25,
      'Vestidos & Faldas': 1.60,
      'Chaquetería': 1.10,
      'Sport / Ropa Deportiva': 1.15,
      'Pantalonería / Sport': 1.05,
    },
    defaultMultiplier: 1.25,
  },
  dia_madre: {
    id: 'dia_madre',
    name: 'Día de la Madre',
    badge: '💐 Día de la Madre (+45%)',
    dates: 'Mayo (Segundo Domingo de Mayo)',
    description: 'Pico cumbre del primer semestre comercial en Colombia: vestidos premium, conjuntos elegantes, blusas y lino.',
    categoryMultipliers: {
      'Camisería': 1.40,
      'Pantalonería / Denim': 1.30,
      'Tejido de Punto': 1.35,
      'Vestidos & Faldas': 1.75,
      'Chaquetería': 1.30,
      'Sport / Ropa Deportiva': 1.15,
      'Pantalonería / Sport': 1.15,
    },
    defaultMultiplier: 1.40,
  },
  dia_padre: {
    id: 'dia_padre',
    name: 'Día del Padre',
    badge: '👔 Día del Padre (+40%)',
    dates: 'Junio (Tercer Domingo de Junio)',
    description: 'Pico comercial masculino: camisas Oxford clásicas, polos de piqué pima, jeans slim fit, bermudas y chaquetas bomber.',
    categoryMultipliers: {
      'Camisería': 1.65,
      'Pantalonería / Denim': 1.50,
      'Tejido de Punto': 1.55,
      'Vestidos & Faldas': 0.70,
      'Chaquetería': 1.45,
      'Sport / Ropa Deportiva': 1.35,
      'Pantalonería / Sport': 1.40,
    },
    defaultMultiplier: 1.35,
  },
  amor_amistad: {
    id: 'amor_amistad',
    name: 'Amor y Amistad',
    badge: '❤️ Amor y Amistad (+30%)',
    dates: 'Septiembre (Tercer Sábado de Septiembre)',
    description: 'Temporada de regalos y moda casual: t-shirts estampadas, joggings urbanos, vestidos juveniles y camisas casuales.',
    categoryMultipliers: {
      'Camisería': 1.25,
      'Pantalonería / Denim': 1.30,
      'Tejido de Punto': 1.40,
      'Vestidos & Faldas': 1.40,
      'Chaquetería': 1.20,
      'Sport / Ropa Deportiva': 1.30,
      'Pantalonería / Sport': 1.35,
    },
    defaultMultiplier: 1.30,
  },
  fin_de_ano: {
    id: 'fin_de_ano',
    name: 'Fin de Año & Temporada Navideña',
    badge: '🎄 Fin de Año (+50%)',
    dates: 'Noviembre - Diciembre (Primas, Aguinaldos & Año Nuevo)',
    description: 'Temporada cumbre anual de la industria textil en Colombia: alta demanda transversal en todas las líneas de fiesta y retail.',
    categoryMultipliers: {
      'Camisería': 1.60,
      'Pantalonería / Denim': 1.55,
      'Tejido de Punto': 1.50,
      'Vestidos & Faldas': 1.70,
      'Chaquetería': 1.45,
      'Sport / Ropa Deportiva': 1.35,
      'Pantalonería / Sport': 1.40,
    },
    defaultMultiplier: 1.50,
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
