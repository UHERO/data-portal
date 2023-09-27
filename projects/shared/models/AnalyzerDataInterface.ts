import { DateWrapper } from "./DateWrapper";

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
  requestComplete: boolean;
  indexed: boolean;
  baseYear: string;
}