// Event dates are stored as plain "YYYY-MM-DD" strings with no time zone.
// new Date("YYYY-MM-DD") reads them as midnight UTC, which is the evening before
// in US time zones, so compare the strings against the local calendar date instead.

/** Today's date in the viewer's time zone, as "YYYY-MM-DD". */
export function todayLocal(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/** True if a "YYYY-MM-DD" date is today or later in the viewer's time zone. */
export function isTodayOrLater(dateStr?: string): boolean {
  return !!dateStr && dateStr >= todayLocal();
}
