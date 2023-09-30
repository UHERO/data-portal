import {
  Component,
  OnInit,
  OnChanges,
  Inject,
  Input,
  OnDestroy,
  ChangeDetectorRef,
  AfterContentChecked,
  SimpleChanges,
} from "@angular/core";
import { Location, NgIf, NgFor, AsyncPipe } from "@angular/common";
import { AnalyzerService } from "projects/shared/services/analyzer.service";
import { DateRange } from "projects/shared/models/DateRange";
import { ActivatedRoute, Router } from "@angular/router";
import { DataPortalSettingsService } from "projects/shared/services/data-portal-settings.service";
import { forkJoin, Subscription } from "rxjs";
import { ApiService } from "projects/shared/services/api.service";
import { HelperService } from "projects/shared/services/helper.service";
import { AnalyzerTableComponent } from "../analyzer-table/analyzer-table.component";
import { AnalyzerHighstockComponent } from "../analyzer-highstock/analyzer-highstock.component";
import { CategoryChartsComponent } from "../category-charts/category-charts.component";
import { DateSliderComponent } from "../date-slider/date-slider.component";
import { FreqSelectorComponent } from "../freq-selector/freq-selector.component";
import { ShareLinkComponent } from "../share-link/share-link.component";
import { TabViewModule } from "primeng/tabview";
import { DialogModule } from "primeng/dialog";

@Component({
  selector: "lib-analyzer",
  templateUrl: "./analyzer.component.html",
  styleUrls: ["./analyzer.component.scss"],
  standalone: true,
  imports: [
    DialogModule,
    TabViewModule,
    NgIf,
    NgFor,
    ShareLinkComponent,
    FreqSelectorComponent,
    DateSliderComponent,
    CategoryChartsComponent,
    AnalyzerHighstockComponent,
    AnalyzerTableComponent,
    AsyncPipe,
  ],
})
export class AnalyzerComponent
  implements OnInit, OnChanges, OnDestroy, AfterContentChecked
{
  @Input() analyzerSeries: string;
  @Input() chartSeries: string;
  @Input() start: string;
  @Input() end: string;
  @Input() index: string;
  @Input() leftMin: string;
  @Input() leftMax: string;
  @Input() rightMin: string;
  @Input() rightMax: string;
  @Input() compare: string;
  @Input() yoy: string;
  @Input() ytd: string;
  @Input() c5ma: string;
  @Input() mom: string;
  @Input() yright: string;
  @Input() yleft: string;
  @Input() column: string;
  @Input() area: string;
  @Input() nocache: string;

  portalSettings;
  tableYoy: boolean;
  tableYtd: boolean;
  tableC5ma: boolean;
  tableMom: boolean;
  private noCache: boolean;
  analyzerData;
  yRightSeries: string;
  yLeftSeries: string;
  //leftMin: string;
  //leftMax: string;
  //rightMin: string;
  //rightMax: string;
  analyzerShareLink: string;
  indexSeries: boolean;
  analyzerSeriesSub: Subscription;
  seriesInAnalyzer;
  routeView: string;
  queryParams: any = {};
  displayCompare: boolean = false;
  urlParams;
  displayHelp: boolean = false;
  displaySelectionNA: boolean = false;
  routeStart: string;
  routeEnd: string;
  dateRangeSubscription: Subscription;
  selectedDateRange: DateRange;
  previousFreq: string = "";

  constructor(
    @Inject("environment") private environment,
    @Inject("portal") private portal,
    private analyzerService: AnalyzerService,
    private dataPortalSettingsServ: DataPortalSettingsService,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private router: Router,
    private cdRef: ChangeDetectorRef,
    private location: Location,
    private helperService: HelperService
  ) {
    this.analyzerSeriesSub = analyzerService.analyzerSeriesTracker.subscribe(
      (series) => {
        this.seriesInAnalyzer = series;
        this.updateAnalyzer(series);
      }
    );

    this.dateRangeSubscription = this.helperService.currentDateRange.subscribe(
      (dateRange) => {
        this.selectedDateRange = dateRange;
      }
    );
  }

  ngOnChanges(simpleChanges: SimpleChanges) {
    this.analyzerService.analyzerData.yLeftSeries = [];
    this.analyzerService.analyzerData.yRightSeries = [];
    this.analyzerService.analyzerData.leftMin = null;
    this.analyzerService.analyzerData.leftMax = null;
    this.analyzerService.analyzerData.rightMin = null;
    this.analyzerService.analyzerData.rightMax = null;

    if (this.analyzerSeries) {
      this.storeUrlSeries(this.analyzerSeries);
    }
    if (this.chartSeries) {
      this.analyzerService.storeUrlChartSeries(this.chartSeries);
    }
    if (this.compare) {
      this.displayCompare = this.evalParamAsTrue(this.compare);
    }
    if (this.yoy) {
      this.tableYoy = this.evalParamAsTrue(this.yoy);
    }
    if (this.ytd) {
      this.tableYtd = this.evalParamAsTrue(this.ytd);
    }
    if (this.c5ma) {
      this.tableC5ma = this.evalParamAsTrue(this.c5ma);
    }
    if (this.mom) {
      this.tableMom = this.evalParamAsTrue(this.mom);
    }
    if (this.yright) {
      this.yRightSeries = this.yright;
      this.analyzerService.analyzerData.yRightSeries = this.yright.split('-').map(id => +id);
    }
    if (this.yleft) {
      this.yLeftSeries = this.yleft;
      this.analyzerService.analyzerData.yLeftSeries = this.yleft.split('-').map(id => +id);
    }
    if (this.column) {
      this.analyzerService.analyzerData.column  = this.column.split('-').map(id => +id);
    }
    if (this.area) {
      this.analyzerService.analyzerData.area  = this.area.split('-').map(id => +id);
    }
    if (this.leftMin) {
      this.analyzerService.analyzerData.leftMin = this.leftMin;
    }
    if (this.leftMax) {
      this.analyzerService.analyzerData.leftMax = this.leftMax;
    }
    if (this.rightMin) {
      this.analyzerService.analyzerData.rightMin = this.rightMin;
    }
    if (this.rightMax) {
      this.analyzerService.analyzerData.rightMax = this.rightMax;
    }
    this.noCache = this.evalParamAsTrue(this.nocache);
    this.updateAnalyzer(this.seriesInAnalyzer);
    this.portalSettings =
      this.dataPortalSettingsServ.dataPortalSettings[this.portal.universe];

  }

  ngOnInit() {
    /*this.dateRangeSubscription = this.helperService.currentDateRange.subscribe(
      (dateRange) => {
        this.selectedDateRange = dateRange;
      }
    );*/

    /*if (this.route) {
      this.route.queryParams.subscribe((params) => {
        if (params[`analyzerSeries`]) {
          this.storeUrlSeries(params[`analyzerSeries`]);
        }
        if (params[`chartSeries`]) {
          this.analyzerService.storeUrlChartSeries(params[`chartSeries`]);
        }
        this.routeStart = params[`start`] || null;
        this.routeEnd = params[`end`] || null;
        this.indexSeries = params["index"] || null;
        this.leftMin = params["leftMin"] || null;
        this.leftMax = params["leftMax"] || null;
        this.rightMin = params["rightMin"] || null;
        this.rightMax = params["rightMax"] || null;
        this.displayCompare = this.evalParamAsTrue(params["compare"]);
        this.tableYoy = this.evalParamAsTrue(params["yoy"]);
        this.tableYtd = this.evalParamAsTrue(params["ytd"]);
        this.tableC5ma = this.evalParamAsTrue(params["c5ma"]);
        this.tableMom = this.evalParamAsTrue(params["mom"]);
        if (this.tableYoy) {
          this.queryParams.yoy = this.tableYoy;
        } else {
          delete this.queryParams.yoy;
        }
        if (this.tableYtd) {
          this.queryParams.ytd = this.tableYtd;
        } else {
          delete this.queryParams.ytd;
        }
        if (this.tableC5ma) {
          this.queryParams.c5ma = this.tableC5ma;
        } else {
          delete this.queryParams.c5ma;
        }
        if (this.tableMom) {
          this.queryParams.mom = this.tableMom;
        } else {
          delete this.queryParams.mom;
        }
        if (this.displayCompare) {
          this.queryParams.compare = this.displayCompare;
        } else {
          delete this.queryParams.compare;
        }
        if (this.indexSeries) {
          this.queryParams.index = this.indexSeries;
        } else {
          delete this.queryParams.index;
        }
        if (this.leftMin) {
          this.queryParams.leftMin = this.leftMin;
        } else {
          delete this.queryParams.leftMin;
        }
        if (this.leftMax) {
          this.queryParams.leftMax = this.leftMax;
        } else {
          delete this.queryParams.leftMax;
        }
        if (this.rightMin) {
          this.queryParams.rightMin = this.rightMin;
        } else {
          delete this.queryParams.rightMin;
        }
        if (this.rightMax) {
          this.queryParams.rightMax = this.rightMax;
        } else {
          delete this.queryParams.rightMax;
        }
        this.yRightSeries = params["yright"];
        this.yLeftSeries = params["yleft"];
        this.analyzerService.analyzerData.yLeftSeries =
          params["yleft"]?.split("-").map((id) => +id) || [];
        this.analyzerService.analyzerData.yRightSeries =
          params["yright"]?.split("-").map((id) => +id) || [];
        this.analyzerService.analyzerData.leftMin = this.leftMin
          ? this.leftMin
          : null;
        this.analyzerService.analyzerData.leftMax = this.leftMax
          ? this.leftMax
          : null;
        this.analyzerService.analyzerData.rightMin = this.rightMin
          ? this.rightMin
          : null;
        this.analyzerService.analyzerData.rightMax = this.rightMax
          ? this.rightMax
          : null;
        this.noCache = this.evalParamAsTrue(params["nocache"]);
      });
    }
    this.updateAnalyzer(this.seriesInAnalyzer);
    this.portalSettings =
      this.dataPortalSettingsServ.dataPortalSettings[this.portal.universe];*/
  }

  ngAfterContentChecked() {
    this.cdRef.detectChanges();
  }

  evalParamAsTrue = (param: string) => param === "true";

  updateAnalyzer(analyzerSeries: Array<any>) {
    if (analyzerSeries.length && this.selectedDateRange) {
      this.analyzerData = this.analyzerService.getAnalyzerData(
        analyzerSeries,
        this.selectedDateRange.startDate,
        this.noCache
      );
      // this.analyzerService.analyzerData.indexed = this.indexSeries;
      this.analyzerService.analyzerData.indexed = this.index === 'true';
    }
  }

  ngOnDestroy() {
    this.analyzerSeriesSub.unsubscribe();
    this.dateRangeSubscription.unsubscribe();
  }

  storeUrlSeries(urlSeries: string) {
    const urlASeries = urlSeries.split("-").map((id) => ({ id: +id }));
    this.analyzerService.updateAnalyzerSeries(urlASeries);
  }

  indexActive(e) {
    // this.indexSeries = e.target.checked;
    this.index = e.target.checked;
    this.queryParams.index = e.target.checked || null;
    this.analyzerService.toggleIndexValues(
      e.target.checked,
      this.selectedDateRange.startDate
    );
    this.updateUrlLocation();
  }

  checkTransforms(e) {
    if (e.label === "yoy") {
      this.tableYoy = e.value;
      this.queryParams.yoy = e.value || null;
    }
    if (e.label === "ytd") {
      this.tableYtd = e.value;
      this.queryParams.ytd = e.value || null;
    }
    if (e.label === "c5ma") {
      this.tableC5ma = e.value;
      this.queryParams.c5ma = e.value || null;
    }
    if (e.label === "mom") {
      this.tableMom = e.value;
      this.queryParams.mom = e.value || null;
    }
    this.updateUrlLocation();
  }

  changeAnalyzerFrequency(freq, previousFreq: string, analyzerSeries) {
    this.previousFreq = previousFreq === freq ? "" : previousFreq;
    const siblingIds = [];
    this.analyzerService.analyzerData.urlChartSeries = [];
    const siblingsList = analyzerSeries.map((serie) => {
      return this.apiService.fetchSiblingSeriesByIdAndGeo(
        serie.id,
        serie.currentGeo.handle,
        serie.seasonalAdjustment,
        freq
      );
    });
    forkJoin(siblingsList).subscribe((res: any) => {
      res.forEach((siblings) => {
        siblings.forEach((sib) => {
          if (
            !siblingIds.some((s) => s.id === sib.id) &&
            sib.frequencyShort === freq
          ) {
            const drawInCompare =
              analyzerSeries.find((s) => s.title === sib.title).visible ===
              true;
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
      this.queryParams.analyzerSeries = siblingIds
        .map((ids) => ids.id)
        .join("-");
      this.queryParams.chartSeries = siblingIds
        .filter((sib) => sib.visible)
        .map((ids) => ids.id)
        .join("-");
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
    this.routeStart = e.startDate;
    this.routeEnd = e.endDate;
    if (this.analyzerService.analyzerData.indexed) {
      this.analyzerService.updateBaseYear(e.startDate);
    }
    this.updateUrlLocation();
  }

  updateUrlLocation() {
    const analyzerData = this.analyzerService.analyzerData;
    const {
      analyzerSeries,
      yLeftSeries,
      yRightSeries,
      leftMin,
      leftMax,
      rightMin,
      rightMax,
      column,
      area
    } = analyzerData;
    this.queryParams.start = this.start;
    this.queryParams.end = this.end;
    this.queryParams.analyzerSeries = analyzerSeries.map((s) => s.id).join("-");
    this.queryParams.chartSeries =
      analyzerSeries
        .filter((s) => s.visible)
        .map((s) => s.id)
        .join("-") || null;
    this.queryParams.yright = yRightSeries.length
      ? yRightSeries.join("-")
      : null;
    this.queryParams.yleft = yLeftSeries.length ? yLeftSeries.join("-") : null;
    this.queryParams.column = column.length ? column.join('-') : null;
    this.queryParams.area = area.length ? area.join('-') : null;
    this.queryParams.leftMin = leftMin ? leftMin : null;
    this.queryParams.leftMax = leftMax ? leftMax : null;
    this.queryParams.rightMin = rightMin ? rightMin : null;
    this.queryParams.rightMax = rightMax ? rightMax : null;
    const url = this.router
      .createUrlTree([], {
        relativeTo: this.route,
        queryParams: this.queryParams,
      })
      .toString();
    this.location.go(url);
  }
}
