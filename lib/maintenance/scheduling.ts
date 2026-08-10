/**
 * Adds `intervalDays` to `fromDate` to compute the next maintenance date.
 * Dates are treated as calendar days (UTC) to avoid DST drift.
 */
export function calculateNextDate(fromDate: Date, intervalDays: number): Date {
  const next = new Date(
    Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate())
  );
  next.setUTCDate(next.getUTCDate() + intervalDays);
  return next;
}

/** Formats a Date as an ISO `YYYY-MM-DD` string for Postgres `date` columns. */
export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Number of days from today (UTC) that counts as "upcoming" on the dashboard. */
export const UPCOMING_WINDOW_DAYS = 7;

export function upcomingThresholdDateString(): string {
  const threshold = new Date();
  threshold.setUTCDate(threshold.getUTCDate() + UPCOMING_WINDOW_DAYS);
  return toDateString(threshold);
}

export function todayDateString(): string {
  return toDateString(new Date());
}
