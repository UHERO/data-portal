import {
  Component,
  OnChanges,
  Inject,
  Input,
  OnDestroy,
  SimpleChanges,
  computed,
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
  implements OnChanges, OnDestroy
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
  analyzerShareLink: string;
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
    public analyzerService: AnalyzerService,
    private dataPortalSettingsServ: DataPortalSettingsService,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private router: Router,
    private location: Location,
    private helperService: HelperService
  ) {
    this.dateRangeSubscription = this.helperService.currentDateRange.subscribe(
      (dateRange) => {
        this.selectedDateRange = dateRange;
        console.log(dateRange)
        console.log('analyzer series', this.analyzerService.analyzerSeriesStore())
        
      }
    );
  }

  analyzerData = computed(() => this.analyzerService.analyzerData());
  
  ngOnChanges(simpleChanges: SimpleChanges) {
    /*console.log('TEST')
    this.routeStart = this.start;
    this.routeEnd = this.end;

    if (this.analyzerSeries) {
      this.storeUrlSeries(this.analyzerSeries);
    }
    if (this.chartSeries) {
      this.analyzerService.storeUrlChartSeries(this.chartSeries);
    }
    if (this.index) {
      this.displayCompare = this.evalParamAsTrue(this.index);
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
      this.analyzerService.yRightSeries.update(right => right = this.mapIds(this.yright));
    }
    if (this.yleft) {
      this.analyzerService.yLeftSeries.update(left => left = this.mapIds(this.yleft));
    }
    if (this.column) {
      this.analyzerService.column.update(col => col = this.mapIds(this.column));
    }
    if (this.area) {
      this.analyzerService.area.update(area => area = this.mapIds(this.area));
    }

    if (this.chartYoy) {
      this.analyzerService.chartYoy.update(yoy => yoy = this.mapIds(this.chartYoy));
    }
    if (this.chartYtd) {
      this.analyzerService.chartYtd.update(ytd => ytd = this.mapIds(this.chartYtd));
    }
    if (this.chartMom) {
      this.analyzerService.chartMom.update(mom => mom = this.mapIds(this.chartMom));
    }
    if (this.chartC5ma) {
      this.analyzerService.chartC5ma.update(c5ma => c5ma = this.mapIds(this.chartC5ma));
    }
    if (this.leftMin) {
      this.analyzerService.leftMin.set(+this.leftMin);
    }
    if (this.leftMax) {
      this.analyzerService.leftMax.set(+this.leftMax);
    }
    if (this.rightMin) {
      this.analyzerService.rightMin.set(+this.rightMin);
    }
    if (this.rightMax) {
      this.analyzerService.rightMax.set(+this.rightMax);
    }
    this.noCache = this.evalParamAsTrue(this.nocache);
    this.seriesInAnalyzer = this.analyzerService.analyzerSeriesStore();

    
    */
    this.portalSettings =
    this.dataPortalSettingsServ.dataPortalSettings[this.portal.universe];
      this.seriesInAnalyzer = this.analyzerService.analyzerSeriesStore();
      this.updateAnalyzer(this.seriesInAnalyzer);
  }

  mapIds = (paramString: string) => paramString.split('-').map(Number);

  evalParamAsTrue = (param: string) => param === "true";

  updateAnalyzer(analyzerSeries: Array<any>) {
    if (analyzerSeries.length /*&& this.selectedDateRange*/) {
      console.log('1', this.selectedDateRange)
      console.log('2', this.start)
      const date = this.selectedDateRange.startDate || this.routeStart;
      this.analyzerService.getAnalyzerData(
        analyzerSeries,
        //this.selectedDateRange.startDate,
        //this.routeStart,
        date,
        this.noCache
      );
      this.analyzerService.indexed.set(this.index === 'true');
    }
  }

  ngOnDestroy() {
    this.dateRangeSubscription.unsubscribe();
  }

  storeUrlSeries(urlSeries: string) {
    // const urlASeries = urlSeries.split("-").map((id) => ({ id: +id }));
    const urlASeries = urlSeries.split('-').map(id => +id);
    this.analyzerService.updateAnalyzerSeries(urlASeries);
  }

  indexActive(e) {
    this.analyzerService.toggleIndexValues(
      e.target.checked,
      this.selectedDateRange.startDate
    )
    this.analyzerService.indexed.set(e.target.checked);
    this.updateUrlLocation({ index: this.analyzerService.indexed() || null });
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
    this.analyzerService.urlChartSeries.update(series => series = []);
    this.analyzerService.updateAnalyzerSeries([]);
    console.log(this.analyzerService.urlChartSeries())
    console.log('series ? ',this.analyzerService.analyzerSeriesStore())
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
      this.analyzerService.updateAnalyzerSeries(siblingIds.map(sib => +sib.id));
      const queryParams = this.analyzerService.analyzerParams();
      this.router.navigate([`/analyzer`], { queryParams: queryParams, queryParamsHandling: 'merge' })
    });
  }

  showHelp() {
    this.displayHelp = true;
  }

  removeAllAnalyzerSeries() {
    this.analyzerService.removeAll();
    Object.keys(this.queryParams).forEach((param) => {
      delete this.queryParams[param]
    });
    this.router.navigate(['/analyzer']);
  }

  toggleAnalyzerDisplay() {
    this.displayCompare = !this.displayCompare;
    this.updateUrlLocation({ compare: `${this.displayCompare}`|| null });
  }

  changeRange(e) {
    console.log('e change range', e)
    this.routeStart = e.startDate;
    this.routeEnd = e.endDate;
    if (this.analyzerService.indexed()) {
      this.analyzerService.updateBaseYear(e.startDate);
      console.log('NEW BASE YEAR', this.analyzerService.baseYear())
    }
    this.updateUrlLocation({start: e.startDate, end: e.endDate});
  }

  updateUrlLocation(param) {
    const paramIncludesAnalyzerSeries = Object.keys(param).includes('analyzerSeries');
    const paramIncludesChartSeries = Object.keys(param).includes('chartSeries');
    const { analyzerSeries } = this.analyzerService.analyzerData();
    if (!paramIncludesAnalyzerSeries) {
      const analyzerSeriesParam = analyzerSeries.map((s) => s.id).join("-");
      this.queryParams = { ...this.queryParams, analyzerSeries: analyzerSeriesParam };
    }
    if (!paramIncludesChartSeries) {
      console.log('analyzerSeries', analyzerSeries)
      const chartSeriesParam = analyzerSeries
        .filter((s) => s.visible)
        .map((s) => s.id)
        .join("-") || null;
      this.queryParams = { ...this.queryParams, chartSeries: chartSeriesParam };
    }
    const optionalParams = [
      'indexed',
      'yright',
      'yleft',
      'leftMin',
      'leftMax',
      'rightMin',
      'rightMax',
      'column',
      'area',
      'chartYoy',
      'chartYtd',
      'chartMom',
      'chartC5ma'
    ];
    optionalParams.forEach((p) => {
      if (!Object.keys(this.analyzerService.analyzerParams()).includes(p)) {
        delete this.queryParams[p];
      }
    });
    this.queryParams = { ...this.queryParams, ...param, ...this.analyzerService.analyzerParams() };
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
