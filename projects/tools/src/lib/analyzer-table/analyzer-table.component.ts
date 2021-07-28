import { Component, Inject, OnInit, OnChanges, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { AnalyzerService } from '../analyzer.service';
import { SeriesHelperService } from '../series-helper.service';
import { HelperService } from '../helper.service';
import { DataPortalSettingsService } from '../data-portal-settings.service';
import { AnalyzerTableRendererComponent } from '../analyzer-table-renderer/analyzer-table-renderer.component';
import { AnalyzerStatsRendererComponent } from '../analyzer-stats-renderer/analyzer-stats-renderer.component';
import { GridOptions } from 'ag-grid-community';

@Component({
  selector: 'lib-analyzer-table',
  templateUrl: './analyzer-table.component.html',
  styleUrls: ['./analyzer-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnalyzerTableComponent implements OnInit, OnChanges {
  @Input() series;
  @Input() minDate;
  @Input() maxDate;
  @Output() tableTransform = new EventEmitter();
  @Input() yoyChecked;
  @Input() ytdChecked;
  @Input() c5maChecked;
  @Input() indexChecked: boolean;
  @Input() indexBaseYear: string;
  portalSettings;
  missingSummaryStat = false;
  private gridApi;
  columnDefs;
  rows;
  frameworkComponents;
  summaryColumns;
  summaryRows;
  public gridOptions: GridOptions;
  public statGridOptions: GridOptions;

  constructor(
    @Inject('portal') private portal,
    private dataPortalSettingsServ: DataPortalSettingsService,
    private analyzerService: AnalyzerService,
    private seriesHelper: SeriesHelperService,
    private helperService: HelperService,
  ) {
    this.frameworkComponents = {
      analyzerTableRenderer: AnalyzerTableRendererComponent,
      analyzerStatsRenderer: AnalyzerStatsRendererComponent,
    };
    this.gridOptions = {
      context: {
        componentParent: this
      } as GridOptions
    };
    this.statGridOptions = {
      context: {
        componentParent: this
      } as GridOptions
    };
  }

  ngOnInit() {
    this.portalSettings = this.dataPortalSettingsServ.dataPortalSettings[this.portal.universe];
  }

  ngOnChanges() {
    const tableDateCols = this.analyzerService.createAnalyzerTableDates(this.series, this.minDate, this.maxDate);
    this.columnDefs = this.setTableColumns(tableDateCols);
    this.rows = [];
    this.summaryColumns = this.setSummaryStatColumns();
    this.summaryRows = [];
    // Check if the summary statistics for a series has NA values
    this.missingSummaryStat = this.isSummaryStatMissing(this.summaryRows);
    // Display values in the range of dates selected
    this.series.forEach((series) => {
      const transformations = this.helperService.getTransformations(series.seriesObservations.transformationResults);
      const { level, yoy, ytd, c5ma } = transformations;
      const seriesData = this.formatLvlData(series, level, this.minDate);
      const summaryStats = this.calculateAnalyzerSummaryStats(series, this.minDate, this.maxDate, this.indexChecked, this.indexBaseYear);
      this.summaryRows.push(summaryStats)
      this.rows.push(seriesData);
      if (this.yoyChecked && yoy) {
        const yoyData = this.formatTransformationData(series, yoy);
        this.rows.push(yoyData);
      }
      if (this.ytdChecked && ytd) {
        const ytdData = this.formatTransformationData(series, ytd);
        this.rows.push(ytdData);
      }
      if (this.c5maChecked && c5ma) {
        const c5maData = this.formatTransformationData(series, c5ma);
        this.rows.push(c5maData);
      }
    });
  }

  calculateAnalyzerSummaryStats = (series, startDate: string, endDate: string, indexed: boolean, indexBase) => {
    const { observationStart, observationEnd } = series.seriesObservations;
    series.seriesStartDate = (observationStart > startDate || !startDate) ?
      observationStart : startDate;
    series.seriesEndDate = (observationEnd > endDate || !endDate) ?
      observationEnd : endDate;
    const stats = this.seriesHelper.calculateSeriesSummaryStats(series, series.chartData, series.seriesStartDate, series.seriesEndDate, indexed, indexBase);
    stats.series = this.indexChecked ? series.indexDisplayName : series.displayName;
    return stats
  }

  setSummaryStatColumns = () => {
    return [{
      field: 'series',
      headerName: 'Series',
      pinned: 'left',
      width: 250,
      cellRenderer: 'analyzerStatsRenderer',
      tooltipValueGetter(params) {
        return params.value;
      }
    }, {
      field: 'range',
      headerName: 'Date Range'
    }, {
      field: 'minValue',
      headerName: 'Minimum Value'
    }, {
      field: 'maxValue',
      headerName: 'Maximum Value'
    }, {
      field: 'percChange',
      headerName: '% Change'
    }, {
      field: 'levelChange',
      headerName: 'Change'
    }, {
      field: 'total',
      headerName: 'Total'
    }, {
      field: 'avg',
      headerName: 'Avg'
    }, {
      field: 'cagr',
      headerName: 'CAGR'
    }];
  }

  setTableColumns = dates => {
    const columns: Array<any> = [];
    columns.push({
      field: 'series',
      headerName: 'Series',
      pinned: 'left',
      width: 250,
      cellRenderer: 'analyzerTableRenderer',
      tooltipValueGetter(params) {
        return params.value;
      }
    });
    const tableDates = dates;
    // Reverse dates for right-to-left scrolling on tables
    for (let i = tableDates.length - 1; i >= 0; i--) {
      columns.push({ field: tableDates[i].tableDate, headerName: tableDates[i].tableDate, width: 125 });
    }
    return columns;
  }

  formatLvlData = (series, level, minDate) => {
    const seriesInChart = $('.highcharts-series.' + series.id);
    const { dates, values } = level;
    const formattedDates = dates.map(d => this.helperService.formatDate(d, series.frequencyShort));
    const baseYear = this.indexBaseYear
    const indexedValues = this.analyzerService.getIndexedValues(values, dates, baseYear);
    const indexBaseYearNotAvailable = !indexedValues.some(v => v !== Infinity);
    const indexDisplayName = indexBaseYearNotAvailable ? series.naIndex : series.indexDisplayName;
    const seriesData = {
      series: this.indexChecked ? indexDisplayName : series.displayName,
      lockPosition: true,
      saParam: series.saParam,
      seriesInfo: series,
      lvlData: true,
    };
    formattedDates.forEach((d, index) => {
      seriesData[d] = this.indexChecked ? this.helperService.formatNum(indexedValues[index], series.decimals) : this.helperService.formatNum(+values[index], series.decimals);
    });
    return seriesData;
  }

  formatTransformationData = (series, transformation) => {
    const { dates, values } = transformation;
    const formattedDates = dates.map(d => this.helperService.formatDate(d, series.frequencyShort));
    const displayName = this.formatTransformationName(transformation.transformation, series.percent);
    const data = {
      series: displayName,
      seriesInfo: series,
      lvlData: false
    };
    formattedDates.forEach((d, index) => {
      data[d] = this.helperService.formatNum(+values[index], series.decimals);
    });
    return data;
  }

  formatTransformationName = (transformation, percent) => {
    const transformationLabel = {
      pc1: 'YOY',
      ytd: 'YTD',
      c5ma: 'Annual'
    };
    return `${transformationLabel[transformation]} (${percent ? 'ch.' : '%'})`;
  }

  onGridReady(params) {
    this.gridApi = params.api;
  }

  onExport = () => {
    const { columnDefs } = this.gridApi.csvCreator.columnController;
    const params = {
      columnKeys: ['series'].concat(columnDefs.flatMap(col => col.field === 'series' ? [] : col.field).reverse()),
      fileName: 'analyzer',
      customHeader: `${this.portalSettings.catTable.portalSource} \n\n`
    };
    this.gridApi.exportDataAsCsv(params);
  }

  isSummaryStatMissing = series => series.some(s => s ? s.missing : null);

  yoyActive(e) {
    this.yoyChecked = e.target.checked;
    this.tableTransform.emit({ value: e.target.checked, label: 'yoy' });
  }

  ytdActive(e) {
    this.ytdChecked = e.target.checked;
    this.tableTransform.emit({ value: e.target.checked, label: 'ytd' });
  }

  c5maActive(e) {
    this.c5maChecked = e.target.checked;
    this.tableTransform.emit({ value: e.target.checked, label: 'c5ma' });
  }

  switchChartYAxes(series) {
    this.analyzerService.switchYAxes.emit(series);
  }

  removeFromAnalyzer(series) {
    this.analyzerService.removeFromAnalyzer(series.id);
  }
}
