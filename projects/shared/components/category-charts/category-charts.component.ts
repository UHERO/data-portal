import { KeyValue, NgFor, NgIf, KeyValuePipe } from '@angular/common';
import { Component, Input, OnChanges, Inject, Output, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { AnalyzerService } from 'projects/shared/services/analyzer.service';
import { HelperService } from 'projects/shared/services/helper.service';
import { HighchartComponent } from '../highchart/highchart.component';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'lib-category-charts',
    templateUrl: './category-charts.component.html',
    styleUrls: ['./category-charts.component.scss'],
    standalone: true,
    imports: [NgFor, NgIf, RouterLink, HighchartComponent, KeyValuePipe]
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
  @Input() dates: Array<{date: string, tableDate: string}>;
  @Input() analyzerView: boolean;
  @Input() indexChecked: boolean;
  @Input() indexBaseYear: string;
  @Output() updateURLFragment = new EventEmitter();
  minValue: number;
  maxValue: number;
  noSeriesToDisplay: boolean;
  dateRangeSubscription: Subscription;
  selectedDateRange;
  selectedStart;
  selectedEnd;

  constructor(
    @Inject('defaultRange') private defaultRange,
    private helperService: HelperService,
    private analyzerService: AnalyzerService,
  ) {
    this.dateRangeSubscription = helperService.currentDateRange.subscribe((dateRange) => {
      this.selectedDateRange = dateRange;
      this.selectedStart = dateRange.startDate;
      this.selectedEnd = dateRange.endDate;
    });
  }

  ngOnChanges() {
    console.log('MEASUREMENT UPDATED')
    if (this.displayedMeasurements) {
      Object.keys(this.displayedMeasurements).forEach((measurement) => {
        this.helperService.toggleSeriesDisplay(this.hasSeasonal, this.showSeasonal, this.displayedMeasurements[measurement], this.analyzerView);
        this.isSeriesInAnalyzer(this.displayedMeasurements[measurement]);
      });
    }
    this.noSeriesToDisplay = this.helperService.checkIfSeriesAvailable(this.noSeries, this.displayedMeasurements);
    // If setYAxes, chart view should display all charts' (level) yAxis with the same range
    // Allow y-axes to vary for search results
    if (this.portalSettings.highcharts.setYAxes) {
      if (this.findMinMax) {
        // Find minimum and maximum values out of all series within a sublist; Use values to set min/max of yAxis
        this.minValue = this.findMin(this.displayedMeasurements, this.selectedStart, this.selectedEnd);
        this.maxValue = this.findMax(this.displayedMeasurements, this.selectedStart, this.selectedEnd);
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
    this.analyzerService.removeFromAnalyzer(series.id, this.selectedDateRange.startDate);
  }

  addCompare(series) {
    series.visible = true;
    this.analyzerService.makeCompareSeriesVisible(series, this.selectedDateRange.startDate);
  }

  removeCompare(series) {
    series.visible = false;
    this.analyzerService.removeFromComparisonChart(series.id, this.selectedDateRange.startDate);
  }
}
