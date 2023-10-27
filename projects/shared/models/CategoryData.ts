import { Geography } from "./Geography";
import { Frequency } from "./Frequency";

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