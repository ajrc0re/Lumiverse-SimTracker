import { parse as parseYaml } from "yaml";

export type CharacterRecord = Record<string, unknown>;

export type TrackerData = {
  worldData?: Record<string, unknown>;
  characters?: CharacterRecord[];
  [key: string]: unknown;
};

function cleanupPlusSigns(input: string): string {
  return input.replace(/([\s:[,{])\+(\d+(?:\.\d+)?)([\s,}\]\n\r]|$)/g, "$1$2$3");
}

/**
 * Freaky Frankenstein emits its `<internal_states>` tracker as raw HTML
 * (nested `<details>` blocks with pipe-delimited lines), not JSON/YAML. When
 * a payload carries that object, keep the text verbatim — signs like
 * `BOND: +4` must survive — and surface it to the template layer through
 * `worldData.internal_states_html`, where the preset's template-logic script
 * parses the modules. Returns null for payloads without the object so
 * ordinary invalid JSON/YAML still reports as invalid.
 */
const INTERNAL_STATES_RE = /<internal_states\b[^>]*>[\s\S]*<\/internal_states>/i;

export function parseTrackerBlock(raw: string): TrackerData | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (INTERNAL_STATES_RE.test(trimmed)) {
    return { worldData: { internal_states_html: trimmed }, characters: [] };
  }

  const cleaned = cleanupPlusSigns(trimmed);

  try {
    const json = JSON.parse(cleaned) as unknown;
    if (json && typeof json === "object") {
      return normalizeTrackerData(json as TrackerData);
    }
  } catch {
    // Not JSON; try YAML.
  }

  try {
    const yaml = parseYaml(cleaned) as unknown;
    if (yaml && typeof yaml === "object") {
      return normalizeTrackerData(yaml as TrackerData);
    }
  } catch {
    return null;
  }

  return null;
}

export function normalizeTrackerData(data: TrackerData): TrackerData {
  if (Array.isArray(data.characters)) {
    return data;
  }

  const characters: CharacterRecord[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (key === "worldData") continue;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      characters.push({ name: key, ...(value as CharacterRecord) });
    }
  }

  return {
    ...data,
    characters,
  };
}
