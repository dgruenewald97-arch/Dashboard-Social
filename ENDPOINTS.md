# 📡 Endpoint-Doku — die funktioniert (Stand 13.06.2026, API v25.0)

Diese Doku ist bewusst **knapp und korrekt**. Alle Calls gehen über die gepinnte
Version `v25.0` (siehe `src/config.js`). Veraltete Felder sind klar markiert.

---

## TEIL A — Page-ID & Token holen (am Montag, in 5 Minuten)

### A1. Voraussetzung
- Instagram = **Business-/Creator-Konto**, verbunden mit deiner **Facebook-Seite**.
- Du bist Admin der Seite.

### A2. Token + Page-ID im Graph API Explorer
1. Öffne **https://developers.facebook.com/tools/explorer**
2. Oben rechts: deine **App** wählen.
3. **„Generate Access Token"** klicken, diese Berechtigungen anhaken:
   - `pages_read_engagement`
   - `pages_show_list`
   - `instagram_basic`
   - `instagram_manage_insights`
   - `read_insights`
4. Abfrage eingeben: **`me/accounts`** → ▶ ausführen.
5. In der Antwort pro Seite:
   - `"id"`  → **das ist deine Page-ID**
   - `"access_token"` → **das ist dein Page-Token**

> ✅ Diese beiden Werte trägst du im Dashboard unter **„⚙ Verbindung"** ein.
> Das Dashboard testet sie sofort und sagt dir, ob's klappt.

### A3. (Optional) Token, der nicht abläuft
Ein Page-Token aus dem Explorer kann nach 1–2 Std. ablaufen. Für Dauerbetrieb:
1. **https://business.facebook.com/settings/system-users**
2. Systembenutzer anlegen → Rolle **Admin**.
3. **Assets zuweisen** → deine Facebook-Seite (Vollzugriff).
4. **Token generieren** → App + obige Berechtigungen → kopieren.
→ Dieser Token ist langlebig. Im Dashboard genauso eintragen.

---

## TEIL B — Die Calls, die das Dashboard macht

Basis-URL: `https://graph.facebook.com/v25.0`
Jeder Call hängt `&access_token=DEIN_TOKEN` an.

### B1. Verbindung prüfen (`/api/connect`)
```
GET /{PAGE_ID}?fields=name,followers_count,instagram_business_account{id,username,followers_count}
```
Liefert Seitenname + verbundenen Instagram-Account (dessen `id` = `IG_USER_ID`).

### B2. Instagram — Account-Insights pro Woche
```
GET /{IG_USER_ID}/insights?metric=reach,views&metric_type=total_value&period=week
GET /{IG_USER_ID}/insights?metric=profile_links_taps&metric_type=total_value&period=week
GET /{IG_USER_ID}/insights?metric=follower_count&period=day
GET /{IG_USER_ID}?fields=followers_count
```
- `views` = ersetzt das alte `impressions` (seit März 2025).
- `metric_type=total_value` ist bei vielen Account-Metriken **Pflicht**.

### B3. Facebook — Seiten-Insights pro Woche
```
GET /{PAGE_ID}/insights?metric=page_views_total,page_post_engagements,page_fan_adds&period=week
GET /{PAGE_ID}?fields=followers_count
```

### ⚠ B4. Reach → Viewer (ab 15.06.2026!) — Feldname jetzt bekannt
Meta retired ~85 **Reach**-Metriken und ersetzt sie durch **„Media Viewers /
Unique Views"**. **Recherchierte neue Feldnamen (13.06.2026):**
```
GET /{PAGE_ID}/insights?metric=page_total_media_view_unique&period=week   ← NEU = FB-Reichweite
GET /{PAGE_ID}/insights?metric=page_impressions_unique&period=week        ← ALT (Fallback bis Umstellung)
```
Der Fetcher (`src/meta.js`) macht genau das: erst das neue Feld, sonst das alte —
isoliert, damit ein noch ungültiger Name die anderen FB-Werte nicht abschießt.
Beitrags-Ebene (Phase 2): `post_total_media_views_unique` / `post_media_view`.
**Mit der ersten echten Antwort am Live-Account gegenprüfen** (Rollout-Timing
schwankt in den Quellen zwischen 15.06. und 30.06.2026).

> ⚠ Ebenfalls verifizieren: **`profile_links_taps`** (IG Link-Taps) ist als
> Account-Metrikname nicht sicher belegt. Schlägt er fehl, steht's im Debug-Log
> (`data/last-fetch-debug.json`) und `linkTaps` bleibt 0 — dann korrekten Namen eintragen.

---

## TEIL C — Tote Felder (NICHT mehr verwenden)

| Tot | Ersatz | Seit |
|---|---|---|
| `impressions` (IG) | `views` | März 2025 |
| `page_impressions` (FB) | `views` / `page_views_total` | Nov 2025 |
| `website_clicks` | `profile_links_taps` | Dez 2024 |
| `profile_impressions` | `views` | März 2025 |
| `page_fans` | `page_fan_adds` / `followers_count` | 2023 |
| `reach` (diverse) | `Viewer / Unique Views` | **15.06.2026** |

---

## TEIL D — Häufige Fehler

| Meldung | Bedeutung | Lösung |
|---|---|---|
| `(#190) access token` | Token falsch/abgelaufen | neuen Token holen (A2/A3) |
| `(#100) ... does not exist` | falsche ID oder IG nicht verbunden | A1 + Page-ID prüfen |
| `(#10) requires permission` | Berechtigung fehlt | Berechtigung in A2 nachhaken |
| `(#80004) too many calls` | Rate-Limit | kurz warten, seltener abrufen |
| `metric ... is not valid` | Feld umbenannt/deprecated | Teil C prüfen, neuen Namen eintragen |
| leere `data: []` | Account zu neu / kein Zeitraum | ein paar Tage Daten abwarten |

---

## TEIL E — YouTube (Phase 4, separat)

YouTube läuft NICHT über Meta, sondern über die **YouTube Analytics API v2**
(Google Cloud Projekt + OAuth):
```
GET https://youtubeanalytics.googleapis.com/v2/reports
    ?ids=channel==MINE&startDate=..&endDate=..
    &metrics=views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,subscribersLost
```
Bauen wir auf, sobald Instagram + Facebook stabil laufen.
