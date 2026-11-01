import { parseTrackerBlock, type TrackerData } from "./trackerData";

/**
 * Tracker routes.
 *
 * A tracker tag's `type` attribute decides how its body is parsed. Tags with
 * no `type`, or with the configured code-block identifier, take the default
 * structured route (`parseTrackerBlock`: JSON, then YAML). Each route below
 * reserves one more `type` whose body is NOT JSON/YAML and gives it its own
 * parser, so the structured parser never has to guess at foreign payloads
 * and ordinary invalid JSON keeps reporting as invalid.
 *
 * Callers pass the tag's sanitized `type` (lowercase, `[a-z0-9_-]`). Fenced
 * blocks and other untyped sources pass an empty string.
 */
export type TrackerRoute = {
  /** Reserved tag `type` this route owns, e.g. `<tracker type="internal_states">`. */
  type: string;
  /**
   * Legacy marker: a body wrapped in this element is routed here even when
   * it arrived under the default type (for example
   * `<tracker type="sim"><internal_states>…</internal_states></tracker>`).
   */
  wrapperTag?: string;
  /** Builds template data from the verbatim tag body. */
  parse: (raw: string) => TrackerData | null;
};

const TRACKER_ROUTES: readonly TrackerRoute[] = [
  {
    // Freaky Frankenstein internal-states board: raw HTML (nested <details>
    // panels with pipe-delimited lines). The body is kept verbatim, so signs
    // like `BOND: +4` survive, and handed to the preset's template-logic
    // script through `worldData.internal_states_html`.
    type: "internal_states",
    wrapperTag: "internal_states",
    parse: (raw) => {
      const html = raw.trim();
      return html ? { worldData: { internal_states_html: html }, characters: [] } : null;
    },
  },
];

const WRAPPER_RES = new Map(
  TRACKER_ROUTES.filter((route) => route.wrapperTag).map((route) => [
    route,
    new RegExp(String.raw`<${route.wrapperTag}\b[^>]*>[\s\S]*<\/${route.wrapperTag}>`, "i"),
  ]),
);

/** The route reserved for a tag `type`, or null for the default structured route. */
export function getTrackerRoute(type: string | null | undefined): TrackerRoute | null {
  if (!type) return null;
  return TRACKER_ROUTES.find((route) => route.type === type) || null;
}

/** True when a tag of this `type` belongs to the tracker: no type, the configured identifier, or a routed type. */
export function isTrackerType(type: string, identifier: string): boolean {
  return !type || type === identifier || getTrackerRoute(type) !== null;
}

/** Every `type` the tag interceptor must listen for, configured identifier first. */
export function getTrackerTypes(identifier: string): string[] {
  return Array.from(new Set([identifier, ...TRACKER_ROUTES.map((route) => route.type)]));
}

/** Parses a tracker body along the route for its tag `type`. */
export function parseRoutedTracker(raw: string, type = ""): TrackerData | null {
  let route = getTrackerRoute(type);
  if (!route) {
    for (const [candidate, re] of WRAPPER_RES) {
      if (re.test(raw)) {
        route = candidate;
        break;
      }
    }
  }
  return route ? route.parse(raw) : parseTrackerBlock(raw);
}
