import { Component, Inject, OnInit, OnChanges, OnDestroy, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { AnalyzerService } from 'projects/shared/services/analyzer.service';
import { SeriesHelperService } from 'projects/shared/services/series-helper.service';
import { HelperService } from 'projects/shared/services/helper.service';
import { DateRange } from 'projects/shared/models/DateRange';
import { Subscription } from 'rxjs';
import { DataPortalSettingsService } from 'projects/shared/services/data-portal-settings.service';
import { AnalyzerTableRendererComponent } from '../analyzer-table-renderer/analyzer-table-renderer.component';
import { AnalyzerStatsRendererComponent } from '../analyzer-stats-renderer/analyzer-stats-renderer.component';
import { GridOptions } from 'ag-grid-community';
import { AgGridModule } from 'ag-grid-angular';
import { NgIf, NgFor } from '@angular/common';

@Component({
    selector: 'lib-analyzer-table',
    templateUrl: './analyzer-table.component.html',
    styleUrls: ['./analyzer-table.component.scss'],
    standalone: true,
    imports: [
        NgIf,
        AgGridModule,
        NgFor,
    ],
})
export class AnalyzerTableComponent implements OnInit, OnChanges, OnDestroy {
  @Input() series;
  @Input() dates: Array<any>;
  @Output() tableTransform = new EventEmitter();
  @Input() yoyChecked;
  @Input() ytdChecked;
  @Input() c5maChecked;
  @Input() momChecked;
  @Input() indexChecked: boolean;
  @Input() indexBaseYear: string;
  @Input() freq;
  displayMomCheck: boolean;
  portalSettings;
  missingSummaryStat = false;
  private dataGridApi;
  private summaryStatGridApi;
  columnDefs;
  rows;
  frameworkComponents;
  summaryColumns;
  summaryRows;
  public gridOptions: GridOptions;
  public statGridOptions: GridOptions;
  dateRangeSub: Subscription;
  selectedDateRange: DateRange;

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
    this.dateRangeSub = this.helperService.currentDateRange.subscribe((dateRange) => {
      this.selectedDateRange = dateRange;
      const { startDate, endDate } = dateRange;
      this.drawTable(startDate, endDate);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    let indexCheckChange = changes['indexChecked'];
    if (indexCheckChange && !indexCheckChange.firstChange) {
     this.drawTable(this.selectedDateRange.startDate, this.selectedDateRange.endDate);
    }
  }


  ngOnDestroy() {
    this.dateRangeSub.unsubscribe();
    this.dataGridApi.destroy();
    this.summaryStatGridApi.destroy();
  }

  drawTable = (startDate: string, endDate: string) => {
    this.displayMomCheck = this.freq === 'M' || this.freq === 'W' || this.freq === 'D';
    const tableDateCols = this.analyzerService.createAnalyzerTableDates(this.series, startDate, endDate);
    this.columnDefs = this.setTableColumns(tableDateCols);
    this.dataGridApi?.setColumnDefs(this.columnDefs)
    this.rows = [];
    this.summaryColumns = this.setSummaryStatColumns();
    this.summaryRows = [];
    // Display values in the range of dates selected
    this.series.forEach((series) => {
      const transformations = this.helperService.getTransformations(series.seriesObservations.transformationResults);
      const { level, yoy, ytd, c5ma, mom } = transformations;
      const seriesData = this.formatLvlData(series, level, startDate);
      const summaryStats = this.calculateAnalyzerSummaryStats(series, startDate, endDate, this.indexChecked, startDate);
      this.summaryRows.push(summaryStats);
      this.summaryStatGridApi?.setRowData(this.summaryRows);
      this.rows.push(seriesData);
      this.addTransformationToTableRows(this.yoyChecked, yoy, series);
      this.addTransformationToTableRows(this.ytdChecked, ytd, series);
      this.addTransformationToTableRows(this.c5maChecked, c5ma, series);
      this.addTransformationToTableRows(this.momChecked, mom, series);
    });
    // Check if the summary statistics for a series has NA values
    this.missingSummaryStat = this.isSummaryStatMissing(this.summaryRows);
  }

  addTransformationToTableRows = (checked, transformation, series) => {
    if (checked && transformation) {
      this.rows.push(this.formatTransformationData(series, transformation));
    }
  }

  calculateAnalyzerSummaryStats = (series, startDate: string, endDate: string, indexed: boolean, indexBase) => {
    const stats = this.seriesHelper.calculateSeriesSummaryStats(series, series.chartData, startDate, endDate, indexed, indexBase);
    stats.series = this.analyzerService.formatDisplayName(series, this.indexChecked);
    return stats;
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

  formatLvlData = (series, level, startDate) => {
    const { dates, values } = level;
    const formattedDates = dates.map(d => this.helperService.formatDate(d, series.frequencyShort));
    const baseYear = this.indexBaseYear
    const indexedValues = this.analyzerService.getIndexedValues(values, dates, baseYear);
    const seriesData = {
      series: this.analyzerService.formatDisplayName(series, this.indexChecked),
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
      data[d] = +values[index];
    });
    return data;
  }

  formatTransformationName = (transformation, percent) => {
    const transformationLabel = {
      pc1: 'YOY',
      ytd: 'YTD',
      c5ma: 'Annual',
      mom: 'MOM'
    };
    return `${transformationLabel[transformation]} (${percent ? 'ch.' : '%'})`;
  }

  onGridReady(params, table) {
    if (table === 'data') {
      this.dataGridApi = params.api;
    }
    if (table === 'summary') {
      this.summaryStatGridApi = params.api;
    }
  }

  onExport = () => {
    const { columnDefs } = this.dataGridApi.csvCreator.columnModel;
    const params = {
      columnKeys: ['series'].concat(columnDefs.flatMap(col => col.field === 'series' ? [] : col.field).reverse()),
      fileName: 'analyzer',
      prependContent: `${this.portalSettings.catTable.portalSource} \n\n`
    };
    this.dataGridApi.exportDataAsCsv(params);
  }

  isSummaryStatMissing = series => series.some(s => s?.missing || null);

  yoyActive(e) {
    this.yoyChecked = e.target.checked;
    this.tableTransform.emit({ value: e.target.checked, label: 'yoy' });
    this.drawTable(this.selectedDateRange.startDate, this.selectedDateRange.endDate);
  }

  ytdActive(e) {
    this.ytdChecked = e.target.checked;
    this.tableTransform.emit({ value: e.target.checked, label: 'ytd' });
    this.drawTable(this.selectedDateRange.startDate, this.selectedDateRange.endDate);
  }

  c5maActive(e) {
    this.c5maChecked = e.target.checked;
    this.tableTransform.emit({ value: e.target.checked, label: 'c5ma' });
    this.drawTable(this.selectedDateRange.startDate, this.selectedDateRange.endDate);
  }

  momActive(e, series) {
    this.momChecked = e.target.checked;
    this.tableTransform.emit({ value: e.target.checked, label: 'mom' });
    this.drawTable(this.selectedDateRange.startDate, this.selectedDateRange.endDate);
  }
}
