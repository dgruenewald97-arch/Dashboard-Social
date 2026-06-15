// ───────────────────────────────────────────────────────────────────────────
//  SINGLE SOURCE OF TRUTH — Stand der APIs: Juni 2026 (recherchiert).
//
//  Meta-API-Version FEST gepinnt. Stand: 13.06.2026 → neueste Version ist v25.0
//  (Release 18.02.2026). v20.0 wird am 24.09.2026 abgeschaltet.
//  Wenn Meta diese Version abschaltet (~2 Jahre), ändere ich NUR diese Zeile.
//
//  ⚠ WICHTIGSTE LAUFENDE ÄNDERUNG (ab 15.06.2026):
//  Meta retired ~85 REACH-Metriken (Post/Page Reach, Video/Story Impressions)
//  und ersetzt sie durch die neue "Page Viewer Metric" / "Unique Views" —
//  eine plattformübergreifende Zahl (FB + IG), wie viele MENSCHEN Inhalte sahen.
//  → In unseren Daten ist das Feld "reach" = diese Viewer/Unique-Views-Zahl.
//    Den exakten neuen Feldnamen am Live-Account verifizieren (Rollout Ende Juni).
// ───────────────────────────────────────────────────────────────────────────

export const META_API_VERSION = "v25.0";
export const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

// ───────────────────────────────────────────────────────────────────────────
//  DEPRECATION-LANDKARTE (was tot ist und was es ersetzt) — damit klar ist,
//  warum wir bestimmte Felder NICHT mehr verwenden.
// ───────────────────────────────────────────────────────────────────────────
export const DEPRECATED = {
  impressions: "views",          // IG: März 2025 · FB: Nov 2025 — Meta vereinheitlicht auf "views"
  page_impressions: "views",
  website_clicks: "KEIN Account-Ersatz (seit Dez 2024) — Link-Taps nur noch auf Beitrags-Ebene (Phase 2)",
  profile_impressions: "views",
  page_fans: "page_follows / page_fan_adds",
  reach: "Viewer / Unique Views (Page Viewer Metric, ab 15.06.2026)", // ~85 Reach-Metriken retired
  post_reach: "Unique Views",
  video_impressions: "views",
  story_impressions: "views",
};

// ─── INSTAGRAM — Account-Ebene (aktuelle Feldnamen) ─────────────────────────
// Viele dieser Metriken brauchen heute  metric_type=total_value .
// period: "week" für Reichweiten/Views-Fenster, "day" für follower_count.
export const IG_ACCOUNT_METRICS = {
  // "views" = der neue "Impressions"-Ersatz (bestätigt gültig 2026).
  // "reach" + "follower_count" sind 2026 weiter gültige Account-Metriken. "reach" ist
  // laut Feldliste „non-aggregatable" (NICHT über Wochen summierbar — siehe Monats-/Quartals-Hinweis im UI).
  // Der Fetcher holt reach/views robust: erst metric_type=total_value, sonst klassisch (igInsightWeek).
  week: ["reach", "views"],
  day: ["follower_count"],                    // Follower-Zuwachs pro Tag (tägl. Netto-Neu)
  // profile_views: in v21/v22 deprecated (März 2025) → am Live-Account prüfen, was zurückkommt.
  // ❌ Link-Taps: KEIN gültiges Account-Feld mehr. website_clicks ist seit Dez 2024 tot, OHNE
  //   Account-Ersatz (recherchiert 13.06.2026). Der Fetcher feuert deshalb KEINEN Link-Taps-Call
  //   (linkTaps=0, Vermerk im Debug-Log). Echte Link-Taps kommen aus den Beitrags-Insights (Phase 2).
};

// ─── INSTAGRAM — Beitrags-Ebene (für ER, Saves, Shares, Reels) ──────────────
export const IG_MEDIA_METRICS = [
  "reach",
  "views",                 // ersetzt media impressions
  "likes",
  "comments",
  "saved",
  "shares",
  "total_interactions",    // = likes + comments + shares + saves (− unlikes)
];
export const IG_REELS_METRICS = [
  "ig_reels_avg_watch_time",       // Ø Wiedergabedauer
  "ig_reels_video_view_total_time" // gesamte Wiedergabezeit
];

// ─── FACEBOOK — Seite (Organic/Paid-Split lebt hier nativ) ──────────────────
// page_impressions* ist seit Nov 2025 tot → views. Diese drei überleben den
// Juni-2026-Umbau (laut Changelog NICHT in der Deprecation-Liste).
export const FB_PAGE_METRICS = [
  "page_views_total",        // ersetzt page_impressions
  "page_post_engagements",   // Interaktion
  "page_fan_adds",           // Follower dazu (page_fans ist tot)
];
// ─── FACEBOOK — Reichweite / eindeutige Betrachter (15.06.2026-Umstellung) ───
// Recherchiert 13.06.2026: die ~85 Reach-Metriken werden retired, Ersatz =
// „Media Viewers". Konkrete neue API-Feldnamen (Page + Beitrag):
export const FB_VIEWER_METRICS = {
  pageUniqueViewers:       "page_total_media_view_unique",  // NEU (ab 15.06.2026) = unsere FB-„reach"
  pageUniqueViewersLegacy: "page_impressions_unique",        // ALT (vor 15.06.2026) — Fallback
  pageMediaViews:          "page_media_view",                // Page-Views (Ersatz für page_impressions)
  postUniqueViewers:       "post_total_media_views_unique",  // Beitrags-Ebene (Phase 2)
  postMediaViews:          "post_media_view",
};

// ─── YOUTUBE — Analytics API v2 (separater Endpoint, OAuth) ─────────────────
// GET https://youtubeanalytics.googleapis.com/v2/reports
export const YT_METRICS = [
  "views",
  "estimatedMinutesWatched",  // Watch Time
  "averageViewDuration",      // Ø Wiedergabedauer (Sek.)
  "averageViewPercentage",    // Halterate / Retention
  "subscribersGained",
  "subscribersLost",
  "likes", "comments", "shares",
];

// ─── Deutsche Anzeige-Namen fürs Dashboard ──────────────────────────────────
export const METRIC_LABELS = {
  views: "Views (Aufrufe)",
  reach: "Reichweite",
  interactions: "Interaktionen",
  erReach: "ER (Reichweite)",
  erFollower: "ER (Follower)",
  saves: "Saves",
  shares: "Shares",
  linkTaps: "Link-Taps",
  profileViews: "Profilaufrufe",
  followersGained: "Follower dazu",
  growthRate: "Wachstumsrate",
  reachRate: "Reichweitenrate",
};

// ───────────────────────────────────────────────────────────────────────────
//  ANPASSBARE ENDPOINTS / FELDNAMEN  (steuert den echten Abruf in meta.js)
//
//  Das sind genau die Graph-API-Feldnamen, die Meta von Zeit zu Zeit umbenennt
//  (z. B. die Reach→Viewer-Umstellung am 15.06.2026). Damit man bei einer
//  Umbenennung NICHT in den Code muss, sind sie hier zentral — und über den
//  Navi-Punkt „Endpoints" in der UI editierbar (gespeichert in endpoints.local.json,
//  das meta.js dann statt dieser Defaults verwendet). Leeres/ungültiges Feld =
//  der Fetcher merkt es im Debug-Log und liefert 0, statt abzustürzen.
// ───────────────────────────────────────────────────────────────────────────
export const DEFAULT_ENDPOINTS = {
  // ─ Instagram · Woche (Konto-Ebene) ─
  ig_week_reach:        "reach",
  ig_week_views:        "views",
  ig_follower_count:    "follower_count",
  // ─ Facebook · Woche (Seiten-Ebene) ─
  fb_page_bundle:       "page_views_total,page_post_engagements,page_fan_adds",
  fb_page_views:        "page_views_total",
  fb_page_engagements:  "page_post_engagements",
  fb_page_fan_adds:     "page_fan_adds",
  fb_reach_new:         "page_total_media_view_unique",
  fb_reach_old:         "page_impressions_unique",
  // ─ Facebook · Beiträge (Phase 2) ─
  // NEU (ab 15.06.2026): Views/Reichweite gesamt heißen jetzt media-view-Felder.
  // Werden ZUERST versucht; greifen sie (noch) nicht, fällt der Abruf auf die
  // alten post_impressions*-Felder zurück (genau wie auf Seiten-Ebene).
  fb_post_views_new:     "post_media_view",
  fb_post_reach_new:     "post_total_media_views_unique",
  fb_post_views_total:   "post_impressions",              // ALT (Fallback)
  fb_post_views_organic: "post_impressions_organic",
  fb_post_views_paid:    "post_impressions_paid",
  fb_post_reach_total:   "post_impressions_unique",        // ALT (Fallback)
  fb_post_reach_organic: "post_impressions_organic_unique",
  fb_post_reach_paid:    "post_impressions_paid_unique",
  // ─ Instagram · Beiträge (Phase 2) ─
  ig_post_reach:        "reach",
  ig_post_views:        "views",
  ig_post_saved:        "saved",
  ig_post_shares:       "shares",
  ig_reels_avg_watch:   "ig_reels_avg_watch_time",
  ig_reels_total_time:  "ig_reels_video_view_total_time",
};

// Beschreibungen + Gruppierung für die „Endpoints"-Seite im Dashboard.
export const ENDPOINT_FIELDS = [
  { group: "Instagram · Woche (Konto)", items: [
    { key: "ig_week_reach",       label: "Reichweite (Betrachter)", hint: "IG-Account-Metrik pro Woche. 2026 gueltig: reach." },
    { key: "ig_week_views",       label: "Views (Aufrufe)",         hint: "Ersetzt das alte impressions (seit Maerz 2025)." },
    { key: "ig_follower_count",   label: "Follower-Zuwachs/Tag",    hint: "Tageswert follower_count, wird ueber die Woche summiert." },
  ]},
  { group: "Facebook · Woche (Seite)", items: [
    { key: "fb_page_bundle",      label: "Seiten-Metriken (gebündelt)", hint: "Komma-Liste, in EINEM Call: Views, Interaktionen, neue Fans." },
    { key: "fb_page_views",       label: "  ↳ Views-Feld",          hint: "Name des Views-Felds im Bündel (auch für 28-Tage-Fenster)." },
    { key: "fb_page_engagements", label: "  ↳ Interaktions-Feld",   hint: "Name des Interaktions-Felds im Bündel." },
    { key: "fb_page_fan_adds",    label: "  ↳ Neue-Fans-Feld",      hint: "Name des Follower-Zuwachs-Felds im Bündel." },
    { key: "fb_reach_new",        label: "Reichweite NEU (ab 15.06.2026)", hint: "Neue Unique-Viewer-Metrik. Wird zuerst versucht." },
    { key: "fb_reach_old",        label: "Reichweite ALT (Fallback)", hint: "Altes Feld vor der Umstellung — Fallback, falls NEU (noch) nicht greift." },
  ]},
  { group: "Facebook · Beiträge (Phase 2)", items: [
    { key: "fb_post_views_new",     label: "Beitrag: Views NEU (ab 15.06.2026)", hint: "Neues Feld post_media_view. Wird zuerst versucht." },
    { key: "fb_post_views_total",   label: "Beitrag: Views ALT (Fallback)",  hint: "Altes post_impressions — Fallback, falls NEU (noch) nicht greift." },
    { key: "fb_post_views_organic", label: "Beitrag: Views organisch",   hint: "" },
    { key: "fb_post_views_paid",    label: "Beitrag: Views bezahlt",     hint: "" },
    { key: "fb_post_reach_new",     label: "Beitrag: Reichweite NEU (ab 15.06.2026)", hint: "Neues Feld post_total_media_views_unique. Wird zuerst versucht." },
    { key: "fb_post_reach_total",   label: "Beitrag: Reichweite ALT (Fallback)", hint: "Altes post_impressions_unique — Fallback, falls NEU (noch) nicht greift." },
    { key: "fb_post_reach_organic", label: "Beitrag: Reichweite organisch", hint: "" },
    { key: "fb_post_reach_paid",    label: "Beitrag: Reichweite bezahlt",   hint: "" },
  ]},
  { group: "Instagram · Beiträge (Phase 2)", items: [
    { key: "ig_post_reach",       label: "Beitrag: Reichweite", hint: "" },
    { key: "ig_post_views",       label: "Beitrag: Views",      hint: "" },
    { key: "ig_post_saved",       label: "Beitrag: Saves",      hint: "API-Feld heisst saved." },
    { key: "ig_post_shares",      label: "Beitrag: Shares",     hint: "" },
    { key: "ig_reels_avg_watch",  label: "Reel: Ø Wiedergabedauer", hint: "In Millisekunden; wird in Sekunden umgerechnet." },
    { key: "ig_reels_total_time", label: "Reel: Gesamt-Wiedergabezeit", hint: "" },
  ]},
];
