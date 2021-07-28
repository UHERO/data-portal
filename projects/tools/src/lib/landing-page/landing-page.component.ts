// Component for multi-chart view
import { Inject, Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';

import { AnalyzerService } from '../analyzer.service';
import { CategoryHelperService } from '../category-helper.service';
import { HelperService } from '../helper.service';
import { DataPortalSettingsService } from '../data-portal-settings.service';
import { Frequency, Geography } from '../tools.models';
import { Subscription } from 'rxjs';

import 'jquery';
declare var $: any;

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
  routeView: string;
  private routeYoy;
  private routeYtd;
  private routeSa;
  private noCache: boolean;
  routeStart;
  routeEnd;
  search = false;
  queryParams: any = {};
  seriesStart = null;
  seriesEnd = null;
  portalSettings;
  seriesRange;
  private displaySeries;

  // Variables for geo and freq selectors
  public categoryData;
  private loading = false;
  freqSub: Subscription;
  geoSub: Subscription;
  selectedGeo: Geography;
  selectedFreq: Frequency;

  constructor(
    @Inject('portal') public portal,
    private analyzerService: AnalyzerService,
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
  }

  ngOnInit(): void {
    this.portalSettings = this.dataPortalSettingsServ.dataPortalSettings[this.portal.universe];
    this.sub = this.activatedRoute.queryParams.subscribe((params) => {
      this.id = this.getIdParam(params[`id`]);
      this.dataListId = this.getIdParam(params[`data_list_id`]);
      this.search = typeof this.id === 'string' ? true : false;
      this.routeGeo = params[`geo`];
      this.routeFreq = params[`freq`];
      this.routeView = params[`view`];
      this.routeYoy = params[`yoy`];
      this.routeYtd = params[`ytd`];
      this.routeSa = params[`sa`];
      this.routeStart = params[`start`] || null;
      this.routeEnd = params[`end`] || null;
      this.noCache = params[`nocache`] === 'true';
      if (this.id) { this.queryParams.id = this.id; }
      if (this.dataListId) { this.queryParams.data_list_id = this.dataListId; }
      if (this.routeGeo) { this.queryParams.geo = this.routeGeo; }
      if (this.routeFreq) { this.queryParams.freq = this.routeFreq; }
      if (this.routeView) { this.queryParams.view = this.routeView; }
      if (this.routeSa) { this.queryParams.sa = this.routeSa; } else { this.queryParams.sa = 'true'; }
      if (this.routeYoy) { this.queryParams.yoy = this.routeYoy; } else { delete this.queryParams.yoy; }
      if (this.routeYtd) { this.queryParams.ytd = this.routeYtd; } else { delete this.queryParams.ytd; }
      if (this.noCache) { this.queryParams.noCache = this.noCache; } else { delete this.queryParams.noCache; }
      this.categoryData = this.getData(this.id, this.noCache, this.dataListId, this.routeGeo, this.routeFreq);
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
    this.freqSub.unsubscribe();
    this.geoSub.unsubscribe();
  }

  getIdParam(id) {
    if (id === undefined) {
      return null;
    }
    if (id && isNaN(+id)) {
      // id param is a string, display search results
      return id;
    }
    if (id && +id) {
      // id of category selected in sidebar
      return +id;
    }
  }

  getData(id, noCache, dataListId, geo, freq) {
    return (typeof id === 'number' || id === null) ?
      this.catHelper.initContent(id, noCache, { dataListId, geo, freq }) :
      this.catHelper.initSearch(id, noCache, { geo, freq });
  }

  // Redraw series when a new region is selected
  redrawSeriesGeo(event, currentFreq) {
    this.displaySeries = false;
    this.loading = true;
    setTimeout(() => {
      this.queryParams.geo = event.handle;
      this.queryParams.freq = currentFreq.freq;
      this.updateRoute();
    }, 20);
  }

  redrawSeriesFreq(event, currentGeo) {
    this.displaySeries = false;
    this.loading = true;
    setTimeout(() => {
      this.queryParams.geo = currentGeo.handle;
      this.queryParams.freq = event.freq;
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

  changeRange(e) {
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
}
