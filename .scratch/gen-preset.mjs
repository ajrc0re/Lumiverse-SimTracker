import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(resolve(root, "tracker-card-templates/internal-states-simtracker.html"), "utf8");
const preset = {
  templateName: "Internal States Board",
  templateAuthor: "c0re",
  trackerDesc: "Renders the Freaky Frankenstein <internal_states> HTML object as one collapsible panel per module — cast, world, bonds, story and engine state — in the Narrative Weave visual language. No JSON tracker emission required.",
  templatePosition: "BOTTOM",
  displayInstructions: "Pairs with Freaky Frankenstein 5.x: keep the <internal_states> block exactly as <internal_states_module> defines it, wrapped in <tracker type=\"sim\"> instead of the GFX comments. Optional modules (BONDS, QUESTS, INV & SKILLS, CHEKHOV'S GUN, INTERNAL THOUGHTS, GM'S NOTEBOOK, DND TASK SIM, WORLD SIM) appear automatically when enabled.",
  htmlTemplate: html,
  sysPrompt: "## INTERNAL STATES BOARD\n\nThis tracker renders the Freaky Frankenstein `<internal_states>` HTML object, so keep emitting that object exactly as `<internal_states_module>` defines it — same sections, same telegraphic one-line entries, same `<details>`/`<summary>` structure.\n\nThe only wrapper change: the final block opens with `<tracker type=\"sim\">` where `<!-- GFX_START -->` used to appear and closes with `</tracker>` where `<!-- GFX_END -->` used to appear. The `<internal_states>` HTML between them stays byte-for-byte identical: never convert it to JSON or YAML and never place it in code fences.",
  customFields: [],
  extSettings: {
    codeBlockIdentifier: "sim",
    renderMode: "tracker",
    hideSimBlocks: true,
    templateFile: "internal-states-simtracker.html",
    presetRevision: 1
  }
};
writeFileSync(resolve(root, "tracker-card-templates/internal-states-simtracker.json"), JSON.stringify(preset, null, 2) + "\n");
console.log("preset json written,", JSON.stringify(preset).length, "bytes");
