/**
 * Convert nanosecond bigint timestamp to Date
 */
export function timeToDate(time: bigint): Date {
  return new Date(Number(time / 1_000_000n));
}

/**
 * Convert Date to nanosecond bigint timestamp
 */
export function dateToTime(date: Date): bigint {
  return BigInt(date.getTime()) * 1_000_000n;
}

/**
 * Convert current time to nanosecond bigint
 */
export function nowToTime(): bigint {
  return BigInt(Date.now()) * 1_000_000n;
}

/**
 * Format bigint time as locale date string
 */
export function formatDate(time: bigint): string {
  return timeToDate(time).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format number as currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date input string (YYYY-MM-DD) to bigint nanoseconds
 */
export function dateInputToTime(dateStr: string): bigint {
  const date = new Date(`${dateStr}T00:00:00`);
  return BigInt(date.getTime()) * 1_000_000n;
}

/**
 * Convert bigint time to date input string (YYYY-MM-DD)
 */
export function timeToDateInput(time: bigint): string {
  const d = timeToDate(time);
  return d.toISOString().split("T")[0];
}

/**
 * Generate a short invoice number from a UUID
 */
export function shortInvoiceId(id: string): string {
  return `INV-${id.slice(0, 8).toUpperCase()}`;
}
