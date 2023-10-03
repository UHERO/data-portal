import {
  Component,
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
  implements OnChanges, OnDestroy, AfterContentChecked
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
  @Input() chartYoy: string;
  @Input() chartYtd: string;
  @Input() chartMom: string;
  @Input() chartC5ma: string;
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
  analyzerShareLink: string;
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
        console.log('compare', this.compare)
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
    this.routeStart = this.start;
    this.routeEnd = this.end;
    console.log('on changes compare', this.compare)
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
      this.analyzerService.analyzerData.column = this.column.split('-').map(id => +id);
    }
    if (this.area) {
      this.analyzerService.analyzerData.area = this.area.split('-').map(id => +id);
    }
    if (this.chartYoy) {
      this.analyzerService.analyzerData.chartYoy = this.evalParamAsTrue(this.chartYoy);
    }
    if (this.chartYtd) {
      this.analyzerService.analyzerData.chartYtd = this.evalParamAsTrue(this.chartYtd);
    }
    if (this.chartMom) {
      this.analyzerService.analyzerData.chartMom = this.evalParamAsTrue(this.chartMom);
    }
    if (this.chartC5ma) {
      this.analyzerService.analyzerData.chartC5ma = this.evalParamAsTrue(this.chartC5ma);
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
    this.index = e.target.checked;
    this.queryParams.index = e.target.checked || null;
    this.analyzerService.toggleIndexValues(
      e.target.checked,
      this.selectedDateRange.startDate
    );
    this.updateUrlLocation({ index: e.target.checked || null });
  }

  checkTransforms(e) {
    if (e.label === "yoy") {
      this.tableYoy = e.value;
    }
    if (e.label === "ytd") {
      this.tableYtd = e.value;
    }
    if (e.label === "c5ma") {
      this.tableC5ma = e.value;
    }
    if (e.label === "mom") {
      this.tableMom = e.value;
    }
    const param = {};
    param[e.label] = e.value || null;
    this.updateUrlLocation(param);
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
      const analyzerSeriesParam = siblingIds
      .map((ids) => ids.id)
      .join("-");
      const chartSeriesParam = siblingIds
      .filter((sib) => sib.visible)
      .map((ids) => ids.id)
      .join("-");
      this.analyzerService.updateAnalyzerSeries(siblingIds);
      this.updateUrlLocation({
        analyzerSeries: analyzerSeriesParam,
        chartSeries: chartSeriesParam
      });
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
    console.log('toggle display', this.displayCompare)

    this.updateUrlLocation({ compare: `${this.displayCompare}`|| null });
  }

  changeRange(e) {
    this.routeStart = e.startDate;
    this.routeEnd = e.endDate;
    if (this.analyzerService.analyzerData.indexed) {
      this.analyzerService.updateBaseYear(e.startDate);
    }
    this.updateUrlLocation({start: e.startDate, end: e.endDate});
  }

  updateUrlLocation(param) {
    const paramIncludesAnalyzerSeries = Object.keys(param).includes('analyzerSeries');
    const paramIncludesChartSeries = Object.keys(param).includes('chartSeries');
    if (!paramIncludesAnalyzerSeries) {
      const analyzerData = this.analyzerService.analyzerData;
      const { analyzerSeries } = analyzerData;
      const analyzerSeriesParam = analyzerSeries.map((s) => s.id).join("-");
      this.queryParams = { ...this.queryParams, analyzerSeries: analyzerSeriesParam };
    }
    if (!paramIncludesChartSeries) {
      const analyzerData = this.analyzerService.analyzerData;
      const { analyzerSeries } = analyzerData;
      const chartSeriesParam = analyzerSeries
        .filter((s) => s.visible)
        .map((s) => s.id)
        .join("-") || null;
      this.queryParams = { ...this.queryParams, chartSeries: chartSeriesParam };
    }
    /* const analyzerData = this.analyzerService.analyzerData;
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
    console.log('this.start', this.start)
    this.queryParams.start = this.start;
    this.queryParams.end = this.end;
    this.queryParams.analyzerSeries = this.queryParams.analyzerSeries = analyzerSeries.map((s) => s.id).join("-");
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
    this.queryParams.rightMax = rightMax ? rightMax : null; */
    this.queryParams = { ...this.queryParams, ...param };
    console.log(this.route)
    const url = this.router
      .createUrlTree([], {
        relativeTo: this.route,
        queryParams: this.queryParams,
        queryParamsHandling: 'merge'
      })
      .toString();
    this.location.go(url);
  }
}
