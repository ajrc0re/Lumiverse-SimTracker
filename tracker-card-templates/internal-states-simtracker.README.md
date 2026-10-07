# Internal States Board SimTracker

Internal States Board is a Silly Sim Tracker preset that renders the **Freaky Frankenstein `<internal_states>` object** — the raw HTML block with nested `<details>` sections that FF 5.x already appends to every reply — as a polished module board in the Narrative Weave visual language. It requires **no JSON, no YAML, and no extra prompting**: the model keeps writing the exact same object it writes today.

- One collapsible panel per internal states module, in the order the story emits them (not split by character), with a master expand-all / collapse-all toggle at the top right of the header (the arrow flips from down to up whenever any panel is open).
- Mandatory modules (NPC AGENDAS, NPC LOCATIONS, FACTIONS, PHYSICS ENGINE & WORLD) plus every optional module — BONDS, QUESTS, INV & SKILLS, CHEKHOV'S GUN, INTERNAL THOUGHTS, GM'S NOTEBOOK, DND TASK SIM, WORLD SIM — render automatically when enabled, and the layout adapts from the 4-module minimum to the full 12-module maximum without grid holes.
- Narrative Weave styling: theme-aware surfaces, colored module accents, pill chips, progress tracks, custom chevrons, tooltips on meter rows, reduced-motion support, and single-column layout under 720 px.
- Purpose-built bodies per module: agenda step bars, dotted-leader location rows, bond meters (BOND −5…+20, Sparks, Grudge), quest banners with infinite-progress striping, Chekhov bullets with weight dots and fire-ready age badges (age ≥ 4 glows), thought quotes, color-coded GM notebook entries, dice/task grids, and world-sim event chips.

## How it works

1. The Freaky Frankenstein prompt keeps producing its `<internal_states>` HTML verbatim. The **only** prompt edit is the wrapper: the block that used to say
   ```
   <!-- GFX_START -->
   <internal_states>
   ...
   </internal_states>
   <!-- GFX_END -->
   ```
   now says
   ```
   <tracker type="sim">
   <internal_states>
   ...
   </internal_states>
   </tracker>
   ```
   Nothing inside the `<internal_states>` tags changes. In the FF `👾Internal States 💾🎮` block, replace the `<!-- GFX_START -->` line with `<tracker type="sim">` and the `<!-- GFX_END -->` line with `</tracker>` — that is the whole edit. (Keeping the GFX comments outside the tracker tags is also fine; they are inert in Lumiverse.)

2. SimTracker's interceptor recognizes the `<tracker type="sim">` wrapper, hides the raw block from the chat, and keeps feeding the previous object back to the model as "Previous tracker state" so state continuity works exactly as before.

3. The payload parser in `src/trackerData.ts` detects that the payload is a raw `<internal_states>` HTML object (not JSON/YAML) and passes it through verbatim as `worldData.internal_states_html` — preserving signs like `BOND: +4` that the legacy `+`-cleanup would have stripped.

4. The preset ships a `<script type="text/x-handlebars-template-logic">` preprocessor that parses the HTML into structured modules (turn number, per-module entries, fields, meters, chips) before the Handlebars card template renders them.

## Installation and use

1. In Lumiverse, open **Extensions** and install or update from `https://github.com/ajrc0re/Lumiverse-SimTracker` (this fork).
2. Open the Silly Sim Tracker settings.
3. Choose **Internal States Board** from the template selector.
4. Click **Save Settings**.
5. Make the one-line wrapper edit in your Freaky Frankenstein prompt (above). Do **not** inject `{{sim_tracker}}` anywhere — Freaky Frankenstein already prompts the object, and this preset's system prompt only exists to reinforce the wrapper if you ever do inject it.

The fork seeds `tracker-card-templates/internal-states-simtracker.json` into template storage during installation and bundles the preset into the extension build. If the preset does not appear, use **Import Preset** and select the JSON file manually.

## Module coverage and fallbacks

| Module | Mandatory | Body rendering |
| --- | --- | --- |
| 👤 NPC AGENDAS | yes | Avatar row, agenda text, step progress bar (infinite max renders as a dim striped track), meta chips |
| 👤 NPC LOCATIONS | yes | Dotted-leader rows (name ··· location) |
| 🏳️ FACTIONS | yes | Faction cards with Goal/Intel/Fibs/State/Conflict/Relations chips |
| 💚 BONDS | optional | Bond meters on FF's −5…+20 scale plus Sparks (0–7) and Grudge (0–5); grudge ≥ 3 flags halved gains |
| 📜 QUESTS | optional | Main/side banners with status, reward chip, progress (0/∞ supported) |
| 🎒 INV & SKILLS | optional | Field rows with per-item chips |
| 🔫 CHEKHOV'S GUN | optional | Active/Locked/Fired columns; weight dots (1–3), age badges, ready glow at age ≥ 4, lock tags |
| 🧠 INTERNAL THOUGHTS | optional | Quote cards per NPC |
| 📓 GM'S NOTEBOOK | optional | Full-width log with colored R/T/D badges |
| 🎲 DND TASK SIM | optional | Task banner plus DC/Roll/Delta/Outcome grid |
| 🌎 WORLD SIM | optional | Table chip, d20 roll badge, event chip + description |
| 🌌 PHYSICS, ENGINE & WORLD | yes | Wide Env/Physics field grid |

Any unrecognized `<details>` section falls through to a generic bullet list, so renamed or custom modules still render. Modules whose content is only "None" render an italic empty state. `{{user}}`/`{{char}}` tokens in the object are displayed as "You"/"Char".

## Tracker data at a glance

The model emits (example minimum configuration):

```xml
<tracker type="sim">
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
</tracker>
```

JSON and YAML trackers from other presets continue to work unchanged; the raw-HTML fallback only activates when the payload contains an `<internal_states>` object.
