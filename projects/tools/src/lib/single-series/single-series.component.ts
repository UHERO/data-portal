import { Inject, Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AnalyzerService } from '../analyzer.service';
import { DataPortalSettingsService } from '../data-portal-settings.service';
import { SeriesHelperService } from '../series-helper.service';
import { Frequency } from '../tools.models';
import { Geography } from '../tools.models';

declare var $: any;

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
  private seasonalAdjustment;
  startDate;
  endDate;
  chartStart;
  chartEnd;
  portalSettings;
  private category;

  // Vars used in selectors
  public currentFreq: Frequency;
  public currentGeo: Geography;
  public seriesData;

  static saFromSeasonalAdjustment(seasonalAdjustment: string): boolean {
    return seasonalAdjustment !== 'not_seasonally_adjusted';
  }

  static selectSibling(geoFreqSiblings: Array<any>, sa: boolean, freq: string) {
    const saSeries = geoFreqSiblings.find(series => series.seasonalAdjustment === 'seasonally_adjusted');
    const nsaSeries = geoFreqSiblings.find(series => series.seasonalAdjustment === 'not_seasonally_adjusted');
    const naSeries = geoFreqSiblings.find(series => series.seasonalAdjustment === 'not_applicable');
    // If more than one sibling exists (i.e. seasonal & non-seasonal)
    // Select series where seasonalAdjustment matches sa setting
    if (freq === 'A') {
      return geoFreqSiblings[0].id;
    }
    if (saSeries && nsaSeries) {
      if (sa) {
        return geoFreqSiblings.find(sibling => sibling.seasonalAdjustment === 'seasonally_adjusted').id;
      }
      return geoFreqSiblings.find(sibling => sibling.seasonalAdjustment === 'not_seasonally_adjusted').id;
    }
    if (!saSeries && nsaSeries) {
      return nsaSeries.id;
    }
    if (saSeries && !nsaSeries) {
      return saSeries.id;
    }
    if (!saSeries && !nsaSeries) {
      return naSeries.id;
    }
  }

  constructor(
    @Inject('portal') public portal,
    private dataPortalSettings: DataPortalSettingsService,
    private seriesHelper: SeriesHelperService,
    private analyzerService: AnalyzerService,
    private route: ActivatedRoute,
    private router: Router,
    private cdRef: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.currentGeo = { fips: null, handle: null, name: null , shortName: null };
    this.currentFreq = { freq: null, label: null };
    this.portalSettings = this.dataPortalSettings.dataPortalSettings[this.portal.universe];
  }

  ngAfterViewInit() {
    this.route.queryParams.subscribe(params => {
      const seriesId = Number(params[`id`]);
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
      this.seriesData = this.seriesHelper.getSeriesData(seriesId, noCache, categoryId);
    });
    this.cdRef.detectChanges();
  }

  // Redraw chart when selecting a new region or frequency
  goToSeries = (siblings: Array<any>, freq: string, geo: string, sa: boolean) => {
    this.seasonallyAdjusted = sa;
    this.noSelection = null;
    // Get array of siblings for selected geo and freq
    const geoFreqSib = this.seriesHelper.findGeoFreqSibling(siblings, geo, freq);
    const id = geoFreqSib.length ? SingleSeriesComponent.selectSibling(geoFreqSib, sa, freq) : null;
    if (id) {
      const queryParams = {
        id,
        sa: this.seasonallyAdjusted,
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

  updateAnalyze(seriesInfo) {
    this.analyzerService.updateAnalyzer(seriesInfo.id);
    seriesInfo.analyze = this.analyzerService.analyzerSeries.find(aSeries => aSeries.id === seriesInfo.id);
  }

  updateChartExtremes(e) {
    this.chartStart = e.minDate;
    this.chartEnd = e.endOfSample ? null : e.maxDate;
  }

  // Update table when selecting new ranges in the chart
  redrawTable = (e, seriesDetail, tableData, freq, chartData) => {
    const deciamls = seriesDetail.decimals ? seriesDetail.decimals : 1;
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
    seriesDetail.currentFreq = { freq: seriesDetail.frequencyShort };
    this.summaryStats = this.seriesHelper.calculateSeriesSummaryStats(seriesDetail, chartData, minDate, maxDate);
  }

  createTableColumns = (portalSettings, seriesDetail) => {
    const cols = [];
    cols.push({ field: 'tableDate', header: 'Date' });
    cols.push({ field: portalSettings.seriesTable.series1, header: 'Level' });
    cols.push({
      field: portalSettings.seriesTable.series2, header: seriesDetail.percent ?
        portalSettings.seriesTable.series2PercLabel : portalSettings.seriesTable.series2Label
    });
    if (seriesDetail.frequencyShort !== 'A' && portalSettings.seriesTable.columns === 4) {
      cols.push({
        field: portalSettings.seriesTable.series3, header: seriesDetail.percent ?
        portalSettings.seriesTable.series3PercLabel : portalSettings.seriesTable.series3Label
      });
    }
    return cols;
  }
}
