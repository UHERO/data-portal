import { Inject, Component, OnInit, OnDestroy, AfterViewInit, AfterContentChecked, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AnalyzerService } from '../analyzer.service';
import { DataPortalSettingsService } from '../data-portal-settings.service';
import { SeriesHelperService } from '../series-helper.service';
import { Frequency, Geography, DateRange } from '../tools.models';
import { Subscription } from 'rxjs';
import { HelperService } from '../helper.service';
import { tap, map, shareReplay } from 'rxjs/operators';

@Component({
  selector: 'lib-single-series',
  templateUrl: './single-series.component.html',
  styleUrls: ['./single-series.component.scss']
})
export class SingleSeriesComponent implements OnInit/*, AfterViewInit*/, OnDestroy, AfterContentChecked {
  noSelection: string;
  newTableData;
  tableHeaders;
  summaryStats;
  seasonallyAdjusted = false;
  // startDate;
  // endDate;
  chartStart;
  chartEnd;
  portalSettings;
  seriesId: number;
  seriesShareLink: string;
  freqSub: Subscription;
  geoSub: Subscription;
  fcSub: Subscription;
  dateRangeSubscription: Subscription;
  selectedDateRange: DateRange;
  selectedGeo: Geography;
  selectedForecast;
  selectedFreq: Frequency;
  displayFcSelector: boolean;
  displayHelp: boolean = false;
  public seriesData;

  constructor(
    @Inject('environment') private environment,
    @Inject('portal') public portal,
    private dataPortalSettings: DataPortalSettingsService,
    private seriesHelper: SeriesHelperService,
    private helperService: HelperService,
    private analyzerService: AnalyzerService,
    private route: ActivatedRoute,
    private router: Router,
    private cdRef: ChangeDetectorRef
  ) {
    this.freqSub = helperService.currentFreq.subscribe((freq) => {
      this.selectedFreq = freq;
    });
    this.geoSub = helperService.currentGeo.subscribe((geo) => {
      this.selectedGeo = geo;
    });
    this.fcSub = helperService.currentFc.subscribe((forecast) => {
      this.selectedForecast = forecast;
    });
    
  }

  ngOnInit() {
    this.portalSettings = this.dataPortalSettings.dataPortalSettings[this.portal.universe];
    this.displayFcSelector = this.portalSettings.selectors.includes('forecast');
    this.dateRangeSubscription = this.helperService.currentDateRange.subscribe((dateRange) => {
      this.selectedDateRange = dateRange;
      console.log('SINGLE SERIES date range', dateRange)
      this.summaryStats = { avg: '', cagr: '', levelChange: '', maxValue: '', minValue: '', missing: null, percChange: '', range: '', series: '', seriesInfo: null, total: ''}
    });

    this.route.queryParams.subscribe(params => {
      this.seriesId = Number(params[`id`]);
      let categoryId;
      let noCache: boolean;
      if (params[`sa`] !== undefined) {
        this.seasonallyAdjusted = (params[`sa`] === 'true');
      }
      if (params[`data_list_id`]) {
        categoryId = Number(params[`data_list_id`]);
      }
      if (params[`start`]) {
        //this.startDate = params[`start`];
      }
      if (params[`end`]) {
        //this.endDate = params[`end`];
      }
      if (params[`nocache`]) {
        noCache = params[`nocache`] === 'true';
      }
      this.seriesData = this.seriesHelper.getSeriesData(this.seriesId, noCache, categoryId)

      // this.seriesShareLink = this.formatSeriesShareLink(this.startDate, this.endDate);
    });
  }

  /* ngAfterViewInit() {
    this.route.queryParams.subscribe(params => {
      this.seriesId = Number(params[`id`]);
      let categoryId;
      let noCache: boolean;
      if (params[`sa`] !== undefined) {
        this.seasonallyAdjusted = (params[`sa`] === 'true');
      }
      if (params[`data_list_id`]) {
        categoryId = Number(params[`data_list_id`]);
      }
      if (params[`start`]) {
        //this.startDate = params[`start`];
      }
      if (params[`end`]) {
        //this.endDate = params[`end`];
      }
      if (params[`nocache`]) {
        noCache = params[`nocache`] === 'true';
      }
      this.seriesData = this.seriesHelper.getSeriesData(this.seriesId, noCache, categoryId);
      // this.seriesShareLink = this.formatSeriesShareLink(this.startDate, this.endDate);
    });
    this.cdRef.detectChanges();
  } */

  ngAfterContentChecked() {
    this.cdRef.detectChanges();
  }

  ngOnDestroy() {
    this.freqSub.unsubscribe();
    this.geoSub.unsubscribe();
    this.fcSub.unsubscribe();
    this.dateRangeSubscription.unsubscribe();
  }

  updateSelectedForecast(siblings: Array<any>, geo: string, sa: boolean, forecasts: Array<any>, newFc: string) {
    this.helperService.updateCurrentForecast(newFc);
    const selectedFc = forecasts.find(f => f.forecast === newFc);
    const { freq, label } = selectedFc;
    this.helperService.updateCurrentFrequency({ freq, label });
    this.goToSeries(siblings, freq, geo, sa, selectedFc);
  }

  // Redraw chart when selecting a new region or frequency
  goToSeries = (siblings: Array<any>, freq: string, geo: string, sa: boolean, forecast = null) => {
    this.seasonallyAdjusted = sa;
    this.noSelection = null;
    // Get array of siblings for selected geo and freq
    const geoFreqSib = siblings.length ? this.seriesHelper.findGeoFreqSibling(siblings, geo, freq, forecast) : [];
    const id = geoFreqSib.length ? this.seriesHelper.selectSibling(geoFreqSib, sa, freq) : null;
    if (id) {
      const queryParams = {
        id,
        sa: this.seasonallyAdjusted,
        ...(forecast?.forecast && { fc: forecast.forecast }),
        geo,
        freq
      };
      // this.startDate = this.chartStart;
      // this.endDate = this.chartEnd;
      this.router.navigate(['/series/'], { queryParams, queryParamsHandling: 'merge' });
    } else {
      this.noSelection = 'Selection Not Available';
    }
  }

  showHelp() {
    this.displayHelp = true;
  }

  addToAnalyzer(series) {
    series.analyze = true;
    this.analyzerService.addToAnalyzer(series.id);
  }

  removeFromAnalyzer(series) {
    series.analyze = false;
    this.analyzerService.removeFromAnalyzer(series.id);
  }

  // Update table when selecting new ranges in the chart
  /* drawTable = (startDate, endDate, seriesData, tableData, chartData) => {
    let minDate;
    let maxDate;
    let tableStart;
    let tableEnd;
    minDate = startDate;
    maxDate = endDate;
    for (let i = 0; i < tableData.length; i++) {
      if (tableData[i].date === maxDate) {
        tableStart = i;
      }
      if (tableData[i].date === minDate) {
        tableEnd = i;
      }
    }
    this.newTableData = tableData.slice(tableEnd, tableStart + 1).reverse();
    this.tableHeaders = this.createTableColumns(this.portalSettings, seriesData.seriesDetail);
    seriesData.observations = seriesData.seriesObservations;
    this.summaryStats = this.seriesHelper.calculateSeriesSummaryStats(seriesData.seriesDetail, chartData, minDate, maxDate, false, null);
  } */
  drawTable = (selectedDateRange, seriesData, tableData, chartData) => {
    let minDate;
    let maxDate;
    let tableStart;
    let tableEnd;
    //minDate = startDate;
    //maxDate = endDate;
    minDate = selectedDateRange.startDate;
    maxDate = selectedDateRange.endDate;
    if (minDate && maxDate) {
      for (let i = 0; i < tableData.length; i++) {
        if (tableData[i].date === maxDate) {
          tableStart = i;
        }
        if (tableData[i].date === minDate) {
          tableEnd = i;
        }
      }
      const newTableData = tableData.slice(tableEnd, tableStart + 1).reverse();
      const tableHeaders = this.createTableColumns(this.portalSettings, seriesData.seriesDetail);
      seriesData.observations = seriesData.seriesObservations;
      //this.summaryStats = this.seriesHelper.calculateSeriesSummaryStats(seriesData.seriesDetail, chartData, minDate, maxDate, false, null);
      return {newTableData, tableHeaders};  
    }
    return {}
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
    const cols = [];
    cols.push({ field: 'tableDate', header: 'Date' });
    cols.push({ field: series1, header: 'Level' });
    cols.push({
      field: series2, header: percent ? series2PercLabel : series2Label
    });
    if (frequencyShort !== 'A' && columns === 4) {
      cols.push({
        field: series3, header: percent ? series3PercLabel : series3Label
      });
    }
    return cols;
  }

  formatSeriesShareLink = (start: string, end: string) => this.environment[`portalUrl`] + this.addQueryParams('/series', start, end);

  addQueryParams(seriesUrl, start, end) {
    if (this.seriesId) {
      seriesUrl += `?id=${this.seriesId}`;
    }
    if (this.seasonallyAdjusted) {
      seriesUrl += `&sa=${this.seasonallyAdjusted}`;
    }
    if (start) {
      seriesUrl += `&start=${start}`;
    }
    if (end) {
      seriesUrl += `&end=${end}`;
    }
    return seriesUrl;
  }

  changeRange(event, data, tableData) {
    console.log('changeRange')
    const { seriesStart, seriesEnd } = event;
    // this.startDate = seriesStart;
    // this.endDate = seriesEnd;
    const { seriesDetail, chartData } = data;
    const { startDate, endDate } = this.selectedDateRange;
    //this.summaryStats = this.seriesHelper.calculateSeriesSummaryStats(seriesDetail, chartData, startDate, endDate, false, null);
    //this.drawTable(this.selectedDateRange, data, tableData, chartData);
  }
}
