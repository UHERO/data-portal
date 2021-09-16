// Component for multi-chart view
import { Inject, Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { NtaHelperService } from '../nta-helper.service';
import { HelperService } from '../helper.service';
import { AnalyzerService } from '../analyzer.service';
import { DataPortalSettingsService } from '../data-portal-settings.service';

@Component({
  selector: 'lib-measurement-landing-page',
  templateUrl: './measurement-landing-page.component.html',
  styleUrls: ['./measurement-landing-page.component.scss']
})
export class MeasurementLandingPageComponent implements OnInit, OnDestroy {
  private sub;
  private id: number;
  private dataListId: number;
  routeView: string;
  private routeC5ma;
  private noCache: boolean;
  search = false;
  queryParams: any = {};
  private chartRange;
  private seriesStart;
  private seriesEnd;
  displaySeries;
  public categoryData;
  private selectedMeasure;
  private loading = false;
  private userEvent;
  portalSettings;

  constructor(
    @Inject('portal') private portal,
    private analyzerService: AnalyzerService,
    private ntaHelperService: NtaHelperService,
    private helperService: HelperService,
    private dataPortalSettingsServ: DataPortalSettingsService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
  ) { }

  ngOnInit() {
    this.portalSettings = this.dataPortalSettingsServ.dataPortalSettings[this.portal.universe];
    this.sub = this.activatedRoute.queryParams.subscribe((params) => {
      this.id = this.helperService.getIdParam(params[`id`]);//this.getIdParam(params[`id`]);
      this.dataListId = this.helperService.getIdParam(params[`data_list_id`]);//this.getIdParam(params[`data_list_id`]);
      this.search = typeof this.id === 'string' ? true : false;
      this.routeView = params[`view`];
      this.routeC5ma = params[`c5ma`];
      this.selectedMeasure = params[`m`];
      this.noCache = params[`nocache`] === 'true';
      if (this.id) { this.queryParams.id = this.id; }
      if (this.selectedMeasure) { this.queryParams.m = this.selectedMeasure; }
      if (this.dataListId) { this.queryParams.data_list_id = this.dataListId; }
      if (this.routeView) { this.queryParams.view = this.routeView; }
      if (this.routeC5ma) { this.queryParams.c5ma = this.routeC5ma; } else { delete this.queryParams.c5ma; }
      if (this.noCache) { this.queryParams.noCache = this.noCache; }  else { delete this.queryParams.noCache; }
      const dataListId = this.dataListId;
      const selectedMeasure = this.selectedMeasure;
      this.categoryData = this.ntaHelperService.initContent(this.id, this.noCache, { dataListId, selectedMeasure });
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  // Redraw series when a new measurement is selected
  redrawSeries(event) {
    this.displaySeries = false;
    this.loading = true;
    setTimeout(() => {
      this.queryParams.m = event.name;
      this.updateRoute();
    }, 10);
  }

  switchView() {
    this.loading = true;
    setTimeout(() => {
      this.queryParams.view = this.routeView === 'table' ? 'chart' : 'table';
      this.updateRoute();
    });
  }

  c5maActive(e) {
    this.loading = true;
    setTimeout(() => {
      this.queryParams.c5ma = e.target.checked;
      this.updateRoute();
    }, 10);
  }

  changeRange(e, measurement) {
    measurement.seriesStart = e.seriesStart;
    measurement.seriesEnd = e.seriesEnd;
    this.seriesStart = e.seriesStart;
    this.seriesEnd = e.endOfSample ? null : e.seriesEnd;
    this.displaySeries = true;
  }

  updateRoute() {
    this.queryParams.id = this.queryParams.id || this.id;
    this.queryParams.data_list_id = this.queryParams.data_list_id || this.dataListId;
    const urlPath = typeof this.queryParams.id === 'string' ? '/search' : '/category';
    this.router.navigate(['/category'], { queryParams: this.queryParams, queryParamsHandling: 'merge' });
    this.loading = false;
  }
}
