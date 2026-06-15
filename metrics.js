// ═══════════════════════════════════════════════════════════════════════════
//  METRIK-REGISTRY — das Fundament des Dashboards.
//  EINE zentrale Definition für ALLE Kanäle. Jede Metrik bringt mit:
//   • label   Anzeigename
//   • group   Funnel-Ebene (reach → engagement → conversion → growth)
//   • format  "int" (Zahl) oder "rate" (Prozent)
//   • channels  wo es die Metrik gibt ("all" oder Liste) → channel-aware Anzeige
//   • hero    headline-Kennzahl (größer hervorgehoben)
//   • desc    Klartext-Erklärung (→ ℹ️-Info-Karte)
//   • formula Rechenweg (→ ℹ️-Info-Karte)
//   • get     wie der Wert aus dem berechneten Objekt gelesen wird
//  Neue Metrik? Nur hier eintragen — Karten, Info-Tipps & Tabellen ziehen
//  sich das automatisch.
// ═══════════════════════════════════════════════════════════════════════════

const METRICS = {
  // ── Reichweite ──
  reach: {
    label: "Betrachter (Reichweite)", group: "reach", format: "int", channels: "all", hero: true,
    desc: "Anzahl einzelner Menschen, die deine Inhalte gesehen haben (nicht Klicks, sondern Personen).",
    formula: "Unique Views — ersetzt ab 15.06.2026 die klassische Reichweite (Meta Viewer-Metrik).",
    get: d => d.reach,
  },
  views: {
    label: "Views (Aufrufe)", group: "reach", format: "int", channels: "all", hero: true,
    desc: "Wie oft Inhalte insgesamt angezeigt/abgespielt wurden — eine Person kann mehrfach zählen.",
    formula: "Ersetzt das alte „Impressions“ (Meta seit 2025).",
    get: d => d.views,
  },

  // ── Engagement-Qualität ──
  interactions: {
    label: "Interaktionen", group: "engagement", format: "int", channels: "all", hero: true,
    desc: "Alle aktiven Reaktionen zusammen: Likes, Kommentare, Shares und Saves.",
    formula: "Likes + Kommentare + Shares + Saves.",
    get: d => d.interactions,
  },
  erReach: {
    label: "ER (Reichweite)", group: "engagement", format: "rate", channels: "all", hero: true,
    desc: "Engagement-Rate bezogen auf erreichte Menschen — die ehrlichste Qualitäts-Kennzahl.",
    formula: "Interaktionen ÷ Betrachter × 100.",
    target: 4.0, benchmark: 2.0,
    get: d => d.erReach,
  },
  erFollower: {
    label: "ER (Follower)", group: "engagement", format: "rate", channels: "all",
    desc: "Engagement-Rate bezogen auf alle Follower — gut für Branchen-Benchmarks.",
    formula: "Interaktionen ÷ Follower gesamt × 100.",
    target: 3.0, benchmark: 1.5,
    get: d => d.erFollower,
  },
  saves: {
    label: "Saves", group: "engagement", format: "int", channels: ["instagram"],
    desc: "Wie oft ein Beitrag gespeichert wurde — starkes Qualitätssignal bei Instagram.",
    formula: "Direkt aus den Insights (nur Instagram).",
    get: d => d.saves,
  },
  shares: {
    label: "Shares", group: "engagement", format: "int", channels: "all",
    desc: "Wie oft Inhalte geteilt wurden — erhöht organische Reichweite stark.",
    formula: "Direkt aus den Insights.",
    get: d => d.shares,
  },

  // ── Conversion ──
  linkTapRate: {
    label: "Link-Tap-Rate", group: "conversion", format: "rate", channels: ["instagram", "facebook"],
    desc: "Anteil der Aufrufe, der auf einen Link getippt hat.",
    formula: "Link-Taps ÷ Views × 100.",
    target: 1.0, benchmark: 0.6,
    get: d => d.linkTapRate,
  },
  profileViews: {
    label: "Profilaufrufe", group: "conversion", format: "int", channels: ["instagram", "facebook"],
    desc: "Wie oft dein Profil bzw. deine Seite aufgerufen wurde.",
    formula: "Direkt aus den Insights (bei Meta aktuell im Umbau).",
    get: d => d.profileViews,
  },

  // ── Wachstum ──
  followersTotal: {
    label: "Follower gesamt", group: "growth", format: "int", channels: "all",
    desc: "Aktueller Gesamtstand an Followern bzw. Abonnenten.",
    formula: "Stand am Ende des Zeitraums.",
    get: d => d.followersTotal,
  },
  followersGained: {
    label: "Follower dazu", group: "growth", format: "int", channels: "all",
    desc: "Netto neu gewonnene Follower im Zeitraum.",
    formula: "Follower-Ende − Follower-Anfang.",
    get: d => d.followersGained,
  },
  growthRate: {
    label: "Wachstumsrate", group: "growth", format: "rate", channels: "all",
    desc: "Prozentuales Follower-Wachstum — relativ, daher fair über alle Kontogrößen.",
    formula: "Follower dazu ÷ Follower-Anfang × 100.",
    target: 2.0, benchmark: 1.0,
    get: d => d.growthRate,
  },
  reachRate: {
    label: "Reichweitenrate", group: "growth", format: "rate", channels: "all",
    desc: "Reichweite im Verhältnis zur Follower-Basis. Über 100 % ist gut und normal: du erreichst dann mehr Menschen als du Follower hast (virale / Nicht-Follower-Reichweite).",
    formula: "Betrachter ÷ Follower gesamt × 100.",
    target: 30.0, benchmark: 20.0,
    get: d => d.reachRate,
  },
};

// Funnel-Reihenfolge der Gruppen.
const METRIC_GROUPS = [
  { key: "reach", label: "Sichtbarkeit (Attract)" },
  { key: "engagement", label: "Interaktion (Engage)" },
  { key: "conversion", label: "Aktion (Convert)" },
  { key: "growth", label: "Community (Grow)" },
];

// Video-Metriken (nur Kanäle/Beiträge mit Video — dynamisch, nicht pro Kanal fix).
const VIDEO_METRICS = {
  watchTimeHours:    { label: "Watch Time (Std.)",   format: "int",  desc: "Gesamte Wiedergabezeit in Stunden — YouTubes wichtigstes Ranking-Signal.", formula: "Summe aller Wiedergabesekunden ÷ 3600." },
  avgViewDurationSec:{ label: "Ø Wiedergabe (Sek.)", format: "int",  desc: "Wie lange im Schnitt pro Aufruf geschaut wird.", formula: "Watch Time ÷ Views." },
  retentionPct:      { label: "Ø Halterate",          format: "rate", desc: "Anteil des Videos, der im Schnitt gesehen wird.", formula: "Ø Wiedergabedauer ÷ Videolänge × 100." },
  subsGained:        { label: "Abos +",               format: "int",  desc: "Neu gewonnene Abonnenten im Zeitraum.", formula: "Direkt aus der YouTube Analytics API." },
  subsLost:          { label: "Abos −",               format: "int",  desc: "Verlorene Abonnenten im Zeitraum.", formula: "Direkt aus der YouTube Analytics API.", higherIsBetter: false },
  thumbnailCTR:      { label: "Thumbnail-CTR",         format: "rate", desc: "Klickrate auf das Vorschaubild — entscheidet, ob Videos angeklickt werden.", formula: "Klicks ÷ Thumbnail-Impressions × 100." },
};

// Ist eine Metrik für diesen Kanal verfügbar?
function metricAvailable(key, channel) {
  const m = METRICS[key];
  return m && (m.channels === "all" || m.channels.includes(channel));
}
