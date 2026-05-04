/**
 * Map OSM tag soup to a coarse POI type our app understands.
 * The mapping is intentionally conservative: editors can override later.
 */

import type { Candidate } from "../types";

type POIType = Candidate["type"];

export function classifyOSMTags(tags: Record<string, string>): POIType {
  if (tags["man_made"] === "bridge" || tags["bridge"]) return "bridge";

  if (
    tags["historic"] === "monument" ||
    tags["historic"] === "memorial" ||
    tags["tourism"] === "artwork"
  ) {
    return "monument";
  }

  if (
    tags["amenity"] === "place_of_worship" ||
    tags["building"] === "church" ||
    tags["building"] === "chapel" ||
    tags["building"] === "cathedral" ||
    tags["historic"] === "church" ||
    tags["historic"] === "chapel"
  ) {
    return "church";
  }

  if (tags["leisure"] === "park" || tags["natural"] === "wood") return "park";

  if (tags["historic"] === "manor" || tags["historic"] === "mansion") {
    return "mansion";
  }

  // Architectural style hints
  const style = (tags["building:architecture"] ?? "").toLowerCase();
  if (
    /constructivist|stalin|soviet|brutalist/.test(style) ||
    /^soviet/.test(tags["start_date"] ?? "")
  ) {
    return "soviet";
  }
  if (/modern|international|deconstruct|hi[- ]?tech/.test(style)) {
    return "modernism";
  }

  if (tags["building"]) return "building";

  return "other";
}

/**
 * Try to extract street + house number from OSM addr:* tags.
 */
export function buildAddress(tags: Record<string, string>): string | undefined {
  const street = tags["addr:street"];
  const house = tags["addr:housenumber"];
  if (!street && !house) return undefined;
  return [street, house].filter(Boolean).join(", ");
}

export function bestName(tags: Record<string, string>): string | undefined {
  return (
    tags["name:ru"] ??
    tags["name"] ??
    tags["int_name"] ??
    tags["name:en"] ??
    tags["loc_name"] ??
    tags["alt_name"]
  );
}
