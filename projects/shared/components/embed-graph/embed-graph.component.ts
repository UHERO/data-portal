import { Component, OnInit, Inject, OnDestroy, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataPortalSettingsService } from 'projects/shared/services/data-portal-settings.service';
import { SeriesHelperService } from 'projects/shared/services/series-helper.service';
import { AnalyzerService } from 'projects/shared/services/analyzer.service';
import { AnalyzerHighstockComponent } from '../analyzer-highstock/analyzer-highstock.component';
import { HighstockComponent } from '../highstock/highstock.component';
import { DateSliderComponent } from '../date-slider/date-slider.component';
import { NgFor, NgIf, AsyncPipe } from '@angular/common';

@Component({
    selector: 'lib-embed-graph',
    templateUrl: './embed-graph.component.html',
    styleUrls: ['./embed-graph.component.scss'],
    standalone: true,
    imports: [NgFor, NgIf, DateSliderComponent, HighstockComponent, AnalyzerHighstockComponent, AsyncPipe]
})
export class EmbedGraphComponent /* implements OnInit, OnDestroy */{
  private seriesId: number;
  private analyzerIds: Array<any>;
  startDate: string;
  endDate: string;
  seriesData: any;
  //analyzerData: any;
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
    public analyzerService: AnalyzerService,
    private route: ActivatedRoute,
    private seriesHelper: SeriesHelperService,
    private dataPortalSettings: DataPortalSettingsService
  ) { }

  analyzerData = computed(() => this.analyzerService.analyzerData());

  ngOnInit(): void {
    this.portalSettings = this.dataPortalSettings.dataPortalSettings[this.portal.universe];
    this.route.queryParams.subscribe(params => {
      if (params[`id`]) {
        this.seriesId = Number(params[`id`]);
      }
      if (params[`analyzerSeries`]) {
        this.analyzerIds = params[`analyzerSeries`].split('-').map(series => (+series ));
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
        //this.analyzerService.analyzerData.yLeftSeries = params['yleft']?.split('-').map(id => +id) || [];
        this.analyzerService.yLeftSeries.update(yleft => yleft =  params['yleft']?.split('-').map(id => +id));
      }
      if (params[`yright`]) {
        this.yRightSeries = params['yright'];
        //this.analyzerService.analyzerData.yRightSeries = params['yright']?.split('-').map(id => +id) || [];
        this.analyzerService.yRightSeries.update(yright => yright =  params['yright']?.split('-').map(id => +id));
      }
      if (params[`leftMin`]) {
        this.leftMin = params['leftMin'];
        // this.analyzerService.analyzerData.leftMin = +params['leftMin'];
        this.analyzerService.leftMin.set(+params['leftMin']);
      }
      if (params[`leftMax`]) {
        this.leftMax = params['leftMax'];
        //this.analyzerService.analyzerData.leftMax = +params['leftMax'];
        this.analyzerService.leftMax.set(+params['leftMax']);
      }
      if (params[`rightMin`]) {
        this.rightMin = params['rightMin'];
        //this.analyzerService.analyzerData.rightMin = +params['rightMin'];
        this.analyzerService.rightMin.set(+params['rightMin']);
      }
      if (params[`rightMax`]) {
        this.rightMax = params['rightMax'];
        // this.analyzerService.analyzerData.rightMax = +params['rightMax'];
        this.analyzerService.rightMax.set(+params['rightMax']);
      }
      if (params[`index`]) {
        this.indexSeries = params[`index`];
      }
    });
    if (this.seriesId) {
      this.seriesData = this.seriesHelper.getSeriesData(this.seriesId, true);
    }
    if (this.analyzerIds) {
      //this.analyzerData = this.analyzerService.getAnalyzerData(this.analyzerIds, this.startDate, true);
      this.analyzerService.getAnalyzerData(this.analyzerIds, this.startDate, true);
    }
  }

  ngOnDestroy() {
    //this.analyzerService.analyzerData = this.analyzerService.resetAnalyzerData();

  }
}
