// ───────────────────────────────────────────────────────────────────────────
//  CLI zum Daten holen (Alternative zum Knopf im Dashboard).
//  Start:  npm run fetch
//  Liest die Zugänge aus config.local.json (die der Setup-Assistent anlegt).
// ───────────────────────────────────────────────────────────────────────────

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fetchWeek, fetchPosts } from "./meta.js";

const CONFIG = "config.local.json";

if (!existsSync(CONFIG)) {
  console.error("\n  ⚠  Keine Verbindung eingerichtet. Öffne das Dashboard (npm run dashboard)");
  console.error("     und richte die Verbindung im Setup-Assistenten ein.\n");
  process.exit(1);
}

const cfg = JSON.parse(await readFile(CONFIG, "utf-8"));
console.log(`\n  → Hole Daten für „${cfg.pageName}" …`);

const { weekEntry, debug } = await fetchWeek(cfg);
const { posts, debug: postsDebug } = await fetchPosts(cfg);

const file = "data/weekly.json";
let store = existsSync(file) ? JSON.parse(await readFile(file, "utf-8")) : { weeks: [] };
store.generatedAt = new Date().toISOString();
store.weeks = (store.weeks || []).filter((w) => !(w.kw === weekEntry.kw && w.year === weekEntry.year));
store.weeks.push(weekEntry);
store.weeks.sort((a, b) => a.year - b.year || a.kw - b.kw);
await writeFile(file, JSON.stringify(store, null, 2));

const postsFile = "data/posts.json";
await writeFile(postsFile, JSON.stringify({ posts }, null, 2));

console.log(`  ✅ KW ${weekEntry.kw}/${weekEntry.year} gespeichert.`);
console.log("  ✅ Beitrags-Insights gespeichert.");

const combinedDebug = [...debug, ...postsDebug];
if (combinedDebug.length) {
  console.log("\n  Hinweise (Metriken, die ggf. neu gemappt werden müssen):");
  combinedDebug.forEach((d) => console.log("   • " + d));
}
console.log("\n  Dashboard neu laden — es zeigt jetzt echte Daten.\n");
