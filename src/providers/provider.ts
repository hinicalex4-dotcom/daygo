import { Airport, Flight } from "@/lib/types";
/** Jeder Anbieter (Amadeus, Duffel, …) implementiert dieses Interface. */
export interface FlightProvider {
  readonly name: string;
  readonly isLive: boolean; // false => Demo; UI muss das kennzeichnen
  destinations(origin: string): Promise<Airport[]>;
  searchOneWay(from: string, to: string, date: string /* lokales Abflugdatum */): Promise<Flight[]>;
}
