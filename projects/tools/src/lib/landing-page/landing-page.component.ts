// Component for multi-chart view
import { Inject, Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryHelperService } from '../category-helper.service';
import { HelperService } from '../helper.service';
import { DataPortalSettingsService } from '../data-portal-settings.service';
import { Frequency, Geography } from '../tools.models';
import { Subscription } from 'rxjs';
import { DialogModule } from 'primeng/dialog';
import { TabViewModule } from 'primeng/tabview';

@Component({
  selector: 'lib-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss']
})
export class LandingPageComponent implements OnInit, OnDestroy {
  private sub;
  private defaultCategory;
  private id: number;
  private dataListId: number;
  private routeGeo: string;
  private routeFreq: string;
  private routeFc: string;
  routeView: string;
  private routeYoy;
  private routeYtd;
  private routeC5ma;
  private routeSa;
  private noCache: boolean;
  private selectedMeasure;
  routeStart;
  routeEnd;
  search = false;
  queryParams: any = {};
  seriesStart = null;
  seriesEnd = null;
  portalSettings;
  seriesRange;
  private displaySeries;
  displayHelp: boolean = false;

  // Variables for geo and freq selectors
  public categoryData;
  private loading = false;
  freqSub: Subscription;
  fcSub: Subscription;
  geoSub: Subscription;
  selectedGeo: Geography;
  selectedFreq: Frequency;
  selectedFc: string;

  constructor(
    @Inject('portal') public portal,
    private dataPortalSettingsServ: DataPortalSettingsService,
    private catHelper: CategoryHelperService,
    private helperService: HelperService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
  ) {
    this.freqSub = helperService.currentFreq.subscribe((freq) => {
      this.selectedFreq = freq;
    });
    this.geoSub = helperService.currentGeo.subscribe((geo) => {
      this.selectedGeo = geo;
    });
    this.fcSub = helperService.currentFc.subscribe((fc) => {
      this.selectedFc = fc;
    })
  }

  ngOnInit(): void {
    this.portalSettings = this.dataPortalSettingsServ.dataPortalSettings[this.portal.universe];
    this.sub = this.activatedRoute.queryParams.subscribe((params) => {
      this.id = this.helperService.getIdParam(params[`id`]);
      this.dataListId = this.helperService.getIdParam(params[`data_list_id`]);
      this.search = typeof this.id === 'string' ? true : false;
      this.routeGeo = params[`geo`];
      this.routeFreq = params[`freq`];
      this.routeFc = params[`fc`];
      this.routeView = params[`view`];
      this.routeYoy = params[`yoy`];
      this.routeYtd = params[`ytd`];
      this.routeC5ma = params[`c5ma`];
      this.selectedMeasure = params[`m`];
      this.routeSa = params[`sa`];
      this.routeStart = params[`start`] || null;
      this.routeEnd = params[`end`] || null;
      this.noCache = params[`nocache`] === 'true';
      if (this.id) { this.queryParams.id = this.id; }
      if (this.selectedMeasure) { this.queryParams.m = this.selectedMeasure; }
      if (this.dataListId) { this.queryParams.data_list_id = this.dataListId; }
      if (this.routeGeo) { this.queryParams.geo = this.routeGeo; }
      if (this.routeFreq) { this.queryParams.freq = this.routeFreq; }
      if (this.routeFc) { this.queryParams.fc = this.routeFc; }
      if (this.routeView) { this.queryParams.view = this.routeView; }
      if (this.routeSa) { this.queryParams.sa = this.routeSa; } else { this.queryParams.sa = 'true'; }
      if (this.routeYoy) { this.queryParams.yoy = this.routeYoy; } else { delete this.queryParams.yoy; }
      if (this.routeYtd) { this.queryParams.ytd = this.routeYtd; } else { delete this.queryParams.ytd; }
      if (this.routeC5ma && this.portal.universe === 'nta') { this.queryParams.c5ma = this.routeC5ma; } else { delete this.queryParams.c5ma; }
      if (this.noCache) { this.queryParams.noCache = this.noCache; } else { delete this.queryParams.noCache; }
      const dataListId = this.dataListId;
      const geo = this.routeGeo;
      const freq = this.routeFreq;
      const fc = this.routeFc;
      const selectedMeasure = this.selectedMeasure;
      this.categoryData = this.portal.universe === 'nta' ?
        this.catHelper.initContent(this.id, this.noCache, { dataListId, selectedMeasure }) :
        this.catHelper.initContent(this.id, this.noCache, { dataListId, geo, freq, fc })
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
    if (this.fcSub) {
      this.fcSub.unsubscribe();
    }
    this.freqSub.unsubscribe();
    this.geoSub.unsubscribe();
  }

  // Redraw series when a new measurement is selected
  redrawSeriesMeasurements(event) {
    this.displaySeries = false;
    this.loading = true;
    setTimeout(() => {
      this.queryParams.m = event.name;
      this.updateRoute();
    }, 10);
  }

  // Redraw series when a new region is selected
  redrawSeriesGeo(event, currentFreq: Frequency, currentFc: string) {
    this.displaySeries = false;
    this.loading = true;
    setTimeout(() => {
      this.queryParams.geo = event.handle;
      this.queryParams.freq = currentFreq.freq;
      this.queryParams.fc = currentFc;
      this.updateRoute();
    }, 20);
  }

  redrawSeriesFreq(event, currentGeo: Geography, currentFc: string) {
    this.displaySeries = false;
    this.loading = true;
    setTimeout(() => {
      this.queryParams.geo = currentGeo.handle;
      this.queryParams.freq = event.freq;
      this.queryParams.fc = currentFc;
      this.updateRoute();
    }, 10);
  }

  redrawSeriesFc(event, currentGeo: Geography, currentFreq: Frequency) {
    this.displaySeries = false;
    this.loading = true;
    setTimeout(() => {
      this.queryParams.geo = currentGeo.handle;
      this.queryParams.freq = currentFreq.freq;
      this.queryParams.fc = event
      this.updateRoute();
    }, 10);
  }

  switchView() {
    this.loading = true;
    this.displaySeries = false;
    setTimeout(() => {
      this.queryParams.view = this.routeView === 'table' ? 'chart' : 'table';
      this.updateRoute();
    });
  }

  yoyActive(e) {
    this.loading = true;
    setTimeout(() => {
      this.queryParams.yoy = e.target.checked;
      this.updateRoute();
    }, 10);
  }

  ytdActive(e) {
    this.loading = true;
    setTimeout(() => {
      this.queryParams.ytd = e.target.checked;
      this.updateRoute();
    }, 10);
  }

  c5maActive(e) {
    this.loading = true;
    setTimeout(() => {
      this.queryParams.c5ma = e.target.checked;
      this.updateRoute();
    }, 10);
  }

  showHelp() {
    this.displayHelp = true;
  }

  changeRange(e, category) {
    category.seriesStart = e.seriesStart;
    category.seriesEnd = e.seriesEnd;
    this.routeStart = e.seriesStart;
    this.routeEnd = e.endOfSample ? null : e.seriesEnd;
    this.seriesRange = e;
    this.displaySeries = true;
    this.queryParams.start = this.routeStart;
    this.queryParams.end = this.routeEnd;
    this.updateRoute();
  }

  updateRoute() {
    this.queryParams.id = this.queryParams.id || this.id;
    this.queryParams.data_list_id = this.queryParams.data_list_id || this.dataListId;
    const urlPath = typeof this.queryParams.id === 'string' ? '/search' : '/category';
    this.router.navigate([urlPath], { queryParams: this.queryParams, queryParamsHandling: 'merge' });
    this.loading = false;
    this.displaySeries = true;
  }

  toggleSASeries(e) {
    this.loading = true;
    setTimeout(() => {
      this.queryParams.sa = e.target.checked;
      this.updateRoute();
    }, 10);
  }

  // navigate to Summary or first data list when clicking on a category
  navToFirstDataList(dataList) {
    if (!dataList.children) {
      this.queryParams.data_list_id = dataList.id;
      this.updateRoute();
    }
    if (dataList.children) {
      return this.navToFirstDataList(dataList.children[0]);
    }
  }
}
