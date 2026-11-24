import { NextRequest, NextResponse } from "next/server";
import { DemoProvider, AIRPORTS } from "@/providers/demo";
import { searchRange } from "@/lib/search";

// TODO: Rate-Limit und Redis-Cache vor echten Providern ergänzen.
const providers = [new DemoProvider()]; // später: new AmadeusProvider(process.env.AMADEUS_KEY!) …

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const origin = AIRPORTS[(q.get("origin") ?? "MAD").toUpperCase()];
  const from = q.get("from") ?? "", days = Math.min(Number(q.get("days") ?? 1), 90);
  if (!origin || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !(days >= 1))
    return NextResponse.json({ error: "Ungültige Parameter" }, { status: 400 });
  const results = await searchRange(providers, origin, from, days, { directOnly: q.get("direct") === "1" },
    Number(q.get("maxPrice") ?? Infinity));
  return NextResponse.json({ demo: providers.some(p => !p.isLive), results });
}
