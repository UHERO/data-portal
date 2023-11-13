// Component for multi-chart view
import { Inject, Component, OnChanges, OnDestroy, Input, SimpleChanges } from "@angular/core";
import { Router } from "@angular/router";
import { CategoryHelperService } from "projects/shared/services/category-helper.service";
import { HelperService } from "projects/shared/services/helper.service";
import { DataPortalSettingsService } from "projects/shared/services/data-portal-settings.service";
import { Frequency } from "projects/shared/models/Frequency";
import { Geography } from "projects/shared/models/Geography";
import { DateRange } from "projects/shared/models/DateRange";
import { Subscription } from "rxjs";
import { SearchResultsComponent } from "../search-results/search-results.component";
import { CategoryChartsComponent } from "../category-charts/category-charts.component";
import { CategoryTableViewComponent } from "../category-table-view/category-table-view.component";
import { DateSliderComponent } from "../date-slider/date-slider.component";
import { MeasurementSelectorComponent } from "../measurement-selector/measurement-selector.component";
import { ForecastSelectorComponent } from "../forecast-selector/forecast-selector.component";
import { FreqSelectorComponent } from "../freq-selector/freq-selector.component";
import { GeoSelectorComponent } from "../geo-selector/geo-selector.component";
import { TabViewModule } from "primeng/tabview";
import { DialogModule } from "primeng/dialog";
import { NgFor, NgIf, AsyncPipe } from "@angular/common";

@Component({
  selector: "lib-landing-page",
  templateUrl: "./landing-page.component.html",
  styleUrls: ["./landing-page.component.scss"],
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    DialogModule,
    TabViewModule,
    GeoSelectorComponent,
    FreqSelectorComponent,
    ForecastSelectorComponent,
    MeasurementSelectorComponent,
    DateSliderComponent,
    CategoryTableViewComponent,
    CategoryChartsComponent,
    SearchResultsComponent,
    AsyncPipe,
  ],
})
export class LandingPageComponent implements OnChanges, OnDestroy {
  @Input() m: string; // measurement param for NTA portal
  @Input() geo: string;
  @Input() freq: string;
  @Input() fc: string; // Only for forecast portal (beta)
  @Input() sa: string; // Seasonal Adjustment
  @Input() yoy: string; 
  @Input() ytd: string;
  @Input() c5ma: string; // Only for NTA (5-year moving avg.)
  @Input() id: number | string | undefined;
  @Input() data_list_id: number;
  @Input() view: string;
  @Input() start: string | null = null;
  @Input() end: string | null = null;
  @Input() nocache: string;
  private sub;
  isSearch: boolean;
  queryParams: any = {};
  portalSettings;
  displayHelp: boolean = false;
  previousFreq: string = "";

  // Variables for geo and freq selectors
  public categoryData;
  freqSub: Subscription;
  fcSub: Subscription;
  geoSub: Subscription;
  selectedGeo: Geography;
  selectedFreq: Frequency;
  selectedFc: string;
  selectedDateRange: DateRange;

  constructor(
    @Inject("portal") public portal,
    private dataPortalSettingsServ: DataPortalSettingsService,
    private catHelper: CategoryHelperService,
    private helperService: HelperService,
    private router: Router
  ) {
    this.freqSub = helperService.currentFreq.subscribe((freq) => {
      this.selectedFreq = freq;
    });
    this.geoSub = helperService.currentGeo.subscribe((geo) => {
      this.selectedGeo = geo;
    });
    this.fcSub = helperService.currentFc.subscribe((fc) => {
      this.selectedFc = fc;
    });
  }
  
  ngOnChanges(simpleChanges: SimpleChanges): void  {
    this.portalSettings = this.dataPortalSettingsServ.dataPortalSettings[this.portal.universe];
    const idOrSearchParam = this.helperService.getIdParam(this.id);
    this.isSearch = typeof idOrSearchParam === 'string' ? true : false;
    const dataListIdParam = this.helperService.getIdParam(this.data_list_id);
    const noCacheParam = this.nocache === 'true';
    if (this.sa === undefined) {
      this.sa = 'true'
    }
    this.categoryData =
      this.portal.universe === "nta"
        ? this.catHelper.initContent(idOrSearchParam, noCacheParam, {
            dataListIdParam,
            selectedMeasure: this.m,
          })
        : this.catHelper.initContent(idOrSearchParam, noCacheParam, {
            dataListIdParam,
              geo: this.geo,
              freq: this.freq,
              fc: this.fc,
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
    this.previousFreq = "";
    this.queryParams.m = event.name;
    this.updateRoute();
  }

  // Redraw series when a new region is selected
  redrawSeriesGeo(event, currentFreq: Frequency, currentFc: string) {
    this.previousFreq = "";
    this.queryParams.geo = event.handle;
    this.queryParams.freq = currentFreq.freq;
    this.queryParams.fc = currentFc;
    this.updateRoute();
  }

  redrawSeriesFreq(
    event,
    currentFreq: Frequency,
    currentGeo: Geography,
    currentFc: string
  ) {
    this.previousFreq = currentFreq.freq;
    this.queryParams.geo = currentGeo.handle;
    this.queryParams.freq = event.freq;
    this.queryParams.fc = currentFc;
    this.updateRoute();
  }

  redrawSeriesFc(event, currentGeo: Geography, currentFreq: Frequency) {
    this.previousFreq = "";
    this.queryParams.geo = currentGeo.handle;
    this.queryParams.freq = currentFreq.freq;
    this.queryParams.fc = event;
    this.updateRoute();
  }

  switchView() {
    this.queryParams.view = this.view === "table" ? "chart" : "table";
    this.updateRoute();
  }

  yoyActive(e) {
    this.previousFreq = "";
    this.queryParams.yoy = e.target.checked;
    this.updateRoute();
  }

  ytdActive(e) {
    this.previousFreq = "";
    this.queryParams.ytd = e.target.checked;
    this.updateRoute();
  }

  c5maActive(e) {
    this.previousFreq = "";
    this.queryParams.c5ma = e.target.checked;
    this.updateRoute();
  }

  showHelp() {
    this.displayHelp = true;
  }

  changeRange(e) {
    this.previousFreq = "";
    this.start = e.useDefaultRange ? null : e.startDate;
    this.end = e.endOfSample ? null : e.endDate;
    this.queryParams.start = this.start;
    this.queryParams.end = this.end;
    this.updateRoute();
  }

  updateRoute() {
    this.queryParams.id = this.id;
    this.queryParams.data_list_id =
      this.queryParams.data_list_id || this.data_list_id;
    const urlPath =
      typeof this.queryParams.id === "string" ? "/search" : "/category";
    this.router.navigate([urlPath], {
      queryParams: this.queryParams,
      queryParamsHandling: "merge",
    });
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
