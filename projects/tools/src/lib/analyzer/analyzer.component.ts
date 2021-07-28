import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { AnalyzerService } from '../analyzer.service';
import { ActivatedRoute } from '@angular/router';
import { DataPortalSettingsService } from '../data-portal-settings.service';
import { forkJoin, Subscription } from 'rxjs';
import { ApiService } from '../api.service';

@Component({
  selector: 'lib-analyzer',
  templateUrl: './analyzer.component.html',
  styleUrls: ['./analyzer.component.scss']
})
export class AnalyzerComponent implements OnInit, OnDestroy {
  portalSettings;
  tableYoy;
  tableYtd;
  tableC5ma;
  startDate;
  endDate;
  private noCache: boolean;
  analyzerData;
  yRightSeries;
  yLeftSeries;
  analyzerShareLink: string;
  indexSeries: boolean;
  analyzerSeriesSub: Subscription;
  analyzerSeries;
  routeView: string;
  queryParams: any = {};
  displayCompare: boolean = false;
  urlParams;


  constructor(
    @Inject('environment') private environment,
    @Inject('portal') private portal,
    private analyzerService: AnalyzerService,
    private dataPortalSettingsServ: DataPortalSettingsService,
    private route: ActivatedRoute,
    private apiService: ApiService,
  ) {
    this.analyzerSeriesSub = analyzerService.analyzerSeriesTracker.subscribe((series) => {
      this.analyzerSeries = series;
      this.updateAnalyzer(series);
    });
  }

  ngOnInit() {
    if (this.route) {
      this.route.queryParams.subscribe(params => {
        if (params[`analyzerSeries`]) {
          this.storeUrlSeries(params[`analyzerSeries`]);
        }
        if (params[`chartSeries`]) {
          this.storeUrlChartSeries(params[`chartSeries`]);
        }
        this.analyzerService.analyzerData.minDate = params['start'] || '';
        this.analyzerService.analyzerData.maxDate = params['end'] || '';
        this.indexSeries = params['index'] || null;
        this.displayCompare = this.evalParamAsTrue(params['compare']);
        this.tableYoy = this.evalParamAsTrue(params['yoy']);
        this.tableYtd = this.evalParamAsTrue(params['ytd']);
        this.tableC5ma = this.evalParamAsTrue(params['c5ma']);
        this.yRightSeries = params['yright'];
        this.yLeftSeries = params['yleft'];
        this.analyzerService.analyzerData.yLeftSeries = params['yleft']?.split('-').map(id => +id) || []
        this.analyzerService.analyzerData.yRightSeries = params['yright']?.split('-').map(id => +id) || []
        this.noCache = this.evalParamAsTrue(params['nocache']);
      });
    }
    this.updateAnalyzer(this.analyzerSeries);
    this.portalSettings = this.dataPortalSettingsServ.dataPortalSettings[this.portal.universe];
  }

  evalParamAsTrue = (param: string) => param === 'true';

  updateAnalyzer (analyzerSeries: Array<any>) {
    if (analyzerSeries.length) {
      this.analyzerData = this.analyzerService.getAnalyzerData(analyzerSeries, this.noCache, this.yRightSeries);
      this.analyzerService.analyzerData.indexed = this.indexSeries;
    }
  }

  ngOnDestroy() {
    this.analyzerSeriesSub.unsubscribe();
  }

  storeUrlSeries(urlSeries: string) {
    const urlASeries = urlSeries.split('-').map(id => ({ id: +id }));
    this.analyzerService.updateAnalyzerSeries(urlASeries);
  }

  storeUrlChartSeries(urlChartSeries: string) {
    const urlCSeries = urlChartSeries.split('-').map(Number);
    urlCSeries.forEach((cSeries) => {
      const aSeries = this.analyzerSeries.find(analyzer => analyzer.id === cSeries);
      aSeries.compare = true;
    });
  }

  // Update table when selecting new ranges in the chart
  setTableDates(e) {
    this.analyzerService.analyzerData.minDate = e.minDate;
    this.analyzerService.analyzerData.maxDate = e.maxDate;
  }

  indexActive(e) {
    this.indexSeries = e.target.checked;
    this.analyzerService.toggleIndexValues(e.target.checked, this.analyzerService.analyzerData.minDate)
  }

  checkTransforms(e) {
    if (e.label === 'yoy') {
      this.tableYoy = e.value;
    }
    if (e.label === 'ytd') {
      this.tableYtd = e.value;
    }
    if (e.label === 'c5ma') {
      this.tableC5ma = e.value;
    }
  }

  changeAnalyzerFrequency(freq, analyzerSeries) {
    const siblingIds = [];
    this.analyzerService.analyzerSeriesCompareSource.next([]);
    const siblingsList = analyzerSeries.map((serie) => {
      const nonSeasonal = serie.seasonalAdjustment === 'not_seasonally_adjusted' && freq !== 'A';
      return this.apiService.fetchSiblingSeriesByIdAndGeo(serie.id, serie.currentGeo.handle, nonSeasonal);
    });
    forkJoin(siblingsList).subscribe((res: any) => {
      res.forEach((siblings) => {
        siblings.forEach((series) => {
          if (series.frequencyShort === freq && !siblingIds.some(serie => serie.id === series.id)) {
            const drawInCompare = analyzerSeries.find(s => s.title === series.title).compare === true;
            siblingIds.push({ id: series.id, compare: drawInCompare });
          }
        });
      });
      this.analyzerService.updateAnalyzerSeries(siblingIds);
    });
  }

  removeAllAnalyzerSeries() {
    this.analyzerService.removeAll();
  }

  toggleAnalyzerDisplay() {
    this.displayCompare = !this.displayCompare;
  }

  changeRange(e) {
    this.analyzerService.analyzerData.minDate = e.seriesStart;
    this.analyzerService.analyzerData.maxDate = e.seriesEnd;
    const currentCompareSeries = this.analyzerService.analyzerSeriesCompareSource.value;
    const seriesToCalcBaseYear = currentCompareSeries.filter(s => s.visible).length ? currentCompareSeries.filter(s => s.visible) : currentCompareSeries;
    this.analyzerService.getIndexBaseYear(seriesToCalcBaseYear, e.seriesStart)
    this.analyzerService.updateCompareSeriesDataAndAxes(this.analyzerService.analyzerSeriesCompareSource.value)
  }
}
