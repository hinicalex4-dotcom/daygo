# DAYGO – Stufe 2 (Suchlogik)

```bash
npm install && npm test && npm run dev
# GET /api/search?origin=MAD&from=2026-12-05&days=14&maxPrice=100
```

## Aufbau
- `src/lib/matcher.ts` – Same-Day-Matching, unabhängige Hin-/Rückflug-Kombination, Zeitzonen, Dedupe
- `src/lib/search.ts` – Tages- und Flexsuche, begrenzte Parallelität
- `src/lib/score.ts` – DAYGO Score (Gewichte konfigurierbar)
- `src/providers/provider.ts` – Interface für Anbieter; `demo.ts` liefert DEMO-Daten nur ab MAD

## Echten Anbieter anbinden (Stufe 3)
1. `src/providers/amadeus.ts` anlegen, `FlightProvider` implementieren (`isLive = true`, `source: "live"` setzen).
2. Keys nur serverseitig in `.env.local` (`AMADEUS_KEY`, `AMADEUS_SECRET`), nie im Frontend.
3. In `app/api/search/route.ts` zur `providers`-Liste hinzufügen. Redis-Cache und Rate-Limit davor schalten.

## Offen
- Komplette Round-Trip-Angebote gegen Einzeltickets vergleichen (Gebühren, Gepäck)
- Währungsumrechnung, Preis-Verifikation vor Weiterleitung, Sponsored-Kennzeichnung
- Heatmap/UI an `/api/search` anbinden
