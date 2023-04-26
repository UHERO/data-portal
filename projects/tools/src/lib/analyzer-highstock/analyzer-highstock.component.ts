import {
  Component,
  Inject,
  OnInit,
  OnDestroy,
  OnChanges,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  SimpleChanges
} from '@angular/core';
import { AnalyzerService } from '../analyzer.service';
import { DateRange } from '../tools.models';
import { Dropdown } from 'bootstrap';
import { HighstockHelperService } from '../highstock-helper.service';
import { HelperService } from '../helper.service';
import { Subscription } from 'rxjs';
import * as Highcharts from 'highcharts/highstock';
import exporting from 'highcharts/modules/exporting';
import exportData from 'highcharts/modules/export-data';
import offlineExport from 'highcharts/modules/offline-exporting';
import Accessibility from 'highcharts/modules/accessibility';

type CustomSeriesOptions = Highcharts.SeriesOptionsType & {frequencyShort: string}

@Component({
  selector: 'lib-analyzer-highstock',
  templateUrl: './analyzer-highstock.component.html',
  styleUrls: ['./analyzer-highstock.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class AnalyzerHighstockComponent implements OnInit, OnChanges, OnDestroy {
  @Input() series;
  @Input() portalSettings;
  @Input() dates;
  @Input() indexChecked;
  @Output() xAxisExtremes = new EventEmitter(true);
  @Output() updateUrl = new EventEmitter<any>();
  Highcharts = Highcharts;
  chartConstructor = 'stockChart';
  updateChart = false;
  chartObject;
  indexed: boolean = false;
  analyzerData;
  oneToOneFlag = false;
  dateRangeSubscription: Subscription;
  selectedDateRange: DateRange;

  chartCallback = (chart) => {
    if (!this.chartObject) {
      this.chartObject = chart;
    }
  };

  chartOptions: Highcharts.Options = {
    accessibility: {
      description: ''
    },
    chart: {
      alignTicks: false,
      className: 'analyzer-chart',
      styledMode: true,
      zooming: {
        type: 'x'
      },
      events: {
        load: null,
      }
    },
    rangeSelector: {},
    exporting: {},
    xAxis: {
      events: {},
      min: null,
      max: null,
      minRange: null,
      ordinal: false,
      labels: {}
    },
    tooltip: {
      borderWidth: 0,
      shadow: false,
      shared: true,
      split: false,
      followPointer: true,
      formatter: function (args: any) {
        const getFreqLabel = (frequency, date) => HighstockHelperService.getTooltipFreqLabel(frequency, date);
        const filterFrequency = (cSeries: Array<any>, freq: string) => {
          return cSeries.filter(series => series.userOptions.frequencyShort === freq && series.name !== 'Navigator 1');
        }
        const getSeriesColor = (seriesIndex: number) => {
          // Get color of the line for a series & use for tooltip label
          const lineColor = getComputedStyle(document.querySelector(`.highcharts-markers.highcharts-color-${seriesIndex}`)).fill;
          return `<span style="fill:${lineColor}">\u25CF</span>`;
        };
        const formatObsValue = (value: number, decimals: number) => {
          // Round observation to specified decimal place
          const displayValue = Highcharts.numberFormat(value, decimals, '.', ',');
          return displayValue === '-0.00' ? '0.00' : displayValue;
        };
        const formatSeriesLabel = (point, seriesValue: number, date: string, pointX) => {
          let str = '';
          const { colorIndex, userOptions } = point;
          const { geography, decimals, title, chartData, name } = userOptions;
          const decimal = (name.includes('YOY') || name.includes('YTD')) ? 1 : decimals;
          const seriesColor = getSeriesColor(colorIndex);
          const displayName = `${title} (${geography.name})`;
          const value = formatObsValue(seriesValue, decimal);
          const label = `${displayName} ${date}: ${value}`;
          const pseudoZones = chartData.pseudoZones;
          if (pseudoZones.length) {
            pseudoZones.forEach((zone) => {
              return str += pointX < zone.value ?
                `${seriesColor}Pseudo History ${label}` :
                `${seriesColor}${label}`;
            });
          }
          if (!pseudoZones.length) {
            str += `${seriesColor}${label}<br>`;
          }
          return str;
        };
        const getAnnualObs = (aSeries: Array<any>, point, year: string) => {
          let label = '';
          aSeries.forEach((serie) => {
            // Check if current point's year is available in the annual series' data
            const yearObs = serie.data.find((obs) => {
              return obs ? Highcharts.dateFormat('%Y', obs.x) === Highcharts.dateFormat('%Y', point.x) : false;
            });
            if (yearObs) {
              label += formatSeriesLabel(serie, yearObs.y, year, yearObs.x);
            }
          });
          // Return string of annual series with their values formatted for the tooltip
          return label;
        };
        const getQuarterObs = (qSeries: Array<any>, date: string, pointQuarter: string) => {
          let label = '';
          qSeries.forEach((serie) => {
            // Check if current point's year and quarter month (i.e., Jan for Q1) is available in the quarterly series' data
            const obsDate = serie.data.find((obs) => {
              return obs ? `${Highcharts.dateFormat('%Y', obs.x)} ${Highcharts.dateFormat('%b', obs.x)}` === date : false;
            });
            if (obsDate) {
              const qDate = `${Highcharts.dateFormat('%Y', obsDate.x)} ${pointQuarter} `;
              label += formatSeriesLabel(serie, obsDate.y, qDate, obsDate.x);
            }
          });
          // Return string of quarterly series with their values formatted for the tooltip
          return label;
        };
        let tooltip = '';
        const chartSeries = args.chart.series;
        // Series in chart with an annual frequency
        const annualSeries = filterFrequency(chartSeries, 'A');
        // Series in chart with a quarterly frequency
        const quarterSeries = filterFrequency(chartSeries, 'Q');
        // Series in chart with a monthly frequency
        const monthSeries = filterFrequency(chartSeries, 'M');
        // Points in the shared tooltip
        this.points.forEach((point, index) => {
          if (annualSeries && Highcharts.dateFormat('%b', +point.x) !== 'Jan' && index === 0) {
            const year = Highcharts.dateFormat('%Y', +point.x);
            // Add annual observations when other frequencies are selected
            tooltip += getAnnualObs(annualSeries, point, year);
          }
          if (quarterSeries && monthSeries) {
            const pointMonth = Highcharts.dateFormat('%b', +point.x);
            const qMonths = ['Jan', 'Apr', 'Jul', 'Oct'];
            if (!qMonths.some(m => m === pointMonth)) {
              const quarters = { Q1: 'Jan', Q2: 'Apr', Q3: 'Jul', Q4: 'Oct' };
              const months = {
                Q1: ['Feb', 'Mar'],
                Q2: ['May', 'Jun'],
                Q3: ['Aug', 'Sep'],
                Q4: ['Nov', 'Dec']
              };
              // Quarter that hovered point falls into
              const pointQuarter = Object.keys(months).find(key => months[key].some(m => m === pointMonth));
              // Month for which there is quarterly data
              const quarterMonth = quarters[pointQuarter];
              const date = `${Highcharts.dateFormat('%Y', +point.x)} ${quarterMonth}`;
              // Add quarterly observations when monthly series are selected
              tooltip += getQuarterObs(quarterSeries, date, pointQuarter);
            }
          }
          const dateLabel = getFreqLabel((<CustomSeriesOptions>point.series.userOptions).frequencyShort, point.x);
          tooltip += formatSeriesLabel(point.series, point.y, dateLabel, point.x);
        });
        return tooltip;
      }
    },
    navigator: {
      enabled: false
    },
    scrollbar: {
      enabled: false
    },
    legend: {
      enabled: true,
      useHTML: true,
      labelFormatter() {
        return `<div class="btn-group dropdown" id="series-${(<Highcharts.Series>this).userOptions.className}">
        <svg width="16" height="16" class="bi bi-gear-fill dropdown-toggle">
          <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.` +
          `987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.` +
          `105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.` +
          `81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .8` +
          `72-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.` +
          `987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
        </svg>
        <ul class="dropdown-menu px-2">
          <p class="change-y-axis-side">Y-Axis: </p>
          <p class="change-chart-type">Chart Type: </p>
          <p class="change-chart-value">Values: </p>
          <p class="remove-from-comparison">
          <i class="bi bi-bar-chart-fill"></i> Remove From Comparison
          </p>
          <p class="add-to-comparison">
            <i class="bi bi-bar-chart"></i> Add To Comparison
          </p>
          <p class="remove-from-analyzer text-danger">
            <i class="bi bi-trash-fill"></i> Remove From Analyzer
          </p>
        </ul>
        <p class="series-name">${this.name} (${(<Highcharts.Series>this).userOptions.yAxis})</p>
      </div>`
      }
    },
    lang: {
      //exportKey: 'Download Chart'
    },
    credits: {
      enabled: false
    },
    plotOptions: {
      series: {
        cropThreshold: 0,
        turboThreshold: 0,
      }
    },
    yAxis: [],
    series: [],
  };

  constructor(
    @Inject('logo') private logo,
    private highstockHelper: HighstockHelperService,
    private analyzerService: AnalyzerService,
    private helperService: HelperService
  ) {
    this.analyzerData = this.analyzerService.analyzerData;
    Highcharts.addEvent(Highcharts.Chart, 'render', e => {
      [...e.target.renderTo.querySelectorAll('div.dropdown')].forEach((a) => {
        if (a) {
          const seriesId = +a.id.split('-')[1];
          const settingIcon = a.querySelector('svg.bi-gear-fill');
          settingIcon.setAttribute('data-bs-toggle', 'dropdown');
          settingIcon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
          settingIcon.setAttribute('viewBox', '0 0 16 16');
          const dropdownElements = [].slice.call(document.querySelectorAll('.dropdown-toggle'));
          const dropdownList = dropdownElements.map(function (dropdownToggleEl) {
            return new Dropdown(dropdownToggleEl, {
              boundary: document.querySelector('.analyzer-view'),
              popperConfig: {
                placement: 'top-start'
              }
            });
          });
          const chartOptionSeries = this.chartOptions.series.find(s => +s.className === seriesId);
          const addToComparisonChartItem = a.querySelector('.add-to-comparison');
          const removeFromComparisonChartItem = a.querySelector('.remove-from-comparison');
          const changeChartTypeItem = a.querySelector('.change-chart-type');
          const changeYAxisSideItem = a.querySelector('.change-y-axis-side');
          const changeChartValueItem = a.querySelector('.change-chart-value');
          const removeFromAnalyzerItem = a.querySelector('.remove-from-analyzer');
          changeYAxisSideItem.style.display = chartOptionSeries?.visible ? 'block' : 'none';
          changeChartTypeItem.style.display = chartOptionSeries?.visible ? 'block' : 'none';
          removeFromComparisonChartItem.style.display = chartOptionSeries?.visible ? 'block' : 'none';
          addToComparisonChartItem.style.display = chartOptionSeries?.visible ? 'none' : 'block';
          if (!a.querySelector(`#chart-type-${seriesId}`)) {
            this.createChartTypeSelector(seriesId, chartOptionSeries, changeChartTypeItem);
          }
          if (!a.querySelector(`#y-axis-side-${seriesId}`)) {
            this.createYAxisSideSelector(seriesId, chartOptionSeries, changeYAxisSideItem);
          }
          if (!a.querySelector(`#chart-values-${seriesId}`)) {
            this.createChartSeriesValueSelector(seriesId, chartOptionSeries, changeChartValueItem);
          }
          addToComparisonChartItem.addEventListener('click', (e) => {
            e.stopPropagation();
            if (chartOptionSeries) {
              analyzerService.makeCompareSeriesVisible(chartOptionSeries, this.selectedDateRange.startDate);
              this.updateUrl.emit(chartOptionSeries);
            }
          });
          removeFromComparisonChartItem.addEventListener('click', () => {
            analyzerService.removeFromComparisonChart(seriesId, this.selectedDateRange.startDate);
            this.updateUrl.emit(chartOptionSeries);
          });
          removeFromAnalyzerItem.addEventListener('click', (e) => {
            e.stopPropagation();
            analyzerService.removeFromAnalyzer(seriesId, this.selectedDateRange.startDate);
          });
        }
      });
    });
    // workaround to include exporting module in production build
    exporting(this.Highcharts);
    exportData(this.Highcharts);
    offlineExport(this.Highcharts);
    //Accessibility(this.Highcharts);

    Highcharts.wrap(Highcharts.Chart.prototype, 'getCSV', function(proceed) {
      // Add metadata to top of CSV export
      const result = proceed.apply(this, Array.prototype.slice.call(arguments, 1));
      let seriesMetaData = '';
      seriesMetaData = this.userOptions.accessibility.description;
      return seriesMetaData ? `${seriesMetaData}\n\n${result}` : result;
    });
  }

  ngOnInit(): void {
    this.dateRangeSubscription = this.helperService.currentDateRange.subscribe((dateRange) => {
      this.selectedDateRange = dateRange;
      const { startDate, endDate } = dateRange;
      this.drawChart(startDate, endDate);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    const indexCheckChange = changes['indexChecked'];
    const seriesChange = changes['series']; 
    const datesChange = changes['dates'];
    if (
      (indexCheckChange && !indexCheckChange.firstChange) ||
      (seriesChange && !seriesChange.firstChange) ||
      (datesChange && !datesChange.firstChange)
    ) {
      const { startDate, endDate } = this.selectedDateRange;
      this.drawChart(startDate, endDate)
    }
  }

  ngOnDestroy(): void {
    this.dateRangeSubscription.unsubscribe();
  }

  drawChart(startDate: string, endDate: string) {
    this.updateChartOptions(this.series, startDate, endDate);
    this.updateChart = true;
    if (this.chartOptions.xAxis) {
      (<Highcharts.AxisOptions>this.chartOptions.xAxis).min = Date.parse(startDate);
      (<Highcharts.AxisOptions>this.chartOptions.xAxis).max = Date.parse(endDate);
      this.chartObject?.xAxis[0].setExtremes(Date.parse(startDate), Date.parse(endDate));
      this.setYMinMax();
    }
  }

  // Labels used for metadata in CSV download
  formatChartLabels = (portalSettings) => {
    const { portal, portalLink } = portalSettings.highstock.labels;
    const labelItems = [
      {
        html: portal
      }, {
        html: portalLink
      }
    ];
    return { items: labelItems, style: { display: 'none' } };
  }

  updateChartOptions(series, startDate: string, endDate: string) {
    const { portal, portalLink } = this.portalSettings.highstock.labels;
    const xAxisFormatter = (chart, freq) => this.highstockHelper.xAxisLabelFormatter(chart, freq);
    const xAxisExtremes = this.xAxisExtremes;
    const logo = this.logo;
    const highestFreq = this.analyzerService.getHighestFrequency(this.series).freq;
    const buttons = this.formatChartButtons(this.portalSettings.highstock.buttons);
    const dates = this.dates;
    const rangeSelectorSetExtremes = (eventMin, eventMax, freq, dates, xAxisExtremes) => this.highstockHelper.rangeSelectorSetExtremesEvent(eventMin, eventMax, freq, dates, xAxisExtremes);
    this.chartOptions.accessibility.description = `${portal}\n${portalLink}`;
    this.chartOptions.series = series.map((s, index) => {
      return {
        ...s,
        colorIndex: index,
      };
    });

    this.chartOptions.chart.events = {
      load() {
        if (logo.analyticsLogoSrc) {
          this.renderer.image(logo.analyticsLogoSrc, 10, 0, 141 / 1.75, 68 / 1.75).add();
        }
      }
    };

    const leftAxisLabel = this.createYAxisLabel(this.chartOptions.series, 'left');
    const rightAxisLabel = this.createYAxisLabel(this.chartOptions.series, 'right');
    this.chartOptions.yAxis = this.chartOptions.series.reduce((axes, s) => {
      if (axes.findIndex(a => a.id === `${s.yAxis}`) === -1) {
        const { leftMin, leftMax, rightMin, rightMax } = this.analyzerService.analyzerData;
        let currentMin: number;
        let currentMax: number;
        if (s.yAxis === 'left') {
          currentMin = +leftMin ?? 0;
          currentMax = +leftMax || null;
        }
        if (s.yAxis === 'right') {
          currentMin = +rightMin ?? 0;
          currentMax = +rightMax || null;
        }
        axes.push({
          labels: {
            formatter() {
              return Highcharts.numberFormat(this.value, 2, '.', ',');
            },
            align: s.yAxis === 'right' ? 'left' : 'right' 
          },
          id: `${s.yAxis}`,
          title: {
            text: s.yAxis === 'right' ? rightAxisLabel : leftAxisLabel
          },
          opposite: s.yAxis === 'left' ? false : true,
          gridLineColor: 'none',
          minPadding: 0,
          maxPadding: 0,
          minTickInterval: 0.01,
          endOnTick: false,
          startOnTick: false,
          showEmpty: false,
          styleOrder: s.yAxis === 'left' ? 1 : 2,
          showLastLabel: true,
          showFirstLabel: true,
          min: currentMin,
          max: currentMax,
          visible: this.chartOptions.series.filter(series => series.yAxis === s.yAxis && series.className !== 'navigator').some(series => series.visible)
        });
      }
      return axes;
    }, []);

    this.chartOptions.exporting = {
      allowHTML: true,
      buttons: {
        contextButton: {
          enabled: false
        },
        ...this.chartTransformationToggles(this.chartOptions.series),
        exportButton: {
          //_titleKey: 'exportKey',
          menuItems: ['downloadPNG', 'downloadJPEG', 'downloadPDF', 'downloadSVG', 'downloadCSV'],
          text: 'Download'
        },
      },
      csv: {
        dateFormat: '%Y-%m-%d',
      },
      filename: 'chart',
      chartOptions: {
        //events: null,
        legend: {
          labelFormatter() {
            return `${this.name} (${(<Highcharts.Series>this).userOptions.yAxis})`
          }
        },
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
          text: this.portalSettings.highstock.credits,
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

    this.chartOptions.rangeSelector = {
      selected: !startDate && !endDate ? 2 : null,
      buttons,
      buttonPosition: {
        x: 20,
        y: 0
      },
      labelStyle: {
        visibility: 'hidden'
      },
      inputEnabled: false
    };

    this.chartOptions.xAxis = {
      events: {
        setExtremes: function(e) {
          if (e.trigger === 'rangeSelectorButton') {
            rangeSelectorSetExtremes(e.min, e.max, highestFreq, dates, xAxisExtremes);
          }
        },
      },
      minRange: this.calculateMinRange(highestFreq),
      min: startDate ? Date.parse(startDate) : undefined,
      max: endDate ? Date.parse(endDate) : undefined,
      ordinal: false,
      labels: {
        formatter() {
          return xAxisFormatter(this, highestFreq);
        }
      }
    };
  }

  createYAxisLabel = (chartSeries: Array<any>, axis: string) => [...new Set(chartSeries.filter(s => s.yAxis === axis && s.className !== 'navigator' && s.visible).map(s => s.yAxisText))].join(', ');
  
  createChartTypeSelector(seriesId: number, series: any, chartTypeMenuItem: HTMLElement) {
    if (series) {
      const chartTypeSelect = document.createElement('select');
      chartTypeSelect.setAttribute('id', `chart-type-${seriesId}`);
      chartTypeSelect.classList.add('form-select'); 
      this.addSelectorOptions(chartTypeSelect, series.chartType, series.selectedChartType)
      chartTypeMenuItem.appendChild(chartTypeSelect);
      chartTypeSelect.addEventListener('mousedown', e => e.stopPropagation());
      chartTypeSelect.addEventListener('change', e => this.analyzerService.updateCompareChartType(seriesId, (e.target as HTMLSelectElement).value));  
    }
  }

  createYAxisSideSelector(seriesId: number, series: any, yAxisSideMenuItem: HTMLElement) {
    if (series) {
      const yAxisSelect = document.createElement('select');
      yAxisSelect.setAttribute('id', `y-axis-side-${seriesId}`);
      yAxisSelect.classList.add('form-select');
      this.addSelectorOptions(yAxisSelect, series.yAxisSides, series.yAxis);
      yAxisSideMenuItem.appendChild(yAxisSelect);
      yAxisSelect.addEventListener('mousedown', e => e.stopPropagation());
      yAxisSelect.addEventListener('change', (e) => {
        this.analyzerService.updateCompareSeriesAxis(seriesId, (e.target as HTMLSelectElement).value);
        this.updateUrl.emit()
      });
    }
  }

  createChartSeriesValueSelector(seriesId: number, series: any, chartValueItem: HTMLElement) {
    if (series) {
      const valueSelect = document.createElement('select');
      valueSelect.setAttribute('id', `chart-values-${seriesId}`);
      valueSelect.classList.add('form-select');
      this.addSelectorOptions(valueSelect, series.chartValues, series.selectedChartTransformation);
      chartValueItem.appendChild(valueSelect);
      chartValueItem.addEventListener('mousedown', e => e.stopPropagation());
      chartValueItem.addEventListener('change', e => this.analyzerService.updateCompareChartTransformation(seriesId, (e.target as HTMLSelectElement).value));
    }
  }

  addSelectorOptions(selector: any, options: Array<any>, selected: string) {
    options.forEach((opt: string) => {
      const selectedOpt = opt === selected;
      selector.add(new Option(opt, opt, selectedOpt, selectedOpt), undefined);
    });
  }

  setYMinMax() {
    (<Highcharts.YAxisOptions[]>this.chartOptions.yAxis).forEach((y) => {
      y.min = y.min ?? null;
      y.max = y.max ?? null;
    });
  }

  changeYAxisMin(e, axis) {
    (<Highcharts.YAxisOptions[]>this.chartOptions.yAxis)
      .find(a => a.id === axis.userOptions.id).min = +e.target.value ?? null;
    this.analyzerService.analyzerData[`${axis.userOptions.id}Min`] = +e.target.value ?? null;
    this.updateChart = true;
    this.updateUrl.emit();
  }

  changeYAxisMax(e, axis) {
    (<Highcharts.YAxisOptions[]>this.chartOptions.yAxis)
      .find(a => a.id === axis.userOptions.id).max = +e.target.value ?? null;
    this.analyzerService.analyzerData[`${axis.userOptions.id}Max`] = +e.target.value ?? null;
    this.updateChart = true;
    this.updateUrl.emit();
  }

  calculateMinRange = (freq: string) => {
    const range = {
      A: 1000 * 3600 * 24 * 30 * 12,
      S: 1000 * 3600 * 24 * 30 * 6,
      Q: 1000 * 3600 * 24 * 30 * 3,
      M: 1000 * 3600 * 24 * 30,
      W: 1000 * 3600 * 24 * 7,
    }
    return range[freq] || 1000 * 3600 * 24;
  }

  chartTransformationToggles = (chartSeries) => {
    const updateTransformation = (seriesId, transformation) =>  this.analyzerService.updateCompareChartTransformation(seriesId, transformation);
    const series = chartSeries.filter(s => s.className !== 'navigator');
    const transformations = series.reduce((prev, curr) => {
        prev.push(...curr.chartValues);
        return prev;
    }, []).filter((transformation, index, arr) => {
      return arr.indexOf(transformation) === index;
    });
    const buttons = [];
    transformations.forEach((t) => {
      buttons.push({
        text: t,
        onclick: function(e) {
          series.forEach((series) => {
            if (series.className !== 'navigator') {
              updateTransformation(series.id, t);
            };
          });
        }
      });
    });
    return buttons;
  };

  formatChartButtons(buttons: Array<any>) {
    const chartButtons = buttons.reduce((allButtons, button) => {
        allButtons.push(button !== 'all' ? {
          type: 'year',
          count: button,
          text: `${button}Y`
        } :
        {
          type: 'all',
          text: 'All'
        });
      return allButtons;
    }, []);
    return chartButtons;
  }

  sortVisible = (a, b) => b.visible - a.visible;
}
