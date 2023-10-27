export interface Category {
  id: number;
  categories: Array<any>;
  name: string;
  geos?: Array<any>;
  freqs?: Array<any>;
  freqGeos: Array<any>;
  geoFreqs: Array<any>;
  parentId?: number;
  children?: Array<any>;
  defaults?: {geo: string, freq: string};
  current?: {geo: string, freq: string, observationStart: string, observationEnd: string};
  observationStart?: string;
  observationEnd?: string;
}
