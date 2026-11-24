import { Airport, Flight } from "@/lib/types";
import { localToUtc } from "@/lib/tz";
import { FlightProvider } from "./provider";
import { AIRPORTS } from "@/lib/airports";

export { AIRPORTS };

const BLOCK: Record<string, number> = { MAD: 0, BCN: 70, AGP: 65, VLC: 55, LIS: 75, OPO: 80, CDG: 125, MXP: 130, FCO: 145, LHR: 150, RAK: 115 };
const rnd = (s: number) => { const x = Math.sin(s * 9301 + 49297) * 233280; return x - Math.floor(x); };
const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 1e6, 7);

/** Deterministische DEMO-Flüge. Keine echten Angebote oder buchbaren Preise. */
export class DemoProvider implements FlightProvider {
  readonly name = "demo"; readonly isLive = false;
  async destinations(origin: string) {
    return BLOCK[origin] !== undefined ? Object.keys(BLOCK).map(code => AIRPORTS[code]).filter((a): a is Airport => !!a && a.iata !== origin) : [];
  }
  async searchOneWay(from: string, to: string, date: string): Promise<Flight[]> {
    const dest = to;
    if (!AIRPORTS[from] || !AIRPORTS[to] || from === to || BLOCK[from] === undefined || BLOCK[to] === undefined) return [];
    const seed = hash(`${from}${to}${date}`);
    // Synthetic schedules include both morning and evening departures in either direction.
    const slots = [390, 450, 510, 570, 1080, 1170, 1260, 1350];
    return slots.map((m, i) => {
      const dep = localToUtc(date, m, AIRPORTS[from].tz), r = rnd(seed + i);
      const stops = r > .8 ? 1 : 0, dur = (BLOCK[dest] || 90) + stops * 70;
      return { id: `demo-${from}${to}-${date}-${i}`, provider: "demo", airline: ["Demo Air", "Sample Jet"][i % 2],
        flightNo: `DG${100 + (seed + i) % 900}`, from, to, depUtc: dep,
        arrUtc: new Date(Date.parse(dep) + dur * 60000).toISOString(),
        price: Math.round(18 + r * 55 + (BLOCK[dest] ?? 90) / 8), currency: "EUR", stops,
        fetchedAt: new Date().toISOString(), source: "demo" as const };
    });
  }
}
