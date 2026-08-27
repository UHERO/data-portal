
export interface CategoryGeography {
  fips?: string;
  name: string;
  shortName: string;
  handle: string;
}

export interface CategoryFrequency {
  freq: string;
  label: string;
}

export interface CategoryDefaults {
  geo: CategoryGeography;
  freq: CategoryFrequency;
  observationStart?: string;
  observationEnd?: string;
}

export interface RawCategory {
  id: number;
  name: string;
  universe: string;
  parentId: number;
  defaults: CategoryDefaults;
}

export interface CategoryApiResponse {
  data: RawCategory[];
}

export interface Category extends RawCategory {
  children?: Category[];
}