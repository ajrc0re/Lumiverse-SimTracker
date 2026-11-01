import { parseTrackerBlock } from "../src/trackerData.ts";
import { getTrackerTypes, isTrackerType, parseRoutedTracker } from "../src/trackerRoutes.ts";
import { readFileSync } from "node:fs";

// 1) parseTrackerBlock fallback behaviors
const ffHtml = `<internal_states>
<details>
<summary>🎬 INTERNAL STATES (Turn: 3)</summary>
<details>
<summary>👤 NPC AGENDAS</summary>
- <b>Nova</b> | Agenda: Patrol the ridge | (Step 2/5) | Aware: none | Fibs: none | Circle: none | Body: Alert
</details>
</details>
</internal_states>`;

// Legacy form: <tracker type="sim"><internal_states>…</internal_states></tracker>
const wrapped = parseRoutedTracker(ffHtml, "sim");
console.log("legacy wrapper under sim →", wrapped?.worldData?.internal_states_html ? `worldData.internal_states_html (${wrapped.worldData.internal_states_html.length} chars), characters: ${wrapped.characters.length}` : "NULL (BAD)");

const bondHtml = ffHtml + "\n- <b>Nova</b> ↔ <b>Ren</b> | BOND: +4 | Sparks: 2 | Grudge: 1";
const wrapped2 = parseRoutedTracker(bondHtml, "sim");
console.log("BOND +4 survives payload:", wrapped2.worldData.internal_states_html.includes("BOND: +4"));

// Routed form: <tracker type="internal_states"> with the bare <details> board
const bare = ffHtml.replace(/<\/?internal_states>\n?/g, "");
const routed = parseRoutedTracker(bare, "internal_states");
console.log("internal_states type routes bare HTML:", routed?.worldData?.internal_states_html === bare.trim());
console.log("bare HTML under sim stays invalid:", parseRoutedTracker(bare, "sim") === null);

const jsonPayload = JSON.stringify({ worldData: { current_date: "2030-01-01" }, characters: [{ name: "A", ap: 10 }] });
console.log("JSON payload still parses:", parseRoutedTracker(jsonPayload, "sim")?.characters?.length === 1);
console.log("structured parser untouched (no HTML fallback):", parseTrackerBlock(ffHtml) === null);
console.log("garbage returns null:", parseRoutedTracker("not a tracker at all", "sim") === null);
console.log("broken JSON (no internal_states) returns null:", parseRoutedTracker('{"worldData": ', "sim") === null);
console.log("accepted types:", isTrackerType("sim", "sim") && isTrackerType("internal_states", "sim") && !isTrackerType("other", "sim"));
console.log("interceptor types:", JSON.stringify(getTrackerTypes("sim")), JSON.stringify(getTrackerTypes("internal_states")));

// 2) production tag extraction (mirrors backend.ts buildTrackerTagRegex)
const tagName = "tracker";
const tagRe = new RegExp(String.raw`<${tagName}\b([^>]*)>([\s\S]*?)<\/${tagName}>`, "ig");
const message = `The wind howls across the ridge.

<tracker type="sim">
${ffHtml}
</tracker>`;
let extracted = null;
let m;
while ((m = tagRe.exec(message)) !== null) { extracted = m[2].trim(); break; }
console.log("tag extraction finds payload:", extracted?.startsWith("<internal_states>") === true);

// 3) frontend extractTrackerBlock equivalent (same regex shape)
const re = new RegExp(String.raw`<tracker\b([^>]*)>([\s\S]*?)<\/tracker>`, "ig");
const mm = re.exec(message);
console.log("frontend-style extraction:", (mm?.[2]?.trim().startsWith("<internal_states>")) === true);

// 4) preset JSON integrity: htmlTemplate in JSON === .html source file
const preset = JSON.parse(readFileSync("tracker-card-templates/internal-states-simtracker.json", "utf8"));
const htmlFile = readFileSync("tracker-card-templates/internal-states-simtracker.html", "utf8");
console.log("preset htmlTemplate === .html file:", preset.htmlTemplate === htmlFile);
console.log("preset fields:", preset.templateName, "| renderMode:", preset.extSettings.renderMode, "| position:", preset.templatePosition);

// 5) dist bundles contain the preset and fallback
const backend = readFileSync("dist/backend.js", "utf8");
const frontend = readFileSync("dist/frontend.js", "utf8");
console.log("backend bundle has preset:", backend.includes("Internal States Board"));
console.log("frontend bundle has parser fallback:", frontend.includes("internal_states_html"));
console.log("frontend bundle has template-logic runner:", frontend.includes("x-handlebars-template-logic"));
