import tzLookup from "@photostructure/tz-lookup";
import rows from "@/data/airports.json";
import { Airport } from "./types";

type AirportRow = { iata: string; name: string; city: string; country: string; lat: number; lon: number };
const countryNames = new Intl.DisplayNames(["de"], { type: "region" });

// Airport records are a filtered snapshot of OurAirports public-domain data.
export const AIRPORT_LIST: Airport[] = (rows as AirportRow[]).map(a => ({
  iata: a.iata, name: a.name, city: a.city,
  country: countryNames.of(a.country) ?? a.country,
  lat: a.lat, lon: a.lon, tz: tzLookup(a.lat, a.lon),
}));
export const AIRPORTS: Record<string, Airport> = Object.fromEntries(AIRPORT_LIST.map(a => [a.iata, a]));

export const POPULAR_DESTINATIONS = ["LIS","OPO","CDG","MXP","FCO","LHR","RAK","BCN","AGP","VLC","AMS","BRU","PMI","IBZ","NCE","MRS","SVQ","BIO","CPH","DUB","BER","FRA","MUC","PRG","VIE","ZRH","GVA","ATH","BUD","WAW"];

export function findAirports(query: string, limit = 20): Airport[] {
  const q = query.trim().toLocaleLowerCase("de");
  if (q.length < 2) return [];
  return AIRPORT_LIST.filter(a => a.iata.toLowerCase().includes(q) || a.city.toLocaleLowerCase("de").includes(q)
    || a.name.toLocaleLowerCase("de").includes(q) || a.country.toLocaleLowerCase("de").includes(q))
    .sort((a,b) => (a.iata.toLowerCase() === q ? -1 : b.iata.toLowerCase() === q ? 1 : a.city.localeCompare(b.city,"de")))
    .slice(0, limit);
}
