import { Inject, Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AnalyzerService } from '../analyzer.service';
import { DataPortalSettingsService } from '../data-portal-settings.service';
import { SeriesHelperService } from '../series-helper.service';
import { Frequency } from '../tools.models';
import { Geography } from '../tools.models';
import { Subscription } from 'rxjs';
import { HelperService } from '../helper.service';

@Component({
  selector: 'lib-single-series',
  templateUrl: './single-series.component.html',
  styleUrls: ['./single-series.component.scss']
})
export class SingleSeriesComponent implements OnInit, AfterViewInit {
  noSelection: string;
  newTableData;
  tableHeaders;
  summaryStats;
  seasonallyAdjusted = false;
  startDate;
  endDate;
  chartStart;
  chartEnd;
  portalSettings;
  seriesId;
  seriesShareLink: string;
  freqSub: Subscription;
  geoSub: Subscription;
  fcSub: Subscription;
  selectedGeo: Geography;
  selectedForecast;
  selectedFreq: Frequency;
  displayFcSelector: boolean;

  // Vars used in selectors
  //public currentFreq: Frequency;
  //public currentGeo: Geography;
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
  }

  ngAfterViewInit() {
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
        this.startDate = params[`start`];
      }
      if (params[`end`]) {
        this.endDate = params[`end`];
      }
      if (params[`nocache`]) {
        noCache = params[`nocache`] === 'true';
      }
      this.seriesData = this.seriesHelper.getSeriesData(this.seriesId, noCache, categoryId);
      this.seriesShareLink = this.formatSeriesShareLink(this.startDate, this.endDate);
    });
    this.cdRef.detectChanges();
  }

  ngOnDestroy() {
    this.freqSub.unsubscribe();
    this.geoSub.unsubscribe();
    this.fcSub.unsubscribe();
  }

  updateSelectedForecast(siblings: Array<any>, geo: string, sa: boolean, forecasts: Array<any>, newFc: string) {
    this.helperService.updateCurrentForecast(newFc);
    const selectedFc = forecasts.find(f => f.forecast === newFc);
    const { freq, label } = selectedFc;
    console.log(selectedFc)
    this.helperService.updateCurrentFrequency({ freq, label });
    this.goToSeries(siblings, freq, geo, sa, selectedFc);
  }

  // Redraw chart when selecting a new region or frequency
  goToSeries = (siblings: Array<any>, freq: string, geo: string, sa: boolean, forecast = null) => {
    const { findGeoFreqSibling, selectSibling } = this.seriesHelper;
    this.seasonallyAdjusted = sa;
    this.noSelection = null;
    // Get array of siblings for selected geo and freq
    const geoFreqSib = siblings.length ? findGeoFreqSibling(siblings, geo, freq, forecast) : [];
    const id = geoFreqSib.length ? selectSibling(geoFreqSib, sa, freq) : null;
    if (id) {
      const queryParams = {
        id,
        sa: this.seasonallyAdjusted,
        ...(forecast?.forecast && { fc: forecast.forecast }),
        geo,
        freq
      };
      this.startDate = this.chartStart;
      this.endDate = this.chartEnd;
      this.router.navigate(['/series/'], { queryParams, queryParamsHandling: 'merge' });
    } else {
      this.noSelection = 'Selection Not Available';
    }
  }

  addToAnalyzer(series) {
    series.analyze = true;
    this.analyzerService.addToAnalyzer(series.id);
  }

  removeFromAnalyzer(series) {
    series.analyze = false;
    this.analyzerService.removeFromAnalyzer(series.id);
  }
  
  updateChartExtremes(e) {
    this.chartStart = e.minDate;
    this.chartEnd = e.endOfSample ? null : e.maxDate;
    this.seriesShareLink = this.formatSeriesShareLink(this.chartStart, this.chartEnd);
  }

  // Update table when selecting new ranges in the chart
  redrawTable = (e, seriesDetail, tableData, chartData) => {
    let minDate;
    let maxDate;
    let tableStart;
    let tableEnd;
    minDate = e.minDate;
    maxDate = e.maxDate;
    for (let i = 0; i < tableData.length; i++) {
      if (tableData[i].date === maxDate) {
        tableStart = i;
      }
      if (tableData[i].date === minDate) {
        tableEnd = i;
      }
    }
    this.newTableData = tableData.slice(tableEnd, tableStart + 1).reverse();
    this.tableHeaders = this.createTableColumns(this.portalSettings, seriesDetail);
    seriesDetail.observations = seriesDetail.seriesObservations;
    this.summaryStats = this.seriesHelper.calculateSeriesSummaryStats(seriesDetail, chartData, minDate, maxDate, false, null);
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
}
