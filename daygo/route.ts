import { NextRequest, NextResponse } from "next/server";
import { findAirports } from "@/lib/airports";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.trim().length < 2) return NextResponse.json({ airports: [] });
  return NextResponse.json({ airports: findAirports(q, 20) });
}
