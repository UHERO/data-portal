import { Component, Inject, OnChanges, Input } from '@angular/core';
import { HelperService } from '../helper.service';
import { AnalyzerService } from '../analyzer.service';
import * as Highcharts from 'highcharts';
import { HighchartsObject } from '../tools.models';

@Component({
  selector: 'lib-highchart',
  templateUrl: './highchart.component.html',
  styleUrls: ['./highchart.component.scss']
})
export class HighchartComponent implements OnChanges {
  @Input() portalSettings;
  @Input() seriesData;
  @Input() chartStart;
  @Input() chartEnd;
  @Input() minValue;
  @Input() maxValue;
  @Input() indexChecked;
  @Input() baseYear;
  chartCallback;
  chartObject;
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions = {} as HighchartsObject;
  updateChart = false;

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

  ngOnChanges() {
    if (this.seriesData === 'No data available') {
      this.noDataChart(this.seriesData);
      this.updateChart = true;
    } else {
      this.drawChart(this.seriesData, this.portalSettings, this.minValue, this.maxValue, this.chartStart, this.chartEnd);
      this.updateChart = true;
    }
    if (this.chartObject) {
      this.chartObject.redraw();
    }
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
    };
  }

  setXAxis = (startDate, endDate) => {
    return {
      type: 'datetime',
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

  drawChart = (seriesData, portalSettings, min: number, max: number, chartStart, chartEnd) => {
    const currentFreq = seriesData.frequencyShort;
    const { start, end } = seriesData.gridDisplay;
    const { percent, title, unitsLabelShort, displayName, indexDisplayName } = seriesData;
    const decimals = seriesData.decimals || 1;
    let { series0, series1, pseudoZones } = seriesData.gridDisplay.chartData;
    series0 = this.indexChecked ? this.helperService.getIndexedTransformation(seriesData.observations[0], this._analyzerService.analyzerData.baseYear) : series0;
    const startDate = Date.parse(chartStart) || Date.parse(seriesData.gridDisplay.start)
    const endDate = Date.parse(chartEnd) || Date.parse(seriesData.gridDisplay.end);
    // Check how many non-null points exist in level series
    const levelLength = series0.values.filter(value => Number.isFinite(value));
    const chartSeries = this.setChartSeries(portalSettings, series0, pseudoZones, series1, endDate);
    const formatLabel = (seriesName, freq, perc) => this.formatTransformLabel(seriesName, freq, perc);
    const formatDate = (date, freq) => this.formatDateLabel(date, freq);
    const indexed = this.indexChecked;
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
      // Fiilter out null values
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
          let lastValue0 = (s0 !== undefined && s0.points && s0.points.length) ?
            HighchartComponent.findLastValue(s0.points, s0.userOptions.endDate, s0.xAxis.min) : -1;
          let lastValue1 = (s1 !== undefined && s1.points && s1.points.length) ?
            HighchartComponent.findLastValue(s1.points, s1.userOptions.endDate, s1.xAxis.min) : -1;
          if (s0.userOptions._indexed && !s0.points.some(p => p.y !== null)) {
            lastValue0 = -1;
            lastValue1 = -1
          }
          // Prevent tooltip from being hidden on mouseleave
          // Reset toolip value and marker to most recent observation
          this.tooltip.hide = () => {
            if (lastValue0 > -1) {
              const tooltipData = lastValue1 > -1 ?
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
            this.setTitle({ text: s0.userOptions._indexed ? `<b>${indexDisplayName}</b>` : `<b>${title}</b>` });
            this.setSubtitle({
              text: s0.userOptions._indexed ? `Not available for current base year` : `Data Available From: ${categoryDisplayStart} - ${categoryDisplayEnd}`,
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
    this.chartOptions.title = this.setChartTitle('<br>');
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
            const displayValue = Highcharts.numberFormat(point.y, decimals, '.', ',');
            const formattedValue = displayValue === '-0.00' ? '0.00' : displayValue;
            const name = formatLabel(point.series.name, currentFreq, percent);
            let label = name + formattedValue;
            const pseudo = ' Pseudo History ';
            if (point.series.name === 'level') {
              label += ` (${indexed ? 'Index' : unitsLabelShort}) <br />`;
            }
            if (pseudoZones.length) {
              pseudoZones.forEach((zone) => {
                if (point.x < zone.value) {
                  const otherSeriesLabel = pseudo + name + formattedValue;
                  const levelLabel = `${otherSeriesLabel} (${unitsLabelShort}) <br />`;
                  labelString += point.series.name === 'level' ? levelLabel : otherSeriesLabel;
                }
                if (point.x >= zone.value) {
                  labelString += label;
                }
              });
            }
            if (pseudoZones.length === 0){
              labelString += label;
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
    this.chartOptions.xAxis = this.setXAxis(startDate, endDate);
    this.chartOptions.yAxis = this.setYAxis(min, max);
    this.chartOptions.plotOptions = {
      line: {
        marker: {
          enabled: levelLength.length === 1 ? false : true,
          radius: 1.5
        }
      }
    };
    this.chartOptions.series = chartSeries;
    if (this.chartObject) {
      this.chartObject.redraw();
    }
  }

  formatTransformLabel = (transformationName, percent, currentFreq) => {
    if (transformationName === 'c5ma') {
      return percent ? 'Annual Chg: ' : 'Annual % Chg: ';
    }
    if (transformationName === 'ytd' && currentFreq === 'A') {
      return percent ? 'Year/Year Chg: ' : 'Year/Year % Chg: ';
    }
    if (transformationName === 'ytd' && currentFreq !== 'A') {
      return percent ? 'Year-to-Date Chg: ' : 'Year-to-Date % Chg: ';
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

  noDataChart = (seriesData) => {
    const title = seriesData.displayName;
    this.chartOptions.title = this.setChartTitle(`<b>${title}</b><br />No Data Available`);
    this.chartOptions.exporting = { enabled: false };
    this.chartOptions.legend = { enabled: false };
    this.chartOptions.credits = { enabled: false };
    this.chartOptions.yAxis = this.setYAxis(null, null);
    this.chartOptions.xAxis = this.setXAxis(null, null);
    this.chartOptions.series = [{
      data: []
    }];
    this.chartOptions.lang = { noData: 'No Data Available' };
  }
}
