import { Component, Inject, OnChanges, Input, OnDestroy } from '@angular/core';
import { HelperService } from '../helper.service';
import { CategoryTableRenderComponent } from '../category-table-render/category-table-render.component';
import { AnalyzerService } from '../analyzer.service';
import { Frequency, Geography } from '../tools.models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'lib-category-table-view',
  templateUrl: './category-table-view.component.html',
  styleUrls: ['./category-table-view.component.scss']
})
export class CategoryTableViewComponent implements OnChanges, OnDestroy {
  @Input() data;
  @Input() selectedCategory;
  @Input() selectedDataList;
  @Input() tableId;
  @Input() dates;
  @Input() noSeries;
  @Input() yoyActive;
  @Input() ytdActive;
  @Input() c5maActive;
  @Input() params;
  @Input() subcatIndex;
  @Input() tableStart;
  @Input() tableEnd;
  @Input() portalSettings;
  @Input() showSeasonal: boolean;
  @Input() hasNonSeasonal: boolean;
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
  selectedGeo: Geography;
  selectedFreq: Frequency;

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
  }

  ngOnChanges() {
    this.rows = [];
    this.gridOptions = {
      localeText: {
        noRowsToShow: 'Current selections do not return any data, please try a different combination'
      }
    };
    if (this.data) {
      this.columnDefs = this.setTableColumns(this.dates, this.tableStart, this.tableEnd);
      this.data.forEach((series) => {
        if (series !== 'No data available' && this.dates) {
          series.display = this.helperService.toggleSeriesForSeasonalDisplay(series, this.showSeasonal, this.hasSeasonal);
          series.analyze = this.analyzerService.checkAnalyzer(series);
          const transformations = this.helperService.getTransformations(series.seriesObservations.transformationResults);
          const { level, yoy, ytd, c5ma } = transformations;
          const seriesData = this.selectedDataList ?
            this.formatLvlData(series, level, this.selectedDataList.id) :
            this.formatLvlData(series, level, null);
          if (series.display) { this.rows.push(seriesData); }
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
    }
    this.noSeriesToDisplay = this.helperService.checkIfSeriesAvailable(this.noSeries, this.data);
  }

  ngOnDestroy() {
    this.freqSub.unsubscribe();
    this.geoSub.unsubscribe();
  }

  setTableColumns = (dates, tableStart, tableEnd) => {
    const columns: Array<any> = [];
    columns.push({
      field: 'series',
      headerName: 'Series',
      colId: 'series',
      pinned: 'left',
      width: 275,
      cellRenderer: 'categoryTableRender',
      tooltipValueGetter(params) {
        return params.value;
      }
    });
    const tableDates = dates//.slice(seriesStart, seriesEnd + 1);
    // Reverse dates for right-to-left scrolling on tables
    for (let i = dates.length - 1; i >= 0; i--) {
      const hideColumn = dates[i].date < tableStart || dates[i].date > tableEnd
      columns.push({ field: dates[i].date, headerName: dates[i].tableDate, width: 125, colId: i, hide: hideColumn });
    }
    return columns;
  }

  formatLvlData = (series, level, parentId) => {
    const { dates, values } = level;
    const units = series.unitsLabelShort || series.unitsLabel;
    const seriesData = {
      series: `${series.tablePrefix || ''} ${series.displayName} ${series.tablePostfix || ''} (${units})`,
      saParam: series.saParam,
      seriesInfo: series,
      lvlData: true,
      categoryId: parentId
    };
    dates.forEach((d, index) => {
      seriesData[d] = this.helperService.formatNum(+values[index], series.decimals);
    });
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
        data[d] = values[index];
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
    const displayedColumns = this.gridApi.csvCreator.columnController.getAllDisplayedColumns()
    const params = {
      columnKeys: ['series'].concat(displayedColumns.flatMap(col => col.userProvidedColDef.field === 'series' ? [] : col).reverse()),
      suppressQuotes: false,
      fileName,
      customFooter: `\n\n ${parentName}${sublistName} Table \n ${geoName}-${freqLabel} \n ${this.portalSettings.catTable.portalLink + catId + dataListId}&view=table`
    };
    this.gridApi.exportDataAsCsv(params);
  }

  onGridReady = (params) => {
    this.gridApi = params.api;
  }
}
