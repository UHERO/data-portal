import { KeyValue } from '@angular/common';
import { Component, Input, OnChanges, Inject, Output, EventEmitter } from '@angular/core';
import { AnalyzerService } from '../analyzer.service';
import { HelperService } from '../helper.service';

@Component({
  selector: 'lib-category-charts',
  templateUrl: './category-charts.component.html',
  styleUrls: ['./category-charts.component.scss']
})
export class CategoryChartsComponent implements OnChanges {
  @Input() portalSettings;
  @Input() displayedMeasurements: any;
  @Input() measurementOrder: Array<string>;
  @Input() findMinMax: boolean;
  @Input() freq: string;
  @Input() noSeries: boolean;
  @Input() showSeasonal: boolean;
  @Input() hasSeasonal: boolean;
  @Input() chartStart: string;
  @Input() chartEnd: string;
  @Input() dates: Array<{date: string, tableDate: string}>;
  @Input() analyzerView: boolean;
  @Input() indexChecked: boolean;
  @Input() indexBaseYear: string;
  @Input() routeStart;
  @Input() routeEnd;
  @Output() updateURLFragment = new EventEmitter();
  minValue: number;
  maxValue: number;
  noSeriesToDisplay: boolean;

  constructor(
    @Inject('defaultRange') private defaultRange,
    private helperService: HelperService,
    private analyzerService: AnalyzerService,
  ) { }

  ngOnChanges() {
    if (this.displayedMeasurements) {
      Object.keys(this.displayedMeasurements).forEach((measurement) => {
        this.helperService.toggleSeriesDisplay(this.hasSeasonal, this.showSeasonal, this.displayedMeasurements[measurement], this.analyzerView);
        this.isSeriesInAnalyzer(this.displayedMeasurements[measurement]);
      });
      const { seriesStart, seriesEnd } = this.helperService.getSeriesStartAndEnd(this.dates, this.routeStart, this.routeEnd, this.freq, this.defaultRange);
      this.chartStart = this.dates[seriesStart].date;
      this.chartEnd = this.dates[seriesEnd].date;
    }
    this.noSeriesToDisplay = this.helperService.checkIfSeriesAvailable(this.noSeries, this.displayedMeasurements);
    // If setYAxes, chart view should display all charts' (level) yAxis with the same range
    // Allow y-axes to vary for search results
    if (this.portalSettings.highcharts.setYAxes) {
      const defaultStartEnd = this.defaultRange.find(ranges => ranges.freq === this.freq);
      const start = this.chartStart || Date.parse(defaultStartEnd.start);
      const end = this.chartEnd || Date.parse(defaultStartEnd.end);
      if (this.findMinMax) {
        // Find minimum and maximum values out of all series within a sublist; Use values to set min/max of yAxis
        this.minValue = this.findMin(this.displayedMeasurements, start, end);
        this.maxValue = this.findMax(this.displayedMeasurements, start, end);
      }
    }
  }

  measurementOrderFunc = (a: KeyValue<string, Array<any>>, b: KeyValue<string, Array<any>>): number => {
    return !this.measurementOrder ?
      null :
      this.measurementOrder.indexOf(a.key) - this.measurementOrder.indexOf(b.key);
  }

  isSeriesInAnalyzer = (measurementSeries: Array<any>) => {
    measurementSeries.forEach((series) => {
      series.analyze = this.analyzerService.checkAnalyzer(series);
    });
  }

  getAllSeriesFromAllMeasurements = (measurements) => {
    return Object.keys(measurements).reduce((dataArr, measurement) => {
      return dataArr.concat(measurements[measurement]);
    }, []);
  }

  findMin = (displaySeries, start, end) => {
    let minValue = null;
    const allSeries = this.getAllSeriesFromAllMeasurements(displaySeries);
    allSeries.forEach((serie) => {
      const values = this.getSeriesValues(serie, start, end);
      const min = Math.min(...values);
      if (minValue === null || min < minValue) {
        minValue = min;
      }
    });
    return minValue;
  }

  findMax = (displaySeries, start, end) => {
    let maxValue = null;
    const allSeries = this.getAllSeriesFromAllMeasurements(displaySeries);
    allSeries.forEach((serie) => {
      const values = this.getSeriesValues(serie, start, end);
      const max = Math.max(...values);
      if (maxValue === null || max > maxValue) {
        maxValue = max;
      }
    });
    return maxValue;
  }

  getSeriesValues = (series, start, end) => {
    const dateStart = this.dates.findIndex(date => date.date === new Date(start).toISOString().substring(0, 10));
    const dateEnd = this.dates.findIndex(date => date.date === new Date(end).toISOString().substring(0, 10));
    return series.seriesObservations.transformationResults[0].values.slice(dateStart, dateEnd + 1);
  }

  addToAnalyzer(series) {
    series.analyze = true;
    this.analyzerService.addToAnalyzer(series.id);
  }

  removeFromAnalyzer(series) {
    series.analyze = false;
    this.analyzerService.removeFromAnalyzer(series.id);
  }

  addCompare(series) {
    series.visible = true;
    this.analyzerService.makeCompareSeriesVisible(series);
  }

  removeCompare(series) {
    series.visible = false;
    this.analyzerService.removeFromComparisonChart(series.id);
  }
}
