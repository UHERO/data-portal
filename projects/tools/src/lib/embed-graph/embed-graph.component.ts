import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataPortalSettingsService } from '../data-portal-settings.service';
import { SeriesHelperService } from '../series-helper.service';
import { AnalyzerService } from '../analyzer.service';

@Component({
  selector: 'lib-embed-graph',
  templateUrl: './embed-graph.component.html',
  styleUrls: ['./embed-graph.component.scss']
})
export class EmbedGraphComponent implements OnInit {
  private seriesId: number;
<<<<<<< HEAD
  private chartSeries: Array<any>;
=======
  private analyzerIds: Array<any>;
>>>>>>> f86a666cb72b69e88d0d6717c11eb4e0852a4175
  startDate: string;
  endDate: string;
  seriesData: any;
  analyzerData: any;
  portalSettings: any;
<<<<<<< HEAD
  y0: string;
  y1: string;
=======
  yLeftSeries: string;
  yRightSeries: string;
>>>>>>> f86a666cb72b69e88d0d6717c11eb4e0852a4175
  indexSeries: boolean;
  
  constructor(
    @Inject('portal') public portal,
    private analyzerService: AnalyzerService,
    private route: ActivatedRoute,
    private seriesHelper: SeriesHelperService,
    private dataPortalSettings: DataPortalSettingsService
  ) { }

  ngOnInit(): void {
    this.portalSettings = this.dataPortalSettings.dataPortalSettings[this.portal.universe];
    this.route.queryParams.subscribe(params => {
      if (params[`id`]) {
        this.seriesId = Number(params[`id`]);
      }
      if (params[`analyzerSeries`]) {
        this.analyzerIds = params[`analyzerSeries`].split('-').map(series => ({ id: +series }));
      }
      if (params[`chartSeries`]) {
<<<<<<< HEAD
        this.chartSeries = params[`chartSeries`].split('-').map(series => ({ id: +series, compare: true }));
=======
        this.analyzerService.storeUrlChartSeries(params[`chartSeries`]);
>>>>>>> f86a666cb72b69e88d0d6717c11eb4e0852a4175
      }
      if (params[`start`]) {
        this.startDate = params[`start`];
      }
      if (params[`end`]) {
        this.endDate = params[`end`];
      }
      if (params[`yleft`]) {
        this.yLeftSeries = params['yleft'];
        this.analyzerService.analyzerData.yLeftSeries = params['yleft']?.split('-').map(id => +id) || []
      }
      if (params[`yright`]) {
<<<<<<< HEAD
        this.y1 = params[`yright`];
=======
        this.yRightSeries = params['yright'];
        this.analyzerService.analyzerData.yRightSeries = params['yright']?.split('-').map(id => +id) || []
>>>>>>> f86a666cb72b69e88d0d6717c11eb4e0852a4175
      }
      if (params[`index`]) {
        this.indexSeries = params[`index`];
      }
    });
    if (this.seriesId) {
      this.seriesData = this.seriesHelper.getSeriesData(this.seriesId, true);
    }
<<<<<<< HEAD
    if (this.chartSeries) {
      this.analyzerData = this.analyzerService.getAnalyzerData(this.chartSeries, true, this.y1);
=======
    if (this.analyzerIds) {
      this.analyzerData = this.analyzerService.getAnalyzerData(this.analyzerIds, true);
>>>>>>> f86a666cb72b69e88d0d6717c11eb4e0852a4175
    }
  }

  ngOnDestroy() {
<<<<<<< HEAD
    this.analyzerService.analyzerData = {
      analyzerTableDates: [],
      sliderDates: [],
      analyzerDateWrapper: { firstDate: '', endDate: '' },
      analyzerSeries: [],
      displayFreqSelector: false,
      siblingFreqs: [],
      analyzerFrequency: {},
      y0Series: null,
      yRightSeries: [],
      yLeftSeries: [],
      requestComplete: false,
      indexed: false,
      baseYear: null,
      minDate: null,
      maxDate: null
    };
=======
    this.analyzerService.analyzerData = this.analyzerService.resetAnalyzerData();
>>>>>>> f86a666cb72b69e88d0d6717c11eb4e0852a4175
  }
}
