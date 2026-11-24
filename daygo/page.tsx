"use client";
import { useEffect, useMemo, useState } from "react";
import type { Airport, DestinationResult } from "@/lib/types";
import { skyscannerUrl } from "@/lib/links";
import { DaygoLogo } from "@/components/daygo-logo";

type Mode = "A" | "B" | "C";
type DailyWeather = { time: string[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_probability_max: number[]; wind_speed_10m_max: number[] };
type WeatherData = { daily?: DailyWeather; error?: string };
const MAD: Airport = { iata: "MAD", city: "Madrid", country: "Spanien", tz: "Europe/Madrid" };
const hm = (iso: string, tz: string) => new Intl.DateTimeFormat("de-DE", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso));
const dur = (m: number) => `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}min`;
const dateIso = (d: Date) => d.toISOString().slice(0, 10);
const WMO: Record<number, string> = {0:"Sonnig",1:"Meist sonnig",2:"Teilweise bewölkt",3:"Bewölkt",45:"Neblig",48:"Neblig",51:"Leichter Niesel",53:"Niesel",55:"Starker Niesel",61:"Leichter Regen",63:"Regen",65:"Starker Regen",71:"Leichter Schnee",73:"Schnee",75:"Starker Schnee",80:"Regenschauer",81:"Schauer",82:"Starke Schauer",95:"Gewitter",96:"Gewitter",99:"Gewitter"};

function AirportPicker({ label, selected, onChange, max }: { label:string; selected:Airport[]; onChange:(v:Airport[])=>void; max:number }) {
  const [query,setQuery]=useState(""); const [matches,setMatches]=useState<Airport[]>([]);
  useEffect(()=>{ const q=query.trim(); if(q.length<2){setMatches([]);return} const timer=setTimeout(async()=>{try{const r=await fetch(`/api/airports?q=${encodeURIComponent(q)}`);const j=await r.json();setMatches(j.airports??[])}catch{setMatches([])}},180); return ()=>clearTimeout(timer)},[query]);
  function add(a:Airport){if(selected.length<max&&!selected.some(x=>x.iata===a.iata))onChange([...selected,a]);setQuery("");setMatches([])}
  return <label>{label}<div className="airport-picker"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Stadt, Land oder IATA-Code suchen" aria-label={label}/>
    {matches.length>0&&<div className="airport-suggestions">{matches.map(a=><button type="button" key={a.iata} onClick={()=>add(a)}>{a.city} · {a.name} <b>({a.iata})</b> · {a.country}</button>)}</div>}</div>
    <div className="selected-airports">{selected.map(a=><button type="button" key={a.iata} title={`${a.name??a.city}, ${a.country}`} onClick={()=>onChange(selected.filter(x=>x.iata!==a.iata))}>{a.city} ({a.iata}) ×</button>)}</div>
    <small>{selected.length}/{max} ausgewählt</small></label>;
}

function weatherDescription(code:number, rain:number, high:number, wind:number) {
  const rough=[65,75,82,95,96,99].includes(code)||rain>=70||wind>=55;
  const mixed=[51,53,55,61,63,71,73,80,81].includes(code)||rain>=40||high<10||high>33;
  return {rating:rough?"Eher ungemütlich":mixed?"Durchwachsen":"Gutes Ausflugswetter", icon:rough?"🌧️":mixed?"⛅":"☀️"};
}

export default function Home() {
  const [mode,setMode]=useState<Mode>("A"); const [origins,setOrigins]=useState<Airport[]>([MAD]); const [destinations,setDestinations]=useState<Airport[]>([]);
  const [date,setDate]=useState(""); const [days,setDays]=useState(30); const [budget,setBudget]=useState(120); const [minH,setMinH]=useState(6); const [direct,setDirect]=useState(false);
  const [sort,setSort]=useState<"score"|"price"|"time">("score"); const [data,setData]=useState<DestinationResult[]|null>(null); const [demo,setDemo]=useState(true);
  const [busy,setBusy]=useState(false); const [err,setErr]=useState(""); const [pick,setPick]=useState<string|null>(null); const [weekdays,setWeekdays]=useState<number[]>([]);
  const [outStart,setOutStart]=useState("06:00"); const [outEnd,setOutEnd]=useState("10:00"); const [retStart,setRetStart]=useState("18:00"); const [retEnd,setRetEnd]=useState("23:59");
  const [country,setCountry]=useState("all"); const [weather,setWeather]=useState<Record<string,WeatherData>>({});
  useEffect(()=>setDate(dateIso(new Date(Date.now()+7*864e5))),[]);

  async function run(){
    if(!origins.length){setErr("Bitte mindestens einen Abflughafen auswählen.");return}
    setBusy(true);setErr("");setPick(null);setWeather({});
    const from=mode==="A"?date:dateIso(new Date(Date.now()+864e5)); const n=mode==="A"?1:days;
    try{
      const flights=await Promise.all(origins.map(async origin=>{
        const params=new URLSearchParams({origin:origin.iata,from,days:String(n),maxPrice:String(budget),direct:direct?"1":"0",outStart,outEnd,retStart,retEnd});
        if(weekdays.length)params.set("weekdays",weekdays.join(",")); if(destinations.length)params.set("destinations",destinations.map(a=>a.iata).join(","));
        const r=await fetch(`/api/search?${params}`); const j=await r.json(); if(!r.ok)throw new Error(j.error??"Suche fehlgeschlagen");return j;
      }));
      setData(flights.flatMap(j=>j.results));setDemo(flights.every(j=>j.demo));
    }catch(e){setErr(e instanceof Error?e.message:String(e));setData(null)}finally{setBusy(false)}
  }

  const filtered=useMemo(()=>(data??[]).filter(r=>r.best.usableMinutes>=minH*60&&(country==="all"||r.dest.country===country)),[data,minH,country]);
  const byDate=useMemo(()=>{const m=new Map<string,number>();filtered.forEach(r=>m.set(r.date,Math.min(m.get(r.date)??1e9,r.best.total)));return m},[filtered]);
  const shown=(mode!=="A"&&pick?filtered.filter(r=>r.date===pick):filtered).slice().sort((a,b)=>sort==="price"?a.best.total-b.best.total:sort==="time"?b.best.usableMinutes-a.best.usableMinutes:b.score-a.score).slice(0,60);
  useEffect(()=>{let cancelled=false;const codes=[...new Set((data??[]).map(r=>r.dest.iata))];if(!codes.length){setWeather({});return} (async()=>{try{const r=await fetch(`/api/weather?airports=${codes.join(",")}`);const j=await r.json();if(!cancelled)setWeather(j.weather??{})}catch{if(!cancelled)setWeather({})}})();return()=>{cancelled=true}},[data]);
  const countries=[...new Set((data??[]).map(r=>r.dest.country))].sort();

  return <div className="w">
    <header className="site-header"><DaygoLogo /></header>
    <h1>Wo kannst du heute hin?</h1><p className="note">Morgens hin, abends zurück, am selben Kalendertag.</p>
    <div className="box">
      <div className="tabs">{([["A","Bestimmtes Datum"],["B","Flexible Daten"],["C","Günstigste Deals"]] as const).map(([k,l])=><button key={k} className={mode===k?"on":""} onClick={()=>{setMode(k);setData(null);setPick(null)}}>{l}</button>)}</div>
      <div className="grid">
        <AirportPicker label="Abflughäfen" selected={origins} onChange={setOrigins} max={5}/>
        <AirportPicker label="Ziele (optional)" selected={destinations} onChange={setDestinations} max={10}/>
        {mode==="A"&&<label>Datum<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>}
        {mode!=="A"&&<label>Suchzeitraum<select value={days} onChange={e=>setDays(+e.target.value)}><option value={7}>Nächste 7 Tage</option><option value={30}>Nächste 30 Tage</option><option value={90}>3 Monate</option><option value={180}>6 Monate</option></select></label>}
        <label>Max. Budget (€)<input type="number" value={budget} onChange={e=>setBudget(+e.target.value)}/></label>
        <label>Min. Zeit vor Ort (h)<input type="number" value={minH} min={2} max={14} onChange={e=>setMinH(+e.target.value)}/></label>
        <label>Nur Direktflüge<select value={direct?"1":"0"} onChange={e=>setDirect(e.target.value==="1")}><option value="0">Nein</option><option value="1">Ja</option></select></label>
        <label>Hinflug ab<input type="time" value={outStart} onChange={e=>setOutStart(e.target.value)}/></label><label>Hinflug bis<input type="time" value={outEnd} onChange={e=>setOutEnd(e.target.value)}/></label>
        <label>Rückflug ab<input type="time" value={retStart} onChange={e=>setRetStart(e.target.value)}/></label><label>Rückflug bis<input type="time" value={retEnd} onChange={e=>setRetEnd(e.target.value)}/></label>
      </div>
      <p className="note">Ohne Zielauswahl sucht DAYGO in einer Liste beliebter Ziele. Flughäfen weltweit findest du über die Suche.</p>
      <label className="weekdays">Bevorzugte Wochentage (leer = alle)<div className="dayrow">{["So","Mo","Di","Mi","Do","Fr","Sa"].map((d,i)=><button type="button" className={weekdays.includes(i)?"chip on":"chip"} key={d} onClick={()=>setWeekdays(v=>v.includes(i)?v.filter(x=>x!==i):[...v,i])}>{d}</button>)}</div></label>
      <button className="cta" onClick={run} disabled={busy}>{busy?"Suche läuft …":"Finde meinen Tagesausflug"}</button>
    </div>
    {err&&<p className="warn">{err}</p>}{data&&demo&&<p className="warn">Demo-Daten: simulierte Preise und Zeiten, nicht buchbar.</p>}
    {data&&<div className="tabs" style={{marginTop:16}}>{([["score","Bester Score"],["price","Günstigste"],["time","Längste Zeit vor Ort"]] as const).map(([k,l])=><button key={k} className={sort===k?"chip on":"chip"} onClick={()=>setSort(k)}>{l}</button>)}</div>}
    {mode!=="A"&&data&&<div className="cal">{[...byDate.entries()].sort().map(([d,p])=><div key={d} className={`calday ${p<70?"cheap":p<100?"mid":"high"}`} onClick={()=>setPick(d)} style={{outline:pick===d?"3px solid #8D654A":"none"}}>{d.slice(8)}.{d.slice(5,7)}<span>{p} €</span></div>)}</div>}
    {data&&<label className="country-filter">Land filtern<select value={country} onChange={e=>setCountry(e.target.value)}><option value="all">Alle Länder</option>{countries.map(c=><option key={c}>{c}</option>)}</select></label>}
    {data&&!filtered.length&&<p className="note">Keine passenden Kombinationen gefunden. Budget erhöhen oder Mindestzeit senken.</p>}
    {mode==="C"&&data&&<h2>Günstigste Tagestrips</h2>}
    <div className="res">{shown.map(r=>{const t=r.best;const wx=weather[r.dest.iata]?.daily;const wi=wx?.time.indexOf(r.date)??-1;const forecast=wx&&wi>=0?weatherDescription(wx.weather_code[wi],wx.precipitation_probability_max[wi],wx.temperature_2m_max[wi],wx.wind_speed_10m_max[wi]):null;
      return <div className="c" key={`${r.origin.iata}-${r.dest.iata}-${r.date}`}>
        <h3>{r.dest.city} <span className="tag">{r.score}/100</span></h3><div className="note">{r.dest.country} · {r.date} · ab {r.origin.city} ({r.origin.iata})</div>
        {forecast?<div className="weather"><span className="rating">{forecast.icon} {forecast.rating}</span><strong>{WMO[wx!.weather_code[wi]]??"Wetter"}</strong> · {Math.round(wx!.temperature_2m_min[wi])}–{Math.round(wx!.temperature_2m_max[wi])} °C · Regen {wx!.precipitation_probability_max[wi]}%<br/><small>Vorhersage · max. Wind {Math.round(wx!.wind_speed_10m_max[wi])} km/h · Open-Meteo</small></div>:<div className="weather">🌤️ Wettervorhersage für diesen Termin noch nicht verfügbar.</div>}
        <div className="pr">{t.total} € <span className="note">Hin & zurück</span></div>
        <div className="row"><span>Hinflug</span><span>{hm(t.outbound.depUtc,r.origin.tz)} → {hm(t.outbound.arrUtc,r.dest.tz)}</span></div>
        <div className="row"><span>Rückflug</span><span>{hm(t.inbound.depUtc,r.dest.tz)} → {hm(t.inbound.arrUtc,r.origin.tz)}</span></div>
        <div className="row"><span>Zeit vor Ort (nutzbar)</span><b>{dur(t.usableMinutes)}</b></div><div className="row"><span>Flug</span><span>{t.outbound.stops+t.inbound.stops===0?"Direkt":"mit Stopp"}</span></div>
        <div className="row"><span>Hinflugpreis</span><span>{t.outbound.price} € · {t.outbound.airline}</span></div><div className="row"><span>Rückflugpreis</span><span>{t.inbound.price} € · {t.inbound.airline}</span></div>
        <div className="row"><span>Tickets</span><span className="tag">{t.separateTickets?"getrennt":"ein Ticket"} · {{live:"Live",cached:"Zwischengespeichert",test:"Test",demo:"Demo"}[t.source]}</span></div>
        {t.separateTickets&&<p className="warn">Getrennte Tickets: Verspätet sich ein Flug, gilt der andere nicht als Anschluss.</p>}
        <a className="chip" style={{display:"inline-block",textDecoration:"none",marginTop:8}} href={skyscannerUrl(r.origin.iata,r.dest.iata,r.date)} target="_blank" rel="noopener noreferrer">Bei Skyscanner prüfen ↗</a>
      </div>})}</div>
    <footer className="note" style={{marginTop:28}}>Wetter: <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a> · Flughafendaten: <a href="https://ourairports.com/data/" target="_blank" rel="noopener noreferrer">OurAirports (Public Domain)</a></footer>
  </div>;
}
