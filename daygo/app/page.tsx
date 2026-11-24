"use client";
import { useEffect, useMemo, useState } from "react";
import type { DestinationResult } from "@/lib/types";
import { AIRPORTS } from "@/providers/demo";
import { skyscannerUrl } from "@/lib/links";

type Mode = "A" | "B" | "C";
const hm = (iso: string, tz: string) =>
  new Intl.DateTimeFormat("de-DE", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso));
const dur = (m: number) => `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}min`;
const iso = (d: Date) => d.toISOString().slice(0, 10);

export default function Home() {
  const [mode, setMode] = useState<Mode>("A");
  const [origin] = useState("MAD");
  const [date, setDate] = useState("");
  const [days, setDays] = useState(30);
  const [budget, setBudget] = useState(120);
  const [minH, setMinH] = useState(6);
  const [direct, setDirect] = useState(false);
  const [sort, setSort] = useState<"score" | "price" | "time">("score");
  const [data, setData] = useState<DestinationResult[] | null>(null);
  const [demo, setDemo] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [pick, setPick] = useState<string | null>(null);
  useEffect(() => setDate(iso(new Date(Date.now() + 7 * 864e5))), []);

  async function run() {
    setBusy(true); setErr(""); setPick(null);
    const from = mode === "A" ? date : iso(new Date(Date.now() + 864e5));
    const n = mode === "A" ? 1 : mode === "B" ? days : 90;
    try {
      const r = await fetch(`/api/search?origin=${origin}&from=${from}&days=${n}&maxPrice=${budget}&direct=${direct ? 1 : 0}`);
      if (!r.ok) throw new Error((await r.json()).error ?? "Fehler");
      const j = await r.json(); setData(j.results); setDemo(j.demo);
    } catch (e) { setErr(String(e)); setData(null); } finally { setBusy(false); }
  }

  const filtered = useMemo(() => (data ?? []).filter(r => r.best.usableMinutes >= minH * 60), [data, minH]);
  const byDate = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach(r => m.set(r.date, Math.min(m.get(r.date) ?? 1e9, r.best.total)));
    return m;
  }, [filtered]);
  const shown = (mode === "B" && pick ? filtered.filter(r => r.date === pick) : mode === "B" ? [] : filtered)
    .slice().sort((a, b) => sort === "price" ? a.best.total - b.best.total
      : sort === "time" ? b.best.usableMinutes - a.best.usableMinutes : b.score - a.score).slice(0, 36);
  const home = AIRPORTS[origin];

  return <div className="w">
    <h1>Wo kannst du heute hin?</h1>
    <p className="note">Morgens hin, abends zurück, am selben Kalendertag.</p>
    <div className="box">
      <div className="tabs">{([["A", "Bestimmtes Datum"], ["B", "Flexible Daten"], ["C", "Günstigste Deals"]] as const).map(([k, l]) =>
        <button key={k} className={mode === k ? "on" : ""} onClick={() => { setMode(k); setData(null); }}>{l}</button>)}</div>
      <div className="grid">
        <label>Abflughafen<input value="MAD – Madrid" readOnly /></label>
        {mode === "A" && <label>Datum<input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>}
        {mode === "B" && <label>Zeitraum<select value={days} onChange={e => setDays(+e.target.value)}>
          <option value={14}>14 Tage</option><option value={30}>30 Tage</option><option value={90}>3 Monate</option></select></label>}
        <label>Max. Budget (€)<input type="number" value={budget} onChange={e => setBudget(+e.target.value)} /></label>
        <label>Min. Zeit vor Ort (h)<input type="number" value={minH} min={2} max={14} onChange={e => setMinH(+e.target.value)} /></label>
        <label>Nur Direktflüge<select value={direct ? "1" : "0"} onChange={e => setDirect(e.target.value === "1")}><option value="0">Nein</option><option value="1">Ja</option></select></label>
      </div>
      <button className="cta" onClick={run} disabled={busy}>{busy ? "Suche läuft …" : "Finde meinen Tagesausflug"}</button>
    </div>
    {err && <p className="warn">{err}</p>}
    {data && demo && <p className="warn">Demo-Daten: simulierte Flüge, keine echten Preise, nicht buchbar.</p>}
    {data && <div className="tabs" style={{ marginTop: 16 }}>{([["score", "Bester Score"], ["price", "Günstigste"], ["time", "Längste Zeit vor Ort"]] as const).map(([k, l]) =>
      <button key={k} className={sort === k ? "chip on" : "chip"} onClick={() => setSort(k)}>{l}</button>)}</div>}
    {mode === "B" && data && <div className="cal">{[...byDate.entries()].sort().map(([d, p]) =>
      <div key={d} onClick={() => setPick(d)} style={{ background: p < 70 ? "#22b573" : p < 100 ? "#f2c230" : "#f08a2b", outline: pick === d ? "3px solid #2b5cff" : "none" }}>
        {d.slice(8)}.{d.slice(5, 7)}.<span>{p} €</span></div>)}</div>}
    {mode === "B" && data && !pick && <p className="note">Tag antippen, um alle Ziele zu sehen.</p>}
    {data && !filtered.length && <p className="note">Keine passenden Kombinationen. Budget erhöhen oder Mindestzeit senken.</p>}
    <div className="res">{shown.map(r => { const t = r.best;
      return <div className="c" key={r.dest.iata + r.date}>
        <h3>{r.dest.city} <span className="tag">{r.score}/100</span></h3><div className="note">{r.dest.country} · {r.date}</div>
        <div className="pr">{t.total} € <span className="note">Hin & zurück</span></div>
        <div className="row"><span>Hinflug</span><span>{hm(t.outbound.depUtc, home.tz)} → {hm(t.outbound.arrUtc, r.dest.tz)}</span></div>
        <div className="row"><span>Rückflug</span><span>{hm(t.inbound.depUtc, r.dest.tz)} → {hm(t.inbound.arrUtc, home.tz)}</span></div>
        <div className="row"><span>Zeit vor Ort (nutzbar)</span><b>{dur(t.usableMinutes)}</b></div>
        <div className="row"><span>Flug</span><span>{t.outbound.stops + t.inbound.stops === 0 ? "Direkt" : "mit Stopp"}</span></div>
        <div className="row"><span>Tickets</span><span className="tag">{t.separateTickets ? "getrennt" : "ein Ticket"} · {t.source}</span></div>
        {t.separateTickets && <p className="warn">Getrennte Tickets: Verspätet sich ein Flug, gilt der andere nicht als Anschluss.</p>}
        <a className="chip" style={{display:"inline-block",textDecoration:"none",marginTop:8}} href={skyscannerUrl(origin, r.dest.iata, r.date)} target="_blank" rel="noopener noreferrer">Bei Skyscanner prüfen ↗</a>
        <p className="note">Öffnet die Skyscanner-Suche für dieses Datum. Der dortige Preis kann vom Demo-Preis abweichen.</p>
      </div>; })}</div>
  </div>;
}
