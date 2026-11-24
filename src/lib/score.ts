import { Trip } from "./types";
export interface Weights { time: number; price: number; schedule: number; direct: number; reliability: number }
export const DEFAULT_WEIGHTS: Weights = { time: .30, price: .25, schedule: .20, direct: .15, reliability: .10 };

/** 0–100. reliability: 0..1, falls unbekannt neutral 0.7. */
export function daygoScore(t: Trip, w: Weights = DEFAULT_WEIGHTS, reliability = 0.7, maxPrice = 200): number {
  const time = Math.min(t.usableMinutes / 600, 1);
  const price = 1 - Math.min(t.total / maxPrice, 1);
  const schedule = Math.max(0, 1 - Math.abs(t.usableMinutes - 600) / 600);
  const direct = t.outbound.stops + t.inbound.stops === 0 ? 1 : 0.3;
  const sum = w.time + w.price + w.schedule + w.direct + w.reliability;
  return Math.round(((w.time * time + w.price * price + w.schedule * schedule + w.direct * direct + w.reliability * reliability) / sum) * 100);
}
