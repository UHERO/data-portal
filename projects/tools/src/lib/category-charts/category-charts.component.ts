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
  @Input() data;
  @Input() findMinMax;
  @Input() freq;
  @Input() noSeries;
  @Input() showSeasonal;
  @Input() hasNonSeasonal;
  @Input() hasSeasonal;
  @Input() nsaActive;
  @Input() routeStart;
  @Input() routeEnd;
  @Input() search;
  @Input() dates;
  @Input() dateWrapper;
  @Input() analyzerView: boolean;
  @Input() indexChecked;
  @Input() indexBaseYear;
  @Output() updateURLFragment = new EventEmitter();
  minValue;
  maxValue;
  noSeriesToDisplay;
  routeSubscription;
  chartStart;
  chartEnd;

  constructor(
    @Inject('defaultRange') private defaultRange,
    private helperService: HelperService,
    private analyzerService: AnalyzerService,
  ) { }

  ngOnChanges() {
    if (this.data) {
      this.data.forEach((chartSeries) => {
        if (chartSeries && this.dates) {
          chartSeries.display = this.helperService.toggleSeriesForSeasonalDisplay(chartSeries, this.showSeasonal, this.hasSeasonal);
          chartSeries.analyze = this.analyzerService.checkAnalyzer(chartSeries);
          const { seriesStart, seriesEnd } = this.helperService.getSeriesStartAndEnd(this.dates, this.routeStart, this.routeEnd, this.freq, this.defaultRange);
          this.chartStart = this.dates[seriesStart].date;
          this.chartEnd = this.dates[seriesEnd].date;
        }
      });
    }
    this.noSeriesToDisplay = this.helperService.checkIfSeriesAvailable(this.noSeries, this.data);
    // If setYAxes, chart view should display all charts' (level) yAxis with the same range
    // Allow y-axes to vary for search results
    if (this.portalSettings.highcharts.setYAxes && !this.search) {
      const defaultStartEnd = this.defaultRange.find(ranges => ranges.freq === this.freq);
      const start = this.chartStart || Date.parse(defaultStartEnd.start);
      const end = this.chartEnd || Date.parse(defaultStartEnd.end);
      if (this.findMinMax) {
        // Find minimum and maximum values out of all series within a sublist; Use values to set min/max of yAxis
        this.minValue = this.findMin(this.data, start, end);
        this.maxValue = this.findMax(this.data, start, end);
      }
    }
  }

  findMin = (displaySeries, start, end) => {
    let minValue = null;
    displaySeries.forEach((serie) => {
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
    displaySeries.forEach((serie) => {
      const values = this.getSeriesValues(serie, start, end);
      const max = Math.max(...values);
      if (maxValue === null || max > maxValue) {
        maxValue = max;
      }
    });
    return maxValue;
  }

  getSeriesValues = (series, start, end) => {
    const dateStart = this.dates.findIndex(date => date.date === new Date(start).toISOString().substr(0, 10));
    const dateEnd = this.dates.findIndex(date => date.date === new Date(end).toISOString().substr(0, 10));
    return series.seriesObservations.transformationResults[0].values.slice(dateStart, dateEnd + 1);
  }

  addToAnalyzer(series) {
    series.analyze = true;
<<<<<<< HEAD
    this.analyzerService.addToAnalzyer(series.id);
=======
    this.analyzerService.addToAnalyzer(series.id);
>>>>>>> f86a666cb72b69e88d0d6717c11eb4e0852a4175
  }

  removeFromAnalyzer(series) {
    series.analyze = false;
    this.analyzerService.removeFromAnalyzer(series.id);
  }

  addCompare(series) {
    series.compare = true;
<<<<<<< HEAD
    //this.analyzerService.setCompareChartSeriesObject(series);
=======
>>>>>>> f86a666cb72b69e88d0d6717c11eb4e0852a4175
    this.analyzerService.makeCompareSeriesVisible(series.id)
  }

  removeCompare(series) {
    series.compare = false;
    this.analyzerService.removeFromComparisonChart(series.id);
  }

  trackBySeries(index, item) {
    return item.id;
  }
}
