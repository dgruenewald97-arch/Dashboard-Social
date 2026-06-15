# 🧭 AI-START-HERE — zuerst lesen (für die nächste KI-Session)

> **Zweck dieser Datei:** Dir (der nächsten KI) in EINER kurzen Datei sagen, *was wo ist*
> und *wie du wenig Tokens verbrauchst*. Lies diese Datei ganz, dann gezielt nur das,
> was die Aufgabe braucht. **Nicht alles einlesen.**

---

## ⚡ Token-Disziplin (wichtig — der User achtet darauf)

1. **Diese Datei + `HANDOFF.md` reichen als Überblick.** Lies NICHT die ganze Codebasis
   „zum Verständnis". Der Code ist die Wahrheit; lies gezielt die Datei zur Aufgabe.
2. **Ignoriere den Ordner `.agents/`** — das sind tote Protokolle eines einmaligen
   Multi-Agent-Laufs. Nicht gepflegt, nicht relevant. Nie reinlesen.
3. **Fast die ganze App ist EINE Datei:** `dashboard/public/index.html` (~2700 Zeilen,
   HTML+CSS+JS). Such darin mit `Grep` nach Funktions-/IDs-Namen statt sie ganz zu lesen.
4. **Verifizieren ohne Screenshot:** Der Screenshot-Automat hängt am Liquid-Glass-Effekt.
   Nutze stattdessen `preview_eval` (DOM messen) + `preview_console_logs`.
5. **Server-Änderungen** (`server.js`/`src/`) brauchen einen **Neustart** des Preview-Servers;
   Frontend-Änderungen (`index.html`) nur einen **Reload** der Seite.

---

## 📂 Wo ist was?

| Datei | Was | Wann lesen |
|---|---|---|
| **`HANDOFF.md`** | Technische Komplett-Übergabe (Architektur, Datenmodell, API-Stand, Fallstricke). Nummerierte Abschnitte. | Bei jeder Code-Aufgabe — **nur den passenden Abschnitt**. |
| `dashboard/public/index.html` | Die ganze Web-App (Anzeige, Charts, alle Seiten). | Für UI/Anzeige-Änderungen. Per Grep navigieren. |
| `dashboard/server.js` | Lokaler Node-Server (0 Abhängigkeiten): API-Routen + Auslieferung. | Für API/Backend-Änderungen. |
| `src/meta.js` | Meta-Graph-API-Abruf (`fetchWeek`, `fetchPosts`, Validierung). | Für Datenabruf-Änderungen. |
| `src/config.js` | **Single Source of Truth:** API-Version (v25.0 gepinnt), Deprecation-Map, `DEFAULT_ENDPOINTS` (anpassbare Feldnamen). | Feldnamen/API-Version. |
| `test-fetch.mjs` / `test-posts.mjs` | Logik-Tests des Abrufs (Mock-API). | Nach jeder Änderung an `meta.js`: `node test-*.mjs`. |
| `ENDPOINTS.md` | Anleitung: Token/Page-ID holen + die genauen Graph-API-Calls. | Wenn es um echte Meta-Calls/Felder geht. |
| `GO-LIVE.md` | Schritt-für-Schritt-Checkliste für den User (Nicht-Coder) zum echten Anschluss. | Wenn der User „echte Daten anschließen" will. |
| `AUDIT.md` | Fachliches Audit (Kennzahl-Logik, Korrektheit, Roadmap). | Bei Fragen zu Kennzahl-Richtigkeit. |
| `README.md` | Kurze Beschreibung für Menschen. | Selten. |
| `data/sample-*.json` | Beispieldaten (laufen, wenn keine echten da sind). | Datenformat nachschauen. |

---

## 🛠️ Häufige Aufgaben → wo anpacken

- **Meta hat ein Feld umbenannt / Wert bleibt 0** → User kann es selbst auf der
  **„Endpoints"-Seite** im Dashboard ändern. Im Code: `src/config.js` → `DEFAULT_ENDPOINTS`.
  Der Abruf liest die Namen über das `ep`-Objekt in `meta.js`.
- **Anzeige/Chart/Layout ändern** → `index.html`, Funktionen `renderWeek` / `renderMonth` /
  `renderQuarter` / `renderExplorer` / `renderEndpoints` / `renderDoku`; Routing in `render()`.
- **Neue Kennzahl** → Registry `dashboard/public/metrics.js` + ggf. `derive()` in `index.html`.
- **Neue API-Route** → `server.js` (Muster: bestehende `/api/*`-Blöcke).
- **YouTube anbinden (Phase 4)** → existiert noch NICHT; eigene Google-OAuth + Analytics API v2.

---

## ▶️ Starten & prüfen

```bash
npm run dashboard      # Server auf http://localhost:4317  (oder: Doppelklick „Dashboard starten.bat")
node test-fetch.mjs    # Abruf-Logik testen
node test-posts.mjs    # Beitrags-Logik testen
```

---

## 📍 Stand (Kurzfassung)

- **Fertig:** Wochen-/Monats-/Quartalsreport + Explorer für Instagram & Facebook, Export
  (Excel/PDF/PPT), Drag&Drop-KPIs, „Endpoints"- & „Doku"-Seite. Läuft mit Beispieldaten,
  bereit für echten Anschluss. Tests grün.
- **Watch-Item:** FB-Beitrags-Reichweite/Views nutzen Felder, die Meta am 15.06.2026 umstellt
  → ggf. 0 (kein Crash); Fix = neue Feldnamen auf der Endpoints-Seite eintragen. Details `GO-LIVE.md`.
- **Offen:** echten Token anschließen (User), dann Phase 2 (Beitrags-Insights), 3 (Ads/Paid), 4 (YouTube).
- **User** = Nicht-Coder, Deutsch. Tech-Entscheidungen selbst treffen + kurz erklären, nicht zur
  Abstimmung stellen. Abhängigkeiten minimal halten (Windows).
