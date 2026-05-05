export type POIType =
  | "building"
  | "church"
  | "mansion"
  | "soviet"
  | "modernism"
  | "monument"
  | "bridge"
  | "park"
  | "other";

export type FactCard = {
  title: string;
  body: string;
};

export type POISources = {
  wikidata_id?: string;
  wikipedia_url?: string;
  osm_id?: string;
  um_mos_url?: string;
  custom?: { label: string; url: string }[];
};

export type POI = {
  slug: string;
  name: string;
  address: string | null;
  lng: number;
  lat: number;
  type: POIType;
  built_year: number | null;
  architect: string | null;
  short_blurb: string | null;
  long_text: string | null;
  fact_cards: FactCard[];
  cover_image_url: string | null;
  cover_image_credit: string | null;
  sources: POISources;
};
