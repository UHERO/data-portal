import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { AnalyzerService } from '../analyzer.service';
import { ActivatedRoute, Router } from '@angular/router';
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
    private router: Router,
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
          this.analyzerService.storeUrlChartSeries(params[`chartSeries`]);
        }
        this.analyzerService.analyzerData.minDate = params['start'] || '';
        this.analyzerService.analyzerData.maxDate = params['end'] || '';
        this.indexSeries = params['index'] || null;
        this.displayCompare = this.evalParamAsTrue(params['compare']);
        this.tableYoy = this.evalParamAsTrue(params['yoy']);
        this.tableYtd = this.evalParamAsTrue(params['ytd']);
        this.tableC5ma = this.evalParamAsTrue(params['c5ma']);
        if (this.tableYoy) { this.queryParams.yoy = this.tableYoy } else { delete this.queryParams.yoy };
        if (this.tableYtd) { this.queryParams.ytd = this.tableYtd } else { delete this.queryParams.ytd };
        if (this.tableC5ma) { this.queryParams.c5ma = this.tableC5ma } else { delete this.queryParams.c5ma };
        if (this.displayCompare) { this.queryParams.compare = this.displayCompare } else { delete this.queryParams.compare };
        if (this.indexSeries) { this.queryParams.index = this.indexSeries } else { delete this.queryParams.index };
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
      this.analyzerData = this.analyzerService.getAnalyzerData(analyzerSeries, this.noCache);
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

  // Update table when selecting new ranges in the chart
  setTableDates(e) {
    this.analyzerService.analyzerData.minDate = e.minDate;
    this.analyzerService.analyzerData.maxDate = e.maxDate;
    this.queryParams.start = e.minDate;
    this.queryParams.end = e.maxDate;
    this.updateRoute();
  }

  indexActive(e) {
    this.indexSeries = e.target.checked;
    this.queryParams.index = e.target.checked ? e.target.checked : null;
    this.analyzerService.toggleIndexValues(e.target.checked, this.analyzerService.analyzerData.minDate);
    this.updateRoute();
  }

  checkTransforms(e) {
    if (e.label === 'yoy') {
      this.tableYoy = e.value;
      this.queryParams.yoy = e.value ? e.value : null;
    }
    if (e.label === 'ytd') {
      this.tableYtd = e.value;
      this.queryParams.ytd = e.value ? e.value : null;
    }
    if (e.label === 'c5ma') {
      this.tableC5ma = e.value;
      this.queryParams.c5ma = e.value ? e.value : null;
    }
    this.updateRoute();
  }

  changeAnalyzerFrequency(freq, analyzerSeries) {
    const siblingIds = [];
    this.analyzerService.analyzerSeriesCompareSource.next([]);
    const siblingsList = analyzerSeries.map((serie) => {
      return this.apiService.fetchSiblingSeriesByIdAndGeo(serie.id, serie.currentGeo.handle, serie.seasonalAdjustment, freq);
    });
    forkJoin(siblingsList).subscribe((res: any) => {
      res.forEach((siblings) => {
        siblings.forEach((sib) => {
          if (!siblingIds.some(s => s.id === sib.id) && sib.frequencyShort === freq) {
            const drawInCompare = analyzerSeries.find(s => s.title === sib.title).compare === true;
            siblingIds.push({ id: sib.id, compare: drawInCompare });
          }
        })
      });
      this.queryParams.analyzerSeries = siblingIds.map(ids => ids.id).join('-');
      this.queryParams.chartSeries = siblingIds.filter(sib =>  sib.compare).map(ids => ids.id).join('-');
      this.analyzerService.updateAnalyzerSeries(siblingIds);
      this.updateRoute();
    });
  }

  removeAllAnalyzerSeries() {
    this.analyzerService.removeAll();
  }

  toggleAnalyzerDisplay() {
    this.displayCompare = !this.displayCompare;
    this.queryParams.compare = this.displayCompare;
    this.updateRoute();
  }

  changeRange(e) {
    this.analyzerService.analyzerData.minDate = e.seriesStart;
    this.analyzerService.analyzerData.maxDate = e.seriesEnd;
    const currentCompareSeries = this.analyzerService.analyzerSeriesCompareSource.value;
    const seriesToCalcBaseYear = currentCompareSeries.filter(s => s.visible).length ? currentCompareSeries.filter(s => s.visible) : currentCompareSeries;
    this.analyzerService.getIndexBaseYear(seriesToCalcBaseYear, e.seriesStart);
    this.analyzerService.updateCompareSeriesDataAndAxes(this.analyzerService.analyzerSeriesCompareSource.value);
    this.queryParams.start = e.seriesStart;
    this.queryParams.end = e.seriesEnd;
    this.updateRoute();
  }

  updateRoute() {
    this.router.navigate(['/analyzer'], { queryParams: this.queryParams, queryParamsHandling: 'merge' });
  }
}
