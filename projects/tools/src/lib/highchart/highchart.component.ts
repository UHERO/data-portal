import { Component, Inject, OnInit, OnChanges, OnDestroy, Input, SimpleChanges } from '@angular/core';
import { HelperService } from '../helper.service';
import { AnalyzerService } from '../analyzer.service';
import * as Highcharts from 'highcharts';
import { DateRange } from '../tools.models';
import { Subscription } from 'rxjs';

type CustomSeriesOptions = Highcharts.SeriesOptionsType & {endDate: string, _indexed: boolean};

@Component({
  selector: 'lib-highchart',
  templateUrl: './highchart.component.html',
  styleUrls: ['./highchart.component.scss']
})
export class HighchartComponent implements OnInit, OnChanges, OnDestroy {
  @Input() portalSettings;
  @Input() seriesData;
  @Input() minValue;
  @Input() maxValue;
  @Input() indexChecked;
  @Input() baseYear;
  chartCallback;
  chartObject;
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = {} //as HighchartsObject;
  updateChart = false;
  dateRangeSubscription: Subscription;
  selectedDateRange: DateRange;

  static findLastValue(valueArray, endDate, start) {
    const firstSeriesObs = valueArray[0].x;
    const lastSeriesObs = valueArray[valueArray.length - 1].x;
    if (endDate < start || start > lastSeriesObs || endDate < firstSeriesObs) {
      return -1
    }
    if (endDate) {
      const pointIndex = valueArray.findIndex(points => points.x === endDate);
      return pointIndex === -1 ? valueArray.length - 1 : pointIndex;
    }
  }

  constructor(
    @Inject('defaultRange') private defaultRange,
    private helperService: HelperService,
    private _analyzerService: AnalyzerService,
  ) {
    this.chartCallback = chart => {
      this.chartObject = chart;
    };
  }

  ngOnInit(): void {
    this.dateRangeSubscription = this.helperService.currentDateRange.subscribe((dateRange) => {
      this.selectedDateRange = dateRange;
      const { startDate, endDate } = dateRange;
      if (this.seriesData === 'No data available') {
        this.noDataChart(this.seriesData, `<b>${this.seriesData.displayTitle}</b><br />No Data Available`, '');
        this.updateChart = true;
      } else {
        this.drawChart(this.seriesData, this.portalSettings, this.minValue, this.maxValue, startDate, endDate);
      }
      if (this.chartObject) {
        this.chartObject.redraw();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    const indexCheckChange = changes['indexChecked'];
    const baseYearChange = changes['baseYear'];
    const seriesDataChange = changes['seriesData']; 
    const maxValueChange = changes['maxValue'];
    const minValueChange = changes['minValue'];
    if (
      (indexCheckChange && !indexCheckChange.firstChange) ||
      (baseYearChange && !baseYearChange.firstChange) ||
      (seriesDataChange && !seriesDataChange.firstChange) ||
      (minValueChange && !minValueChange.firstChange) ||
      (maxValueChange && !maxValueChange.firstChange)
    ) {
      const { startDate, endDate } = this.selectedDateRange;
      this.drawChart(this.seriesData, this.portalSettings, this.minValue, this.maxValue, startDate, endDate);
      if (this.chartObject) {
        this.chartObject.redraw();
      }
    }
  }

  drawChart = (seriesData, portalSettings, minValue: number, maxValue: number, startDate: string, endDate: string) => {
    this.updateChartOptions(seriesData, portalSettings, minValue, maxValue, startDate, endDate);
    this.updateChart = true;
  }

  ngOnDestroy(): void {
    this.dateRangeSubscription.unsubscribe();
  }

  noDataChart = (seriesData, chartTitle: string, subtitle: string) => {
    this.chartOptions.title = this.setChartTitle(chartTitle);
    this.chartOptions.subtitle = this.setSubtitle(subtitle);
    this.chartOptions.exporting = { enabled: false };
    this.chartOptions.legend = { enabled: false };
    this.chartOptions.credits = { enabled: false };
    this.chartOptions.yAxis = this.setYAxis(null, null);
    this.chartOptions.xAxis = this.setXAxis(null, null);
    this.chartOptions.series = [{
      data: [],
      type: 'line'
    }];
    this.chartOptions.lang = { noData: 'No Data Available' };
  }
  
  setXAxis = (startDate, endDate) => {
    return {
      type: 'datetime' as Highcharts.AxisTypeValue,
      min: startDate,
      max: endDate,
      ordinal: false,
      labels: {
        enabled: false
      },
      lineWidth: 0,
      tickLength: 0
    };
  }

  setChartTitle = (title: string) => {
    return {
      text: title,
      useHTML: true,
      align: 'left',
      widthAdjust: 0,
      x: 0,
      y: -5,
      style: {
        margin: 75
      }
    } as Highcharts.TitleOptions;
  }

  setSubtitle = (subtitle: string) => {
    return {
      text: subtitle,
      verticalAlign: 'middle',
      y: -20
    } as Highcharts.SubtitleOptions
  }

  setYAxis = (min: number, max: number) => {
    return [{
      labels: {
        enabled: false
      },
      title: {
        text: ''
      },
      minTickInterval: 0.01
    }, {
      labels: {
        enabled: false
      },
      title: {
        text: ''
      },
      min,
      max,
      minTickInterval: 0.01,
      opposite: true
    }];
  }

  setChartSeries = (portalSettings, series0, pseudoZones, series1, endDate) => {
    const formatDate = (date, freq) => this.formatDateLabel(date, freq);
    const chartSeries = [];
    chartSeries.push({
      name: portalSettings.highcharts.series0Name,
      type: portalSettings.highcharts.series0Type,
      yAxis: 1,
      data: series0.values,
      _indexed: this.indexChecked,
      pointStart: Date.parse(series0.start),
      endDate: endDate,
      states: {
        hover: {
          lineWidth: 2
        }
      },
      dataGrouping: {
        enabled: false
      },
      zoneAxis: 'x',
      zones: pseudoZones,
      zIndex: 1
    });
    if (series1) {
      chartSeries.push({
        name: portalSettings.highcharts.series1Name,
        type: portalSettings.highcharts.series1Type,
        data: series1.values,
        pointStart: Date.parse(series1.start),
        endDate: endDate,
        dataGrouping: {
          enabled: false
        },
      });
    }
    return chartSeries;
  }

  updateChartOptions = (seriesData, portalSettings, min: number, max: number, chartStart, chartEnd) => {
    const {
      percent,
      title,
      unitsLabelShort,
      displayName,
      indexDisplayName,
      frequencyShort: currentFreq,
      gridDisplay,
      observations
    } = seriesData;
    const { start, end } = gridDisplay;
    const decimals = seriesData.decimals || 1;
    let { series0, series1, pseudoZones } = gridDisplay.chartData;
    series0 = this.indexChecked ? this.helperService.getIndexedTransformation(observations[0], chartStart) : series0;
    const startDate = Date.parse(chartStart) || Date.parse(start);
    const endDate = Date.parse(chartEnd) || Date.parse(end);
    // Check how many non-null points exist in level series
    const levelLength = series0.values.filter(value => Number.isFinite(value));
    const formatLabel = (seriesName, perc, freq) => this.formatTransformLabel(seriesName, perc, freq);
    const formatDate = (date, freq) => this.formatDateLabel(date, freq);
    const indexed = this.indexChecked;
    const chartSeries = this.setChartSeries(portalSettings, series0, pseudoZones, series1, endDate);
    const addSubtitle = (point0, freq, chart, point1?, s1?) => {
      const dateLabel = formatDate(point0.x, freq);
      let subtitleText = '';
      subtitleText += `${Highcharts.numberFormat(point0.y, decimals, '.', ',')} <br> (${this.indexChecked ? 'Index' : unitsLabelShort})`;
      subtitleText += s1 ?
      `${this.formatTransformLabel(s1.name, percent, currentFreq)}<br>${Highcharts.numberFormat(point1.y, decimals, '.', ',')}<br>${dateLabel}` :
        dateLabel;
      chart.setSubtitle({
        text: subtitleText,
        verticalAlign: 'middle',
        y: -20
      });
    };
    const refreshTooltip = (chart, tooltipData, latest0, s0) => {
      chart.tooltip.refresh(tooltipData);
      s0.points[latest0].setState('');
      const pointCount = s0.points.filter(point => Number.isFinite(point.y));
      if (pointCount.length > 1) {
        chart.setSubtitle({ text: '' });
      }
    };
    const checkPointCount = (freq, s0, point0, chart, point1?, s1?) => {
      // Filter out null values
      const pointCount = s0.points.filter(point => Number.isFinite(point.y));
      // If only 1 non-null value exists, display data value as text
      if (pointCount.length === 1) {
        addSubtitle(point0, freq, chart, point1, s1);
        s0.userOptions.states.hover.enabled = false;
        s0.options.marker.states.hover.enabled = false;
        point0.setState('');
      }
      if (pointCount.length > 1) {
        chart.setSubtitle({ text: '' });
      }
    };
    this.chartOptions.chart = {
      spacingTop: 20,
      className: levelLength.length === 1 ? 'single-point' : undefined,
      events: {
        render() {
          const s0 = this.series[0];
          const s1 = this.series[1];
          // Get position of last non-null value
            let lastValue0 = (s0?.points?.length) ? HighchartComponent.findLastValue(s0.points, (<CustomSeriesOptions>s0.userOptions).endDate, s0.xAxis.min) : -1;
            let lastValue1 = (s1?.points?.length) ? HighchartComponent.findLastValue(s1.points, (<CustomSeriesOptions>s1.userOptions).endDate, s1.xAxis.min) : -1;
          if ((<CustomSeriesOptions>s0.userOptions)._indexed && !s0.points.some(p => p.y !== null)) {
            lastValue0 = -1;
            lastValue1 = -1
          }
          // Prevent tooltip from being hidden on mouseleave
          // Reset toolip value and marker to most recent observation
          this.tooltip.hide = () => {
            if (lastValue0 > -1) {
              const tooltipData = lastValue1 > -1 && s1.points[lastValue1].y !== null ?
                [s0.points[lastValue0], s1.points[lastValue1]] :
                // no YTD values
                [s0.points[lastValue0]];
              refreshTooltip(this, tooltipData, lastValue0, s0);
            }
          };
          // Display tooltip when chart loads
          if (lastValue0 > -1 && lastValue1 > -1) {
            this.setTitle({ text: '' });
            this.tooltip.refresh([s0.points[lastValue0], s1.points[lastValue1]]);
            checkPointCount(currentFreq, s0, s0.points[lastValue0], this, s1.points[lastValue1], s1);
          }
          if (lastValue0 > -1 && lastValue1 === -1) {
            this.setTitle({ text: '' });
            this.tooltip.refresh([s0.points[lastValue0]]);
            checkPointCount(currentFreq, s0, s0.points[lastValue0], this);
          }
          // If no data available for a given date range, display series title and display dates where data is available for a series
         if (lastValue0 === -1 && lastValue1 === -1) {
            this.setClassName(undefined);
            const categoryDisplayStart = formatDate(Date.parse(start), currentFreq);
            const categoryDisplayEnd = formatDate(Date.parse(end), currentFreq);
            this.setTitle({ text: (<CustomSeriesOptions>s0.userOptions)._indexed ? `<b>${indexDisplayName}</b>` : `<b>${title}</b>` });
            this.setSubtitle({
              text: (<CustomSeriesOptions>s0.userOptions)._indexed ? `Not available for current base year` : `Data Available From: ${categoryDisplayStart} - ${categoryDisplayEnd}`,
              verticalAlign: 'middle',
              y: -20
            });
          }
        }
      },
      styledMode: true,
     margin: [50, 15, 10, 10]
    };
    this.chartOptions.exporting = { enabled: false };
    this.chartOptions.title = this.setChartTitle('');
    this.chartOptions.tooltip = {
      positioner() {
        return { x: 0, y: -5 };
      },
      shadow: false,
      borderWidth: 0,
      shared: true,
      formatter() {
        const getSeriesLabel = (points, labelString) => {
          if (indexed && !points.some(p => p.series.userOptions.name === 'level')) {
            return;
          }
          points.forEach((point) => {
            if (point.y !== null) {
              const displayValue = Highcharts.numberFormat(point.y, decimals, '.', ',');
              const formattedValue = displayValue === '-0.00' ? '0.00' : displayValue;
              const { name } = point.series;
              const labelName = formatLabel(name, percent, currentFreq);
              let label = labelName + formattedValue;
              const pseudo = ' Pseudo History ';
              if (name === 'level') {
                label += ` (${indexed ? 'Index' : unitsLabelShort}) <br />`;
              }
              if (pseudoZones.length) {
                pseudoZones.forEach((zone) => {
                  if (point.x < zone.value) {
                    const pseudoZoneLabel = pseudo + labelName + formattedValue;
                    const levelLabel = `${pseudoZoneLabel} (${unitsLabelShort}) <br />`;
                    labelString += name === 'level' ? levelLabel : pseudoZoneLabel;
                  }
                  if (point.x >= zone.value) {
                    labelString += label;
                  }
                });
              }
              if (pseudoZones.length === 0){
                labelString += label;
              }
            }
          });
          return labelString;
        };
        if (this.x >= startDate && this.x <= endDate) {
          let s = `<b>${indexed ? indexDisplayName : displayName}</b><br>`;
          // Get Quarter or Month for Q/M frequencies
          s = s + formatDate(this.x, currentFreq);
          // Add year
          s = getSeriesLabel(this.points, s);
          return s;
        }
      },
      useHTML: true
    };
    this.chartOptions.legend = { enabled: false };
    this.chartOptions.credits = { enabled: false };
    this.chartOptions.xAxis = end < chartStart ? this.setXAxis(null, null) : this.setXAxis(startDate, endDate);
    this.chartOptions.yAxis = end < chartStart ? this.setYAxis(null, null) :  this.setYAxis(min, max);
    this.chartOptions.plotOptions = {
      line: {
        marker: {
          enabled: levelLength.length === 1 ? false : true,
          radius: 1.5
        }
      }
    };
    this.chartOptions.series = chartSeries;
  }

  formatTransformLabel = (transformationName: string, percent: boolean, currentFreq: string) => {
    const changeString = percent ? 'Chg: ' : '% Chg: ';
    if (transformationName === 'c5ma') {
      return `Annual ${changeString}`;
    }
    if (transformationName === 'ytd' && currentFreq === 'A') {
      return `Year/Year ${changeString}`;
    }
    if (transformationName === 'ytd' && currentFreq !== 'A') {
      return `Year-to-Date ${changeString}`;
    }
    return ': ';
  }

  formatDateLabel = (date, freq) => {
    if (freq === 'A') {
      return Highcharts.dateFormat('%Y', date);
    }
    if (freq === 'Q') {
      const month = Highcharts.dateFormat('%b', date);
      if (month === 'Jan' || month === 'Feb' || month === 'Mar') {
        return `${Highcharts.dateFormat('%Y', date)} Q1`;
      }
      if (month === 'Apr' || month === 'May' || month === 'Jun') {
        return `${Highcharts.dateFormat('%Y', date)} Q2`;
      }
      if (month === 'Jul' || month === 'Aug' || month === 'Sep') {
        return `${Highcharts.dateFormat('%Y', date)} Q3`;
      }
      if (month === 'Oct' || month === 'Nov' || month === 'Dec') {
        return `${Highcharts.dateFormat('%Y', date)} Q4`;
      }
    }
    if (freq === 'M' || freq === 'S') {
      return `${Highcharts.dateFormat('%b', date)} ${Highcharts.dateFormat('%Y', date)}`;
    }
    return Highcharts.dateFormat('%b %d %Y', date);
  }
}
