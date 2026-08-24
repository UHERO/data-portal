/* import { Component, Input, OnInit, OnDestroy, Inject } from '@angular/core';
import { HelperService } from 'projects/shared/services/helper.service';
import { DateRange } from 'projects/shared/models/DateRange';
import { Subscription } from 'rxjs';
import { DataPortalSettingsService } from 'projects/shared/services/data-portal-settings.service';

import { SharedModule } from 'primeng/api';
import { TableModule } from 'primeng/table';

@Component({
    selector: 'lib-single-series-table',
    templateUrl: './single-series-table.component.html',
    styleUrls: ['./single-series-table.component.scss'],
    imports: [TableModule, SharedModule]
})
export class SingleSeriesTableComponent implements OnInit, OnDestroy {
  @Input() seriesData;
  dateRangeSub: Subscription;
  tableHeaders: Array<any>;
  tableData: Array<any>;
  portalSettings;

  constructor(
    @Inject('portal') public portal,
    private dataPortalSettings: DataPortalSettingsService,
    private helperService: HelperService,
  ) {}

  ngOnInit() {
    this.portalSettings = this.dataPortalSettings.dataPortalSettings[this.portal.universe];
    this.dateRangeSub = this.helperService.currentDateRange.subscribe((dateRange) => {
      const { seriesDetail, seriesTableData } = this.seriesData;
      this.drawTable(dateRange, seriesDetail, seriesTableData)
    }); 
  }

  ngOnDestroy() {
    this.dateRangeSub.unsubscribe()
  }

  drawTable = (selectedDateRange: DateRange, seriesDetail, seriesTableData) => {
    let tableStart: number;
    let tableEnd: number;
    const { startDate, endDate } = selectedDateRange;
    for (let i = 0; i < seriesTableData.length; i++) {
      if (seriesTableData[i].date === startDate) {
        tableStart = i;
      }
      if (seriesTableData[i].date === endDate) {
        tableEnd = i;
      }
    }
    this.tableData = seriesTableData.slice(tableStart, tableEnd + 1).reverse();
    this.tableHeaders = this.createTableColumns(this.portalSettings, seriesDetail);
  }

  createTableColumns = (portalSettings, seriesDetail) => {
    const { frequencyShort, percent } = seriesDetail;
    const {
      series1,
      series2,
      series2PercLabel,
      series2Label,
      columns,
      series3,
      series3PercLabel,
      series3Label
    } = portalSettings.seriesTable;
    const cols = [
      { field: 'tableDate', header: 'Date' },
      { field: series1, header: 'Level' },
      {
        field: series2, header: percent ? series2PercLabel : series2Label
      }
    ];
    if (frequencyShort !== 'A' && columns === 4) {
      cols.push({
        field: series3, header: percent ? series3PercLabel : series3Label
      });
    }
    return cols;
  }
} */

  import { Component, Input, OnInit, OnDestroy, Inject, ViewChild, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { HelperService } from 'projects/shared/services/helper.service';
import { DateRange } from 'projects/shared/models/DateRange';
import { Subscription } from 'rxjs';
import { DataPortalSettingsService } from 'projects/shared/services/data-portal-settings.service';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort, Sort } from '@angular/material/sort';

interface TableColumn {
  field: string;
  header: string;
}

interface TableRow {
  tableDate: string;
  [key: string]: any;
}

@Component({
  selector: 'lib-single-series-table',
  templateUrl: './single-series-table.component.html',
  styleUrls: ['./single-series-table.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [MatTableModule, MatSortModule]
})
export class SingleSeriesTableComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() seriesData: any;
  @ViewChild(MatSort) sort: MatSort;

  dateRangeSub: Subscription;
  tableHeaders: TableColumn[];
  displayedColumns: string[];
  dataSource = new MatTableDataSource<TableRow>([]);
  portalSettings: any;

  constructor(
    @Inject('portal') public portal: any,
    private dataPortalSettings: DataPortalSettingsService,
    private helperService: HelperService,
  ) {}

  ngOnInit() {
    this.portalSettings = this.dataPortalSettings.dataPortalSettings[this.portal.universe];
    this.dateRangeSub = this.helperService.currentDateRange.subscribe((dateRange) => {
      const { seriesDetail, seriesTableData } = this.seriesData;
      this.drawTable(dateRange, seriesDetail, seriesTableData);
    });
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    // Custom sort: only the date column is sortable, and it's a string
    // date field, not a number — default MatTableDataSource sorting
    // compares values directly, which works fine for ISO-format date
    // strings, but we override sortingDataAccessor for clarity/safety.
    this.dataSource.sortingDataAccessor = (row: TableRow, field: string) => {
      if (field === 'tableDate') return row.tableDate;
      return (row as any)[field];
    };
  }

  ngOnDestroy() {
    this.dateRangeSub.unsubscribe();
  }

  drawTable = (selectedDateRange: DateRange, seriesDetail: any, seriesTableData: any[]) => {
    let tableStart: number;
    let tableEnd: number;
    const { startDate, endDate } = selectedDateRange;
    for (let i = 0; i < seriesTableData.length; i++) {
      if (seriesTableData[i].date === startDate) {
        tableStart = i;
      }
      if (seriesTableData[i].date === endDate) {
        tableEnd = i;
      }
    }
    const tableData = seriesTableData.slice(tableStart, tableEnd + 1).reverse();
    this.dataSource.data = tableData;
    this.tableHeaders = this.createTableColumns(this.portalSettings, seriesDetail);
    this.displayedColumns = this.tableHeaders.map(col => col.field);
  };

  createTableColumns = (portalSettings: any, seriesDetail: any): TableColumn[] => {
    const { frequencyShort, percent } = seriesDetail;
    const {
      series1,
      series2,
      series2PercLabel,
      series2Label,
      columns,
      series3,
      series3PercLabel,
      series3Label
    } = portalSettings.seriesTable;

    const cols: TableColumn[] = [
      { field: 'tableDate', header: 'Date' },
      { field: series1, header: 'Level' },
      { field: series2, header: percent ? series2PercLabel : series2Label }
    ];

    if (frequencyShort !== 'A' && columns === 4) {
      cols.push({ field: series3, header: percent ? series3PercLabel : series3Label });
    }

    return cols;
  };
}
