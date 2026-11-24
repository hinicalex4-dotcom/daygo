import { describe, it, expect } from "vitest";
import { matchSameDay } from "@/lib/matcher";
import { AIRPORTS } from "@/providers/demo";
import { localToUtc } from "@/lib/tz";
import { Flight } from "@/lib/types";

const MAD = AIRPORTS.MAD, LIS = AIRPORTS.LIS;
const fl = (id: string, from: string, to: string, dep: string, arr: string, price: number): Flight => ({
  id, provider: "t", airline: "T", flightNo: id, from, to, depUtc: dep, arrUtc: arr, price, currency: "EUR",
  stops: 0, fetchedAt: "", source: "demo" });

describe("matchSameDay", () => {
  const d = "2026-12-05"; // Winter: MAD = UTC+1, LIS = UTC+0
  const out = fl("O", "MAD", "LIS", localToUtc(d, 480, MAD.tz), localToUtc(d, 480 + 75, MAD.tz), 30);
  it("akzeptiert Rückflug 21:00 Lissabon-Zeit mit Landung am selben Tag", () => {
    const back = fl("R", "LIS", "MAD", localToUtc(d, 1260, LIS.tz), localToUtc(d, 1260 + 75, LIS.tz), 25);
    const t = matchSameDay([out], [back], MAD, LIS);
    expect(t).toHaveLength(1);
    expect(t[0].total).toBe(55);
    expect(t[0].usableMinutes).toBeGreaterThan(600);
  });
  it("verwirft Rückflug, der erst nach Mitternacht (Heimatzeit) landet", () => {
    const back = fl("R2", "LIS", "MAD", localToUtc(d, 1380, LIS.tz), localToUtc(d, 1380 + 75, LIS.tz), 20);
    expect(matchSameDay([out], [back], MAD, LIS)).toHaveLength(0);
  });
  it("verwirft Rückflug vor dem Rückflugfenster", () => {
    const back = fl("R3", "LIS", "MAD", localToUtc(d, 900, LIS.tz), localToUtc(d, 1035, LIS.tz), 20);
    expect(matchSameDay([out], [back], MAD, LIS)).toHaveLength(0);
  });
});
