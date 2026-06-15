# 🔍 Experten-Audit — Social-Media Reporting Dashboard

> Review auf **Richtigkeit, Logik & Marketing-Korrektheit**. Stand: **13.06.2026**.
> Perspektive: Marketing-Analytics + Technik. Ehrliche Einschätzung — inkl. dem, was (noch) nicht stimmt.

---

## 0. Gesamturteil

Das Dashboard ist **technisch solide und konzeptionell durchdacht**: zentrale Metrik-Registry,
channel-aware Anzeige, sauberer Funnel (Reichweite → Engagement → Conversion → Wachstum),
robuster Fetcher, 0 Runtime-Dependencies, durchgängig im Browser verifiziert.
Es ist **bereit für den Live-Anschluss von Instagram + Facebook**. Die offenen Punkte sind
**bewusste Phasen** (YouTube, Post-Insights, Paid-Split), keine Baufehler.

**Ampel:** 🟢 Architektur · 🟢 Wochen-Logik · 🟢 IG/FB-Endpoints (v25.0) · 🟡 Aggregat-Reichweite (siehe 1.1) · 🟡 Paid-Split (Platzhalter) · 🔴 YouTube (nicht verdrahtet).

---

## 1. Korrektheit & Logik der Kennzahlen

### 1.1 Aggregierte Reichweite (Monat/Quartal) — WICHTIG ✅ transparent gemacht
**Befund:** „Reichweite" = einzelne **Personen**. Über Wochen wird sie aktuell **summiert**
(`aggregate()`), d. h. wer in KW23 **und** KW24 erreicht wurde, zählt **doppelt**. Eine echte
entdoppelte Monats-/Quartals-Reichweite gibt es nur über einen **Monats-/Zeitraum-Abruf** der API.
**Status:** Korrekt eingeordnet — Monat & Quartal zeigen jetzt einen sichtbaren Hinweis
(„Reichweite = Summe der Wochen, Personen können mehrfach zählen"). Views & Interaktionen sind
dagegen sauber summierbar. **Empfehlung Phase 2/3:** zusätzlich einen echten Monats-Reichweiten-Abruf
ziehen und als „unique" getrennt ausweisen.

### 1.2 Reichweitenrate > 100 % ✅ Erklärung präzisiert
**Befund:** `reach ÷ followers × 100` kann >100 % sein (Screenshot: 203,7 %). Das ist **gut**
(virale / Nicht-Follower-Reichweite), die alte Tooltip-Erklärung „Anteil deiner Audience" war
dann aber irreführend. **Status:** Erklärung umformuliert (>100 % ist normal & positiv erklärt).

### 1.3 ER-Definitionen 🟢 korrekt
- **ER (Reichweite)** = Interaktionen ÷ Betrachter — die ehrlichste Qualitätszahl.
- **ER (Follower)** = Interaktionen ÷ Follower — gut für Benchmarks.
- Raten-Deltas werden korrekt in **Prozentpunkten (pp)** ausgewiesen, absolute Werte in **%**. Sauber unterschieden.

### 1.4 Wachstumsrate / Follower-Logik 🟢 korrekt
`followersGained` = tägliche Netto-Neu-Follower aufsummiert (richtig für „dazu"), `followersTotal`
= aktueller Gesamtstand. `growthRate = gained ÷ (total − gained)` = Wachstum auf Wochen-/Monatsbasis. Korrekt.
Kanalübergreifend (Quartal) summiert `crossDerive()` Follower-Stände **je Kanal** korrekt
(kein fehlerhaftes flatMap mehr).

### 1.5 Delta-Pfeil-Richtung 🟡 kleine Unschärfe
Der grüne ↑ / rote ↓ nimmt an: **hoch = gut**. Für die meisten Kennzahlen stimmt das. Ausnahme:
**„Abos −" (subsLost)** im Video-Block — mehr verlorene Abos ist schlecht, würde aber grün-↑ zeigen.
**Empfehlung (niedrige Prio):** pro Metrik ein `higherIsBetter`-Flag in der Registry, Pfeilfarbe danach.

### 1.6 Engagement-Zusammensetzung 🟡 Näherung (dokumentiert)
„Likes & Kommentare = Interaktionen − Saves − Shares" ist eine **Account-Näherung**; exakte
Aufschlüsselung kommt mit Beitrags-Insights (Phase 2). Ist im UI bereits als Näherung gekennzeichnet.

---

## 2. API-Endpoints & Calls (Recherche-Stand 13.06.2026)

### 2.1 Was bestätigt korrekt ist 🟢
- **Version v25.0** gepinnt — ist die aktuelle (Release 18.02.2026).
- **Verbindungs-Call** (`/{PAGE_ID}?fields=…instagram_business_account{…}`) — Standard, korrekt.
- **IG**: `reach,views` (`metric_type=total_value`, `period=week`) + `follower_count` (`period=day`) — gültige Namen 2026.
- **FB**: `page_views_total`, `page_post_engagements`, `page_fan_adds` — **überleben** den Juni-2026-Umbau (nicht in der Streichliste).
- **Robustheit:** `tryGraph` → ein falscher Metrikname setzt nur diesen Wert auf 0 + Debug-Eintrag, statt alles abzubrechen.

### 2.2 15.06.2026-Umbau — abgesichert ✅
Meta retired ~85 Reach/Impressions-Metriken → „Media Views/Viewers". **Neue Feldnamen recherchiert & eingebaut:**
FB-Reichweite läuft jetzt über **`page_total_media_view_unique`** mit Fallback **`page_impressions_unique`**
(isolierter Call). Beitrags-Ebene (Phase 2): `post_total_media_views_unique` / `post_media_view`.
Dokumentiert in `src/config.js` (`FB_VIEWER_METRICS`) und `ENDPOINTS.md`.

### 2.3 Am Live-Account zu verifizieren 🟡
- **`profile_links_taps`** (IG Link-Taps): als Account-Metrikname **nicht sicher belegt**. Fällt sauber auf 0,
  steht im Debug-Log — mit der ersten echten Antwort korrekten Namen eintragen.
- **`period=week` + `total_value`** bei IG reach/views — Kombi gegenprüfen.
- Rollout-Timing des Reach-Umbaus schwankt in den Quellen zwischen **15.06. und 30.06.2026**.

---

## 3. Lücken pro Plattform (bewusste Phasen)

| Plattform | Offen |
|---|---|
| **YouTube** 🔴 | **Komplett unverdrahtet** — nur Konstanten, kein Abruf-Code, keine Google-OAuth. YT-Zahlen kommen aktuell **nur aus Beispieldaten.** Braucht: Google-Cloud-Projekt + OAuth + `youtubeanalytics.googleapis.com/v2/reports`. |
| **Instagram** 🟡 | `interactions/saves/shares` = 0 (→ Phase 2 Beitrags-Insights), `profileViews` = 0 (Meta-Umbau). |
| **Facebook** 🟡 | `reach` jetzt verdrahtet; Saves/Shares auf Beitragsebene fehlen (Phase 2). |
| **Alle** 🟡 | **Paid/Organic-Split** ist Platzhalter (alles `paid:0`) → echter Split via **Marketing/Ads-API** (Phase 3). |

---

## 4. Technik & Robustheit 🟢

- **0 Runtime-Dependencies** (Windows-robust); Chart.js + PptxGenJS nur per CDN.
- Fetcher fängt einzelne Metrik-Fehler ab (kein Total-Crash), Debug in `data/last-fetch-debug.json`.
- `weekStart` immer ISO-Montag (`isoMonday`) — Zeitraum-Filter & Sammel-Erinnerung verlassen sich darauf.
- Captions/URLs werden ge-`escHtml`t (XSS-sicher bei echten API-Texten).
- Datums-Logik year-safe (über `weekStart`, nicht bloße KW-Nummer) — Jahreswechsel getestet.

**Empfehlung:** beim ersten Live-Abruf einmal das Debug-Log durchsehen (genau dafür gebaut).

---

## 5. Priorisierte Roadmap

1. **IG + FB live testen** — Token/Page-ID im Wizard, erste echte Woche, Debug-Log prüfen (verifiziert 2.3).
2. **Phase 2 — Post-Insights** — echte Beitragsdaten (interactions/saves/shares, Thumbnails/permalinks); macht die 0-Werte & die Galerie echt.
3. **Phase 3 — Marketing/Ads-API** — echter Paid/Organic-Split.
4. **Phase 4 — YouTube** — Google-OAuth + Analytics API.
5. **Feinschliff** — echte unique Monats-Reichweite (1.1), `higherIsBetter`-Flag (1.5).

---

*Dieses Audit ergänzt `HANDOFF.md` (Architektur/Dateien) und die Auto-Memory. Bei Widerspruch gilt der Code.*
