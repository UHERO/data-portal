import {
  Component,
  Inject,
  OnChanges,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewEncapsulation
} from '@angular/core';
import { AnalyzerService } from '../analyzer.service';
import { HighstockObject } from '../tools.models';
import 'jquery';
import { HighstockHelperService } from '../highstock-helper.service';
declare var $: any;
import * as Highcharts from 'highcharts/highstock';
import exporting from 'highcharts/modules/exporting';
import exportData from 'highcharts/modules/export-data';
import offlineExport from 'highcharts/modules/offline-exporting';

@Component({
  selector: 'lib-analyzer-highstock',
  templateUrl: './analyzer-highstock.component.html',
  styleUrls: ['./analyzer-highstock.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class AnalyzerHighstockComponent implements OnChanges, OnDestroy {
  @Input() series;
  @Input() allDates;
  @Input() portalSettings;
  @Input() start;
  @Input() end;
  @Input() yAxes: Array<any>;
  @Input() seriesOptions: Array<any>;
  @Input() nameChecked;
  @Input() unitsChecked;
  @Input() geoChecked;
  @Input() indexChecked;
  @Input() y0;
  @Input() y1;
  @Output() tableExtremes = new EventEmitter(true);
  @Output() tooltipOptions = new EventEmitter();
  @Output() yAxesSeries = new EventEmitter();
  Highcharts = Highcharts;
  chartConstructor = 'stockChart';
  chartOptions = {} as HighstockObject;
  updateChart = false;
  chartObject;
  toggleSeries;
  toggleIndexed;
  switchAxes;
  alertMessage;
  indexed: boolean = false;


  constructor(
    @Inject('logo') private logo,
    private highstockHelper: HighstockHelperService,
    private analyzerService: AnalyzerService,
    private cdr: ChangeDetectorRef
  ) {
    // workaround to include exporting module in production build
    exporting(this.Highcharts);
    exportData(this.Highcharts);
    offlineExport(this.Highcharts);
    Highcharts.wrap(Highcharts.Chart.prototype, 'getCSV', function(proceed) {
      // Add metadata to top of CSV export
      const result = proceed.apply(this, Array.prototype.slice.call(arguments, 1));
      let seriesMetaData = '';
      this.userOptions.labels.items.forEach((label) => {
        if (!result.includes(label.html)) {
          seriesMetaData += label.html ? `${label.html} \n` : '';
        }
      });
      return seriesMetaData ?  seriesMetaData + '\n\n' + result : result;
    });
    this.switchAxes = this.analyzerService.switchYAxes.subscribe((data: any) => {
      this.switchYAxes(data, this.chartObject);
    });
    this.toggleSeries = this.analyzerService.toggleSeriesInChart.subscribe((data: any) => {
      const chartSeries = this.series.filter(s => s.showInChart);
      const toggleDisplay = this.analyzerService.checkSeriesUnits(chartSeries, data.seriesInfo.unitsLabelShort);
      if (toggleDisplay) {
          const seriesToUpdate = this.analyzerService.analyzerData.analyzerSeries.find(s => s.seriesDetail.id === data.seriesInfo.id);
          if (seriesToUpdate) {
            seriesToUpdate.showInChart = !seriesToUpdate.showInChart;
          }
          const yAxes = this.analyzerService.setYAxes(this.series, '', '');
          this.chartOptions.series = this.formatSeriesData(this.series, this.allDates, this.yAxes, this.chartObject._extremes.min);
          this.chartOptions.yAxis = yAxes;
          this.chartOptions.rangeSelector.selected = null
          this.updateChart = true;
          this.chartObject.redraw()
      }
      if (!toggleDisplay) {
        this.alertMessage = 'Chart may only display up to two different units.';
        if (this.alertMessage) {
          // Timeout warning message alerting user if too many units are being added to the chart
          setTimeout(() => {
            this.alertMessage = '';
            this.cdr.detectChanges();
          }, 4000);
        }
        this.cdr.detectChanges();
      }
    });
  }
  

  ngOnChanges() {
    console.log(this.chartObject)
    if (this.series.length && this.chartObject) {
      this.chartObject._indexed = this.indexChecked;
      console.log('CHANGE IN SERIES', this.series);
      const yAxes = this.analyzerService.setYAxes(this.series, '', '');
      this.chartOptions.series = this.formatSeriesData(this.series, this.allDates, this.yAxes, this.chartObject._extremes.min);
      this.chartOptions.yAxis = yAxes;
      console.log(this.formatSeriesData(this.series, this.allDates, this.yAxes, this.chartObject._extremes.min));
      this.chartOptions.rangeSelector.selected = null
      this.updateChart = true;
    }
    if(this.series.length && !this.chartObject) {
      console.log('on changes')
      const buttons = this.formatChartButtons(this.portalSettings.highstock.buttons);
      const navigatorOptions = {
        frequency: this.analyzerService.checkFrequencies(this.series),
        dateStart: this.allDates[0].date,
        numberOfObservations: this.filterDatesForNavigator(this.allDates).length
      };
      this.initChart(this.series, this.yAxes, this.portalSettings, buttons, navigatorOptions)
    }
  }

  ngOnDestroy() {
    this.toggleSeries.unsubscribe();
    this.switchAxes.unsubscribe();
  }

  chartCallback = (chart) => {
    this.chartObject = chart;
  }

  toggleSeriesDisplay(data) {
    const yAxes = this.chartObject.yAxis.slice().filter(axis => axis.userOptions.id !== 'navigator-y-axis');
    const seriesInChart = this.chartObject.series.find(s => s.userOptions.className === data.seriesInfo.id);
    seriesInChart.update({
      visible: !seriesInChart.userOptions.visible,
      showInLegend: !seriesInChart.userOptions.showInLegend,
      includeInDataExport: !seriesInChart.userOptions.includeInDataExport
    }, false);
    const seriesAxis = this.chartObject.get(seriesInChart.userOptions.yAxis);
    const visibleSeriesDifferentUnits = seriesAxis.series.filter(s => s.userOptions.unitsLabelShort !== seriesInChart.userOptions.unitsLabelShort && s.userOptions.className !== 'navigator' && s.userOptions.visible);
    if (visibleSeriesDifferentUnits.length) {
      // If the series being made visible is associated with an axis that is currently being used with different units,
      // (i.e., 2 axes are being used with series that have 'Thous' as their units)
      // move the currently drawn series to the opposite axis first
      const oppositeAxis = seriesInChart.userOptions.yAxis === 'yAxis0' ? 'yAxis1' : 'yAxis0';
      visibleSeriesDifferentUnits.forEach((s) => {
        s.update({
          yAxis: seriesInChart.userOptions.yAxis === 'yAxis0' ? 'yAxis1' : 'yAxis0'
        });
      });
      this.chartObject.get(oppositeAxis).update({
        title: {
          text: visibleSeriesDifferentUnits[0].userOptions.unitsLabelShort
        },
        visible: true
      });
    }
    seriesAxis.update({
      title: {
        text: seriesInChart.userOptions.unitsLabelShort
      },
      visible: seriesAxis.series.find(s => s.userOptions.visible) ? true : false
    });
    yAxes.forEach((a) => {
      const axisSeries = a.series.filter(s => s.userOptions.className !== 'navigator' && s.userOptions.visible);
      if (!axisSeries.length) {
        a.update({
          visible: false,
        }, false);
      }
    });
  }

  switchYAxes(data: any, chartObject) {
    const yAxes = chartObject.yAxis.slice().filter(axis => axis.userOptions.id !== 'navigator-y-axis');
    const series = chartObject.series.find(s => s.userOptions.className === data.seriesInfo.id);
    const y0 = [];
    const y1 = [];
    if (yAxes.length === 1) {
      chartObject.addAxis({
        labels: {
          formatter() {
            return Highcharts.numberFormat(this.value, 2, '.', ',');
          }
        },
        id: yAxes[0].userOptions.id === 'yAxis0' ? 'yAxis1' : 'yAxis0',
        title: {
          text: data.seriesInfo.unitsLabelShort
        },
        opposite: yAxes[0].userOptions.index === 0 ? true : false,
        minPadding: 0,
        maxPadding: 0,
        minTickInterval: 0.01,
        showEmpty: false
      });
      series.update({
        yAxis: series.userOptions.yAxis === 'yAxis0' ? 'yAxis1' : 'yAxis0'
      });
    }
    if (yAxes.length === 2) {
      const visibleSeries = chartObject.series.filter(s => s.userOptions.visible && s.userOptions.showInLegend);
      const visibleUnits = visibleSeries.map(s => s.userOptions.unitsLabelShort).filter((unit, i, self) => self.indexOf(unit) === i);
      if (visibleUnits.length === 2) {
        this.swapAllSeriesAndAxes(visibleUnits, chartObject, yAxes);
      }
      if (visibleUnits.length === 1) {
        this.swapSingleSeriesAndAxis(series, chartObject);
      }
    }
    yAxes.forEach((a) => {
      const axisSeries = a.series.filter(s => s.userOptions.className !== 'navigator' && s.userOptions.visible);
      if (!axisSeries.length) {
        a.update({
          visible: false,
        }, false);
      }
      if (a.userOptions.id === 'yAxis0') {
        a.series.forEach((s) => {
          if (!s.userOptions.className.toString().includes('navigator')) {
            y0.push(s.userOptions.className);
          }
        });
      }
      if (a.userOptions.id === 'yAxis1') {
        a.series.forEach((s) => {
          if (!s.userOptions.className.toString().includes('navigator')) {
            y1.push(s.userOptions.className);
          }
        });
      }
    });
    this.yAxesSeries.emit({ y0: y0, y1: y1 });
  }

  formatSeriesData = (series: Array<any>, dates: Array<any>, yAxes: Array<any>, start) => {
    const chartSeries = series.map((serie) => {
      const axis = yAxes ? yAxes.find(y => y.series.some(s => s.seriesDetail.id === serie.seriesDetail.id)) : null;
      return {
        className: serie.seriesDetail.id,
        name: serie.chartDisplayName,
        tooltipName: serie.seriesDetail.title,
        data: this.indexChecked ? this.getIndexedValues(serie.chartData.level, start) : serie.chartData.level,
        levelData: serie.chartData.level.slice(),
        yAxis: axis ? axis.id : null,
        decimals: serie.seriesDetail.decimals,
        frequency: serie.seriesDetail.frequencyShort,
        geography: serie.seriesDetail.geography.name,
        includeInDataExport: serie.showInChart ? true : false,
        showInLegend: serie.showInChart ? true : false,
        showInNavigator: false,
        events: {
          legendItemClick() {
            return false;
          }
        },
        unitsLabelShort: serie.seriesDetail.unitsLabelShort,
        seasonallyAdjusted: serie.seriesDetail.seasonalAdjustment === 'seasonally_adjusted',
        dataGrouping: {
          enabled: false
        },
        pseudoZones: serie.chartData.pseudoZones,
        visible: serie.showInChart ? true : false
      };
    });
    chartSeries.push({
      className: 'navigator',
      data: dates.map(d => [Date.parse(d.date), null]),
      levelData: [],
      decimals: null,
      tooltipName: '',
      frequency: null,
      geography: null,
      yAxis: 'yAxis0',
      dataGrouping: {
        enabled: false
      },
      showInLegend: false,
      showInNavigator: true,
      includeInDataExport: false,
      name: 'Navigator',
      events: {
        legendItemClick() {
          return false;
        }
      },
      unitsLabelShort: null,
      seasonallyAdjusted: null,
      pseudoZones: null,
      visible: true,
    });
    return chartSeries;
  }

  getIndexedValues(values, start) {
    console.log('start', start);
    console.log('values', values);

    return values.map((curr, ind, arr) => {
      const dateIndex = arr.findIndex(dateValuePair => new Date(dateValuePair[0]).toISOString().substr(0, 10) === start);
      return dateIndex > -1 ? [curr[0], curr[1] / arr[dateIndex][1] * 100] : [curr[0], curr[1] / arr[0][1] * 100];
    });
  }

  swapAllSeriesAndAxes(visibleUnits: Array<any>, chartObject, yAxes: Array<any>) {
    const chartSeries = chartObject.series.filter(s => s.userOptions.yAxis === 'yAxis0' || s.userOptions.yAxis === 'yAxis1');
    const y0 = [];
    const y1 = [];
    chartSeries.forEach((s) => {
      s.update({
        yAxis: s.userOptions.yAxis === 'yAxis0' ? 'yAxis1' : 'yAxis0'
      });
      s.userOptions.yAxis === 'yAxis0' ? y0.push(s.userOptions.className) : y1.push(s.userOptions.className)
    });
    yAxes.forEach((axis) => {
      axis.update({
        title: {
          text: visibleUnits.find(unit => unit !== axis.userOptions.title.text)
        },
        visible: axis.series.find(s => s.userOptions.visible) ? true : false,
      });
    });
  }

  swapSingleSeriesAndAxis(series, chartObject) {
    const axisToUpdate = series.userOptions.yAxis === 'yAxis0' ? 'yAxis1' : 'yAxis0';
    chartObject.get(axisToUpdate).update({
      title: {
        text: series.userOptions.unitsLabelShort
      },
      visible: true
    });
    series.update({
      yAxis: series.userOptions.yAxis === 'yAxis0' ? 'yAxis1' : 'yAxis0'
    });
  }

  removeSeriesFromChart(chartObjectSeries: Array<any>, analyzerSeries: Array<any>) {
    chartObjectSeries.forEach((s) => {
      const keepInChart = analyzerSeries.find(serie => serie.name === s.name && s.data.length === serie.data.length);
      if (!keepInChart) {
        s.remove();
      }
    });
  }

  formatChartButtons(buttons: Array<any>) {
    const chartButtons = buttons.reduce((allButtons, button) => {
      if (button !== 'all') {
        allButtons.push({ type: 'year', count: button, text: button + 'Y' });
      }
      if (button === 'all') {
        allButtons.push({ type: 'all', text: 'All' });
      }
      return allButtons;
    }, []);
    return chartButtons;
  }

  initChart = (series, yAxis, portalSettings, buttons, navigatorOptions) => {
    const startDate = this.start ? this.start : null;
    const endDate = this.end ? this.end : null;
    const tooltipName = this.nameChecked;
    const tooltipUnits = this.unitsChecked;
    const tooltipGeo = this.geoChecked;
    const formatTooltip = (args, points, x, name, units, geo) => this.formatTooltip(args, points, x, name, units, geo);
    const getChartExtremes = (chartObject) => this.highstockHelper.getAnalyzerChartExtremes(chartObject);
    const xAxisFormatter = (chart, freq) => this.highstockHelper.xAxisLabelFormatter(chart, freq);
    const setInputDateFormat = freq => this.highstockHelper.inputDateFormatter(freq);
    const setInputEditDateFormat = freq => this.highstockHelper.inputEditDateFormatter(freq);
    const setInputDateParser = (value, freq) => this.highstockHelper.inputDateParserFormatter(value, freq);
    const setDateToFirstOfMonth = (freq, date) => this.highstockHelper.setDateToFirstOfMonth(freq, date);
    const tableExtremes = this.tableExtremes;
    const logo = this.logo;
    const chartCallback = this.chartCallback;
    const getIndexedValues = (values, start) => this.getIndexedValues(values, start);
    const updateIndexed = (chartObject) => chartObject._indexed = this.indexChecked;

    this.chartOptions.chart = {
      alignTicks: false,
      className: 'analyzer-chart',
      description: undefined,
      events: {
        render() {
          const userMin = new Date(this.xAxis[0].getExtremes().min).toISOString().split('T')[0];
          const userMax = new Date(this.xAxis[0].getExtremes().max).toISOString().split('T')[0];
          this._selectedMin = navigatorOptions.frequency === 'A' ? userMin.substr(0, 4) + '-01-01' : userMin;
          this._selectedMax = navigatorOptions.frequency === 'A' ? userMax.substr(0, 4) + '-01-01' : userMax;
          this._hasSetExtremes = true;
          this._extremes = getChartExtremes(this);
          if (this._extremes) {
            tableExtremes.emit({ minDate: this._extremes.min, maxDate: this._extremes.max });
          }
        },
        load() {
          chartCallback(this);
          if (logo.analyticsLogoSrc) {
            this.renderer.image(logo.analyticsLogoSrc, 10, 0, 141 / 1.75, 68 / 1.75).add();
          }
        }
      },
      styledMode: true,
      zoomType: 'x'
    };
    this.chartOptions.labels = {
      items: [
        { html: portalSettings.highstock.labels.portal },
        { html: portalSettings.highstock.labels.portalLink },
      ],
      style: {
        display: 'none'
      }
    };
    this.chartOptions.legend = {
      enabled: true,
      labelFormatter() {
        return this.yAxis.userOptions.opposite ? this.name + ' (right)' : this.name + ' (left)';
      }
    };
    this.chartOptions.rangeSelector = {
      selected: !startDate && !endDate ? 3 : null,
      buttons,
      buttonPosition: {
        x: 20,
        y: 0
      },
      labelStyle: {
        visibility: 'hidden'
      },
      inputEnabled: true,
      inputDateFormat: setInputDateFormat(navigatorOptions.frequency),
      inputEditDateFormat: setInputEditDateFormat(navigatorOptions.frequency),
      inputDateParser(value) {
        return setInputDateParser(value, navigatorOptions.frequency);
      },
      inputPosition: {
        x: -30,
        y: 5
      }
    };
    this.chartOptions.lang = {
      exportKey: 'Download Chart'
    };
    this.chartOptions.exporting = {
      allowHTML: true,
      buttons: {
        contextButton: {
          enabled: false
        },
        exportButton: {
          _titleKey: 'exportKey',
          menuItems: ['downloadPNG', 'downloadJPEG', 'downloadPDF', 'downloadSVG', 'downloadCSV'],
          text: 'Download'
        }
      },
      csv: {
        dateFormat: '%Y-%m-%d',
      },
      filename: 'chart',
      chartOptions: {
        events: null,
        chart: {
          events: {
            load() {
              if (logo.analyticsLogoSrc) {
                this.renderer.image(logo.analyticsLogoSrc, 490, 350, 141 / 1.75, 68 / 1.75).add();
              }
            }
          },
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
          align: 'left',
          text: null
        },
        subtitle: {
          text: ''
        }
      }
    };
    this.chartOptions.tooltip = {
      borderWidth: 0,
      shadow: false,
      shared: true,
      followPointer: true,
      formatter(args) {
        return formatTooltip(args, this.points, this.x, tooltipName, tooltipUnits, tooltipGeo);
      }
    };
    this.chartOptions.credits = {
      enabled: false
    };
    this.chartOptions.series = this.formatSeriesData(series, this.allDates, yAxis, this.start)
    this.chartOptions.yAxis = this.yAxes;
    this.chartOptions.xAxis = {
      events: {
        afterSetExtremes() {
          const userMin = new Date(this.getExtremes().min).toISOString().split('T')[0];
          const userMax = new Date(this.getExtremes().max).toISOString().split('T')[0];
          this._selectedMin = setDateToFirstOfMonth(navigatorOptions.frequency, userMin);
          this._selectedMax = setDateToFirstOfMonth(navigatorOptions.frequency, userMax);
          this._hasSetExtremes = true;
          this._extremes = getChartExtremes(this);
          this._indexed = updateIndexed(this);
          if (this._extremes) {
            console.log('this._extremes', this._extremes)
            if (this._indexed) {
              this.series.forEach((serie) => {
                if (serie.userOptions.className !== 'navigator') {
                  console.log('SET EXTREMES INDEXED')
                  serie.update({
                    data: getIndexedValues(serie.userOptions.levelData, this._extremes.min)
                  })
                }
              });
            }
            tableExtremes.emit({ minDate: this._extremes.min, maxDate: this._extremes.max });
            // use setExtremes to snap dates to first of the month
            this.setExtremes(Date.parse(this._extremes.min), Date.parse(this._extremes.max));
          }
        }
      },
      //minRange: 1000 * 3600 * 24 * 30 * 12,
      minRange: 1000 * 3600 * 24 * 30,
      min: startDate ? Date.parse(startDate) : undefined,
      max: endDate ? Date.parse(endDate) : undefined,
      ordinal: false,
      labels: {
        formatter() {
          return xAxisFormatter(this, navigatorOptions.frequency);
        }
      }
    };
    this.chartOptions.plotOptions = {
      series: {
        cropThreshold: 0,
        turboThreshold: 0
      }
    };
  }

  formatTooltip(args, points, x, name: boolean, units: boolean, geo: boolean) {
    console.log('FORMAT TOOLTIP GEO', geo)
    // Name, units, and geo evaluate as true when their respective tooltip options are checked in the analyzer
    const getFreqLabel = (frequency, date) => this.highstockHelper.getTooltipFreqLabel(frequency, date);
    const filterFrequency = (cSeries: Array<any>, freq: string) => {
      return cSeries.filter(series => series.userOptions.frequency === freq && series.name !== 'Navigator 1');
    };
    const getSeriesColor = (seriesIndex: number) => {
      // Get color of the line for a series
      // Use color for tooltip label
      const lineColor = $('.highcharts-markers.highcharts-color-' + seriesIndex + ' path').css('fill');
      const seriesColor = '<span style="fill:' + lineColor + '">\u25CF</span> ';
      return seriesColor;
    };
    const formatObsValue = (value: number, decimals: number) => {
      // Round observation to specified decimal place
      const displayValue = Highcharts.numberFormat(value, decimals, '.', ',');
      const formattedValue = displayValue === '-0.00' ? '0.00' : displayValue;
      return formattedValue;
    };
    const formatSeriesLabel = (sName, sUnits, sGeo, point, seriesValue: number, date: string, pointX, str: string) => {
      const seriesColor = getSeriesColor(point.colorIndex);
      const displayName = sName ? point.userOptions.tooltipName : '';
      const value = formatObsValue(seriesValue, point.userOptions.decimals);
      const unitsLabel = sUnits ? ` (${point.userOptions.unitsLabelShort}) `: '';
      const geoLabel = sGeo ? `${point.userOptions.geography}` : '';
      const label = `${displayName} ${date}: ${value} ${unitsLabel}`;
      const pseudoZones = point.userOptions.pseudoZones;
      if (pseudoZones.length) {
        pseudoZones.forEach((zone) => {
          if (pointX < zone.value) {
            return str += seriesColor + 'Pseudo History ' + label + geoLabel;
          }
          if (pointX > zone.value) {
            return str += seriesColor + label + geoLabel;
          }
        });
      }
      if (!pseudoZones.length) {
        str += seriesColor + label + geoLabel + '<br>';
      }
      return str;
    };
    const getAnnualObs = (aSeries: Array<any>, point, year: string) => {
      let label = '';
      aSeries.forEach((serie) => {
        // Check if current point's year is available in the annual series' data
        const yearObs = serie.data.find(obs => Highcharts.dateFormat('%Y', obs.x) === Highcharts.dateFormat('%Y', point.x));
        if (yearObs) {
          label += formatSeriesLabel(name, units, geo, serie, yearObs.y, year, yearObs.x, '');
        }
      });
      // Return string of annual series with their values formatted for the tooltip
      return label;
    };
    const getQuarterObs = (qSeries: Array<any>, date: string, pointQuarter: string) => {
      let label = '';
      qSeries.forEach((serie) => {
        // Check if current point's year and quarter month (i.e., Jan for Q1) is available in the quarterly series' data
        const obsDate = serie.data.find(obs => (Highcharts.dateFormat('%Y', obs.x) + ' ' + Highcharts.dateFormat('%b', obs.x)) === date);
        if (obsDate) {
          const qDate = pointQuarter + ' ' + Highcharts.dateFormat('%Y', obsDate.x);
          label += formatSeriesLabel(name, units, geo, serie, obsDate.y, qDate, obsDate.x, '');
        }
      });
      // Return string of quarterly series with their values formatted for the tooltip
      return label;
    };
    const s = '';
    let tooltip = '';
    const chartSeries = args.chart.series;
    // Series in chart with an annual frequency
    const annualSeries = filterFrequency(chartSeries, 'A');
    // Series in chart with a quarterly frequency
    const quarterSeries = filterFrequency(chartSeries, 'Q');
    // Series in chart with a monthly frequency
    const monthSeries = filterFrequency(chartSeries, 'M');
    // Points in the shared tooltip
    points.forEach((point, index) => {
      if (annualSeries && Highcharts.dateFormat('%b', point.x) !== 'Jan' && index === 0) {
        const year = Highcharts.dateFormat('%Y', point.x);
        // Add annual observations when other frequencies are selected
        tooltip += getAnnualObs(annualSeries, point, year);
      }
      if (quarterSeries && monthSeries) {
        const pointMonth = Highcharts.dateFormat('%b', point.x);
        if (pointMonth !== 'Jan' && pointMonth !== 'Apr' && pointMonth !== 'Jul' && pointMonth !== 'Oct') {
          const quarters = { Q1: 'Jan', Q2: 'Apr', Q3: 'Jul', Q4: 'Oct' };
          const months = { Feb: 'Q1', Mar: 'Q1', May: 'Q2', Jun: 'Q2', Aug: 'Q3', Sep: 'Q3', Nov: 'Q4', Dec: 'Q4' };
          // Quarter that hovered point falls into
          const pointQuarter = months[pointMonth];
          // Month for which there is quarterly data
          const quarterMonth = quarters[pointQuarter];
          const date = Highcharts.dateFormat('%Y', point.x) + ' ' + quarterMonth;
          // Add quarterly observations when monthly series are selected
          tooltip += getQuarterObs(quarterSeries, date, pointQuarter);
        }
      }
      const dateLabel = getFreqLabel(point.series.userOptions.frequency, point.x);
      tooltip += formatSeriesLabel(name, units, geo, point.series, point.y, dateLabel, point.x, s);
    });
    return tooltip;
  }

  nameActive(e) {
    this.nameChecked = e.target.checked;
    this.tooltipOptions.emit({ value: e.target.checked, label: 'name' });
    const tooltipName = this.nameChecked;
    const tooltipUnits = this.unitsChecked;
    const tooltipGeo = this.geoChecked;
    this.chartOptions.rangeSelector.selected = null;
    const formatTooltip = (args, points, x, name, units, geo) => this.formatTooltip(args, points, x, name, units, geo);
    this.chartOptions.tooltip = {
      borderWidth: 0,
      shadow: false,
      shared: true,
      followPointer: true,
      formatter(args) {
        return formatTooltip(args, this.points, this.x, tooltipName, tooltipUnits, tooltipGeo);
      }
    };
    this.updateChart = true;
  }

  unitsActive(e) {
    this.unitsChecked = e.target.checked;
    this.tooltipOptions.emit({ value: e.target.checked, label: 'units' });
    const tooltipName = this.nameChecked;
    const tooltipUnits = this.unitsChecked;
    const tooltipGeo = this.geoChecked;
    this.chartOptions.rangeSelector.selected = null;
    const formatTooltip = (args, points, x, name, units, geo) => this.formatTooltip(args, points, x, name, units, geo);
    this.chartOptions.tooltip = {
      borderWidth: 0,
      shadow: false,
      shared: true,
      followPointer: true,
      formatter(args) {
        return formatTooltip(args, this.points, this.x, tooltipName, tooltipUnits, tooltipGeo);
      }
    };
    this.updateChart = true;
  }

  geoActive(e) {
    this.geoChecked = e.target.checked;
    this.tooltipOptions.emit({ value: e.target.checked, label: 'geo' });
    const tooltipName = this.nameChecked;
    const tooltipUnits = this.unitsChecked;
    const tooltipGeo = this.geoChecked;
    this.chartOptions.rangeSelector.selected = null;
    const formatTooltip = (args, points, x, name, units, geo) => this.formatTooltip(args, points, x, name, units, geo);
    this.chartOptions.tooltip = {
      borderWidth: 0,
      shadow: false,
      shared: true,
      followPointer: true,
      formatter(args) {
        return formatTooltip(args, this.points, this.x, tooltipName, tooltipUnits, tooltipGeo);
      }
    };
    this.updateChart = true;
  }

  filterDatesForNavigator(allDates: Array<any>) {
    return allDates.map(date => date.date).filter((d, i, a) => {
      // If mixed frequencies are selected, filter out duplicated dates for annual observations,
      // also check if date range only contains a partial year
      return i > 0 ? a.indexOf(d) === i && d > a[i - 1] : a.indexOf(d) === i;
    });
  }

}
