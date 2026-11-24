import { NextRequest, NextResponse } from "next/server";
import { AIRPORTS } from "@/lib/airports";

export async function GET(req: NextRequest) {
  const codes = (req.nextUrl.searchParams.get("airports") ?? req.nextUrl.searchParams.get("airport") ?? "")
    .split(",").map(c => c.trim().toUpperCase()).filter((c,i,a) => a.indexOf(c) === i).slice(0,40);
  const airports = codes.map(c => AIRPORTS[c]).filter(a => a && a.lat !== undefined && a.lon !== undefined);
  if (!airports.length)
    return NextResponse.json({ error: "Flughafen nicht gefunden" }, { status: 400 });
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: airports.map(a => a.lat).join(","), longitude: airports.map(a => a.lon).join(","),
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max",
    forecast_days: "16", timezone: airports.map(a => a.tz).join(","), temperature_unit: "celsius", wind_speed_unit: "kmh",
  }).toString();
  try {
    const response = await fetch(url, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) return NextResponse.json({ error: "Wetterdienst gerade nicht erreichbar" }, { status: 502 });
    const weather = await response.json();
    const list = Array.isArray(weather) ? weather : [weather];
    const byAirport = Object.fromEntries(airports.map((a,i) => [a.iata,list[i]]).filter(([,v]) => !!v));
    return NextResponse.json({ weather: byAirport }, { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } });
  } catch {
    return NextResponse.json({ error: "Wetterdienst gerade nicht erreichbar" }, { status: 502 });
  }
}
