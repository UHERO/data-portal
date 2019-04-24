// Component for multi-chart view
import { Inject, Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';

import { UheroApiService } from '../../uhero-api.service';
import { NtaHelperService } from '../nta-helper.service';
import { AnalyzerService } from '../../analyzer.service';
import { DataPortalSettingsService } from '../../data-portal-settings.service';
import { Frequency } from '../../frequency';
import { Geography } from '../../geography';
import 'jquery';
declare var $: any;

@Component({
  selector: 'app-nta-layout',
  templateUrl: './nta-layout.component.html',
  styleUrls: ['./nta-layout.component.scss']
})
export class NtaLayoutComponent implements OnInit, AfterViewInit, OnDestroy {
  private sub;
  private id: number;
  private dataListId: number;
  private routeView: string;
  private routeC5ma;
  private search = false;
  private queryParams: any = {};
  private chartRange;
  private seriesStart;
  private seriesEnd;
  private displaySeries;
  private seriesInAnalyzer;
  private toggleSeriesInAnalyzer;

  // Variables for geo and freq selectors
  public categoryData;
  private selectedMeasure;
  private loading = false;
  private userEvent;
  private portalSettings;

  constructor(
    @Inject('portal') private portal,
    private _uheroAPIService: UheroApiService,
    private _analyzer: AnalyzerService,
    private _ntaHelper: NtaHelperService,
    private _dataPortalSettings: DataPortalSettingsService,
    private route: ActivatedRoute,
    private _router: Router,
    private cdRef: ChangeDetectorRef
  ) {
    this.toggleSeriesInAnalyzer = this._analyzer.updateAnalyzerCount.subscribe((data: any) => {
      this.seriesInAnalyzer = { id: data.id, analyze: data.analyze };
    });
  }

  ngOnInit() {
    this.portalSettings = this._dataPortalSettings.dataPortalSettings[this.portal.universe];
  }

  ngAfterViewInit() {
    this.sub = this.route.queryParams.subscribe((params) => {
      this.id = this.getIdParam(params['id']);
      this.dataListId = this.getIdParam(params['data_list_id']);
      this.search = typeof this.id === 'string' ? true : false;
      this.routeView = params['view'];
      this.routeC5ma = params['c5ma'];
      this.selectedMeasure = params['m'];
      if (this.id) { this.queryParams.id = this.id; };
      if (this.selectedMeasure) { this.queryParams.m = this.selectedMeasure; };
      if (this.dataListId) { this.queryParams.data_list_id = this.dataListId; };
      if (this.routeView) { this.queryParams.view = this.routeView; };
      if (this.routeC5ma) { this.queryParams.c5ma = this.routeC5ma; } else { delete this.queryParams.c5ma; }
      this.categoryData = this._ntaHelper.initContent(this.id, this.dataListId, this.selectedMeasure);
      // Run change detection explicitly after the change:
      this.cdRef.detectChanges();
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
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
    this.seriesEnd = e.seriesEnd;
    this.displaySeries = true;
  }

  updateRoute() {
    this.queryParams.id = this.queryParams.id ? this.queryParams.id : this.id;
    this.queryParams.data_list_id = this.queryParams.data_list_id ? this.queryParams.data_list_id : this.dataListId;
    const urlPath = typeof this.queryParams.id === 'string' ? '/search' : '/category';
    this._router.navigate(['/category'], { queryParams: this.queryParams, queryParamsHandling: 'merge' });
    this.loading = false;
  }
}
