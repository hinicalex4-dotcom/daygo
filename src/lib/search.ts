import { FlightProvider } from "@/providers/provider";
import { Airport, DestinationResult, MatchOptions } from "./types";
import { cheapestPerFlight, matchSameDay } from "./matcher";
import { daygoScore } from "./score";
import { AIRPORTS } from "./airports";

const settle = async <T>(ps: Promise<T[]>[]) =>
  (await Promise.allSettled(ps)).flatMap(r => (r.status === "fulfilled" ? r.value : []));

export async function searchDay(providers: FlightProvider[], origin: Airport, date: string,
  opts: Partial<MatchOptions> = {}, destinationCodes?: string[]): Promise<DestinationResult[]> {
  const dests = new Map<string, Airport>();
  if (destinationCodes !== undefined) for (const code of destinationCodes) { const a = AIRPORTS[code]; if (a && a.iata !== origin.iata) dests.set(a.iata, a); }
  else for (const a of await settle(providers.map(p => p.destinations(origin.iata)))) dests.set(a.iata, a);
  const out: DestinationResult[] = [];
  await Promise.all([...dests.values()].map(async dest => {
    const [outs, ins] = await Promise.all([
      settle(providers.map(p => p.searchOneWay(origin.iata, dest.iata, date))),
      settle(providers.map(p => p.searchOneWay(dest.iata, origin.iata, date))),
    ]);
    const trips = matchSameDay(cheapestPerFlight(outs), cheapestPerFlight(ins), origin, dest, opts);
    if (!trips.length) return;
    out.push({ origin, dest, date, best: trips[0], alternatives: trips.slice(1, 4), score: daygoScore(trips[0]) });
  }));
  return out.sort((a, b) => a.best.total - b.best.total);
}

/** Flexible Suche: mehrere Tage, begrenzte Parallelität (Rate-Limits schonen). */
export async function searchRange(providers: FlightProvider[], origin: Airport, from: string, days: number,
  opts: Partial<MatchOptions> = {}, maxPrice = Infinity, concurrency = 4, destinationCodes?: string[]) {
  const dates = Array.from({ length: days }, (_, i) => new Date(Date.parse(from) + i * 864e5).toISOString().slice(0, 10));
  const res: DestinationResult[] = [];
  for (let i = 0; i < dates.length; i += concurrency)
    res.push(...(await Promise.all(dates.slice(i, i + concurrency).map(d => searchDay(providers, origin, d, opts, destinationCodes)))).flat());
  return res.filter(r => r.best.total <= maxPrice && (!opts.weekdays?.length || opts.weekdays.includes(new Date(`${r.date}T12:00:00Z`).getUTCDay())))
    .sort((a, b) => a.best.total - b.best.total);
}
