# 📊 Social-Media Reporting Dashboard

Lokales **Plug-and-Play**-Reporting für **Instagram & Facebook** (YouTube = Phase 4).
Woche · Monat · Quartal + freier Explorer. Keine Cloud, keine Abo-Kosten — deine Daten bleiben lokal.

---

## Start

```powershell
npm run dashboard
```
→ Browser: **http://localhost:4317** (oder Doppelklick auf **`Dashboard starten.bat`**)

Ohne Verbindung laufen **Beispiel-Daten**, damit sofort alles sichtbar ist.
Echte Daten anschließen: Schritt-für-Schritt in **[`GO-LIVE.md`](GO-LIVE.md)**.

---

## Was du siehst (Navigation)

- **Report** — Woche / Monat / Quartal (oben umschaltbar) mit KPI-Funnel, Vergleichs-Charts,
  Organic-vs-Paid, Format-Analyse, Tabellen und **Export** (Excel / PDF / PowerPoint).
- **Explorer** — frei: mehrere Kanäle, eigener Zeitraum, Beiträge als Galerie oder Tabelle.
- **Endpoints** — Meta-Feldnamen anpassen, falls Meta etwas umbenennt (ohne Code).
- **Doku** — In-App-Erklärung (was man sieht, wie es gebaut ist).

Stand der API-Logik: **v25.0** — `views` statt `impressions`, „Betrachter" (Unique Views) statt legacy reach.

---

## Wie alles zusammenhängt

```
[Instagram / Facebook]  --Knopf "Daten aktualisieren" (1×/Woche)-->  src/meta.js (API v25.0)
        -->  data/weekly.json  (DEINE lokal gespeicherten Daten)  -->  Dashboard (liest lokal)
```

**Wichtig:** Meta liefert alte Wochen NICHT nach → einmal pro Woche „Daten aktualisieren".
Das Dashboard baut die History lokal auf. **`data/` regelmäßig sichern** (Backup).

---

## Dokumentation

| Datei | Für wen / wofür |
|---|---|
| **[`GO-LIVE.md`](GO-LIVE.md)** | **Du** — Checkliste zum echten Datenanschluss. |
| **[`AI-START-HERE.md`](AI-START-HERE.md)** | **Nächste KI-Session** — Karte „wo ist was" + Token-Disziplin. |
| [`HANDOFF.md`](HANDOFF.md) | Technische Komplett-Übergabe (Architektur, Datenmodell, API). |
| [`ENDPOINTS.md`](ENDPOINTS.md) | Token/Page-ID holen + die genauen Graph-API-Calls. |
| [`AUDIT.md`](AUDIT.md) | Fachliches Audit (Kennzahl-Logik, Roadmap). |

---

## Roadmap

- [x] Plug-and-Play-Dashboard (Report, Explorer, Export, Drag&Drop, Endpoints, Doku)
- [x] Aktueller API-Stand v25.0 (Views-Logik, Reach→Viewer abgefedert)
- [ ] Echten Token verbinden → erste echte Woche
- [ ] Phase 2: Beitrags-Insights (ER, Saves, Shares, Thumbnails) live
- [ ] Phase 3: Organic/Paid-Split via Ads-API
- [ ] Phase 4: YouTube Analytics API
