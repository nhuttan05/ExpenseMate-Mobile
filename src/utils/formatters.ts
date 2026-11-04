/**
 * Format currency number to Vietnamese Dong format (e.g. 124.500.000 đ)
 */
export const formatCurrency = (amount: number, showSymbol = true): string => {
  const formatted = Math.abs(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return showSymbol ? `${formatted} đ` : formatted;
};

/**
 * Format date string to Vietnamese friendly display (e.g. "Hôm nay, 14:30" or "24/10/2026")
 */
export const formatDate = (dateString: string): string => {
  try {
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
};
