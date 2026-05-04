/**
 * Shared types for the content pipeline.
 *
 * Stage 1 ("fetch") produces an array of `Candidate` records — buildings,
 * monuments, churches, bridges in a zone, enriched with Wikidata metadata
 * and a Wikimedia Commons image URL. Candidates without an image are
 * dropped: photo is mandatory per product requirement.
 */

export type Zone = {
  slug: string;
  title: string;
  /** South-West corner: [lat, lng] */
  sw: [number, number];
  /** North-East corner: [lat, lng] */
  ne: [number, number];
  /** Notes for editors. */
  notes?: string;
};

export type OSMElementType = "node" | "way" | "relation";

export type OverpassElement = {
  type: OSMElementType;
  id: number;
  /** Present on nodes. */
  lat?: number;
  lon?: number;
  /** Present on ways/relations when queried with `out center`. */
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

export type OverpassResponse = {
  version: number;
  generator: string;
  elements: OverpassElement[];
};

export type WikidataLabels = Record<string, { language: string; value: string }>;

export type WikidataClaim = {
  mainsnak?: {
    datavalue?:
      | { type: "string"; value: string }
      | { type: "wikibase-entityid"; value: { id: string } }
      | { type: "time"; value: { time: string; precision: number } }
      | { type: "globecoordinate"; value: { latitude: number; longitude: number } };
  };
};

export type WikidataEntity = {
  id: string;
  labels?: WikidataLabels;
  descriptions?: WikidataLabels;
  claims?: Record<string, WikidataClaim[]>;
  sitelinks?: Record<string, { site: string; title: string; url?: string }>;
};

export type CandidateSource = {
  osm?: { type: OSMElementType; id: number; url: string };
  wikidata?: { id: string; url: string };
  wikipedia?: { lang: string; title: string; url: string };
};

export type CandidateImage = {
  /** Filename on Commons, e.g. "Chistye Prudy 2018.jpg". */
  filename: string;
  /** Direct CDN URL (Special:FilePath redirect target). */
  url: string;
  /** Thumbnail URL (~800px wide). */
  thumb_url: string;
};

/**
 * Mirrors the rough shape of a future POI row, with extra raw fields used by
 * downstream stages (content writing, manual editing).
 */
export type Candidate = {
  /** Stable slug derived from primary name + osm id. */
  slug: string;
  name_ru: string;
  name_en?: string;
  description?: string;
  /** Best-guess type from OSM tags — editors can override. */
  type:
    | "building"
    | "church"
    | "mansion"
    | "soviet"
    | "modernism"
    | "monument"
    | "bridge"
    | "park"
    | "other";
  address?: string;
  lat: number;
  lng: number;
  built_year?: number;
  architect?: string;
  image: CandidateImage;
  sources: CandidateSource;
  /** Raw OSM tags for editor reference. */
  osm_tags?: Record<string, string>;
};
