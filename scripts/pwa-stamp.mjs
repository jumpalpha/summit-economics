// Runs at the end of `npm run build`: stamps out/sw.js with this build's id, so every deploy
// gets fresh offline caches and the old ones are deleted (see public/sw.js). Safe to run twice.
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const SW = "out/sw.js";
if (!existsSync(SW)) { console.log("pwa-stamp: no out/sw.js, skipped"); process.exit(0); }
let id = existsSync(".next/BUILD_ID") ? readFileSync(".next/BUILD_ID", "utf8").trim() : "";
if (!/^[\w-]+$/.test(id)) id = Date.now().toString(36);
const src = readFileSync(SW, "utf8");
if (!src.includes("__SUMMIT_BUILD__")) { console.log("pwa-stamp: already stamped"); process.exit(0); }
writeFileSync(SW, src.replace('"__SUMMIT_BUILD__"', JSON.stringify(id)));
console.log(`pwa-stamp: sw.js cache version ${id}`);
