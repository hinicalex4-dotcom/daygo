export type DataSource = "live" | "cached" | "test" | "demo";
export interface Airport { iata: string; city: string; country: string; tz: string; lat?: number; lon?: number; name?: string }
export interface Flight {
  id: string; provider: string; airline: string; flightNo: string;
  from: string; to: string; depUtc: string; arrUtc: string; // ISO, UTC
  price: number; currency: string; stops: number;
  bookingUrl?: string; fetchedAt: string; source: DataSource;
}
export interface MatchOptions {
  outWindow: [number, number];   // Minuten ab 00:00 lokal am Heimatflughafen
  retWindow: [number, number];   // Minuten ab 00:00 lokal am Zielflughafen
  transferInMin: number;         // Ankunft + Transfer in die Stadt
  transferOutMin: number;        // Rückweg + Check-in/Security-Puffer
  directOnly: boolean;
  weekdays?: number[]; // 0=Sonntag … 6=Samstag, bezogen auf Abflugdatum
}
export const DEFAULT_OPTS: MatchOptions = {
  outWindow: [360, 600], retWindow: [1080, 1439],
  transferInMin: 50, transferOutMin: 110, directOnly: false,
};
export interface Trip {
  outbound: Flight; inbound: Flight; total: number; currency: string;
  usableMinutes: number; travelMinutes: number;
  separateTickets: boolean; // getrennte Tickets => Risiko kommunizieren
  source: DataSource;       // schlechtester Wert beider Flüge
}
export interface DestinationResult { origin: Airport; dest: Airport; date: string; best: Trip; alternatives: Trip[]; score: number }
