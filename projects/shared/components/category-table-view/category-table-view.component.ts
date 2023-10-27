import { Component, Inject, OnChanges, Input, OnDestroy } from '@angular/core';
import { HelperService } from 'projects/shared/services/helper.service';
import { CategoryTableRenderComponent } from '../category-table-render/category-table-render.component';
import { AnalyzerService } from 'projects/shared/services/analyzer.service';
import { Frequency } from 'projects/shared/models/Frequency';
import { Geography } from 'projects/shared/models/Geography';
import { DateRange } from 'projects/shared/models/DateRange';
import { Subscription } from 'rxjs';
import { RowClassRules } from 'ag-grid-community';
import { AgGridModule } from 'ag-grid-angular';
import { NgIf } from '@angular/common';

@Component({
    selector: 'lib-category-table-view',
    templateUrl: './category-table-view.component.html',
    styleUrls: ['./category-table-view.component.scss'],
    standalone: true,
    imports: [NgIf, AgGridModule]
})
export class CategoryTableViewComponent implements OnChanges, OnDestroy {
  @Input() displayedMeasurements;
  @Input() measurementOrder: Array<string>
  @Input() selectedCategory;
  @Input() selectedDataList;
  @Input() tableId;
  @Input() dates;
  @Input() noSeries;
  @Input() yoyActive;
  @Input() ytdActive;
  @Input() c5maActive;
  @Input() params;
  @Input() portalSettings;
  @Input() showSeasonal: boolean;
  @Input() hasSeasonal;
  private gridApi;
  columnDefs;
  rows;
  frameworkComponents;
  totalRows: number;
  noSeriesToDisplay;
  gridOptions;
  freqSub: Subscription;
  geoSub: Subscription;
  dateRangeSub: Subscription;
  selectedGeo: Geography;
  selectedFreq: Frequency;
  selectedDateRange: DateRange;

  public rowClassRules: RowClassRules = {
    'seasonal-alert': (params) => {
      return params.data.seriesInfo.displaySeasonalMessage;
    }
  }

  constructor(
    @Inject('defaultRange') private defaultRange,
    private analyzerService: AnalyzerService,
    private helperService: HelperService,
  ) {
    this.frameworkComponents = {
      categoryTableRender: CategoryTableRenderComponent
    };
    this.freqSub = helperService.currentFreq.subscribe((freq) => {
      this.selectedFreq = freq;
    });
    this.geoSub = helperService.currentGeo.subscribe((geo) => {
      this.selectedGeo = geo;
    });
    this.dateRangeSub = helperService.currentDateRange.subscribe((dateRange) => {
      this.selectedDateRange = dateRange;
      if (this.dates?.length) {
        const { startDate, endDate } = this.selectedDateRange;
        this.columnDefs = this.setTableColumns(this.dates, startDate, endDate, this.showSeasonal);
      }
    });
  }

  ngOnChanges() {
    this.rows = [];
    this.gridOptions = {
      localeText: {
        noRowsToShow: 'Current selections do not return any data, please try a different combination'
      }
    };
    if (this.displayedMeasurements) {
      const { startDate, endDate } = this.selectedDateRange;
      this.columnDefs = this.setTableColumns(this.dates, startDate, endDate, this.showSeasonal);
      this.measurementOrder.forEach((measurement) => {
        this.helperService.toggleSeriesDisplay(this.hasSeasonal, this.showSeasonal, this.displayedMeasurements[measurement], false);
        this.displayedMeasurements[measurement].forEach((series) => {
          if (series.display || series.displaySeasonalMessage) {
            series.analyze = this.analyzerService.checkAnalyzer(series);
            const transformations = this.helperService.getTransformations(series.seriesObservations.transformationResults);
            const { level, yoy, ytd, c5ma } = transformations;
            const dataListId = this.selectedDataList?.id || null
            const seriesData = this.formatLvlData(series, level, dataListId);
            this.rows.push(seriesData);
            if (this.yoyActive) {
              const yoyData = this.formatTransformationData(series, yoy, 'pc1');
              if (series.display) { this.rows.push(yoyData); }
            }
            if (this.ytdActive && this.selectedFreq.freq !== 'A') {
              const ytdData = this.formatTransformationData(series, ytd, 'ytd');
              if (series.display) { this.rows.push(ytdData); }
            }
            if (this.c5maActive) {
              const c5maData = this.formatTransformationData(series, c5ma, 'c5ma');
              if (series.display) { this.rows.push(c5maData); }
            }
          }
        });
      });
    }
    this.noSeriesToDisplay = this.helperService.checkIfSeriesAvailable(this.noSeries, this.displayedMeasurements);
  }

  ngOnDestroy() {
    this.freqSub.unsubscribe();
    this.geoSub.unsubscribe();
    this.dateRangeSub.unsubscribe();
  }

  setTableColumns = (dates, tableStart, tableEnd, showSeasonal) => {
    const columns: Array<any> = [];
    columns.push({
      field: 'series',
      headerName: 'Series',
      colId: 'series',
      pinned: 'left',
      width: 275,
      cellRenderer: 'categoryTableRender',
      tooltipValueGetter(params) {
        const { displaySeasonalMessage } = params.data.seriesInfo;
        return displaySeasonalMessage ?
          `${params.value} Data only available as ${showSeasonal ? 'non-seasonally adjusted' : 'seasonally adjusted'}` :
          params.value;
      }
    });
    // Reverse dates for right-to-left scrolling on tables
    for (let i = dates.length - 1; i >= 0; i--) {
      const hideColumn = dates[i].date < tableStart || dates[i].date > tableEnd
      columns.push({ field: dates[i].date, headerName: dates[i].tableDate, width: 125, colId: i, hide: hideColumn });
    }
    return columns;
  }

  formatLvlData = (series, level, parentId) => {
    const { dates, values } = level;
    const {
      displaySeasonalMessage,
      unitsLabelShort,
      unitsLabel,
      tablePrefix,
      displayName,
      tablePostfix,
      saParam,
      decimals
    } = series;
    const units = unitsLabelShort || unitsLabel;
    const seriesData = {
      series: `${tablePrefix || ''} ${displayName} ${tablePostfix || ''} (${units})`,
      saParam: saParam,
      seriesInfo: series,
      lvlData: true,
      ...(displaySeasonalMessage && { displaySeasonalMessage }),
      categoryId: parentId
    };
    if (!displaySeasonalMessage) {
      dates.forEach((d: string, index: number) => {
        seriesData[d] = this.helperService.formatNum(+values[index], decimals);
      });
    }
    return seriesData;
  }

  formatTransformationData = (series, transformation, transformationName) => {
    const data = {
      series: '',
      seriesInfo: series,
      lvlData: false
    };
    if (transformation) {
      const { dates, values } = transformation;
      const disName = this.formatTransformationName(transformation.transformation, series.percent);
      data.series = disName;
      dates.forEach((d, index) => {
        data[d] = +values[index];
      });
      return data;
    }
    const displayName = this.formatTransformationName(transformationName, series.percent);
    data.series = displayName;
    return data;
  }

  formatTransformationName = (transformation, percent) => {
    const transformationLabels = {
      'pc1': 'YOY',
      'ytd': 'YTD',
      'c5ma': 'Annual'
    }
    return percent ? `${transformationLabels[transformation]} (ch.)` : `${transformationLabels[transformation]} (%)`;
  }

  onExport = () => {
    const parentName = `${(this.selectedCategory && this.selectedCategory.name)}: ` || '';
    const sublistName = `${(this.selectedDataList && this.selectedDataList.name)}` || '';
    const geoName = (this.selectedGeo && this.selectedGeo.name) || '';
    const freqLabel = (this.selectedFreq && this.selectedFreq.label) || '';
    const fileName = `${sublistName}_${geoName}-${freqLabel}`
    const catId = (this.selectedCategory && this.selectedCategory.id) || '';
    const dataListId = `&data_list_id=${(this.selectedDataList && this.selectedDataList.id)}` || '';
    const { displayedColumns } = this.gridApi.csvCreator.columnModel;
    const params = {
      columnKeys: ['series'].concat(displayedColumns.flatMap(col => col.userProvidedColDef.field === 'series' ? [] : col).reverse()),
      suppressQuotes: false,
      fileName,
      appendContent: `\n\n ${parentName}${sublistName} Table \n ${geoName}-${freqLabel} \n ${this.portalSettings.catTable.portalLink + catId + dataListId}&view=table`
    };
    this.gridApi.exportDataAsCsv(params);
  }

  onGridReady = (params) => {
    this.gridApi = params.api;
  }
}
