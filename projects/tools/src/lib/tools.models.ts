export interface Frequency {
  freq: string;
  label: string;
}

export interface DateRange {
  startDate: string,
  endDate: string,
  endOfSample: boolean;
}

export interface Geography {
  fips: number;
  name: string;
  shortName: string;
  handle: string;
}

export interface CategoryData {
  selectedCategory: string;
  sublist: Array<any>;
  regions: Array<any>;
  currentGeo: Geography;
  frequencies: Array<any>;
  currentFreq: Frequency;
  seriesData: Array<any>;
  invalid: string;
}

export class DateWrapper {
  firstDate: string;
  endDate: string;
}

export interface HighchartsObject {
  chart: {
    spacingTop: number;
    className: string;
    events: {
      render?: () => void;
      redraw?: () => void;
      load?: () => void;
    };
    styledMode: true;
    margin?: any;
  };
  exporting: {
    enabled: boolean;
  };
  time?: {
    timezone: string;
  };
  title: {
    text: string;
    useHTML: boolean;
    align: string;
    widthAdjust: number;
    x: number;
    y: number;
    style: {
      margin: number;
    };
  };
  tooltip: {
    positioner: () => {};
    shadow: boolean;
    borderWidth: number;
    shared: boolean;
    formatter: () => string;
    useHTML: boolean;
  };
  legend: {
    enabled: boolean;
  };
  credits: {
    enabled: boolean;
  };
  xAxis: {
    type: string;
    labels: {
      enabled: boolean;
    };
    lineWidth: number;
    tickLength: number;
  };
  yAxis: Array<any>;
  plotOptions: {
    line: {
      marker: {
        enabled: boolean;
        radius: number;
      };
    };
  };
  series: Array<any>;
  lang: {
    noData: string;
  };
}

export interface HighchartChartData {
  dates: Array<any>;
  level: Array<any>;
  pseudoZones: Array<any>;
  // growth rates
  yoy: Array<any>;
  ytd: Array<any>;
  c5ma: Array<any>;
}

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

export interface AnalyzerDataInterface {
  analyzerTableDates: Array<any>;
  analyzerMeasurements: {};
  sliderDates: Array<any>;
  analyzerDateWrapper: DateWrapper;
  analyzerSeries: Array<any>;
  displayFreqSelector: boolean;
  siblingFreqs: Array<any>;
  analyzerFrequency: null;
  yRightSeries: Array<any>;
  yLeftSeries: Array<any>;
  leftMin: number;
  leftMax: number;
  rightMin: number;
  rightMax: number;
  urlChartSeries: Array<any>;
  minDate: string;
  maxDate: string;
  requestComplete: boolean;
  indexed: boolean;
  baseYear: string;
}
