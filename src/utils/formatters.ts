/**
 * Currency and numbers formatting utilities for Colombian Pesos (COP)
 */

export const formatCOP = (amount: number, showCode: boolean = true): string => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return showCode ? '$ 0 COP' : '$ 0';
  }
  
  // Format with Colombian thousands separator (dot: 1.250.000)
  const formattedNumber = Math.round(amount).toLocaleString('es-CO');
  return showCode ? `$ ${formattedNumber} COP` : `$ ${formattedNumber}`;
};

export const formatNumber = (num: number, maxDecimals: number = 1): string => {
  if (isNaN(num) || num === null || num === undefined) return '0';
  return num.toLocaleString('es-CO', {
    maximumFractionDigits: maxDecimals,
  });
};
