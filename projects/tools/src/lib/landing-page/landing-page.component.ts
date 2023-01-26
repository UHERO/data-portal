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
  private id: number;
  private dataListId: number;
  routeView: string;
  private noCache: boolean;
  routeStart;
  routeEnd;
  search = false;
  queryParams: any = {};
  seriesStart = null;
  seriesEnd = null;
  portalSettings;
  seriesRange;
  displayHelp: boolean = false;

  // Variables for geo and freq selectors
  public categoryData;
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
      const {
        m: measurement, // only for NTA portal
        geo,
        freq,
        fc, // only for forecast portal (beta)
        sa,
        yoy,
        ytd,
        c5ma // only for NTA portal
      } = params;
      this.id = this.helperService.getIdParam(params[`id`]);
      this.dataListId = this.helperService.getIdParam(params[`data_list_id`]);
      this.search = typeof this.id === 'string' ? true : false;
      this.routeView = params[`view`];
      this.routeStart = params[`start`] || null;
      this.routeEnd = params[`end`] || null;
      this.noCache = params[`nocache`] === 'true';
      if (this.id) { this.queryParams.id = this.id; }
      if (measurement) { this.queryParams.m = measurement; }
      if (this.dataListId) { this.queryParams.data_list_id = this.dataListId; }
      if (geo) { this.queryParams.geo = geo; }
      if (freq) { this.queryParams.freq = freq; }
      if (fc) { this.queryParams.fc = fc; }
      if (this.routeView) { this.queryParams.view = this.routeView; }
      if (sa) { this.queryParams.sa = sa; } else { this.queryParams.sa = 'true'; }
      if (yoy) { this.queryParams.yoy = yoy; } else { delete this.queryParams.yoy; }
      if (ytd) { this.queryParams.ytd = ytd; } else { delete this.queryParams.ytd; }
      if (c5ma && this.portal.universe === 'nta') { this.queryParams.c5ma = c5ma; } else { delete this.queryParams.c5ma; }
      if (this.noCache) { this.queryParams.noCache = this.noCache; } else { delete this.queryParams.noCache; }
      const dataListId = this.dataListId;
      const selectedMeasure = params[`m`];
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
    this.queryParams.m = event.name;
    this.updateRoute();
  }

  // Redraw series when a new region is selected
  redrawSeriesGeo(event, currentFreq: Frequency, currentFc: string) {
    this.queryParams.geo = event.handle;
    this.queryParams.freq = currentFreq.freq;
    this.queryParams.fc = currentFc;
    this.updateRoute();
  }

  redrawSeriesFreq(event, currentGeo: Geography, currentFc: string) {
    this.queryParams.geo = currentGeo.handle;
    this.queryParams.freq = event.freq;
    this.queryParams.fc = currentFc;
    this.updateRoute();
  }

  redrawSeriesFc(event, currentGeo: Geography, currentFreq: Frequency) {
    this.queryParams.geo = currentGeo.handle;
    this.queryParams.freq = currentFreq.freq;
    this.queryParams.fc = event
    this.updateRoute();
  }

  switchView() {
    this.queryParams.view = this.routeView === 'table' ? 'chart' : 'table';
    this.updateRoute();
  }

  yoyActive(e) {
    this.queryParams.yoy = e.target.checked;
    this.updateRoute();
  }

  ytdActive(e) {
    this.queryParams.ytd = e.target.checked;
    this.updateRoute();
  }

  c5maActive(e) {
    this.queryParams.c5ma = e.target.checked;
    this.updateRoute();
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
    this.queryParams.start = this.routeStart;
    this.queryParams.end = this.routeEnd;
    this.updateRoute();
  }

  updateRoute() {
    this.queryParams.id = this.queryParams.id || this.id;
    this.queryParams.data_list_id = this.queryParams.data_list_id || this.dataListId;
    const urlPath = typeof this.queryParams.id === 'string' ? '/search' : '/category';
    this.router.navigate([urlPath], { queryParams: this.queryParams, queryParamsHandling: 'merge' });
  }

  toggleSASeries(e) {
    this.queryParams.sa = e.target.checked;
    this.updateRoute();
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
