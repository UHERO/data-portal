import { Inject, Component, OnInit, OnChanges, OnDestroy, AfterContentChecked, ChangeDetectorRef, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AnalyzerService } from 'projects/shared/services/analyzer.service';
import { DataPortalSettingsService } from 'projects/shared/services/data-portal-settings.service';
import { SeriesHelperService } from 'projects/shared/services/series-helper.service';
import { Frequency } from 'projects/shared/models/Frequency';
import { Geography } from 'projects/shared/models/Geography';
import { DateRange } from 'projects/shared/models/DateRange';
import { Subscription } from 'rxjs';
import { HelperService } from 'projects/shared/services/helper.service';
import { Location, NgFor, NgIf, AsyncPipe } from '@angular/common';
import { SingleSeriesTableComponent } from '../single-series-table/single-series-table.component';
import { SummaryStatisticsComponent } from '../summary-statistics/summary-statistics.component';
import { HighstockComponent } from '../highstock/highstock.component';
import { DateSliderComponent } from '../date-slider/date-slider.component';
import { FormsModule } from '@angular/forms';
import { ShareLinkComponent } from '../share-link/share-link.component';
import { ForecastSelectorComponent } from '../forecast-selector/forecast-selector.component';
import { FreqSelectorComponent } from '../freq-selector/freq-selector.component';
import { GeoSelectorComponent } from '../geo-selector/geo-selector.component';
import { DialogModule } from 'primeng/dialog';

@Component({
    selector: 'lib-single-series',
    templateUrl: './single-series.component.html',
    styleUrls: ['./single-series.component.scss'],
    standalone: true,
    imports: [
      NgFor,
      NgIf,
      DialogModule,
      GeoSelectorComponent,
      FreqSelectorComponent,
      ForecastSelectorComponent,
      ShareLinkComponent,
      FormsModule,
      DateSliderComponent,
      HighstockComponent,
      SummaryStatisticsComponent,
      SingleSeriesTableComponent,
      AsyncPipe
    ]
})
export class SingleSeriesComponent implements OnInit, OnChanges, OnDestroy, AfterContentChecked {
  @Input() id: string;
  @Input() sa: string;
  @Input() data_list_id: string;
  @Input() start: string;
  @Input() end: string;
  @Input() nocache: string;

  noSelection: string;
  newTableData;
  tableHeaders;
  summaryStats;
  seasonallyAdjusted = true;
  chartStart;
  chartEnd;
  portalSettings;
  seriesId: number;
  seriesShareLink: string;
  freqSub: Subscription;
  geoSub: Subscription;
  fcSub: Subscription;
  dateRangeSubscription: Subscription;
  selectedDateRange: DateRange;
  selectedGeo: Geography;
  selectedForecast;
  selectedFreq: Frequency;
  displayFcSelector: boolean;
  displayHelp: boolean = false;
  routeStart: string;
  routeEnd: string;
  public seriesData;
  queryParams: any = {};
  previousFreq: string = '';

  constructor(
    @Inject('environment') private environment,
    @Inject('portal') public portal,
    private dataPortalSettings: DataPortalSettingsService,
    private seriesHelper: SeriesHelperService,
    private helperService: HelperService,
    private analyzerService: AnalyzerService,
    private route: ActivatedRoute,
    private router: Router,
    private cdRef: ChangeDetectorRef,
    private location: Location
  ) {
    this.freqSub = helperService.currentFreq.subscribe((freq) => {
      this.selectedFreq = freq;
    });
    this.geoSub = helperService.currentGeo.subscribe((geo) => {
      this.selectedGeo = geo;
    });
    this.fcSub = helperService.currentFc.subscribe((forecast) => {
      this.selectedForecast = forecast;
    });
    
  }

  ngOnChanges() {
    let categoryId;
    let noCache;
    this.routeStart = this.start;
    this.routeEnd = this.end;
    this.seriesId = Number(this.id);
    if (this.sa !== undefined) {
      this.seasonallyAdjusted = this.sa === 'true';
    }
    if (this.data_list_id) {
      categoryId = Number(this.data_list_id);
    }
    if (this.nocache) {
      noCache = this.nocache;
    }
    this.seriesData = this.seriesHelper.getSeriesData(this.seriesId, noCache, categoryId);
  }

  ngOnInit() {
    this.portalSettings = this.dataPortalSettings.dataPortalSettings[this.portal.universe];
    this.displayFcSelector = this.portalSettings.selectors.includes('forecast');
    this.dateRangeSubscription = this.helperService.currentDateRange.subscribe((dateRange) => {
      this.selectedDateRange = dateRange;
    });
  }

  ngAfterContentChecked() {
    this.cdRef.detectChanges();
  }

  ngOnDestroy() {
    this.freqSub.unsubscribe();
    this.geoSub.unsubscribe();
    this.fcSub.unsubscribe();
    this.dateRangeSubscription.unsubscribe();
  }

  updateSelectedForecast(siblings: Array<any>, geo: string, sa: boolean, forecasts: Array<any>, newFc: string) {
    this.helperService.updateCurrentForecast(newFc);
    const selectedFc = forecasts.find(f => f.forecast === newFc);
    const { freq, label } = selectedFc;
    this.helperService.updateCurrentFrequency({ freq, label });
    this.goToSeries(siblings, freq, geo, sa, selectedFc);
  }

  // Redraw chart when selecting a new region or frequency
  goToSeries = (siblings: Array<any>, freq: string, geo: string, sa: boolean, forecast = null) => {
    this.previousFreq = freq === this.selectedFreq.freq ? '' : this.selectedFreq.freq;
    this.seasonallyAdjusted = sa;
    this.noSelection = null;
    // Get array of siblings for selected geo and freq
    const geoFreqSib = siblings.length ? this.seriesHelper.findGeoFreqSibling(siblings, geo, freq, forecast) : [];
    const id = geoFreqSib.length ? this.seriesHelper.selectSibling(geoFreqSib, sa, freq) : null;
    if (id) {
      const queryParams = {
        id,
        sa: this.seasonallyAdjusted,
        ...(forecast?.forecast && { fc: forecast.forecast }),
        geo,
        freq,
        start: this.start ? this.start : null,
        end: this.end ? this.end : null
      };
      this.router.navigate(['/series/'], { queryParams, queryParamsHandling: 'merge' });
    } else {
      this.noSelection = 'Selection Not Available';
    }
  }

  showHelp() {
    this.displayHelp = true;
  }

  addToAnalyzer(series) {
    series.analyze = true;
    this.analyzerService.addToAnalyzer(series.id);
  }

  removeFromAnalyzer(series) {
    series.analyze = false;
    this.analyzerService.removeFromAnalyzer(series.id, this.selectedDateRange.startDate);
  }

  changeRange(dateRange: DateRange) {
    const {
      startDate,
      endDate,
      useDefaultRange,
      endOfSample
    } = dateRange;
    this.queryParams.start = useDefaultRange ? null : startDate;
    this.queryParams.end = endOfSample ? null : endDate;

    this.routeStart = this.queryParams.start;
    this.routeEnd = this.queryParams.end;
    const url = this.router.createUrlTree([], {
      relativeTo: this.route,
      queryParams: this.queryParams,
      queryParamsHandling: 'merge'
    }).toString();
    this.location.go(url);
  }
}
