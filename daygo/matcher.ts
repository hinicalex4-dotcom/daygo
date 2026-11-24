import { Airport, Flight, MatchOptions, Trip, DEFAULT_OPTS } from "./types";
import { localParts } from "./tz";

const rank = { live: 0, cached: 1, test: 2, demo: 3 } as const;
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Kombiniert Hin- und Rückflüge unabhängig voneinander (auch über Anbietergrenzen)
 * und liefert nur Kombinationen, die am selben Kalendertag zum Heimatflughafen zurückführen.
 */
export function matchSameDay(outs: Flight[], ins: Flight[], home: Airport, dest: Airport,
  o: Partial<MatchOptions> = {}): Trip[] {
  const opt = { ...DEFAULT_OPTS, ...o };
  const trips: Trip[] = [];
  for (const out of outs) {
    if (out.from !== home.iata || out.to !== dest.iata) continue;
    if (opt.directOnly && out.stops > 0) continue;
    const dep = localParts(out.depUtc, home.tz);
    if (dep.minutes < opt.outWindow[0] || dep.minutes > opt.outWindow[1]) continue;
    for (const inn of ins) {
      if (inn.from !== dest.iata || inn.to !== home.iata) continue;
      if (opt.directOnly && inn.stops > 0) continue;
      if (inn.currency !== out.currency) continue; // Währungen vorher konvertieren
      const rDep = localParts(inn.depUtc, dest.tz);
      if (rDep.minutes < opt.retWindow[0] || rDep.minutes > opt.retWindow[1]) continue;
      // Kernregel: Landung zuhause am SELBEN Kalendertag (lokal) wie der Abflug.
      if (localParts(inn.arrUtc, home.tz).date !== dep.date) continue;
      const gap = (Date.parse(inn.depUtc) - Date.parse(out.arrUtc)) / 60000;
      const usable = gap - opt.transferInMin - opt.transferOutMin;
      if (usable <= 0) continue;
      trips.push({
        outbound: out, inbound: inn, total: round2(out.price + inn.price), currency: out.currency,
        usableMinutes: Math.round(usable),
        travelMinutes: Math.round((Date.parse(out.arrUtc) - Date.parse(out.depUtc)
          + Date.parse(inn.arrUtc) - Date.parse(inn.depUtc)) / 60000),
        separateTickets: true, // bis Round-Trip-Angebote integriert sind, immer getrennte Tickets
        source: rank[out.source] >= rank[inn.source] ? out.source : inn.source,
      });
    }
  }
  return trips.sort((a, b) => a.total - b.total);
}

/** Gleicher Flug bei mehreren Anbietern: nur das günstigste Angebot behalten. */
export function cheapestPerFlight(flights: Flight[]): Flight[] {
  const m = new Map<string, Flight>();
  for (const f of flights) {
    const k = `${f.flightNo}|${f.depUtc}`;
    const c = m.get(k);
    if (!c || f.price < c.price) m.set(k, f);
  }
  return [...m.values()];
}
