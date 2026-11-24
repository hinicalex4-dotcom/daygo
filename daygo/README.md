# DAYGO – Stufe 2 (Suchlogik)

```bash
npm install && npm test && npm run dev
# GET /api/search?origin=MAD&from=2026-12-05&days=14&maxPrice=100
```

## Aufbau
- `src/lib/matcher.ts` – Same-Day-Matching, unabhängige Hin-/Rückflug-Kombination, Zeitzonen, Dedupe
- `src/lib/search.ts` – Tages- und Flexsuche, begrenzte Parallelität
- `src/lib/score.ts` – DAYGO Score (Gewichte konfigurierbar)
- `src/providers/provider.ts` – Interface für Anbieter; `demo.ts` liefert synthetische DEMO-Daten für die aufgeführten Flughäfen
- `src/lib/airports.ts` + `src/data/airports.json` – globale Suche über 3.245 Flughäfen mit planmäßigem Verkehr; Datensatzfilter aus OurAirports (Public Domain), IANA-Zeitzonen aus `@photostructure/tz-lookup`
- `/api/weather` – Tagesvorhersage (bis 16 Tage) und DAYGO-Wetterbewertung über Open-Meteo; wird pro Flughafen für 30 Minuten gecacht
- `/api/airports` – serverseitige Suche im Flughafenverzeichnis

## Echten Anbieter anbinden (Stufe 3)
1. In Duffel ein Konto und einen API-Zugang einrichten.
2. `DUFFEL_ACCESS_TOKEN` lokal in `.env.local` und für den Deploy in den Server-Umgebungsvariablen setzen. Niemals in Frontend-Code oder Git einchecken.
3. Der Server verwendet dann `DuffelProvider`; ohne Token bleibt die klar gekennzeichnete Demo aktiv. Das Beispiel liegt in `.env.example`.

## Aktueller Stand / wichtig
- Die App bietet Datumssuche, flexible Suche und „Find My Cheapest Day“ mit 7/30/90/180 Tagen, Abflughafen, Zeitfenstern, Wochentagen, Mindestzeit, Länderauswahl, Sortierung und Kalenderübersicht.
- Die Duffel-Anbindung ist implementiert, aber ohne `DUFFEL_ACCESS_TOKEN` verwendet die App weiterhin `DemoProvider`. Duffel ist ein Angebotsfeed mit Zugang zu Angeboten aus über 300 Airlines; das ist kein vollständiger Vergleich aller OTAs und Airline-Webshops.
- Duffel-Tokens können im Testmodus laufen. Ergebnisse werden dann als Test statt Live markiert. Die aktuellen Einzelstreckenangebote werden als getrennte Tickets kombiniert; eine gemeinsame Buchung und ein eigener Checkout sind nicht implementiert. Der vorhandene Skyscanner-Link ist eine neue Suche und kein Duffel-Deep-Link.
- Eine breite 90/180-Tage-Live-Suche braucht noch ein Hintergrund-Job-/Cache-System, damit Anfragen, Laufzeiten und API-Kontingente kontrolliert bleiben. Live-Preise müssen vor einer Buchung erneut bestätigt werden.
- Es gibt noch keinen globalen Vergleich echter OTA-, Airline- oder Affiliate-Angebote, keine Gebühren-/Gepäckberechnung und keine Preisprüfung vor Weiterleitung. Einzelne Hin- und Rückflüge werden im Matcher getrennt kombiniert und in der UI als getrennte Tickets samt Risiko gekennzeichnet.
- Vor Veröffentlichung als echte Flugsuche muss mindestens ein autorisierter Live-Anbieter angebunden werden; anschließend Anbieterpreise, Gepäck, Gebühren, Cache-Alter und erneute Verfügbarkeit transparent ausweisen.
