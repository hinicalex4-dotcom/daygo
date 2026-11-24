const fmt = new Map<string, Intl.DateTimeFormat>();
function f(tz: string) {
  if (!fmt.has(tz)) fmt.set(tz, new Intl.DateTimeFormat("en-CA", { timeZone: tz, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }));
  return fmt.get(tz)!;
}
/** Lokales Datum (YYYY-MM-DD), Minuten seit Mitternacht und "Wandzeit" als UTC-ms. */
export function localParts(iso: string, tz: string) {
  const p = Object.fromEntries(f(tz).formatToParts(new Date(iso)).map(x => [x.type, x.value]));
  const date = `${p.year}-${p.month}-${p.day}`;
  const minutes = +p.hour * 60 + +p.minute;
  const wall = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
  return { date, minutes, wall };
}
/** Lokale Zeit in einer Zeitzone -> UTC-ISO. */
export function localToUtc(date: string, minutes: number, tz: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d, 0, minutes);
  const offset = localParts(new Date(guess).toISOString(), tz).wall - guess;
  return new Date(guess - offset).toISOString();
}
