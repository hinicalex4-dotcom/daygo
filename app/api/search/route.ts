import { NextRequest, NextResponse } from "next/server";
import { DemoProvider, AIRPORTS } from "@/providers/demo";
import { searchRange } from "@/lib/search";
import { DuffelProvider } from "@/providers/duffel";
import { FlightProvider } from "@/providers/provider";

// TODO: Rate-Limit und Redis-Cache vor echten Providern ergänzen.
const providers: FlightProvider[] = process.env.DUFFEL_ACCESS_TOKEN
  ? [new DuffelProvider(process.env.DUFFEL_ACCESS_TOKEN)]
  : [new DemoProvider()];

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const origin = AIRPORTS[(q.get("origin") ?? "MAD").toUpperCase()];
  const from = q.get("from") ?? "", days = Number(q.get("days") ?? 1);
  if (!origin || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !Number.isInteger(days) || days < 1 || days > 180)
    return NextResponse.json({ error: "Ungültige Parameter" }, { status: 400 });
  const nums = (s: string | null) => s ? s.split(",").map(Number).filter(n => Number.isInteger(n) && n >= 0 && n <= 6) : undefined;
  const destinationCodes = q.has("destinations") ? (q.get("destinations") ?? "").split(",").map(c => c.trim().toUpperCase()).filter(c => AIRPORTS[c] && c !== origin.iata).slice(0, 10) : undefined;
  const time = (s: string | null, fallback: number) => s && /^\d{2}:\d{2}$/.test(s) ? Math.min(1439, Number(s.slice(0,2))*60 + Number(s.slice(3))) : fallback;
  const results = await searchRange(providers, origin, from, days, {
    directOnly: q.get("direct") === "1", weekdays: nums(q.get("weekdays")),
    outWindow: [time(q.get("outStart"), 360), time(q.get("outEnd"), 600)],
    retWindow: [time(q.get("retStart"), 1080), time(q.get("retEnd"), 1439)],
  },
    Number(q.get("maxPrice") ?? Infinity), 4, destinationCodes);
  const demo = providers.some(p => !p.isLive);
  return NextResponse.json({ demo, results, dataStatus: demo ? "demo" : "provider", providerNames: providers.map(p => p.name) });
}
