// ───────────────────────────────────────────────────────────────────────────
//  Dashboard-Server (0 externe Abhängigkeiten). Start:  npm run dashboard
//
//  Kann mehr als nur ausliefern:
//   • GET  /api/status   → ist eine Verbindung eingerichtet?
//   • POST /api/connect  → Token + Page-ID prüfen und lokal speichern
//   • POST /api/fetch    → echte Daten der laufenden Woche holen
//   • GET  /api/data     → Wochendaten (echt, sonst Beispiel)
//   • GET  /api/posts    → Beitrags-Daten (echt, sonst Beispiel)
//   Zugänge liegen in config.local.json (gitignored, bleibt lokal).
// ───────────────────────────────────────────────────────────────────────────

import { createServer } from "node:http";
import { readFile, writeFile, unlink } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";
import { validateConnection, fetchWeek, fetchPosts } from "../src/meta.js";
import { DEFAULT_ENDPOINTS, ENDPOINT_FIELDS } from "../src/config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PUBLIC = join(__dirname, "public");
const CONFIG = join(ROOT, "config.local.json");
const ENDPOINTS_FILE = join(ROOT, "endpoints.local.json");
const PORT = 4317;

// Aktuelle Endpoints = Defaults aus config.js, überschrieben von endpoints.local.json (falls vorhanden).
const loadEndpoints = () => {
  let overrides = {};
  if (existsSync(ENDPOINTS_FILE)) {
    try { overrides = JSON.parse(readFileSync(ENDPOINTS_FILE, "utf-8")); } catch { overrides = {}; }
  }
  // Nur bekannte Schlüssel und nicht-leere Werte übernehmen.
  const merged = { ...DEFAULT_ENDPOINTS };
  for (const k of Object.keys(DEFAULT_ENDPOINTS)) {
    if (typeof overrides[k] === "string" && overrides[k].trim()) merged[k] = overrides[k].trim();
  }
  return merged;
};

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
};

const loadConfig = () => existsSync(CONFIG) ? JSON.parse(readFileSync(CONFIG, "utf-8")) : null;
const json = (res, code, obj) => {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(obj));
};
const readBody = (req) => new Promise((resolve) => {
  let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => { try { resolve(JSON.parse(b || "{}")); } catch { resolve({}); } });
});

const server = createServer(async (req, res) => {
  const { url, method } = req;
  try {
    // ── Status: ist schon eine Verbindung eingerichtet? ──
    if (url === "/api/status") {
      const cfg = loadConfig();
      // Token-Ablauf: ein langlebiger Page-Token gilt ~60 Tage. Ohne echtes
      // Ablaufdatum schätzen wir ab dem Verbindungs-Zeitpunkt (connectedAt + 60 Tage).
      // Liegt ein echtes tokenExpiresAt in der Config, hat das Vorrang.
      let tokenExpiresAt = null, tokenDaysLeft = null;
      if (cfg?.connectedAt) {
        const base = cfg.tokenExpiresAt
          ? new Date(cfg.tokenExpiresAt)
          : new Date(new Date(cfg.connectedAt).getTime() + 60 * 24 * 60 * 60 * 1000);
        if (!isNaN(base)) {
          tokenExpiresAt = base.toISOString();
          tokenDaysLeft = Math.ceil((base.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
        }
      }
      return json(res, 200, {
        configured: !!cfg,
        pageName: cfg?.pageName ?? null,
        igUsername: cfg?.igUsername ?? null,
        connectedAt: cfg?.connectedAt ?? null,
        lastFetch: cfg?.lastFetch ?? null,
        version: cfg?.version ?? null,
        tokenExpiresAt,
        tokenDaysLeft,
        tokenEstimated: !cfg?.tokenExpiresAt,
      });
    }

    // ── Verbindung herstellen: Token + Page-ID prüfen und speichern ──
    if (url === "/api/connect" && method === "POST") {
      const { pageId, token } = await readBody(req);
      if (!pageId || !token) return json(res, 400, { error: "Page-ID und Token sind erforderlich." });
      try {
        const info = await validateConnection({ pageId: String(pageId).trim(), token: String(token).trim() });
        const cfg = { ...info, token: String(token).trim(), connectedAt: new Date().toISOString() };
        await writeFile(CONFIG, JSON.stringify(cfg, null, 2));
        return json(res, 200, { ...info, token: undefined });
      } catch (e) {
        return json(res, 200, { ok: false, error: e.message, code: e.code ?? null });
      }
    }

    // ── Endpoints / Feldnamen lesen ──
    if (url === "/api/endpoints" && method === "GET") {
      return json(res, 200, {
        defaults: DEFAULT_ENDPOINTS,
        current: loadEndpoints(),
        fields: ENDPOINT_FIELDS,
        custom: existsSync(ENDPOINTS_FILE),
      });
    }
    // ── Endpoints / Feldnamen speichern ──
    if (url === "/api/endpoints" && method === "POST") {
      const body = await readBody(req);
      // Nur bekannte Schlüssel speichern; leere Werte = auf Default zurückfallen (Schlüssel weglassen).
      const clean = {};
      for (const k of Object.keys(DEFAULT_ENDPOINTS)) {
        if (typeof body[k] === "string" && body[k].trim() && body[k].trim() !== DEFAULT_ENDPOINTS[k]) {
          clean[k] = body[k].trim();
        }
      }
      try {
        if (Object.keys(clean).length === 0) {
          // Alles auf Default → Override-Datei entfernen, falls vorhanden.
          if (existsSync(ENDPOINTS_FILE)) await unlink(ENDPOINTS_FILE);
        } else {
          await writeFile(ENDPOINTS_FILE, JSON.stringify(clean, null, 2));
        }
        return json(res, 200, { ok: true, current: loadEndpoints(), saved: Object.keys(clean).length });
      } catch (e) {
        return json(res, 200, { ok: false, error: e.message });
      }
    }

    // ── Echte Daten holen ──
    if (url === "/api/fetch" && method === "POST") {
      const cfg = loadConfig();
      if (!cfg) return json(res, 400, { error: "Noch keine Verbindung eingerichtet." });
      try {
        const ep = loadEndpoints();
        const { weekEntry, debug } = await fetchWeek(cfg, ep);
        const { posts, debug: postsDebug } = await fetchPosts(cfg, ep);

        const file = join(ROOT, "data", "weekly.json");
        let store = existsSync(file) ? JSON.parse(await readFile(file, "utf-8")) : { weeks: [] };
        store.generatedAt = new Date().toISOString();
        store.weeks = (store.weeks || []).filter((w) => !(w.kw === weekEntry.kw && w.year === weekEntry.year));
        store.weeks.push(weekEntry);
        store.weeks.sort((a, b) => a.year - b.year || a.kw - b.kw);
        await writeFile(file, JSON.stringify(store, null, 2));

        const postsFile = join(ROOT, "data", "posts.json");
        await writeFile(postsFile, JSON.stringify({ posts }, null, 2));

        const combinedDebug = [...debug, ...postsDebug];
        await writeFile(join(ROOT, "data", "last-fetch-debug.json"), JSON.stringify({ at: store.generatedAt, debug: combinedDebug }, null, 2));

        cfg.lastFetch = store.generatedAt;
        await writeFile(CONFIG, JSON.stringify(cfg, null, 2));
        return json(res, 200, { ok: true, week: `KW ${weekEntry.kw}/${weekEntry.year}`, debug: combinedDebug });
      } catch (e) {
        return json(res, 200, { ok: false, error: e.message });
      }
    }

    // ── Wochendaten / Posts (echt, sonst Beispiel) ──
    if (url === "/api/data" || url === "/api/posts") {
      const which = url === "/api/data" ? "weekly" : "posts";
      const real = join(ROOT, "data", `${which}.json`);
      const sample = join(ROOT, "data", `sample-${which}.json`);
      const useReal = existsSync(real);
      const body = await readFile(useReal ? real : sample, "utf-8");
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "X-Data-Source": useReal ? "echt" : "beispiel" });
      return res.end(body);
    }

    // ── Statische Dateien ──
    const path = url === "/" ? "/index.html" : url.split("?")[0];
    const filePath = join(PUBLIC, path);
    if (!filePath.startsWith(PUBLIC)) { res.writeHead(403); return res.end("Verboten"); }
    const body = await readFile(filePath);
    res.writeHead(200, { "Content-Type": MIME[extname(filePath)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Nicht gefunden");
  }
});

server.listen(PORT, () => {
  console.log(`\n  ✅ Dashboard läuft:  http://localhost:${PORT}`);
  console.log(`     ${loadConfig() ? "Verbindung eingerichtet." : "Noch keine Verbindung — der Setup-Assistent führt dich durch."}`);
  console.log(`     Beenden: Strg + C\n`);
});
