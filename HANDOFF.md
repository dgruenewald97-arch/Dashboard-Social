# Handoff — Meta Reporting Dashboard

> **KI-Hinweis (Token sparen):** Zuerst `AI-START-HERE.md` lesen. Hier dann **nur den
> Abschnitt** lesen, den die Aufgabe braucht (Abschnitte sind nummeriert) — nicht alles.
> Der Ordner `.agents/` ist totes Material und wird ignoriert.

> Vollständige Übergabe-Doku. Stand: **14.06.2026**. Für: nächste Session / wer immer weiterbaut.
> Kurzfassung: Ein **lokales, plug-and-play Social-Media-Reporting-Dashboard** (Instagram, Facebook, YouTube) mit Beispieldaten, fertig zum Anschluss echter Meta-Daten.

---

## 1. Was ist das & für wen?

Lokales Reporting-Dashboard für ein Social-Media-Team. Zwei Report-Typen waren das Ziel: **Wochenreport pro KW** und **Monatsreport** (Paid dediziert, Best/Worst-Content). Umgesetzt als **ein Report-Tab mit Datums-Switcher** (Granularität Woche/Monat/Quartal + Zeitraum-Dropdown) plus **Explorer**. (Früher waren Woche/Monat/Quartal getrennte Tabs — am 13.06.2026 zusammengelegt, da baugleich.)

- **User** = Vibecoder / Nicht-Programmierer, Deutsch. Trifft Tech-Entscheidungen NICHT selbst — kurz erklären, dann machen. Bei externen Klick-Strecken (Meta-Portal) exakte Schritt-für-Schritt-Anleitungen. **Abhängigkeiten minimal halten** (Windows, „sonst geht was kaputt").
- **DSGVO** bewusst rausgelassen (nur aggregierte Post-Stats, keine Personendaten).

## 2. Schnellstart

**Am einfachsten (Windows):** Doppelklick auf **`Dashboard starten.bat`** im Projekt-Ordner.
→ startet den Server und öffnet das Dashboard automatisch im Browser. Das schwarze
„Dashboard-Server"-Fenster offen lassen (darin läuft der Server); zum Beenden beide Fenster schließen.

Alternativ klassisch:
```bash
npm run dashboard          # startet Server auf http://localhost:4317
```

- Node ≥ 20, **keine npm-Installation nötig** (0 externe Runtime-Deps; Chart.js + PptxGenJS kommen per CDN).
- Ohne Verbindung laufen **Beispieldaten** (`data/sample-*.json`). Setup-Wizard öffnet sich automatisch.
- `npm run fetch` = CLI-Abruf (nutzt dieselbe `src/meta.js`).

**Aktueller UI-Stand:** Nav = **📊 Report** + **🔎 Explorer**. Im Report oben ein **Datums-Switcher**
(Granularität Woche/Monat/Quartal + Zeitraum-Dropdown). Plattform-Wähler oben rechts (im Quartal inkl.
„Alle Kanäle"). Karten dezent in Plattform-Farbe getönt, ruhiger kühler Hintergrund (keine farbigen Ecken).
**Für eine fachliche Bewertung von Logik/Korrektheit/API siehe `AUDIT.md`.**

## 3. Architektur & Dateien

```
dashboard/
  server.js              0-Dep HTTP-Server (Port 4317). API + statische Auslieferung.
  public/
    index.html           DIE GANZE App (HTML + CSS + JS in einer Datei). ~1000 Zeilen.
    metrics.js           METRIK-REGISTRY (zentrale Definition aller Kennzahlen).
src/
  config.js              Single Source of Truth: Meta-API-Version (v25.0 gepinnt), Deprecation-Map, Feldnamen.
  meta.js                Meta-Anbindung (validateConnection, fetchWeek, isoWeek, isoMonday). Server + CLI.
  fetch.js               CLI-Wrapper für meta.js.
data/
  sample-weekly.json     Beispiel-Wochendaten KW16–24/2026 (Q2).
  sample-posts.json      Beispiel-Beiträge (Mai + Juni 2026) inkl. Datenvertrag für thumbnail/permalink.
  weekly.json            ENTSTEHT beim ersten echten Abruf (gitignored-artig, überschreibt sample).
config.local.json        Zugänge (Token + PageID). gitignored. Wird vom Wizard geschrieben.
Dashboard starten.bat    1-Klick-Starter (Windows): Server + Browser. Mit Node-Check.
ENDPOINTS.md             Getestete Graph-API-Calls + Anleitung Token/PageID holen.
AUDIT.md                 Fachliches Experten-Audit (Logik/Korrektheit/API) + Roadmap.
README.md                Kurzbeschreibung.
HANDOFF.md               Diese Datei.
```

**Wichtig:** Fast die gesamte Frontend-Logik liegt in **einer Datei** `dashboard/public/index.html`. Aufbau dort (in `<script>`):
- `S` = globaler State (`tab` = report|explorer, `gran` = week|month|quarter, `period` = gewählter Zeitraum-Key, `channel`, Explorer-Config `S.exp`, Charts).
- `derive()` / `aggregate()` / `crossDerive()` = Kennzahlen aus Rohdaten berechnen (crossDerive = kanalübergreifend fürs Quartal).
- `render()` routet: `tab==="explorer"` → `renderExplorer()`, sonst nach `S.gran` → `renderWeek/Month/Quarter()`. Diese hängen oben `switcherBar()` an (Granularität + Zeitraum-Dropdown) und verdrahten sie mit `wireSwitcher()`. `resolveSel()` löst die gewählte Periode auf (Fallback = neueste).
- Geteilte Perioden-Bausteine: `weekPeriods/monthPeriods/quarterPeriods`, `lineCompare/barSplit`, `buildPeriodTable`, `renderKpiGroups`(+`...Any` fürs Quartal).
- `METRICS` (aus `metrics.js`) = Registry, treibt KPI-Karten, Info-Tipps, Tabellen automatisch.

## 4. Funktionsumfang (alles gebaut & im Browser verifiziert)

**Backlog Schritt 1–5 — komplett durch:**
1. **KPI-Framework + Registry** (`metrics.js`): zentrale Metrik-Defs, ℹ️-Info-Karten (Erklärung+Formel) auf jeder Kennzahl, channel-aware (zeigt nur vorhandene Metriken je Kanal).
2. **Wochenreport-Politur**: Vergleichs-Chart mit Sekundärachse für Raten, Organic/Paid-Split, sortierbare KW-Tabelle, Engagement-Zusammensetzung, Content-Format-Analyse, Ziele & Benchmarks.
3. **Explorer-Tab** (🔎): Multi-Kanal-Auswahl, Zeitraum-Filter (über echtes `weekStart`-Datum, year-safe), Chart mit mehreren vergleichbaren Linien (Sekundärachse), **Content-Ebene** als **Galerie** (Karten mit Vorschaubild) ODER **anpassbare Tabelle** (Spalten-Picker inkl. Vorschau & Beschreibung).
4. **Export**: Excel (CSV, `;`+BOM → dt. Excel), PDF (Druck-Layout), PowerPoint (echte .pptx via PptxGenJS-CDN). Liest die **sichtbare** Ansicht per DOM-Scraping (`collectKpis/collectTables/collectCharts`).
5. **Wöchentliche Sammel-Erinnerung**: erkennt beim Öffnen fehlende abgeschlossene Wochen (`collectionStatus()`), oranges Banner + „Jetzt sammeln", Sidebar-Status, Dismiss via localStorage.

**Extras:** Ziele/Benchmarks, Content-Format-Analyse. **Liquid-Glass-Theme** (Frosted Glass + Aurora-Hintergrund) — letzter CSS-Block in `index.html`, überschreibt die Basis-Styles.

## 5. Daten-Modell

**Woche** (`data/weekly.json`):
```json
{ "weeks": [ {
  "kw": 24, "year": 2026, "weekStart": "2026-06-08",   // weekStart MUSS Montag der ISO-Woche sein!
  "channels": {
    "instagram": { "views": {"organic":N,"paid":N}, "reach": {"organic":N,"paid":N},
                   "interactions":N, "profileViews":N, "linkTaps":N,
                   "followersGained":N, "followersTotal":N, "saves":N, "shares":N },
    "facebook":  { ... gleiche Felder ... },
    "youtube":   { ..., "video": {"watchTimeHours":N,"avgViewDurationSec":N,"retentionPct":N,
                                  "subsGained":N,"subsLost":N,"thumbnailCTR":N} }
  } } ] }
```

**Beiträge** (`data/posts.json`):
```json
{ "posts": [ {
  "id","channel","type","caption","date":"YYYY-MM-DD","boosted":true/false,
  "views":{"organic","paid"}, "reach":{"organic","paid"},
  "interactions","likes","comments","shares","saves",
  "video":{"avgWatchSec","retentionPct"},
  "thumbnail": null,   // ← Phase 2: echte Bild-URL (IG media_url/thumbnail_url, FB full_picture, YT thumbnails.medium.url)
  "permalink": null    // ← Phase 2: Link zum Beitrag
} ] }
```

## 6. Meta-API-Wissensstand (recherchiert, KRITISCH)

- **Version gepinnt: v25.0** (`src/config.js`). v20.0 wird 24.09.2026 abgeschaltet.
- **`impressions` ist tot → `views`** (IG März 2025, FB Nov 2025).
- **AB 15.06.2026:** ~85 Reach-Metriken retired → ersetzt durch **„Page Viewer Metric" / „Unique Views"** (plattformübergreifend). In unseren Daten = Feld `reach`, im UI „Betrachter (Reichweite)". **Exakten neuen Feldnamen am Live-Account verifizieren** (Rollout Ende Juni).
- `website_clicks` → `profile_links_taps`. `page_fans` → `page_fan_adds`. Account-Metriken brauchen oft `metric_type=total_value`. `profile_views` bei Meta im Umbau → live prüfen.
- **YouTube** = separate Analytics API v2 (OAuth), noch NICHT angebunden.

## 7. Nächste Schritte (Reihenfolge offen, User entscheidet)

1. **Echten Anschluss wagen** — User trägt Page-Token + Page-ID im Setup-Wizard ein → erste echte Woche. Anleitung in `ENDPOINTS.md` (Graph API Explorer → `me/accounts`). War ursprünglich für „Montag" geplant.
2. ~~Monat & Quartal auf Wochen-Niveau heben~~ ✅ **erledigt (13.06.2026)** — beide Tabs haben jetzt Funnel-KPI-Gruppen + Info-Karten, Video-Block, wählbare Vergleichs-Charts (Sekundärachse), Organic/Paid-Split bzw. Kanal-Anteil, Engagement/Format (Monat) und sortierbare Perioden-/Kanal-Tabellen. Geteilte Bausteine: `lineCompare`/`barSplit`/`monthPeriods`/`quarterPeriods`/`crossDerive`/`renderKpiGroupsAny`/`buildPeriodTable`.
3. **Phase 2 — Post-Insights**: echte Beitragsdaten inkl. `thumbnail`/`permalink` (dann zeigt die Galerie echte Bilder), ER/Saves/Shares auf Beitragsebene.
4. **Phase 3 — Ads-API**: echter Organic/Paid-Split (aktuell nur IG/FB Account-Views gesplittet, paid=0 im Fetcher).
5. **Phase 4 — YouTube** Analytics API v2 anbinden.

## 8. Bekannte Fallstricke / Designentscheidungen

- **`weekStart` muss Montag sein.** Zeitraum-Filter, Monats-/Quartals-Gruppierung und die Sammel-Erinnerung verlassen sich darauf. `meta.js` schreibt `isoMonday()` — beim Mappen echter Daten nicht aufs heutige Datum zurückfallen.
- **Meta liefert vergangene Wochen NICHT nach** → wöchentlich sammeln ist Pflicht (deshalb die Erinnerung). Dashboard liest nur lokal gespeicherte Daten.
- **Fetcher ist robust gebaut**: schlägt ein einzelner Metrikname fehl (Meta-Umbau), wird der Wert 0 + Debug-Eintrag, statt alles abzubrechen (`tryGraph` in `meta.js`, Debug in `data/last-fetch-debug.json`).
- **0 echte Runtime-Deps** ist gewollt (Windows-Robustheit). Neue Funktionen möglichst ohne npm-Install; CDN nur wie bei Chart.js/PptxGenJS.
- **Captions/URLs werden ge-escaped** (`escHtml`) — echte API-Texte können HTML enthalten.
- **Liquid-Glass** nutzt `backdrop-filter`. Im Druck-CSS wird Glas zu solidem Weiß umgeschaltet (sonst druckt es grau/leer).

## 9. Verifikation in der Entwicklung

Verifiziert wurde durchgehend per Browser-Preview (DOM-Snapshots, Eval-Checks, Screenshots) — keine Console-Fehler über alle Tabs. ISO-Wochen-/Montags-Logik per Node gegengetestet (inkl. Jahreswechsel: 01.01.2027 → Montag 28.12.2026 / KW53).

## 10. Nachtrag — Folge-Auftrag „Light-Mode-Politur + Drag&Drop" (14.06.2026)

Ein zweiter (Multi-Agent-)Auftrag lief: Premium-Light-Mode-Politur, erweiterte Charts
und **Drag-and-Drop für KPI-Karten**. Der Lauf wurde bei Milestone 4 unterbrochen; in der
Folgesitzung verifiziert & abgeschlossen (Details in `.agents/orchestrator/progress.md`).

- **Drag&Drop KPI-Karten** ist fertig (`index.html`): Karten sind `draggable`, lassen sich
  **innerhalb ihrer Metrik-Gruppe** umsortieren, Reihenfolge wird in `localStorage`
  (`sm-metric-order`) gespeichert und beim Laden angewandt. Cross-Gruppen-Drops sind bewusst
  blockiert. Handler: `kpiDragStart/Over/Leave/Drop/End` (~Zeile 2604). Sortierung in
  `renderKpiGroups`/`renderKpiGroupsAny` über `S.metricOrder`. Scroll-Restore via double-rAF in `render()`.
  - *Optionale Erweiterung (nicht angefordert):* Order-Key pro Granularität+Kanal statt einem
    globalen Key — Vorschlag liegt in `.agents/explorer_dnd/handoff.md`.
- **Responsive-Fix (14.06.2026):** Bei 320px Breite sprengte eine breite Tabelle/Chart das
  Grid (227px Überlauf). Behoben mit `.grid > * { min-width: 0; }` → Panels schrumpfen,
  Tabelle scrollt innerhalb ihres `overflow-x:auto`-Containers. Im Browser bei 320px
  verifiziert (overflowPx = 0, keine Konsolen-Fehler).
- **Tests** weiterhin grün: `node test-fetch.mjs`, `node test-posts.mjs`.

## 11. Navi-Punkte „Endpoints" + „Doku" (14.06.2026)

Zwei neue Sidebar-Tabs (`data-tab="endpoints"` / `="doku"`). Beide rendern **ohne
Daten-Abhängigkeit** (wichtig fürs Erst-Setup): `render()` fängt sie VOR dem
Daten-Guard ab, blendet Control-Bar/Export/Zeitraum/Kanäle aus und ruft
`renderEndpoints()` bzw. `renderDoku()`. `renderChannels()` zeigt den Kanal-Wähler
jetzt nur noch im Report (`S.tab!=="report"` → versteckt).

- **Endpoints** = Graph-API-Feldnamen in der UI editieren (für Meta-Umbenennungen
  wie die 15.06-Reach-Umstellung — kein Code-Eingriff mehr nötig).
  - **Zentrale Definition:** `src/config.js` → `DEFAULT_ENDPOINTS` (21 Feldnamen) +
    `ENDPOINT_FIELDS` (Gruppen/Label/Hint fürs UI).
  - **Fetcher liest sie:** `meta.js` `fetchWeek(cfg, ep)` / `fetchPosts(cfg, ep)` nehmen
    jetzt ein `ep`-Objekt (Default = `DEFAULT_ENDPOINTS`), JEDER Metrik-/Feldname kommt
    daraus. Tests bleiben grün, weil die Defaults die alten Literale exakt reproduzieren.
  - **Server:** `loadEndpoints()` merged `DEFAULT_ENDPOINTS` mit `endpoints.local.json`
    (gitignored); `GET/POST /api/endpoints`; `/api/fetch` übergibt das gemergte `ep`.
    Leere/Default-Werte werden NICHT gespeichert (POST {} löscht die Override-Datei).
  - **UI:** `renderEndpoints()` zieht `/api/endpoints`, baut gruppiertes Formular
    (Eingabe je Feld, „Standard: …", „geändert"-Badge, pro-Feld + global „zurücksetzen",
    Speichern mit Feedback). Änderungen greifen beim nächsten „Daten aktualisieren".
- **Doku** = statische In-App-Erklärung (`renderDoku()`): was man sieht (Navi/Report/
  Explorer), die Kennzahlen kurz, wie Daten reinkommen, **wie es technisch gebaut ist**,
  Ausbaustufen, Datensicherung. CSS-Klassen `.ep-*` / `.doku` am Ende des Style-Blocks.
- Verifiziert: `/api/endpoints` GET/POST (Speichern→custom=true, Reset→Datei gelöscht),
  21 Felder/4 Gruppen, Tab-Wechsel blendet korrekt um, zurück zum Report stellt
  Export/Kanäle wieder her, 0 Konsolen-Fehler. (Screenshot-Tool hängt am Liquid-Glass
  `backdrop-filter` — DOM-verifiziert; im echten Browser flüssig.)

---

*Diese Doku ergänzt die Auto-Memory (`~/.claude/.../memory/`). Bei Widerspruch gilt der Code.*
