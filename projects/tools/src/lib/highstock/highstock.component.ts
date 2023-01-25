// Highstock chart component used for single-series view
import { Component, Inject, Input, Output, EventEmitter, OnChanges, ViewEncapsulation, OnInit } from '@angular/core';
import { HighchartChartData, Series, Geography, Frequency } from '../tools.models';
import { HighstockHelperService } from '../highstock-helper.service';
import { AnalyzerService } from '../analyzer.service';
import * as Highcharts from 'highcharts/highstock';
import exporting from 'highcharts/modules/exporting';
import exportData from 'highcharts/modules/export-data';
import offlineExport from 'highcharts/modules/offline-exporting';
import Accessibility from 'highcharts/modules/accessibility';

interface CustomChart extends Highcharts.Chart {
  analyzerBtn: any
}

@Component({
  selector: 'lib-highstock',
  templateUrl: './highstock.component.html',
  styleUrls: ['../analyzer-highstock/analyzer-highstock.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class HighstockComponent implements OnChanges {
  @Input() portalSettings;
  @Input() chartData;
  @Input() seriesDetail;
  @Input() start;
  @Input() end;
  @Input() showTitle;
  // Async EventEmitter, emit tableExtremes on load to render table
  @Output() tableExtremes = new EventEmitter(true);
  updateChart = false;
  chartObject: Highcharts.Chart;
  showChart = false;

  Highcharts: typeof Highcharts = Highcharts;
  chartConstructor: string = 'stockChart';
  chartOptions: Highcharts.Options = {
    accessibility: {
      description: ''
    },
    chart: {
      alignTicks: false,
      zoomType: 'x',
      className: 'single-series-chart',
      styledMode: true,
    },
    navigator: {
      enabled: false
    },
    scrollbar: {
      enabled: false
    },
    credits: {
      enabled: false
    },
    plotOptions:{
      series: {
        cropThreshold: 0,
        turboThreshold: 0
      }
    }
  };

  constructor(
    @Inject('defaultRange') private defaultRange,
    @Inject('logo') private logo,
    private highstockHelper: HighstockHelperService,
    private analyzerService: AnalyzerService,
  ) {
    // workaround to include exporting module in production build
    exporting(this.Highcharts);
    exportData(this.Highcharts);
    offlineExport(this.Highcharts);
    Accessibility(this.Highcharts);

    Highcharts.wrap(Highcharts.Chart.prototype, 'getCSV', function(proceed) {
      // Add metadata to top of CSV export
      const result = proceed.apply(this, Array.prototype.slice.call(arguments, 1));
      const seriesMetaData = this.userOptions.accessibility.description;
      return seriesMetaData ? `${seriesMetaData}\n\n${result}` : result;
    });
  }

  ngOnChanges() {
    if (Object.keys(this.seriesDetail).length) {
      this.showChart = true;
      this.drawChart(this.chartData, this.seriesDetail, this.portalSettings);
      this.updateChart = true;
    }
    if (this.chartOptions.xAxis) {
      (<Highcharts.AxisOptions>(this.chartOptions.xAxis)).min = this.start ? Date.parse(this.start) : undefined;
      (<Highcharts.AxisOptions>(this.chartOptions.xAxis)).max = this.end ? Date.parse(this.end) : undefined;
      this.chartObject?.xAxis[0].setExtremes(Date.parse(this.start), Date.parse(this.end));
      this.updateChart = true;
    }
  }

  saveChartInstance(chart: Highcharts.Chart) {
    this.chartObject = chart;
  }

  drawChart = (chartData: HighchartChartData, seriesDetail: Series, portalSettings) => {
    let chartObject = this.chartObject
    const decimals = seriesDetail.decimals || 1;
    const geo: Geography = seriesDetail.geography;
    const freq: Frequency = { freq: seriesDetail.frequencyShort, label: seriesDetail.frequency };
    const buttons = portalSettings.highstock.buttons;
    const chartButtons = this.formatChartButtons(freq.freq, buttons);
    const accessibilityDescription = this.formatAccessibilityDescription(seriesDetail, portalSettings, geo, freq);
    const pseudoZones = chartData.pseudoZones;
    const name = seriesDetail.title;
    const units = seriesDetail.unitsLabel || seriesDetail.unitsLabelShort;
    const change = seriesDetail.percent ? 'Change' : '% Change';
    const chartRange = chartData.level ? this.getSelectedChartRange(this.start, this.end, chartData.dates, this.defaultRange, freq.freq) : null;
    const startDate = this.start ? this.start : null;
    const endDate = this.setEndDate(this.end, chartRange, chartData);
    const series = this.formatChartSeries(chartData, portalSettings, seriesDetail, freq);
    const tableExtremes = this.tableExtremes;
    const formatTooltip = (points, x, pseudoZ, dec, frequency) => this.formatTooltip(points, x, pseudoZ, dec, frequency);
    const xAxisFormatter = (chart, frequency) => this.highstockHelper.xAxisLabelFormatter(chart, frequency);
    const logo = this.logo;
    const addToAnalyzer = (seriesId: number) => this.analyzerService.addToAnalyzer(seriesId);
    const rmvFromAnalyzer = (seriesId: number) => this.analyzerService.removeFromAnalyzer(seriesId);
    this.chartOptions.accessibility.description = accessibilityDescription;
    this.chartOptions.chart.events = {
      render() {
        if (!chartObject || chartObject.series.length < 4) {
          chartObject = Object.assign({}, this);
        }
        const chart = this as CustomChart;
        if (chart.analyzerBtn) {
          chart.analyzerBtn.destroy();
        }
        const btnIcon = `<i class="analyzer-toggle bi ${!seriesDetail.analyze ? 'bi-star' : 'bi-star-fill'}"></i>`;
        chart.analyzerBtn = this.renderer.text(btnIcon, 10, this.chartHeight - 10, true)
          .on('click', function() {
          const btn = document.querySelector('.analyzer-toggle');
          seriesDetail.analyze ? rmvFromAnalyzer(+seriesDetail.id) : addToAnalyzer(+seriesDetail.id);
          seriesDetail.analyze = !seriesDetail.analyze;
          btn.classList.toggle('bi-star');
          btn.classList.toggle('bi-star-fill'); 
        }).add();
      },
      load() {
        if (logo.analyticsLogoSrc) {
          this.renderer.image(logo.analyticsLogoSrc, 0, 0, 141 / 1.75, 68 / 1.75).add();
        }
        Highcharts.fireEvent(this.xAxis[0], 'afterSetExtremes');
      }
    }
    this.chartOptions.rangeSelector = {
      selected: null,
      buttons: chartButtons,
      buttonPosition: {
        x: 30,
        y: 0
      },
      labelStyle: { visibility: 'hidden' },
      inputEnabled: false,
    };
    this.chartOptions.exporting = {
      allowHTML: true,
      buttons: {
        contextButton: { enabled: false },
        exportButton: {
          menuItems: ['downloadPNG', 'downloadJPEG', 'downloadPDF', 'downloadSVG', 'downloadCSV'],
          text: 'Download',
          //_titleKey: 'exportKey',
        }
      },
      csv: {
        dateFormat: '%Y-%m-%d',
      },
      filename: `${name}_${geo.name}_${freq.label}`,
      chartOptions: {
        // events: null,
        chart: {
          events: {
            load() {
              if (logo.analyticsLogoSrc) {
                this.renderer.image(logo.analyticsLogoSrc, 490, 350, 141 / 1.75, 68 / 1.75).add();
              }
            }
          },
          styledMode: true,
          spacingBottom: 40
        },
        navigator: {
          enabled: false
        },
        scrollbar: {
          enabled: false
        },
        rangeSelector: {
          enabled: false
        },
        credits: {
          enabled: true,
          text: portalSettings.highstock.credits,
          position: {
            align: 'right',
            x: -35,
            y: -5
          }
        },
        title: {
          text: `${name} (${geo.name}, ${freq.label})`,
          align: 'left'
        }
      }
    };
    this.chartOptions.tooltip = {
      borderWidth: 0,
      shadow: false,
      followPointer: true,
      formatter(args) {
        return formatTooltip(this.points, this.x, pseudoZones, decimals, freq);
      }
    };
    this.chartOptions.xAxis = {
      events: {
        setExtremes(e) {
          if (e.trigger === 'rangeSelectorButton') {
            HighstockHelperService.rangeSelectorSetExtremesEvent(e.min, e.max, freq.freq, tableExtremes);
          }
        }
      },
      min: Date.parse(startDate),
      max: Date.parse(endDate),
      ordinal: false,
      labels: {
        formatter() {
          return xAxisFormatter(this, freq.label);
        }
      }
    };
    this.chartOptions.yAxis = [{
      className: 'series2',
      labels: {
        formatter() {
          return Highcharts.numberFormat(+this.value, decimals, '.', ',');
        }
      },
      title: {
        text: change
      },
      opposite: false,
      gridLineColor: 'none',
      minPadding: 0,
      maxPadding: 0,
      minTickInterval: 0.01
    }, {
      className: 'series1',
      title: {
        text: units
      },
      labels: {
        formatter() {
          return Highcharts.numberFormat(+this.value, decimals, '.', ',');
        }
      },
      gridLineWidth: 0,
      gridLineColor: 'none',
      minPadding: 0,
      maxPadding: 0,
      minTickInterval: 0.01,
      showLastLabel: true
    }];
    this.chartOptions.series = series as Highcharts.SeriesOptionsType[];
    this.chartOptions.title = {
      text: this.showTitle ? `${name} (${geo.name}, ${freq.label})` : '',
      align: 'center'
    }
  }

  // Gets buttons used in Highstock Chart
  formatChartButtons = (freq: string, buttons: Array<any>) => {
    const chartButtons = buttons.reduce((allButtons, button) => {
      if (freq === 'A') {
        // Do not display 1Year button for series with an annual frequency
        if (button !== 1 && button !== 'all') {
          allButtons.push({ type: 'year', count: button, text: `${button}Y` });
        }
      }
      if (freq !== 'A') {
        if (button !== 'all') {
          allButtons.push({ type: 'year', count: button, text: `${button}Y` });
        }
      }
      if (button === 'all') {
        allButtons.push({ type: 'all', text: 'All' });
      }
      return allButtons;
    }, []);
    return chartButtons;
  }

  formatAccessibilityDescription = (seriesDetail: Series, portalSettings, geo: Geography, freq: Frequency) => {
    return `Series: ${seriesDetail.title} (${geo.name} - ${freq.label})
      ${seriesDetail.sourceDescription}
      ${seriesDetail.sourceLink}
      ${seriesDetail.sourceDetails ? seriesDetail.sourceDetails : ''}
      ${seriesDetail.title}: ${portalSettings.highstock.labels.seriesLink}${seriesDetail.id}
      ${portalSettings.highstock.labels.portal}
      ${portalSettings.highstock.labels.portalLink}`;
  }

  getSelectedChartRange = (userStart, userEnd, dates, defaults, freq) => {
    const defaultSettings = defaults.find(ranges => ranges.freq === freq);
    const defaultEnd = (defaultSettings && defaultSettings.end) || dates[dates.length - 1].date.substr(0, 4);
    let counter = dates.length ? dates.length - 1 : null;
    while (dates[counter].date.substr(0, 4) > defaultEnd) {
      counter--;
    }
    const end = userEnd || dates[counter].date.substr(0, 10);
    const firstObsYear = +dates[0].date.substr(0, 4);
    const defaultStartYear = +dates[counter].date.substr(0, 4) - defaultSettings.range;
    const defaultStart = defaultStartYear < firstObsYear ? dates[0].date :
      `${defaultStartYear}${dates[counter].date.substr(4, 6)}`;
    let start = userStart || defaultStart;
    if (start > end) {
      start = defaultStart;
    }
    return { start, end };
  }

  setEndDate = (end: string, chartRange, chartData: HighchartChartData) => {
    // Check if end is only a year. This should occur when switching between geos/freqs for a particular series.
    // (Ex: If the max date selected in an annual series is 2015,
    // switching to the quarterly frequency should select up to 2015 Q4 rather than 2015 Q1)
    if (end && end.length === 4) {
      const dateExists = chartData.dates.slice().reverse().find(date => date.date.includes(end));
      return dateExists ? dateExists.date : null;
    }
    if (end && end.length !== 4) {
      return end;
    }
    return chartRange ? chartRange.end : null;
  }

  formatChartSeries = (chartData: HighchartChartData, portalSettings, seriesDetail, freq: Frequency) => {
    const series0 = chartData[portalSettings.highstock.series0Name];
    const series1 = chartData[portalSettings.highstock.series1Name];
    const series2 = chartData[portalSettings.highstock.series2Name];
    const yoyLabel = seriesDetail.percent ? 'YOY Change' : 'YOY % Change';
    const ytdLabel = seriesDetail.percent ? 'YTD Change' : 'YTD % Change';
    const c5maLabel = seriesDetail.percent ? 'Annual Change' : 'Annual % Change';
    const seriesLabels = { yoy: yoyLabel, ytd: ytdLabel, c5ma: c5maLabel, none: ' ' };
    const seriesStart = seriesDetail.seriesObservations ? seriesDetail.seriesObservations.observationStart : null;
    const series = [{
      name: 'Level',
      type: 'line',
      yAxis: 1,
      data: series0,
      pointInterval: this.highstockHelper.freqInterval(freq.freq),
      pointIntervalUnit: this.highstockHelper.freqIntervalUnit(freq.freq),
      pointStart: Date.parse(seriesStart),
      states: {
        hover: {
          lineWidth: 2
        }
      },
      showInNavigator: true,
      dataGrouping: {
        enabled: false
      },
      zoneAxis: 'x',
      zones: chartData.pseudoZones,
      zIndex: 1
    }, {
      name: seriesLabels[portalSettings.highstock.series1Name],
      type: portalSettings.highstock.series1Type,
      data: series1,
      color: '#9E9E9E',
      pointInterval: this.highstockHelper.freqInterval(freq.freq),
      pointIntervalUnit: this.highstockHelper.freqIntervalUnit(freq.freq),
      pointStart: Date.parse(seriesStart),
      showInNavigator: false,
      dataGrouping: {
        enabled: false
      }
    }, {
      name: seriesLabels[portalSettings.highstock.series2Name],
      data: series2,
      pointInterval: this.highstockHelper.freqInterval(freq.freq),
      pointIntervalUnit: this.highstockHelper.freqIntervalUnit(freq.freq),
      pointStart: Date.parse(seriesStart),
      color: 'none',
      includeInDataExport: freq.freq === 'A' ? false : true,
      dataGrouping: {
        enabled: false
      }
    }];
    return series;
  }

  formatTooltip = (points, x, pseudoZones, decimals, freq) => {
    const getFreqLabel = (frequency, date) => HighstockHelperService.getTooltipFreqLabel(frequency, date);
    const pseudo = 'Pseudo History ';
    let s = `<b>${getFreqLabel(freq.freq, x)}</b>`;
    points.forEach((point) => {
      if (!point.series.name.includes('YTD')) {
        const displayValue = Highcharts.numberFormat(point.y, decimals, '.', ',');
        const formattedValue = displayValue === '-0.00' ? '0.00' : displayValue;
        const seriesColor = `<br><span class='series-${point.colorIndex}'>\u25CF</span>`;
        const seriesNameValue =`${point.series.name}: ${formattedValue}`;
        const label = seriesColor + seriesNameValue;
        if (pseudoZones.length) {
          pseudoZones.forEach((zone) => {
            if (point.x < zone.value) {
              return s += `${seriesColor}${pseudo}${seriesNameValue}<br>`;
            }
            if (point.x > zone.value) {
              return s += label;
            }
          });
        }
        if (!pseudoZones.length) {
          s += label;
        }
      }
    });
    return s;
  }
}