// Test für fetchPosts — simuliert die Graph-API per Mock-fetch.
import { fetchPosts } from "./src/meta.js";

const seenUrls = [];

function mockFetch() {
  return async (url) => {
    const u = new URL(url);
    const path = u.pathname.split("/v25.0/")[1] || "";
    const fields = u.searchParams.get("fields");
    const ids = u.searchParams.get("ids");
    const limit = u.searchParams.get("limit");

    seenUrls.push(url);

    const ok = (obj) => ({ json: async () => obj });

    // FB posts list
    if (path === "PAGE/posts" && limit === "50") {
      return ok({
        data: [
          {
            id: "fb_p1",
            message: "FB Post 1",
            created_time: "2026-06-12T10:00:00+0000",
            permalink_url: "https://facebook.com/fb_p1",
            full_picture: "https://facebook.com/fb_p1.jpg",
            shares: { count: 12 },
            reactions: { summary: { total_count: 100 } },
            comments: { summary: { total_count: 15 } },
            type: "photo"
          },
          {
            id: "fb_p2",
            message: "FB Video Post",
            created_time: "2026-06-11T12:00:00+0000",
            permalink_url: "https://facebook.com/fb_p2",
            full_picture: "https://facebook.com/fb_p2.jpg",
            shares: { count: 5 },
            reactions: { summary: { total_count: 50 } },
            comments: { summary: { total_count: 8 } },
            type: "video"
          }
        ]
      });
    }

    // IG media list
    if (path === "IGUSER/media" && limit === "50") {
      return ok({
        data: [
          {
            id: "ig_m1",
            caption: "IG Reel Caption",
            media_type: "VIDEO",
            media_product_type: "REELS",
            media_url: "https://instagram.com/ig_m1.mp4",
            thumbnail_url: "https://instagram.com/ig_m1.jpg",
            permalink: "https://instagram.com/p/ig_m1",
            timestamp: "2026-06-12T14:00:00+0000",
            like_count: 200,
            comments_count: 25
          },
          {
            id: "ig_m2",
            caption: "IG Album Caption",
            media_type: "CAROUSEL_ALBUM",
            media_product_type: "FEED",
            media_url: "https://instagram.com/ig_m2.jpg",
            permalink: "https://instagram.com/p/ig_m2",
            timestamp: "2026-06-10T09:00:00+0000",
            like_count: 150,
            comments_count: 10
          }
        ]
      });
    }

    // Batch insights call
    if (path === "") {
      // FB insights — jetzt ZWEI isolierte Calls (NEU-Felder + ALT-Felder).
      if (ids && ids.includes("fb_p1")) {
        // NEU-Felder-Call (ab 15.06.2026): post_media_view / post_total_media_views_unique
        if (fields && fields.includes("post_media_view")) {
          return ok({
            fb_p1: {
              insights: {
                data: [
                  { name: "post_media_view", values: [{ value: 1200 }] },
                  { name: "post_total_media_views_unique", values: [{ value: 1100 }] }
                ]
              }
            },
            fb_p2: {
              insights: {
                data: [
                  { name: "post_media_view", values: [{ value: 777 }] },
                  { name: "post_total_media_views_unique", values: [{ value: 700 }] }
                ]
              }
            }
          });
        }
        // ALT-Felder-Call (Fallback): post_impressions*
        return ok({
          fb_p1: {
            insights: {
              data: [
                { name: "post_impressions", values: [{ value: 1000 }] },
                { name: "post_impressions_unique", values: [{ value: 900 }] },
                { name: "post_impressions_organic", values: [{ value: 400 }] },
                { name: "post_impressions_paid", values: [{ value: 600 }] },
                { name: "post_impressions_organic_unique", values: [{ value: 350 }] },
                { name: "post_impressions_paid_unique", values: [{ value: 550 }] }
              ]
            }
          },
          // fb_p2 simuliert den 15.06.2026-Umbau: ALT-Felder liefern NICHTS mehr
          // → der Abruf muss auf die NEU-Felder zurückfallen.
          fb_p2: { insights: { data: [] } }
        });
      }

      // IG media insights
      if (ids && ids.includes("ig_m1") && fields && fields.includes("reach,views,saved,shares")) {
        return ok({
          ig_m1: {
            insights: {
              data: [
                { name: "reach", total_value: { value: 1500 } },
                { name: "views", total_value: { value: 2200 } },
                { name: "saved", total_value: { value: 30 } },
                { name: "shares", total_value: { value: 15 } }
              ]
            }
          },
          ig_m2: {
            insights: {
              data: [
                { name: "reach", total_value: { value: 1200 } },
                { name: "views", total_value: { value: 1800 } },
                { name: "saved", total_value: { value: 20 } },
                { name: "shares", total_value: { value: 10 } }
              ]
            }
          }
        });
      }

      // IG reels insights
      if (ids && ids.includes("ig_m1") && fields && fields.includes("ig_reels_avg_watch_time")) {
        return ok({
          ig_m1: {
            insights: {
              data: [
                { name: "ig_reels_avg_watch_time", total_value: { value: 12500 } }, // 12.5s
                { name: "ig_reels_video_view_total_time", total_value: { value: 50000 } }
              ]
            }
          }
        });
      }
    }

    return ok({ data: [] });
  };
}

function assert(name, cond) { console.log((cond ? "  ✅ " : "  ❌ ") + name); if (!cond) process.exitCode = 1; }

globalThis.fetch = mockFetch();

console.log("\nStarte Tests für fetchPosts:");
const { posts, debug } = await fetchPosts({ pageId: "PAGE", igUserId: "IGUSER", token: "TOKEN" });

assert("Gefundene Posts insgesamt: 4", posts.length === 4);

const fb1 = posts.find(p => p.id === "fb_p1");
const fb2 = posts.find(p => p.id === "fb_p2");
const ig1 = posts.find(p => p.id === "ig_m1");
const ig2 = posts.find(p => p.id === "ig_m2");

// FB1 Verifikation
assert("FB1 Kanal ist facebook", fb1.channel === "facebook");
assert("FB1 Typ ist Bild (photo -> Bild)", fb1.type === "Bild");
assert("FB1 boosted ist true (paid views > 0)", fb1.boosted === true);
assert("FB1 views organic = 400, paid = 600", fb1.views.organic === 400 && fb1.views.paid === 600);
assert("FB1 reach organic = 350, paid = 550", fb1.reach.organic === 350 && fb1.reach.paid === 550);
assert("FB1 likes = 100", fb1.likes === 100);
assert("FB1 comments = 15", fb1.comments === 15);
assert("FB1 shares = 12", fb1.shares === 12);
assert("FB1 interactions = 127", fb1.interactions === 127);
assert("FB1 thumbnail ist korrekt", fb1.thumbnail === "https://facebook.com/fb_p1.jpg");
assert("FB1 permalink ist korrekt", fb1.permalink === "https://facebook.com/fb_p1");
assert("FB1 date ist YYYY-MM-DD", fb1.date === "2026-06-12");

// FB2 Verifikation
assert("FB2 Typ ist Video (video -> Video)", fb2.type === "Video");
assert("FB2 boosted ist false (paid views = 0)", fb2.boosted === false);
// FB2: ALT-Felder retired → NEU-Felder müssen greifen (Fallback funktioniert)
assert("FB2 Views fällt auf NEU-Feld zurück = 777", fb2.views.organic === 777);
assert("FB2 Reichweite fällt auf NEU-Feld zurück = 700", fb2.reach.organic === 700);

// FB1: NEU-Felder vorhanden, aber organisch/bezahlt-Aufschlüsselung (ALT) hat Vorrang
assert("FB1 nutzt weiterhin ALT-Aufschlüsselung (organic=400)", fb1.views.organic === 400);

// IG1 Verifikation
assert("IG1 Kanal ist instagram", ig1.channel === "instagram");
assert("IG1 Typ ist Reel (Reels product type)", ig1.type === "Reel");
assert("IG1 views = 2200", ig1.views.organic === 2200);
assert("IG1 reach = 1500", ig1.reach.organic === 1500);
assert("IG1 likes = 200, comments = 25, saves = 30, shares = 15", ig1.likes === 200 && ig1.comments === 25 && ig1.saves === 30 && ig1.shares === 15);
assert("IG1 interactions = 270 (summe)", ig1.interactions === 270);
assert("IG1 video avgWatchSec = 13s (12500ms gerundet)", ig1.video?.avgWatchSec === 13);
assert("IG1 thumbnail bevorzugt thumbnail_url", ig1.thumbnail === "https://instagram.com/ig_m1.jpg");
assert("IG1 permalink ist korrekt", ig1.permalink === "https://instagram.com/p/ig_m1");

// IG2 Verifikation
assert("IG2 Typ ist Karussell (CAROUSEL_ALBUM -> Karussell)", ig2.type === "Karussell");
assert("IG2 thumbnail nutzt media_url", ig2.thumbnail === "https://instagram.com/ig_m2.jpg");

// Sortierung
assert("Beiträge sind absteigend nach Datum sortiert", posts[0].date >= posts[1].date && posts[1].date >= posts[2].date);

console.log(process.exitCode ? "\n❌ POSTS TESTS FEHLGESCHLAGEN\n" : "\n✅ ALLE POSTS TESTS GRÜN\n");
