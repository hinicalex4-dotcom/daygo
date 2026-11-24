import { Airport, Flight } from "@/lib/types";
import { FlightProvider } from "./provider";
import { AIRPORTS, POPULAR_DESTINATIONS } from "@/lib/airports";

type DuffelSegment = {
  departing_at: string; arriving_at: string; marketing_carrier_flight_number?: string;
  marketing_carrier?: { name?: string }; operating_carrier?: { name?: string };
  origin?: { iata_code?: string }; destination?: { iata_code?: string };
};
type DuffelOffer = {
  id: string; total_amount: string; total_currency: string;
  slices?: Array<{ segments?: DuffelSegment[] }>;
};
type DuffelPayload = { data?: { live_mode?: boolean; offers?: DuffelOffer[] }; errors?: Array<{ message?: string }> };

/** One-way live offer search. The API key is read only on the server. */
export class DuffelProvider implements FlightProvider {
  readonly name = "Duffel";
  readonly isLive = true;
  private readonly token: string;
  constructor(token: string) { this.token = token; }

  async destinations(origin: string): Promise<Airport[]> {
    return AIRPORTS[origin] ? POPULAR_DESTINATIONS.map(code => AIRPORTS[code]).filter((a): a is Airport => !!a && a.iata !== origin) : [];
  }

  async searchOneWay(from: string, to: string, date: string): Promise<Flight[]> {
    const response = await fetch("https://api.duffel.com/air/offer_requests?return_offers=true&supplier_timeout=8000", {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(12000),
      headers: {
        Authorization: `Bearer ${this.token}`, "Duffel-Version": "v2",
        Accept: "application/json", "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: {
        slices: [{ origin: from, destination: to, departure_date: date }],
        passengers: [{ type: "adult" }], cabin_class: "economy", max_connections: 2,
      } }),
    });
    const payload = await response.json() as DuffelPayload;
    if (!response.ok) throw new Error(`Duffel ${response.status}: ${payload.errors?.[0]?.message ?? "Anfrage fehlgeschlagen"}`);
    const live = payload.data?.live_mode === true;
    const now = new Date().toISOString();
    return (payload.data?.offers ?? []).flatMap(offer => {
      const segments = offer.slices?.[0]?.segments ?? [];
      if (!segments.length) return [];
      const first = segments[0], last = segments[segments.length - 1];
      const price = Number(offer.total_amount);
      if (!Number.isFinite(price)) return [];
      return [{
        id: offer.id, provider: this.name,
        airline: first.operating_carrier?.name ?? first.marketing_carrier?.name ?? this.name,
        flightNo: segments.map(s => s.marketing_carrier_flight_number ?? "").filter(Boolean).join(" / "),
        from: first.origin?.iata_code ?? from, to: last.destination?.iata_code ?? to,
        depUtc: new Date(first.departing_at).toISOString(), arrUtc: new Date(last.arriving_at).toISOString(),
        price, currency: offer.total_currency, stops: segments.length - 1,
        fetchedAt: now, source: live ? "live" as const : "test" as const,
      }];
    });
  }
}
