import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
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
  tableMom;
  startDate;
  endDate;
  private noCache: boolean;
  analyzerData;
  yRightSeries;
  yLeftSeries;
  leftMin;
  leftMax;
  rightMin;
  rightMax;
  analyzerShareLink: string;
  indexSeries: boolean;
  analyzerSeriesSub: Subscription;
  analyzerSeries;
  routeView: string;
  queryParams: any = {};
  displayCompare: boolean = false;
  urlParams;
  displayHelp: boolean = false;
  displaySelectionNA: boolean = false;

  constructor(
    @Inject('environment') private environment,
    @Inject('portal') private portal,
    private analyzerService: AnalyzerService,
    private dataPortalSettingsServ: DataPortalSettingsService,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private router: Router,
    private location: Location,
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
        console.log(params)
        this.analyzerService.analyzerData.minDate = params['start'] || '';
        this.analyzerService.analyzerData.maxDate = params['end'] || '';
        this.indexSeries = params['index'] || null;
        this.leftMin = params['leftMin'] || null;
        console.log('this.leftMin', this.leftMin)
        this.leftMax = params['leftMax'] || null;
        this.rightMin = params['rightMin'] || null;
        this.rightMax = params['rightMax'] || null;
        this.displayCompare = this.evalParamAsTrue(params['compare']);
        this.tableYoy = this.evalParamAsTrue(params['yoy']);
        this.tableYtd = this.evalParamAsTrue(params['ytd']);
        this.tableC5ma = this.evalParamAsTrue(params['c5ma']);
        this.tableMom = this.evalParamAsTrue(params['mom']);
        if (this.tableYoy) { this.queryParams.yoy = this.tableYoy } else { delete this.queryParams.yoy };
        if (this.tableYtd) { this.queryParams.ytd = this.tableYtd } else { delete this.queryParams.ytd };
        if (this.tableC5ma) { this.queryParams.c5ma = this.tableC5ma } else { delete this.queryParams.c5ma };
        if (this.tableMom) { this.queryParams.mom = this.tableMom } else { delete this.queryParams.mom };
        if (this.displayCompare) { this.queryParams.compare = this.displayCompare } else { delete this.queryParams.compare };
        if (this.indexSeries) { this.queryParams.index = this.indexSeries } else { delete this.queryParams.index };
        if (this.leftMin) { this.queryParams.leftMin = this.leftMin } else { delete this.queryParams.leftMin };
        if (this.leftMax) { this.queryParams.leftMax = this.leftMax } else { delete this.queryParams.leftMax };
        if (this.rightMin) { this.queryParams.rightMin = this.rightMin } else { delete this.queryParams.rightMin };
        if (this.rightMax) { this.queryParams.rightMax = this.rightMax } else { delete this.queryParams.rightMax };
        this.yRightSeries = params['yright'];
        this.yLeftSeries = params['yleft'];
        this.analyzerService.analyzerData.yLeftSeries = params['yleft']?.split('-').map(id => +id) || [];
        this.analyzerService.analyzerData.yRightSeries = params['yright']?.split('-').map(id => +id) || [];
        this.analyzerService.analyzerData.leftMin = this.leftMin ? this.leftMin : null;
        this.analyzerService.analyzerData.leftMax = this.leftMax ? this.leftMax : null;
        this.analyzerService.analyzerData.rightMin = this.rightMin ? this.rightMin : null;
        this.analyzerService.analyzerData.rightMax = this.rightMax ? this.rightMax : null;
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

  indexActive(e) {
    this.indexSeries = e.target.checked;
    this.queryParams.index = e.target.checked || null;
    this.analyzerService.toggleIndexValues(e.target.checked, this.analyzerService.analyzerData.minDate);
    this.updateUrlLocation();
  }

  checkTransforms(e) {
    if (e.label === 'yoy') {
      this.tableYoy = e.value;
      this.queryParams.yoy = e.value || null;
    }
    if (e.label === 'ytd') {
      this.tableYtd = e.value;
      this.queryParams.ytd = e.value || null;
    }
    if (e.label === 'c5ma') {
      this.tableC5ma = e.value;
      this.queryParams.c5ma = e.value || null;
    }
    if (e.label === 'mom') {
      this.tableMom = e.value;
      this.queryParams.mom = e.value || null;
    }
    this.updateUrlLocation();
  }

  changeAnalyzerFrequency(freq, analyzerSeries) {
    const siblingIds = [];
    this.analyzerService.analyzerData.urlChartSeries = [];
    const siblingsList = analyzerSeries.map((serie) => {
      return this.apiService.fetchSiblingSeriesByIdAndGeo(serie.id, serie.currentGeo.handle, serie.seasonalAdjustment, freq);
    });
    forkJoin(siblingsList).subscribe((res: any) => {
      res.forEach((siblings) => {
        siblings.forEach((sib) => {
          if (!siblingIds.some(s => s.id === sib.id) && sib.frequencyShort === freq) {
            const drawInCompare = analyzerSeries.find(s => s.title === sib.title).visible === true;
            siblingIds.push({ id: sib.id, compare: drawInCompare });
          }
        });
      });
      if (!siblingIds.length) {
        this.displaySelectionNA = true;
      }
      if (siblingIds.length) {
        this.displaySelectionNA = false;
      }
      this.queryParams.analyzerSeries = siblingIds.map(ids => ids.id).join('-');
      this.queryParams.chartSeries = siblingIds.filter(sib =>  sib.visible).map(ids => ids.id).join('-');
      this.analyzerService.updateAnalyzerSeries(siblingIds);
      this.updateUrlLocation();
    });
  }

  showHelp() {
    this.displayHelp = true;
  }

  removeAllAnalyzerSeries() {
    this.analyzerService.removeAll();
  }

  toggleAnalyzerDisplay() {
    this.displayCompare = !this.displayCompare;
    this.queryParams.compare = this.displayCompare || null;
    this.updateUrlLocation();
  }

  changeRange(e) {
    this.analyzerService.analyzerData.minDate = e.seriesStart;
    this.analyzerService.analyzerData.maxDate = e.seriesEnd;
    if (this.analyzerService.analyzerData.indexed) {
      this.analyzerService.updateBaseYear();
    }
    this.updateUrlLocation();
  }

  updateUrlLocation() {
    const analyzerData = this.analyzerService.analyzerData;
    const {
      analyzerSeries,
      minDate,
      maxDate,
      yLeftSeries,
      yRightSeries,
      leftMin,
      leftMax,
      rightMin,
      rightMax
    } = analyzerData;
    this.queryParams.start = minDate;
    this.queryParams.end = maxDate;
    this.queryParams.analyzerSeries = analyzerSeries.map(s => s.id).join('-');
    this.queryParams.chartSeries = analyzerSeries.filter(s => s.visible).map(s => s.id).join('-') || null;
    this.queryParams.yright = yRightSeries.length ? yRightSeries.join('-') : null;
    this.queryParams.yleft = yLeftSeries.length ? yLeftSeries.join('-') : null;
    this.queryParams.leftMin = leftMin ? leftMin : null;
    this.queryParams.leftMax = leftMax ? leftMax : null;
    this.queryParams.rightMin = rightMin ? rightMin : null;
    this.queryParams.rightMax = rightMax ? rightMax : null;
    const url = this.router.createUrlTree([], {
      relativeTo: this.route, queryParams: this.queryParams
    }).toString();
    this.location.go(url);
  }
}
