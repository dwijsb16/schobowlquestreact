// Season helpers: a season runs from Labor Day (first Monday of September)
// through the day before the next Labor Day, e.g. "2025-2026".

/** Labor Day (first Monday of September) for the given year, as a local Date. */
export function laborDay(year: number): Date {
  const sept1 = new Date(year, 8, 1);
  const offset = (8 - sept1.getDay()) % 7; // days until Monday (getDay: 0=Sun, 1=Mon)
  return new Date(year, 8, 1 + offset);
}

/** Parse "YYYY-MM-DD" as a local date (avoids the UTC shift of Date.parse). */
function parseLocalDate(dateStr: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr || "");
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Starting year of the season a date falls in. */
export function seasonStartYear(date: Date): number {
  const y = date.getFullYear();
  return date >= laborDay(y) ? y : y - 1;
}

export function seasonLabel(startYear: number): string {
  return `${startYear}-${startYear + 1}`;
}

/** Season label for a "YYYY-MM-DD" date string, or "No Date" if missing/invalid. */
export function seasonForDate(dateStr?: string): string {
  const d = parseLocalDate(dateStr || "");
  return d ? seasonLabel(seasonStartYear(d)) : "No Date";
}

/** Season label for today. */
export function currentSeason(): string {
  return seasonLabel(seasonStartYear(new Date()));
}

/** Sort comparator for season labels, newest season first ("No Date" last). */
export function compareSeasonsDesc(a: string, b: string): number {
  if (a === b) return 0;
  if (a === "No Date") return 1;
  if (b === "No Date") return -1;
  return b.localeCompare(a);
}
