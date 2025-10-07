/**
 * Format number with Spanish locale (. for thousands, , for decimals)
 */
export const formatCurrency = (value: number, decimals: number = 2): string => {
  return value.toLocaleString('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * Format number without decimals
 */
export const formatNumber = (value: number): string => {
  return value.toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};
