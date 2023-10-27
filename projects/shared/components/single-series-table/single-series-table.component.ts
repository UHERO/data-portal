import { Component, Input, OnInit, OnDestroy, Inject } from '@angular/core';
import { HelperService } from 'projects/shared/services/helper.service';
import { DateRange } from 'projects/shared/models/DateRange';
import { Subscription } from 'rxjs';
import { DataPortalSettingsService } from 'projects/shared/services/data-portal-settings.service';
import { NgFor, NgIf } from '@angular/common';
import { SharedModule } from 'primeng/api';
import { TableModule } from 'primeng/table';

@Component({
    selector: 'lib-single-series-table',
    templateUrl: './single-series-table.component.html',
    styleUrls: ['./single-series-table.component.scss'],
    standalone: true,
    imports: [TableModule, SharedModule, NgFor, NgIf]
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
}
