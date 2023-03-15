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
export class EmbedGraphComponent implements OnInit, OnDestroy {
  private seriesId: number;
  private analyzerIds: Array<any>;
  startDate: string;
  endDate: string;
  seriesData: any;
  analyzerData: any;
  portalSettings: any;
  yLeftSeries: string;
  yRightSeries: string;
  leftMin: string;
  leftMax: string;
  rightMin: string;
  rightMax: string;
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
        this.analyzerService.storeUrlChartSeries(params[`chartSeries`]);
      }
      if (params[`start`]) {
        this.startDate = params[`start`];
      }
      if (params[`end`]) {
        this.endDate = params[`end`];
      }
      if (params[`yleft`]) {
        this.yLeftSeries = params['yleft'];
        this.analyzerService.analyzerData.yLeftSeries = params['yleft']?.split('-').map(id => +id) || [];
      }
      if (params[`yright`]) {
        this.yRightSeries = params['yright'];
        this.analyzerService.analyzerData.yRightSeries = params['yright']?.split('-').map(id => +id) || [];
      }
      if (params[`leftMin`]) {
        this.leftMin = params['leftMin'];
        this.analyzerService.analyzerData.leftMin = +params['leftMin'];
      }
      if (params[`leftMax`]) {
        this.leftMax = params['leftMax'];
        this.analyzerService.analyzerData.leftMax = +params['leftMax'];
      }
      if (params[`rightMin`]) {
        this.rightMin = params['rightMin'];
        this.analyzerService.analyzerData.rightMin = +params['rightMin'];
      }
      if (params[`rightMax`]) {
        this.rightMax = params['rightMax'];
        this.analyzerService.analyzerData.rightMax = +params['rightMax'];
      }
      if (params[`index`]) {
        this.indexSeries = params[`index`];
      }
    });
    if (this.seriesId) {
      this.seriesData = this.seriesHelper.getSeriesData(this.seriesId, true);
    }
    if (this.analyzerIds) {
      this.analyzerData = this.analyzerService.getAnalyzerData(this.analyzerIds, true);
    }
  }

  ngOnDestroy() {
    this.analyzerService.analyzerData = this.analyzerService.resetAnalyzerData();
  }
}
