export type LatLng = [number, number];

export type FactCard = {
  title: string;
  body: string;
};

export type Photo = {
  url: string;
  caption?: string;
  attribution: string;
  attributionUrl?: string;
};

export type POI = {
  id: string;
  title: string;
  tag?: string;
  coords: LatLng;
  paragraphs: string[];
  facts: FactCard[];
  photo?: Photo;
};

export type Route = {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  distanceMeters: number;
  durationMinutes: number;
  startHint?: string;
  pois: POI[];
  path?: LatLng[];
  cover?: Photo;
};
