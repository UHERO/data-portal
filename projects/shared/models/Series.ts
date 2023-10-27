import { Geography } from "./Geography";

// Series data accepted by highstock component
export interface Series {
  analyze: boolean;
  decimals: number;
  freqs: Array<any>;
  frequency: string;
  frequencyShort: string;
  geography: Geography;
  geos: Array<any>;
  id: number;
  measurementId: number;
  measurementName: string;
  name: string;
  percent: boolean;
  real: boolean;
  saParam: boolean;
  seasonalAdjustment: string;
  seriesObservations: {
    observationEnd: string;
    observationStart: string;
    orderBy: string;
    sortOrder: string;
    transformationResults: Array<any>;
  };
  sourceDescription: string;
  sourceLink: string;
  sourceDetails: string;
  title: string;
  unitsLabel: string;
  unitsLabelShort: string;
  universe: string;
}