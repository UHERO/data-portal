export type PortalUniverse = 'nta' | 'uhero' | 'fc' | 'ccom';

export interface DashboardLink {
  name: string;
  url: string;
}

export interface CatTableSettings {
  portalSource: string;
  portalLink: string;
}

export interface HighchartsSettings {
  seriesTotal: number;
  series0Name: string;
  series0Type: string;
  series0Data: boolean;
  series1Name: string;
  series1Type: string;
  series1Data: boolean;
  setYAxes: boolean;
}

export interface HighstockLabels {
  seriesLink: string;
  portal: string;
  portalLink: string;
}

export interface HighstockSettings {
  credits: string;
  labels: HighstockLabels;
  series0Name: string;
  series0Type: string;
  series1Name: string;
  series1Type: string;
  series2Name: string;
  series2Type: string;
  buttons: (number | string)[];
}

export interface SeriesTableSettings {
  columns: number;
  series1: string;
  series1Label: string;
  series2: string;
  series2Label: string;
  series2PercLabel: string;
  series3?: string;
  series3Label?: string;
  series3PercLabel?: string;
}

export interface TransformationSettings {
  yoy: boolean;
  ytd: boolean;
  mom?: boolean;
  c5ma: boolean;
}

export interface PortalSettings {
  catTable: CatTableSettings;
  highcharts: HighchartsSettings;
  highstock: HighstockSettings;
  seriesTable: SeriesTableSettings;
  transformations: TransformationSettings;
  sliderInteraction: boolean;
  otherDashboardLinks: DashboardLink[];
  selectors: string[];
}

export interface Portal {
  universe: PortalUniverse
}