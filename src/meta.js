// ───────────────────────────────────────────────────────────────────────────
//  Meta-Anbindung (Instagram + Facebook). Wird vom Server UND vom CLI genutzt.
//  Alle Calls gehen über die gepinnte Version aus config.js.
//  Robust gebaut: Wenn ein einzelner Metrik-Name (gerade im Umbau bei Meta)
//  fehlschlägt, bricht NICHT alles ab — der Wert wird 0 und im Debug vermerkt.
// ───────────────────────────────────────────────────────────────────────────

import { META_API_VERSION, DEFAULT_ENDPOINTS } from "./config.js";

const BASE = `https://graph.facebook.com/${META_API_VERSION}`;

async function graph(path, params, token) {
  const url = new URL(`${BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", token);
  const res = await fetch(url);
  const json = await res.json();
  if (json.error) {
    const e = new Error(json.error.message);
    e.code = json.error.code;
    throw e;
  }
  return json;
}

function pick(insights, name) {
  // null-sicher: ein fehlgeschlagener Call liefert null (tryGraph) → sauberes null statt Crash.
  const m = insights?.data?.find((x) => x.name === name);
  if (!m) return null;
  if (m.total_value) return m.total_value.value ?? 0;
  return m.values?.at(-1)?.value ?? 0;
}

// Prüft Token + Page-ID und ermittelt den verbundenen Instagram-Account.
export async function validateConnection({ pageId, token }) {
  const data = await graph(
    pageId,
    { fields: "name,followers_count,instagram_business_account{id,username,followers_count}" },
    token
  );
  return {
    ok: true,
    version: META_API_VERSION,
    pageId,
    pageName: data.name,
    pageFollowers: data.followers_count ?? null,
    igUserId: data.instagram_business_account?.id ?? null,
    igUsername: data.instagram_business_account?.username ?? null,
    igFollowers: data.instagram_business_account?.followers_count ?? null,
  };
}

export function isoWeek(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((date - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return { kw: week, year: date.getUTCFullYear() };
}

// Montag (ISO) der Woche von d — als YYYY-MM-DD. Dashboard verlässt sich darauf,
// dass weekStart immer ein Montag ist (Zeitraum-Filter, Sammel-Erinnerung).
export function isoMonday(d = new Date()) {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7));
  return x.toISOString().slice(0, 10);
}

// Versucht eine Metrik-Gruppe; bei Fehler wird der Grund gemerkt statt zu crashen.
async function tryGraph(path, params, token, debug, tag) {
  try {
    return await graph(path, params, token);
  } catch (e) {
    debug.push(`${tag}: ${e.message}${e.code ? " (#" + e.code + ")" : ""}`);
    return null;
  }
}

// Eine IG-Account-Metrik für die Woche holen — ERST mit metric_type=total_value
// (neuer Standard seit der Impressions-Abschaffung), SONST klassisch ohne. Je Metrik
// isoliert, damit ein Verhalten nicht das andere blockiert. pick() liest beide
// Antwortformen (total_value.value bzw. values[].value). So wettet der Fetcher nicht
// auf eine Variante, sondern nimmt, was der Account real liefert.
async function igInsightWeek(igUserId, metric, token, debug, tag) {
  let v = pick(
    await tryGraph(`${igUserId}/insights`, { metric, metric_type: "total_value", period: "week" }, token, debug, `${tag} (total_value)`),
    metric
  );
  if (v == null) {
    v = pick(
      await tryGraph(`${igUserId}/insights`, { metric, period: "week" }, token, debug, `${tag} (period=week)`),
      metric
    );
  }
  return v;
}

// Eine IG-Account-Metrik für ein 28-Tage-Fenster holen.
async function igInsight28d(igUserId, metric, token, debug, tag) {
  let v = pick(
    await tryGraph(`${igUserId}/insights`, { metric, metric_type: "total_value", period: "days_28" }, token, debug, `${tag} (total_value)`),
    metric
  );
  if (v == null) {
    v = pick(
      await tryGraph(`${igUserId}/insights`, { metric, period: "days_28" }, token, debug, `${tag} (period=days_28)`),
      metric
    );
  }
  return v;
}

// Holt die laufende Woche für IG + FB. Gibt einen weekEntry + Debug-Infos zurück.
// ep = Endpoint-/Feldnamen (über die UI anpassbar); Default = config.js.
export async function fetchWeek({ pageId, igUserId, token }, ep = DEFAULT_ENDPOINTS) {
  const debug = [];
  const { kw, year } = isoWeek();

  // ── Instagram (Account-Ebene) ──
  let ig = null;
  if (igUserId) {
    // Betrachter (reach) & Views je isoliert + robust (total_value oder klassisch).
    const reachVal = await igInsightWeek(igUserId, ep.ig_week_reach, token, debug, "IG Betrachter (reach)");
    const viewsVal = await igInsightWeek(igUserId, ep.ig_week_views, token, debug, "IG Views");

    // Echte entdoppelte Monats-Reichweite (28-Tage-Fenster)
    const reach28Val = await igInsight28d(igUserId, ep.ig_week_reach, token, debug, "IG Betrachter 28d (reach)");
    const views28Val = await igInsight28d(igUserId, ep.ig_week_views, token, debug, "IG Views 28d");

    const follDay = await tryGraph(
      `${igUserId}/insights`,
      { metric: ep.ig_follower_count, period: "day" },
      token, debug, "IG follower_count"
    );
    const igProfile = await tryGraph(
      igUserId, { fields: "followers_count" }, token, debug, "IG followers_count"
    );
    // follower_count (period=day) = täglich NEU gewonnene Follower → über die Woche summieren.
    const gained = (follDay?.data?.[0]?.values ?? []).reduce((s, d) => s + (d.value || 0), 0);
    // Link-Taps: KEIN gültiges Account-Feld mehr (website_clicks seit Dez 2024 deprecated,
    // ohne Account-Ersatz; recherchiert 13.06.2026). Daher 0 — echte Link-Taps kommen aus
    // den Beitrags-Insights (Phase 2). Wir feuern KEINEN garantiert-fehlerhaften Call.
    debug.push("IG Link-Taps: kein gültiges Account-Feld mehr (website_clicks deprecated, kein Ersatz) → 0; kommt aus Beitrags-Insights (Phase 2).");
    ig = {
      views: { organic: viewsVal ?? 0, paid: 0 },
      reach: { organic: reachVal ?? 0, paid: 0 },
      reach28d: reach28Val ?? 0,
      views28d: views28Val ?? 0,
      interactions: 0,             // aus Post-Insights (Phase 2)
      profileViews: 0,             // profile_views in v21/v22 deprecated → am Live-Account prüfen
      linkTaps: 0,                 // siehe Hinweis oben (Account-Ebene nicht mehr verfügbar)
      followersGained: gained,
      followersTotal: igProfile?.followers_count ?? 0,
      saves: 0, shares: 0,
    };
  }

  // ── Facebook (Seite) ──
  const fbInsights = await tryGraph(
    `${pageId}/insights`,
    { metric: ep.fb_page_bundle, period: "week" },
    token, debug, "FB page insights"
  );
  // Reichweite = eindeutige Betrachter. AB 15.06.2026 heißt das Feld
  // `page_total_media_view_unique` (neue „Viewer"-Metrik); davor lieferte
  // `page_impressions_unique` die unique Reichweite. Erst neu versuchen, sonst alt —
  // ISOLIERTER Call, damit ein (noch) ungültiger Metrikname die anderen FB-Werte
  // (views/engagements/fans) NICHT mitreißt.
  let fbReachVal = pick(
    await tryGraph(`${pageId}/insights`, { metric: ep.fb_reach_new, period: "week" },
      token, debug, `FB Betrachter (${ep.fb_reach_new})`),
    ep.fb_reach_new
  );
  if (fbReachVal == null) {
    fbReachVal = pick(
      await tryGraph(`${pageId}/insights`, { metric: ep.fb_reach_old, period: "week" },
        token, debug, `FB Betrachter Fallback (${ep.fb_reach_old})`),
      ep.fb_reach_old
    );
  }

  // FB 28d Reichweite (für Monatsreport)
  let fbReach28Val = pick(
    await tryGraph(`${pageId}/insights`, { metric: ep.fb_reach_new, period: "days_28" },
      token, debug, `FB Betrachter 28d (${ep.fb_reach_new})`),
    ep.fb_reach_new
  );
  if (fbReach28Val == null) {
    fbReach28Val = pick(
      await tryGraph(`${pageId}/insights`, { metric: ep.fb_reach_old, period: "days_28" },
        token, debug, `FB Betrachter 28d Fallback (${ep.fb_reach_old})`),
      ep.fb_reach_old
    );
  }

  const fbInsights28d = await tryGraph(
    `${pageId}/insights`,
    { metric: ep.fb_page_views, period: "days_28" },
    token, debug, "FB page views insights 28d"
  );
  const fbViews28Val = pick(fbInsights28d, ep.fb_page_views) ?? 0;

  const fbProfile = await tryGraph(
    pageId, { fields: "followers_count" }, token, debug, "FB followers_count"
  );
  const fb = {
    views: { organic: pick(fbInsights, ep.fb_page_views) ?? 0, paid: 0 },
    reach: { organic: fbReachVal ?? 0, paid: 0 },
    reach28d: fbReach28Val ?? 0,
    views28d: fbViews28Val ?? 0,
    interactions: pick(fbInsights, ep.fb_page_engagements) ?? 0,
    profileViews: 0,
    linkTaps: 0,
    followersGained: pick(fbInsights, ep.fb_page_fan_adds) ?? 0,
    followersTotal: fbProfile?.followers_count ?? 0,
    saves: 0, shares: 0,
  };

  const channels = { facebook: fb };
  if (ig) channels.instagram = ig;

  return {
    weekEntry: { kw, year, weekStart: isoMonday(), channels },
    debug,
  };
}

// Holt die neuesten Beiträge (letzte 50) für IG + FB inkl. Metriken und Thumbnails.
export async function fetchPosts({ pageId, igUserId, token }, ep = DEFAULT_ENDPOINTS) {
  const debug = [];
  const posts = [];

  // ── Facebook Beiträge ──
  try {
    const fbRes = await tryGraph(
      `${pageId}/posts`,
      {
        limit: 50,
        fields: "id,message,created_time,permalink_url,full_picture,shares,reactions.summary(total_count),comments.summary(total_count),type"
      },
      token,
      debug,
      "FB Beiträge-Liste"
    );

    const fbRawPosts = fbRes?.data ?? [];
    if (fbRawPosts.length > 0) {
      const fbIds = fbRawPosts.map(p => p.id);
      // Zwei ISOLIERTE Batch-Calls: NEU-Felder (ab 15.06.2026) und ALT-Felder
      // getrennt. So reißt ein (nach dem Umbau ggf. ungültiger) alter Feldname
      // die neuen NICHT mit — gleiches Prinzip wie auf Seiten-Ebene (fb_reach_new/old).
      const fbNewMetrics = [ep.fb_post_views_new, ep.fb_post_reach_new].filter(Boolean).join(",");
      const fbOldMetrics = [
        ep.fb_post_views_total, ep.fb_post_reach_total,
        ep.fb_post_views_organic, ep.fb_post_views_paid,
        ep.fb_post_reach_organic, ep.fb_post_reach_paid,
      ].filter(Boolean).join(",");
      const fbInsightsNew = fbNewMetrics
        ? (await tryGraph("", { ids: fbIds.join(","), fields: `insights.metric(${fbNewMetrics})` },
            token, debug, "FB Beiträge-Insights NEU (Batch)") || {})
        : {};
      const fbInsightsOld = fbOldMetrics
        ? (await tryGraph("", { ids: fbIds.join(","), fields: `insights.metric(${fbOldMetrics})` },
            token, debug, "FB Beiträge-Insights ALT (Batch)") || {})
        : {};

      for (const p of fbRawPosts) {
        // NEU- und ALT-Antworten je Beitrag zusammenführen; getVal liest aus beiden.
        const mergedData = [
          ...(fbInsightsNew[p.id]?.insights?.data ?? []),
          ...(fbInsightsOld[p.id]?.insights?.data ?? []),
        ];
        const getVal = (name) => {
          if (!name) return 0;
          const m = mergedData.find(x => x.name === name);
          if (!m) return 0;
          if (m.total_value) return m.total_value.value ?? 0;
          return m.values?.at(-1)?.value ?? 0;
        };

        // Views/Reichweite gesamt: erst NEU-Feld, sonst ALT-Feld (Fallback).
        const postImpressions = getVal(ep.fb_post_views_new) || getVal(ep.fb_post_views_total);
        const postImpressionsUnique = getVal(ep.fb_post_reach_new) || getVal(ep.fb_post_reach_total);
        const postImpressionsOrganic = getVal(ep.fb_post_views_organic);
        const postImpressionsPaid = getVal(ep.fb_post_views_paid);
        const postImpressionsOrganicUnique = getVal(ep.fb_post_reach_organic);
        const postImpressionsPaidUnique = getVal(ep.fb_post_reach_paid);

        const likes = p.reactions?.summary?.total_count ?? 0;
        const comments = p.comments?.summary?.total_count ?? 0;
        const shares = p.shares?.count ?? 0;
        const saves = 0;
        const interactions = likes + comments + shares;

        const date = p.created_time ? p.created_time.slice(0, 10) : "";

        let type = "Status";
        if (p.type === "photo") type = "Bild";
        else if (p.type === "video") type = "Video";
        else if (p.type === "link") type = "Link";

        posts.push({
          id: p.id,
          channel: "facebook",
          type,
          caption: p.message || "",
          date,
          boosted: postImpressionsPaid > 0,
          views: {
            organic: postImpressionsOrganic || postImpressions,
            paid: postImpressionsPaid
          },
          reach: {
            organic: postImpressionsOrganicUnique || postImpressionsUnique,
            paid: postImpressionsPaidUnique
          },
          interactions,
          likes,
          comments,
          shares,
          saves,
          thumbnail: p.full_picture || null,
          permalink: p.permalink_url || null
        });
      }
    }
  } catch (e) {
    debug.push(`FB fetchPosts Fehler: ${e.message}`);
  }

  // ── Instagram Media ──
  if (igUserId) {
    try {
      const igRes = await tryGraph(
        `${igUserId}/media`,
        {
          limit: 50,
          fields: "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count"
        },
        token,
        debug,
        "IG Media-Liste"
      );

      const igRawMedia = igRes?.data ?? [];
      if (igRawMedia.length > 0) {
        const igIds = igRawMedia.map(m => m.id);
        const igMediaMetrics = [ep.ig_post_reach, ep.ig_post_views, ep.ig_post_saved, ep.ig_post_shares].filter(Boolean).join(",");
        const igInsightsRes = await tryGraph(
          "",
          {
            ids: igIds.join(","),
            fields: `insights.metric(${igMediaMetrics})`
          },
          token,
          debug,
          "IG Media-Insights (Batch)"
        ) || {};

        const reelsIds = igRawMedia
          .filter(m => m.media_product_type === "REELS" || m.media_type === "VIDEO")
          .map(m => m.id);

        let reelsInsightsRes = {};
        if (reelsIds.length > 0) {
          const igReelsMetrics = [ep.ig_reels_avg_watch, ep.ig_reels_total_time].filter(Boolean).join(",");
          reelsInsightsRes = await tryGraph(
            "",
            {
              ids: reelsIds.join(","),
              fields: `insights.metric(${igReelsMetrics})`
            },
            token,
            debug,
            "IG Reels-Insights (Batch)"
          ) || {};
        }

        for (const m of igRawMedia) {
          const postData = igInsightsRes[m.id] || {};
          const getVal = (name) => {
            const insight = postData?.insights?.data?.find(x => x.name === name);
            if (!insight) return 0;
            if (insight.total_value) return insight.total_value.value ?? 0;
            return insight.values?.at(-1)?.value ?? 0;
          };

          const reach = getVal(ep.ig_post_reach);
          const views = getVal(ep.ig_post_views);
          const saves = getVal(ep.ig_post_saved);
          const shares = getVal(ep.ig_post_shares);

          const likes = m.like_count ?? 0;
          const comments = m.comments_count ?? 0;
          const interactions = likes + comments + saves + shares;

          const date = m.timestamp ? m.timestamp.slice(0, 10) : "";

          let type = "Bild";
          if (m.media_type === "CAROUSEL_ALBUM") type = "Karussell";
          else if (m.media_product_type === "REELS" || m.media_type === "VIDEO") type = "Reel";

          const thumbnail = m.thumbnail_url || m.media_url || null;

          let videoData = null;
          if (type === "Reel") {
            const vData = reelsInsightsRes[m.id] || {};
            const getReelVal = (name) => {
              const insight = vData?.insights?.data?.find(x => x.name === name);
              if (!insight) return 0;
              if (insight.total_value) return insight.total_value.value ?? 0;
              return insight.values?.at(-1)?.value ?? 0;
            };

            const avgWatch = getReelVal(ep.ig_reels_avg_watch);
            const avgWatchSec = Math.round(avgWatch / 1000);

            videoData = {
              avgWatchSec: avgWatchSec || 0,
              retentionPct: 0
            };
          }

          posts.push({
            id: m.id,
            channel: "instagram",
            type,
            caption: m.caption || "",
            date,
            boosted: false,
            views: {
              organic: views,
              paid: 0
            },
            reach: {
              organic: reach,
              paid: 0
            },
            interactions,
            likes,
            comments,
            shares,
            saves,
            video: videoData,
            thumbnail,
            permalink: m.permalink || null
          });
        }
      }
    } catch (e) {
      debug.push(`IG fetchPosts Fehler: ${e.message}`);
    }
  }

  // Absteigend nach Datum sortieren
  posts.sort((a, b) => b.date.localeCompare(a.date));

  return { posts, debug };
}
