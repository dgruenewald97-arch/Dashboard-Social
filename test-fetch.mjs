// Temporärer Logik-Test für fetchWeek — simuliert die Graph-API per Mock-fetch.
// Prüft: total_value-Parsing, total_value→klassisch-Fallback, Follower-Summe,
// FB-Reach-Feld, und dass KEIN ungültiger Link-Taps-Call (profile_links_taps/website_clicks) abgeht.
import { fetchWeek } from "./src/meta.js";

const seenMetrics = [];

function mockFetch(scenario) {
  return async (url) => {
    const u = new URL(url);
    const path = u.pathname.split("/v25.0/")[1] || "";
    const metric = u.searchParams.get("metric");
    const metricType = u.searchParams.get("metric_type");
    const fields = u.searchParams.get("fields");
    const period = u.searchParams.get("period");
    if (metric) seenMetrics.push(metric + (metricType ? "|" + metricType : ""));

    const ok = (obj) => ({ json: async () => obj });
    const err = (msg, code) => ({ json: async () => ({ error: { message: msg, code } }) });

    // IG followers_count / FB followers_count (Node-Feld)
    if (fields === "followers_count") {
      return ok({ followers_count: path === "IGUSER" ? 1234 : 9999 });
    }
    // IG insights
    if (path === "IGUSER/insights") {
      if (metric === "reach") {
        if (period === "days_28") {
          return ok({ data: [{ name: "reach", total_value: { value: 15000 } }] });
        }
        if (scenario.failIgReachTotalValue && metricType === "total_value") return err("metric not valid with total_value", 100);
        if (metricType === "total_value") return ok({ data: [{ name: "reach", total_value: { value: 5000 } }] });
        return ok({ data: [{ name: "reach", values: [{ value: 4800 }] }] }); // klassisch (Fallback)
      }
      if (metric === "views") {
        if (period === "days_28") {
          return ok({ data: [{ name: "views", total_value: { value: 25000 } }] });
        }
        return ok({ data: [{ name: "views", total_value: { value: 8000 } }] });
      }
      if (metric === "follower_count") return ok({ data: [{ name: "follower_count", values: [{ value: 10 }, { value: 20 }, { value: 5 }] }] });
    }
    // FB Page insights
    if (path === "PAGE/insights") {
      if (metric === "page_views_total,page_post_engagements,page_fan_adds") {
        return ok({ data: [
          { name: "page_views_total", values: [{ value: 3000 }] },
          { name: "page_post_engagements", values: [{ value: 400 }] },
          { name: "page_fan_adds", values: [{ value: 50 }] },
        ] });
      }
      if (metric === "page_views_total" && period === "days_28") {
        return ok({ data: [{ name: "page_views_total", values: [{ value: 12000 }] }] });
      }
      if (metric === "page_total_media_view_unique") {
        if (period === "days_28") {
          return ok({ data: [{ name: "page_total_media_view_unique", values: [{ value: 10000 }] }] });
        }
        return ok({ data: [{ name: "page_total_media_view_unique", values: [{ value: 2500 }] }] });
      }
      if (metric === "page_impressions_unique") {
        if (period === "days_28") {
          return ok({ data: [{ name: "page_impressions_unique", values: [{ value: 9500 }] }] });
        }
        return ok({ data: [{ name: "page_impressions_unique", values: [{ value: 2400 }] }] });
      }
    }
    return ok({ data: [] });
  };
}

function assert(name, cond) { console.log((cond ? "  ✅ " : "  ❌ ") + name); if (!cond) process.exitCode = 1; }

// ── Lauf 1: Happy Path (total_value funktioniert) ──
seenMetrics.length = 0;
globalThis.fetch = mockFetch({ failIgReachTotalValue: false });
let { weekEntry, debug } = await fetchWeek({ pageId: "PAGE", igUserId: "IGUSER", token: "T" });
const ig = weekEntry.channels.instagram, fb = weekEntry.channels.facebook;
console.log("\nLauf 1 — Happy Path:");
assert("IG reach = 5000 (total_value gelesen)", ig.reach.organic === 5000);
assert("IG views = 8000", ig.views.organic === 8000);
assert("IG reach28d = 15000", ig.reach28d === 15000);
assert("IG views28d = 25000", ig.views28d === 25000);
assert("IG followersGained = 35 (10+20+5 summiert)", ig.followersGained === 35);
assert("IG followersTotal = 1234", ig.followersTotal === 1234);
assert("IG linkTaps = 0 (kein Account-Feld)", ig.linkTaps === 0);
assert("FB views = 3000", fb.views.organic === 3000);
assert("FB reach = 2500 (page_total_media_view_unique)", fb.reach.organic === 2500);
assert("FB reach28d = 10000", fb.reach28d === 10000);
assert("FB views28d = 12000", fb.views28d === 12000);
assert("FB interactions = 400", fb.interactions === 400);
assert("FB followersGained = 50", fb.followersGained === 50);
assert("FB followersTotal = 9999", fb.followersTotal === 9999);
assert("weekStart ist Montag (ISO)", new Date(weekEntry.weekStart + "T00:00:00Z").getUTCDay() === 1);
assert("KEIN profile_links_taps angefragt", !seenMetrics.some(m => m.includes("profile_links_taps")));
assert("KEIN website_clicks angefragt", !seenMetrics.some(m => m.includes("website_clicks")));

// ── Lauf 2: total_value für reach schlägt fehl → Fallback auf klassisch ──
seenMetrics.length = 0;
globalThis.fetch = mockFetch({ failIgReachTotalValue: true });
({ weekEntry, debug } = await fetchWeek({ pageId: "PAGE", igUserId: "IGUSER", token: "T" }));
console.log("\nLauf 2 — total_value fällt aus → Fallback:");
assert("IG reach = 4800 (klassischer Fallback gegriffen)", weekEntry.channels.instagram.reach.organic === 4800);
assert("Fallback wurde versucht (reach ohne total_value)", seenMetrics.includes("reach"));

console.log("\nDebug-Vermerke Lauf 2:");
debug.forEach(d => console.log("   • " + d));
console.log(process.exitCode ? "\n❌ TESTS FEHLGESCHLAGEN\n" : "\n✅ ALLE TESTS GRÜN\n");
