import { readFileSync, writeFileSync } from "node:fs";

const path = "EDITED Freaky Frankenstein 5.4.json";
const raw = readFileSync(path, "utf8");

// Raw-file forms (JSON-escaped): \n inside the string is backslash+n.
const openOld = "<!-- GFX_START -->\\n<internal_states>";
const openNew = "<tracker type=\\\"sim\\\">\\n<internal_states>";
const closeOld = "</internal_states>\\n<!-- GFX_END -->";
const closeNew = "</internal_states>\\n</tracker>";

const openCount = raw.split(openOld).length - 1;
const closeCount = raw.split(closeOld).length - 1;
if (openCount !== 1 || closeCount !== 1) {
  console.error(`Pattern not unique: open=${openCount} close=${closeCount} — aborting.`);
  process.exit(1);
}

const updated = raw.replace(openOld, openNew).replace(closeOld, closeNew);

// Sanity: exactly one tracker wrapper pair now inside the Internal States block,
// and the payload HTML between <internal_states> tags is untouched.
const data = JSON.parse(updated);
const block = data.blocks.find((b) => b.name === "👾Internal States 💾🎮");
const c = block.content;
const tOpen = c.indexOf("<tracker type=\"sim\">");
const tClose = c.indexOf("</tracker>");
const inner = c.slice(tOpen + "<tracker type=\"sim\">".length, tClose);
console.log("wrapper line replaced:",
  c.includes('<tracker type="sim">\n<internal_states>') && c.includes("</internal_states>\n</tracker>"));
console.log("rules text untouched:", c.includes("wrapped strictly in <!-- GFX_START --> and <!-- GFX_END -->"));
console.log("inner HTML intact:", inner.trim().startsWith("<internal_states>") && inner.trim().endsWith("</internal_states>"));
console.log("all modules still present:", ["NPC AGENDAS", "NPC LOCATIONS", "FACTIONS", "QUESTS", "PHYSICS, ENGINE & WORLD", "GM'S NOTEBOOK", "CHEKHOV"].every((s) => c.includes(s)));
console.log("JSON still parses with", data.blocks.length, "blocks");

writeFileSync(path, updated);
console.log("written.");
