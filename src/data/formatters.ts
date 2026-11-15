/**
 * Formats a numeric price into the specified "Rs 30" style.
 */
export function formatRupees(amount: number): string {
  return `Rs ${Math.round(amount)}`;
}
