import { Airport, Flight } from "@/lib/types";
import { localToUtc } from "@/lib/tz";
import { FlightProvider } from "./provider";

export const AIRPORTS: Record<string, Airport> = {
  MAD: { iata: "MAD", city: "Madrid", country: "Spanien", tz: "Europe/Madrid" },
  LIS: { iata: "LIS", city: "Lissabon", country: "Portugal", tz: "Europe/Lisbon" },
  OPO: { iata: "OPO", city: "Porto", country: "Portugal", tz: "Europe/Lisbon" },
  CDG: { iata: "CDG", city: "Paris", country: "Frankreich", tz: "Europe/Paris" },
  MXP: { iata: "MXP", city: "Mailand", country: "Italien", tz: "Europe/Rome" },
  FCO: { iata: "FCO", city: "Rom", country: "Italien", tz: "Europe/Rome" },
  LHR: { iata: "LHR", city: "London", country: "Großbritannien", tz: "Europe/London" },
  RAK: { iata: "RAK", city: "Marrakesch", country: "Marokko", tz: "Africa/Casablanca" },
};
const BLOCK: Record<string, number> = { LIS: 75, OPO: 80, CDG: 125, MXP: 130, FCO: 145, LHR: 150, RAK: 115 };
const rnd = (s: number) => { const x = Math.sin(s * 9301 + 49297) * 233280; return x - Math.floor(x); };
const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 1e6, 7);

/** Deterministische DEMO-Flüge nur ab/nach MAD. Keine echten Angebote. */
export class DemoProvider implements FlightProvider {
  readonly name = "demo"; readonly isLive = false;
  async destinations(origin: string) {
    return origin === "MAD" ? Object.values(AIRPORTS).filter(a => a.iata !== "MAD") : [];
  }
  async searchOneWay(from: string, to: string, date: string): Promise<Flight[]> {
    const outbound = from === "MAD", dest = outbound ? to : from;
    if (!BLOCK[dest] || (!outbound && to !== "MAD")) return [];
    const seed = hash(`${from}${to}${date}`);
    const slots = outbound ? [390, 450, 510, 570] : [1080, 1170, 1260, 1350];
    return slots.map((m, i) => {
      const dep = localToUtc(date, m, AIRPORTS[from].tz), r = rnd(seed + i);
      const stops = r > .8 ? 1 : 0, dur = BLOCK[dest] + stops * 70;
      return { id: `demo-${from}${to}-${date}-${i}`, provider: "demo", airline: ["Demo Air", "Sample Jet"][i % 2],
        flightNo: `DG${100 + (seed + i) % 900}`, from, to, depUtc: dep,
        arrUtc: new Date(Date.parse(dep) + dur * 60000).toISOString(),
        price: Math.round(18 + r * 55 + BLOCK[dest] / 8), currency: "EUR", stops,
        fetchedAt: new Date().toISOString(), source: "demo" as const };
    });
  }
}
