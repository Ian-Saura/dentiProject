/**
 * Format number with Spanish locale (. for thousands, , for decimals)
 * Always shows exactly 2 decimal places
 */
export const formatCurrency = (value: number): string => {
  return value.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Format number with 2 decimals (for consistency across the app)
 */
export const formatNumber = (value: number): string => {
  return value.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};
