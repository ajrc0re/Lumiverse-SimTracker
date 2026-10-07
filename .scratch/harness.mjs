// Test harness that mirrors src/frontend.ts's exact render pipeline:
// decodeTemplateHtml → extractTemplateLogic → extractCardTemplate →
// new Function(logic) → Handlebars.compile(card) with the same helpers.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Handlebars from "handlebars";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let htmlTemplateRaw = readFileSync(resolve(root, "tracker-card-templates/internal-states-simtracker.json"), "utf8");
const htmlTemplate = JSON.parse(htmlTemplateRaw).htmlTemplate;

// ── pipeline copies (from src/frontend.ts) ──────────────────────────────
function decodeTemplateHtml(t) {
  const raw = t || "";
  if (!/&lt;(?:!--|style|div|script|section|article|span)\b/i.test(raw)) return raw;
  return raw.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#039;/g, "'");
}
function extractTemplateLogic(t) {
  const decoded = decodeTemplateHtml(t);
  const m = decoded.match(/<script\s+type=["']text\/x-handlebars-template-logic["'][^>]*>([\s\S]*?)<\/script>/i);
  return m?.[1]?.trim() || null;
}
function extractCardTemplate(t) {
  const raw = decodeTemplateHtml(t);
  const start = raw.indexOf("<!-- CARD_TEMPLATE_START -->");
  const end = raw.indexOf("<!-- CARD_TEMPLATE_END -->");
  if (start !== -1 && end !== -1 && end > start) return raw.substring(start + 29, end).trim();
  return raw.trim();
}
function executeTemplateLogic(input, logic) {
  if (!logic) return input;
  const fn = new Function("data", "templateType", `"use strict";\n${logic}\n; return data;`);
  return fn(input, "tracker");
}
// helpers used by the template (registered the same way as frontend.ts)
Handlebars.registerHelper("eq", (a, b) => a === b);
Handlebars.registerHelper("eqi", (a, b) => String(a || "").toLowerCase() === String(b || "").toLowerCase());
Handlebars.registerHelper("gt", (a, b) => Number(a) > Number(b));
Handlebars.registerHelper("initials", (name) => (typeof name === "string" && name.length ? name.charAt(0).toUpperCase() : "?"));
Handlebars.registerHelper("or", function (...args) { return args.slice(0, -1).some((v) => !!v); });
Handlebars.registerHelper("and", function (...args) { return args.slice(0, -1).every((v) => !!v); });

// ── the new parseTrackerBlock fallback (mirrors src/trackerData.ts change) ──
function parseTrackerBlockFallback(raw) {
  const trimmed = raw.trim();
  if (/<internal_states\b[^>]*>[\s\S]*<\/internal_states>/i.test(trimmed)) {
    return { worldData: { internal_states_html: trimmed }, characters: [] };
  }
  return null;
}

const logic = extractTemplateLogic(htmlTemplate);
const card = extractCardTemplate(htmlTemplate);
if (!logic) throw new Error("template logic not found");
if (!card) throw new Error("card template not found");
const compiled = Handlebars.compile(card);

function render(payload, name) {
  const data = parseTrackerBlockFallback(payload);
  if (!data) throw new Error(name + ": payload not detected as internal_states");
  const prep = executeTemplateLogic(structuredClone(data), logic);
  const html = compiled(prep);
  const modules = prep.worldData.internalStates?.modules || [];
  console.log(`\n=== ${name}: ${modules.length} modules, turn=${prep.worldData.internalStates?.turn} ===`);
  for (const m of modules) {
    console.log(`  [${m.kind}] "${m.title}" empty=${m.empty} count="${m.countLabel}" preview="${(m.preview || "").slice(0, 60)}"`);
  }
  return html;
}

// ── payloads ────────────────────────────────────────────────────────────
const MAX = `<!-- GFX_START -->
<tracker type="sim">
<internal_states>
<details>
<summary>🎬 INTERNAL STATES (Turn: 2)</summary>

<details>
<summary>👤 NPC AGENDAS</summary>
- <b>Shikua</b> | Agenda: Force Aaron to clean his own vomit | (Step 1/2) | Aware: none | Fibs: none | Circle: Aaron | Body: Disgusted, panicked
</details>

<details>
<summary>👤 NPC LOCATIONS</summary>
- <b>Shikua</b> | Location: Her bedroom, far wall, pacing
- <b>Aaron</b> | Location: Shikua's bedroom doorway, post-vomit
</details>

<details>
<summary>🏳️ FACTIONS</summary>
- None established.
</details>

<details>
<summary>💚 BONDS</summary>
- <b>Shikua</b> ↔ <b>Aaron</b> | BOND: +4 | Sparks: 0 | Grudge: +1
</details>

<details>
<summary>📜 QUESTS</summary>
- <b>Main:</b> Active — Survive the household | <b>Progress:</b> 0/∞ | <b>Reward:</b> Life
- <b>Side:</b> None
</details>

<details>
<summary>🎒 INV & SKILLS</summary>
- <b>Inv:</b> Glasses, lip piercings, ear gauges
- <b>Titles/Skills:</b> Eagle Scout, 2nd Dan (judo/aikido), Programmer, Chef, Frontman
- <b>Status:</b> Nauseous, exhausted
- <b>Mods:</b> N/A
</details>

<details>
<summary>🔫 CHEKHOV'S GUN</summary>
- <b>Active:</b> [BULLET: Living room broom/mop rebellion undiscovered] (weight: 2, age: 0) | [BULLET: Dinner waiting in fridge] (weight: 1, age: 0)
- <b>Locked:</b> None
- <b>Fired:</b> None
</details>

<details>
<summary>🧠 INTERNAL THOUGHTS</summary>
- <b>Shikua</b> | Internal Thoughts: He puked. In MY room. On MY floor. I just washed these thighhighs. If he dies I'm not doing CPR.
</details>

<details>
<summary>📓 GM'S NOTEBOOK</summary>
- [T] Living room broom/mop rebellion is active and worsening. Aaron knows, Shikua does not.
- [T] Dinner Shikua prepared sits in the fridge, uneaten.
- [D] Aaron's stomach bug/intoxication source unresolved — convenience store food implied.
</details>

<details>
<summary>🎲 DND TASK SIM</summary>
- <b>Task:</b> None — trivial action
- <b>Locked DC:</b> N/A
- <b>Roll:</b> N/A | <b>Delta:</b> N/A
- <b>Outcome:</b> N/A
</details>

<details>
<summary>🌎 WORLD SIM</summary>
- <b>Active Table:</b> DuoTable
- <b>World Sim Current Roll:</b> 4
- <b>Event:</b> ENV_SHIFT — Overhead light flickered brown briefly, steadied. Possible electrical issue or storm interference.
</details>

<details>
<summary>🌌 PHYSICS, ENGINE & WORLD</summary>
- <b>Env:</b> Vomit on hardwood floor. Rain outside. Overhead light unstable. Sock golem failed to animate.
- <b>Physics:</b> Aaron at doorway. Shikua at far wall, ~4m away. 120° line of sight from bed position. Vomit between them on floor.
</details>

</details>
</internal_states>
</tracker>
<!-- GFX_END -->`;

const MIN = `<tracker type="sim">
<internal_states>
<details>
<summary>🎬 INTERNAL STATES (Turn: 14)</summary>
<details>
<summary>👤 NPC AGENDAS</summary>
- <b>Mira</b> | Agenda: Finish sharpening the kitchen knives | (Step 3/3) | Aware: none | Fibs: none | Circle: lone wolf | Body: Focused, calm
</details>
<details>
<summary>👤 NPC LOCATIONS</summary>
- <b>Mira</b> | Location: Farmhouse kitchen, at the whetstone bench
</details>
<details>
<summary>🏳️ FACTIONS</summary>
- None established.
</details>
<details>
<summary>🌌 PHYSICS, ENGINE & WORLD</summary>
- <b>Env:</b> Wind rising from the west, shutters rattling.
- <b>Physics:</b> Mira seated at bench facing the window.
</details>
</details>
</internal_states>
</tracker>`;

const PARTIAL = `<tracker type="sim">
<internal_states>
<details>
<summary>🎬 INTERNAL STATES (Turn: 7)</summary>

<details>
<summary>👤 NPC AGENDAS</summary>
- <b>Catherine</b> | Agenda: Get Stacy home before the storm | (Step 2/4) | Aware: Eclipse Protocol | Fibs: told her the lab is closed | Circle: none | Body: Anxious, driven
- <b>Stacy</b> | Agenda: Sneak back to the crater | (Step 1/2) | Aware: none | Fibs: said she was at Dez's | Circle: Dez | Body: Wired, exhilarated
</details>

<details>
<summary>👤 NPC LOCATIONS</summary>
- <b>Catherine</b> | Location: County road, driving, 6 km from home
- <b>Stacy</b> | Location: Walker's field, edge of the treeline
- <b>Dez</b> | Location: Abandoned radio mast, climbing
</details>

<details>
<summary>🏳️ FACTIONS</summary>
- <b>The Collectors</b> | Goal: Secure the crater shard | Intel: know Catherine's route | Fibs: pose as geologists | State: confident | Conflict: none | Relations: hostile to county sheriff
- <b>Sheriff's Dept</b> | Goal: Close the road | Intel: storm warning only | Fibs: none | State: stretched thin | Conflict: budget cuts | Relations: distrusts feds
</details>

<details>
<summary>💚 BONDS</summary>
- <b>Catherine</b> ↔ <b>{{user}}</b> | BOND: +12 | Sparks: 2 | Grudge: 0
- <b>Stacy</b> ↔ <b>{{user}}</b> | BOND: -3 | Sparks: 0 | Grudge: 4
</details>

<details>
<summary>🔫 CHEKHOV'S GUN</summary>
- <b>Active:</b> [BULLET: Storm cellar padlock is rusted through] (weight: 3, age: 5) | [BULLET: Dez's radio picks up Collectors chatter] (weight: 2, age: 1)
- <b>Locked:</b> [BULLET: Crater shard hum when Stacy touches it] (weight: 3, age: 0) [LOCKED: T:21:30]
- <b>Fired:</b> County road closure announced on the radio
</details>

<details>
<summary>🧠 INTERNAL THOUGHTS</summary>
- <b>Catherine</b> | Internal Thoughts: If I take the ridge road I can beat the rain. She lied to me about Dez. Confront now or get her home safe? Home first.
- <b>Stacy</b> | Internal Thoughts: The light under the soil PULSED when I got close. Nobody believes me. I'll film it this time.
</details>

<details>
<summary>🌌 PHYSICS, ENGINE & WORLD</summary>
- <b>Env:</b> Thunderheads stacking over the western ridge, first fat raindrops, temperature dropping.
- <b>Physics:</b> Catherine northbound on county road at 90 km/h. Stacy 400 m east of her at field edge, out of sight. Dez 18 m up the mast.
</details>

</details>
</internal_states>
</tracker>`;

mkdirSync(resolve(root, ".scratch/out"), { recursive: true });
const page = (body, label) => `<!doctype html><html><head><meta charset="utf-8"><title>${label}</title>
<style>
  body { background: #17171c; padding: 24px; margin: 0; }
  :root { --lumiverse-bg: #17171c; --lumiverse-fill-subtle: #25262d; --lumiverse-fill: #30313a;
    --lumiverse-border: rgba(255,255,255,0.13); --lumiverse-border-hover: rgba(255,255,255,0.24);
    --lumiverse-text: #f4f4f6; --lumiverse-text-muted: #b4b5bd; --lumiverse-text-dim: #8a8c96; }
</style></head><body>${body}
<script>
// Mirrors bindToggleAllControls() in src/frontend.ts (the extension binds
// this at the document level in production).
document.addEventListener("click", (ev) => {
  const target = ev.target;
  if (!target || typeof target.closest !== "function") return;
  const btn = target.closest("[data-sst-toggle-all]");
  if (!btn) return;
  const scope = btn.closest("[data-sst-toggle-scope]");
  if (!scope) return;
  const panels = Array.from(scope.querySelectorAll("details"));
  if (panels.length === 0) return;
  const expand = !panels.some((panel) => panel.open);
  for (const panel of panels) panel.open = expand;
  btn.setAttribute("aria-expanded", String(expand));
});
</script></body></html>`;

writeFileSync(resolve(root, ".scratch/out/max.html"), page(render(MAX, "MAX"), "max"));
writeFileSync(resolve(root, ".scratch/out/min.html"), page(render(MIN, "MIN"), "min"));
writeFileSync(resolve(root, ".scratch/out/partial.html"), page(render(PARTIAL, "PARTIAL"), "partial"));

// JSON-schema sanity on logic output
const prep = executeTemplateLogic(parseTrackerBlockFallback(MAX), logic);
const is = prep.worldData.internalStates;
const checks = [
  ["turn", is.turn === 2],
  ["module count", is.modules.length === 12],
  ["agendas step", is.modules[0].entries[0].stepCurrent === 1 && is.modules[0].entries[0].stepMax === "2"],
  ["locations count", is.modules[1].entries.length === 2],
  ["factions empty", is.modules[2].empty === true],
  ["bond +4", (() => { const b = is.modules[3].entries[0]; return b.bond === 4 && b.bondDisplay === "+4" && b.hasSparks; })()],
  ["quest infinite", is.modules[4].main.progressInfinite === true],
  ["inv chips", is.modules[5].fields.length === 4],
  ["chekhov bullets", is.modules[6].groups[0].items.length === 2],
  ["thoughts text", /puked/i.test(is.modules[7].entries[0].text)],
  ["notebook markers", is.modules[8].entries.map(e => e.marker).join("") === "TTD"],
  ["dnd fields", is.modules[9].fields.length === 5],
  ["worldsim event", is.modules[10].eventName === "ENV_SHIFT"],
  ["physics wide", is.modules[11].wide === true && is.modules[11].fields.length === 2],
  ["notebook wide", is.modules[8].wide === true],
];
let failed = 0;
for (const [name, ok] of checks) { if (!ok) { failed++; console.log("CHECK FAIL:", name); } }
console.log(failed === 0 ? "\nAll logic checks passed ✓" : `\n${failed} logic checks FAILED`);
