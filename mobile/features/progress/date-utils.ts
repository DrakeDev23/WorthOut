
export type DayKey = string;

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function dayKeyFromDate(date: Date): DayKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local `YYYY-MM-DD` key for an ISO timestamp (parsed into local time). */
export function dayKeyFromISO(iso: string): DayKey {
  return dayKeyFromDate(new Date(iso));
}

/** Midnight (local) at the start of the given date. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Whole-day difference `a - b` using local midnights (positive if a is later). */
export function dayDiff(a: Date, b: Date): number {
  const ms = startOfDay(a).getTime() - startOfDay(b).getTime();
  return Math.round(ms / 86_400_000);
}

export function sameDay(a: Date, b: Date): boolean {
  return dayKeyFromDate(a) === dayKeyFromDate(b);
}

export function addDays(date: Date, days: number): Date {
  const next = startOfDay(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

/**
 * Monday-based start of the week containing `date` (local midnight).
 * JS `getDay()` is 0=Sun..6=Sat; we shift so Monday is index 0.
 */
export function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const mondayIndex = (d.getDay() + 6) % 7;
  return addDays(d, -mondayIndex);
}

/** Index (0=Mon..6=Sun) of a date within a Monday-based week. */
export function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export function monthLabel(date: Date): string {
  return `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`;
}
