# ✅ GO-LIVE — Echte Daten anschließen (Checkliste für morgen)

> Ergebnis des Experten-Audits (14.06.2026): **Die komplette Datenstrecke ist
> startklar.** Es wurde mit simulierten echten Daten (1 Woche, nur FB+IG, viele
> Null-Werte) durchgetestet — nichts bricht, keine Fehler, alle Werte plausibel.
> Diese Liste führt dich Schritt für Schritt durch den ersten echten Anschluss.

---

## Schritt 1 — Dashboard starten
Doppelklick auf **`Dashboard starten.bat`**. Das schwarze Fenster offen lassen,
der Browser öffnet sich automatisch.

## Schritt 2 — Token + Page-ID holen
Folge **`ENDPOINTS.md`, Teil A**. Kurzfassung:
1. https://developers.facebook.com/tools/explorer öffnen, deine App wählen.
2. „Generate Access Token" → diese Rechte anhaken: `pages_read_engagement`,
   `pages_show_list`, `instagram_basic`, `instagram_manage_insights`, `read_insights`.
3. Abfrage `me/accounts` ausführen → bei deiner Seite stehen `"id"` (= Page-ID)
   und `"access_token"` (= Page-Token).

> ⚠️ **WICHTIG für Dauerbetrieb:** Der Explorer-Token läuft nach 1–2 Stunden ab.
> Zum Testen morgen reicht er. Aber damit das **wöchentliche Sammeln** dauerhaft
> klappt, brauchst du einen **langlebigen Token** → `ENDPOINTS.md`, Teil A3
> (Systembenutzer). Sonst musst du jede Woche einen neuen Token holen.

## Schritt 3 — Im Dashboard verbinden
Oben auf **„⚙ Verbindung"** → Page-ID + Token eintragen → speichern.
Das Dashboard prüft sofort gegen die echte Meta-API:
- ✅ Grün „Verbunden mit … und @…" → weiter zu Schritt 4.
- ❌ Rote Meldung mit `#190` / `#100` / `#10` → Bedeutung steht in
  `ENDPOINTS.md`, Teil D (meist Token falsch/abgelaufen oder Recht fehlt).

## Schritt 4 — Erste echte Woche holen
Auf **„Daten aktualisieren"** klicken. Das Dashboard holt die laufende Woche,
**speichert sie lokal** (`data/weekly.json`) und zeigt sie an.

---

## Was du am ersten Tag SEHEN wirst (alles normal, kein Fehler!)

Beim ersten echten Anschluss sind manche Werte bewusst noch **0** — das ist
**kein Bug**, sondern liegt daran, dass diese Zahlen erst in späteren Ausbaustufen
geholt werden:

| Wert | Erste Woche | Warum |
|---|---|---|
| **Facebook**: Reichweite, Views, Interaktionen, Follower | ✅ echt | läuft sofort |
| **Instagram**: Reichweite, Views, Follower(+Zuwachs) | ✅ echt | läuft sofort |
| Instagram: Interaktionen, Saves, Shares | ⏳ 0 | kommen aus Beitrags-Insights (Phase 2) |
| Profilaufrufe, Link-Taps | ⏳ 0 | Meta hat Account-Felder abgeschafft → Beitrags-Ebene (Phase 2) |
| Bezahlt/Organisch-Aufteilung (Paid-Split) | ⏳ Paid 0 | braucht Werbe-API (Phase 3) |
| **YouTube** | ❌ fehlt | eigene Google-Anbindung (Phase 4) |

→ Die Raten (z. B. ER) zeigen dann sauber **0,0 %** oder **„–"**, nichts stürzt ab.

> **Nur 1 Woche da?** Völlig normal. Monat/Quartal und die Vergleiche „füllen sich",
> sobald du **jede Woche** einmal sammelst. Deshalb das orange Erinnerungs-Banner.

---

## ⚠️ Das EINE, was du morgen im Auge behalten solltest

**Heute/Morgen (15.06.2026) stellt Meta ~85 „Reichweite"-Metriken um** auf neue
„Viewer/Unique-Views"-Felder.
- **Wochen-Reichweite (FB + IG):** dafür ist das Dashboard **schon vorbereitet** —
  es probiert automatisch den neuen Feldnamen und fällt sonst auf den alten zurück.
- **Beitrags-Ebene (Content-Galerie, Phase 2):** ist jetzt **ebenfalls vorbereitet** —
  der Abruf probiert zuerst die neuen Felder (`post_media_view` /
  `post_total_media_views_unique`) und fällt sonst auf die alten zurück, genau wie
  auf Wochen-Ebene. Greift der neue Name am Live-Account anders, kannst du ihn auf
  der **„Endpoints"-Seite** unter „Facebook · Beiträge" anpassen (Felder „… NEU").

**Prüf-Tipp:** Nach dem ersten Abruf liegt in `data/last-fetch-debug.json` ein
Protokoll. Steht dort eine Zeile wie „metric … is not valid", wurde ein Feldname
abgelehnt → in `ENDPOINTS.md` Teil C den neuen Namen nachschlagen.

---

## 🔑 Token erneuern (wenn das orange Zugang-Banner erscheint)
Ein langlebiger Token gilt **~60 Tage**. Das Dashboard warnt dich **7 Tage vorher**
mit einem orangen Banner oben. So erneuerst du ihn (dauert 2 Minuten):
1. https://developers.facebook.com/tools/explorer öffnen, deine App wählen.
2. Wie in **Schritt 2** einen neuen **langlebigen** Page-Token holen
   (`ENDPOINTS.md`, Teil A3 — Systembenutzer-Token läuft am längsten).
3. Im Dashboard oben auf **„Verbindung"** → den **neuen** Token eintragen → speichern.
4. Fertig — das Banner verschwindet, das Ablaufdatum wird neu gesetzt.

> Tipp: Trag dir eine Kalender-Erinnerung ~alle 50 Tage ein, dann kommst du dem
> Banner sogar zuvor. Das Datum ist eine **Schätzung** ab dem letzten Verbinden.

---

## Datensicherung (1× einrichten lohnt sich)
Alles liegt **nur lokal** in `data/`. Meta liefert vergangene Wochen **nicht** nach.
→ Kopiere den Ordner **`data/`** ab und zu auf einen USB-Stick / externe Platte.
Geht der Ordner verloren, ist der Verlauf weg.
