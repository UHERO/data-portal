import {
  Component,
  OnChanges,
  Inject,
  Input,
  OnDestroy,
  SimpleChanges,
  computed,
} from "@angular/core";
import { Location } from "@angular/common";
import { AnalyzerService, FormattedAnalyzerSeries } from "projects/shared/services/analyzer.service";
import { DateRange } from "projects/shared/models/DateRange";
import { ActivatedRoute, Router } from "@angular/router";
import { DataPortalSettingsService } from "projects/shared/services/data-portal-settings.service";
import { forkJoin, Subscription } from "rxjs";
import { ApiService } from "projects/shared/services/api.service";
import { HelperService } from "projects/shared/services/helper.service";
import { AnalyzerTableComponent, TransformToggleEvent } from "../analyzer-table/analyzer-table.component";
import { AnalyzerHighstockComponent } from "../analyzer-highstock/analyzer-highstock.component";
import { CategoryChartsComponent } from "../category-charts/category-charts.component";
import { DateSliderComponent } from "../date-slider/date-slider.component";
import { FreqSelectorComponent } from "../freq-selector/freq-selector.component";
import { GeoSelectorComponent } from "../geo-selector/geo-selector.component";
import { ShareLinkComponent } from "../share-link/share-link.component";
import { MatDialog } from '@angular/material/dialog';
import { AnalyzerHelpDialogComponent } from '../analyzer-help-dialog/analyzer-help-dialog.component';
import { Portal, PortalSettings } from "projects/shared/models/DataPortalSettings";

@Component({
  selector: "lib-analyzer",
  templateUrl: "./analyzer.component.html",
  styleUrls: ["./analyzer.component.scss"],
  imports: [
    ShareLinkComponent,
    FreqSelectorComponent,
    GeoSelectorComponent,
    DateSliderComponent,
    CategoryChartsComponent,
    AnalyzerHighstockComponent,
    AnalyzerTableComponent
  ]
})
export class AnalyzerComponent
  implements OnChanges, OnDestroy {
  @Input() analyzerSeries?: string;
  @Input() chartSeries?: string;
  @Input() start?: string;
  @Input() end?: string;
  @Input() index?: string;
  @Input() leftMin?: string;
  @Input() leftMax?: string;
  @Input() rightMin?: string;
  @Input() rightMax?: string;
  @Input() compare?: string;
  @Input() yoy?: string;
  @Input() ytd?: string;
  @Input() c5ma?: string;
  @Input() mom?: string;
  @Input() yright?: string;
  @Input() yleft?: string;
  @Input() column?: string;
  @Input() area?: string;
  @Input() chartYoy?: string;
  @Input() chartYtd?: string;
  @Input() chartMom?: string;
  @Input() chartC5ma?: string;
  @Input() nocache?: string;

  portalSettings: PortalSettings;
  tableYoy: boolean;
  tableYtd: boolean;
  tableC5ma: boolean;
  tableMom: boolean;
  private noCache?: boolean;
  analyzerShareLink: string;
  seriesInAnalyzer;
  routeView: string;
  queryParams: any = {};
  displayCompare: boolean = false;
  // urlParams;
  displaySelectionNA: boolean = false;
  routeStart: string | undefined;
  routeEnd: string | undefined;
  dateRangeSubscription: Subscription;
  selectedDateRange: DateRange;
  previousFreq: string = "";
  previousGeo: string = "";
  
  constructor(
    @Inject("environment") private environment,
    @Inject("portal") private portal: Portal,
    public analyzerService: AnalyzerService,
    private dataPortalSettingsServ: DataPortalSettingsService,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private router: Router,
    private location: Location,
    private helperService: HelperService,
    private dialog: MatDialog
  ) {
    this.dateRangeSubscription = this.helperService.currentDateRange.subscribe(
      (dateRange) => {
        this.selectedDateRange = dateRange;
        if (this.analyzerService.indexed()) {
          this.analyzerService.updateBaseYear(this.selectedDateRange.startDate);
        }
      }
    );
  }

  analyzerData = computed(() => this.analyzerService.analyzerData());

  ngOnChanges(simpleChanges: SimpleChanges) {
    this.routeStart = this.start;
    this.routeEnd = this.end;

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
    const yright = this.yright;
    if (yright) {
      this.analyzerService.yRightSeries.set(this.mapIds(yright));
    }

    const yleft = this.yleft;
    if (yleft) {
      this.analyzerService.yLeftSeries.set(this.mapIds(yleft));
    }

    const column = this.column;
    if (column) {
      this.analyzerService.column.set(this.mapIds(column));
    }

    const area = this.area;
    if (area) {
      this.analyzerService.area.set(this.mapIds(area));
    }

    const chartYoy = this.chartYoy;
    if (chartYoy) {
      this.analyzerService.chartYoy.set(this.mapIds(chartYoy));
    }

    const chartYtd = this.chartYtd;
    if (chartYtd) {
      this.analyzerService.chartYtd.set(this.mapIds(chartYtd));
    }

    const chartMom = this.chartMom;
    if (chartMom) {
      this.analyzerService.chartMom.set(this.mapIds(chartMom));
    }

    const chartC5ma = this.chartC5ma;
    if (chartC5ma) {
      this.analyzerService.chartC5ma.set(this.mapIds(chartC5ma));
    }
    const leftMin = this.leftMin;
    if (leftMin && !isNaN(+leftMin)) {
      this.analyzerService.leftMin.set(+leftMin);
    }

    const leftMax = this.leftMax;
    if (leftMax && !isNaN(+leftMax)) {
      this.analyzerService.leftMax.set(+leftMax);
    }

    const rightMin = this.rightMin;
    if (rightMin && !isNaN(+rightMin)) {
      this.analyzerService.rightMin.set(+rightMin);
    }

    const rightMax = this.rightMax;
    if (rightMax && !isNaN(+rightMax)) {
      this.analyzerService.rightMax.set(+rightMax);
    }
    this.noCache = this.evalParamAsTrue(this.nocache);
    this.seriesInAnalyzer = this.analyzerService.analyzerSeriesStore();

    this.updateAnalyzer(this.seriesInAnalyzer);
    this.portalSettings =
      this.dataPortalSettingsServ.dataPortalSettings[this.portal.universe];
  }

  mapIds = (paramString: string): number[] => paramString.split('-').map(Number);

  evalParamAsTrue = (param: string | undefined) => param === "true";

  updateAnalyzer(analyzerSeries: Array<any>) {
    if (analyzerSeries.length && this.selectedDateRange) {
      this.analyzerService.getAnalyzerData(
        analyzerSeries,
        this.selectedDateRange.startDate,
        this.noCache as boolean
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

  indexActive(e: Event): void {
    const checked = (e.target as HTMLInputElement).checked;
    this.analyzerService.toggleIndexValues(
      checked,
      this.selectedDateRange.startDate
    )
    this.analyzerService.indexed.set(checked);
    this.updateUrlLocation({ index: this.analyzerService.indexed() || null });
  }

  checkTransforms(e: TransformToggleEvent): void {
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
    const param: Record<string, boolean | null> = {};
    param[e.label] = e.value || null;
    this.updateUrlLocation(param);
  }

  changeAnalyzerGeography(geo, previousGeo: string, analyzerSeries: FormattedAnalyzerSeries[], freq: string) {
    this.previousGeo = previousGeo === geo ? "" : previousGeo;
    this.analyzerService.urlChartSeries.update(series => series = []);
    const siblingsList = analyzerSeries.map((serie) => {
      return this.apiService.fetchSiblingSeriesByIdAndGeo(
        serie.id,
        geo.handle,
        serie.seasonalAdjustment
      );
    });
    this.switchToSiblingSeries(siblingsList, analyzerSeries, freq)
  }

  changeAnalyzerFrequency(freq: string, previousFreq: string, analyzerSeries: FormattedAnalyzerSeries[]) {
    this.previousFreq = previousFreq === freq ? "" : previousFreq;
    this.analyzerService.urlChartSeries.update(series => series = []);
    const siblingsList = analyzerSeries.map((serie) => {
      return this.apiService.fetchSiblingSeriesByIdAndGeo(
        serie.id,
        serie.currentGeo.handle,
        serie.seasonalAdjustment,
        freq
      );
    });
    this.switchToSiblingSeries(siblingsList, analyzerSeries, freq);
  }

  switchToSiblingSeries(siblingsList, analyzerSeries, freq) {
    const siblingIds: Record<string, any> = [];
    forkJoin(siblingsList).subscribe((res: any) => {
      res.forEach((siblings) => {
        siblings.forEach((sib) => {
          if (
            !siblingIds.some((s) => s.id === sib.id) &&
            sib.frequencyShort === freq
          ) {
            const drawInCompare =
              analyzerSeries.find((s) => s.title === sib.title)?.visible ===
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
    this.dialog.open(AnalyzerHelpDialogComponent, {
      width: '70vw',
      hasBackdrop: true,
    });
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
    this.updateUrlLocation({ compare: `${this.displayCompare}` || null });
  }

  changeRange(e) {
    this.routeStart = e.startDate;
    this.routeEnd = e.endDate;
    if (this.analyzerService.indexed()) {
      this.analyzerService.updateBaseYear(e.startDate);
    }
    this.updateUrlLocation({ start: e.startDate, end: e.endDate });
  }

  updateUrlLocation(param: Record<string, any>) {
    const paramIncludesAnalyzerSeries = Object.keys(param).includes('analyzerSeries');
    const paramIncludesChartSeries = Object.keys(param).includes('chartSeries');
    const { analyzerSeries } = this.analyzerService.analyzerData();
    if (!paramIncludesAnalyzerSeries) {
      const analyzerSeriesParam = analyzerSeries.map((s) => s.id).join("-");
      this.queryParams = { ...this.queryParams, analyzerSeries: analyzerSeriesParam };
    }
    if (!paramIncludesChartSeries) {
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
