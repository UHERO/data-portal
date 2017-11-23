import { Component, OnInit, OnChanges, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { ClipboardService } from '../clipboard.service';
import { AnalyzerService } from '../analyzer.service';

@Component({
  selector: 'app-share-link',
  templateUrl: './share-link.component.html',
  styleUrls: ['./share-link.component.scss']
})
export class ShareLinkComponent implements OnInit, OnChanges {
  @Input() startDate;
  @Input() endDate;
  // View -- 'analyzer' or 'series'
  @Input() view;

  // Series in the analyzer and series drawn in the analyzer chart
  @Input() analyzerSeries;
  @Input() chartSeries;

  // Tooltip options in the analyzer view
  @Input() name;
  @Input() units;
  @Input() geography;
  @Input() yoy;
  @Input() ytd;
  @Input() c5ma;

  // Series view params
  private id;
  private geo;
  private freq;
  private sa;

  private baseUrl;
  private shareLink;

  constructor(
    private route: ActivatedRoute,
    private _router: Router,
    private clipboard: ClipboardService,
    private _analyzer: AnalyzerService
  ) {
    this.baseUrl = environment['portalUrl'];
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.id = params['id'];
      this.geo = params['geo'] ? params['geo'] : null;
      this.freq = params['freq'] ? params['freq'] : null;
      this.sa = params['sa'] ? params['sa'] : null;
      this.shareLink = this.createSeriesShareLink();
    });
  }

  ngOnChanges() {
    this.shareLink = this.createSeriesShareLink();
  }

  createSeriesShareLink() {
    const start = this.startDate ? ';start=' + this.startDate : '';
    const end = this.endDate ? ';end=' + this.endDate : '';
    if (this.view === 'series') {
      let seriesUrl;
      const urlParams = this.getSeriesUrlParams(start, end, seriesUrl);
      return this.baseUrl + urlParams;
    }
    if (this.view === 'analyzer') {
      let seriesUrl = '/analyzer';
      const urlParams = this.getAnalyzerParams(start, end, seriesUrl);
      return this.baseUrl + urlParams;
    }
  }

  getAnalyzerParams(start, end, seriesUrl) {
    let aSeries = ';analyzerSeries=';
    let cSeries = ';chartSeries=';
    if (this.analyzerSeries.length) {
      this.analyzerSeries.forEach((series, index) => {
        aSeries += index === 0 ? series.id : '-' + series.id;
      });
      this.chartSeries.forEach((series, index) => {
        cSeries += index === 0 ? series.id : '-' + series.id;
      });
    }
    seriesUrl += start + end;
    seriesUrl += aSeries + cSeries;
    seriesUrl += this.name ? ';name=' + this.name : '';
    seriesUrl += this.units ? ';units=' + this.units : '';
    seriesUrl += this.geography ? ';geography=' + this.geography : '';
    seriesUrl += this.yoy ? ';yoy=' + this.yoy : '';
    seriesUrl += this.ytd ? ';ytd=' + this.ytd : '';
    seriesUrl += this.c5ma ? ';c5ma=' + this.c5ma : '';
    return seriesUrl;
  }

  getSeriesUrlParams(start, end, seriesUrl) {
    seriesUrl = '/series' + start + end;
    const urlParams = this.addQueryParams(seriesUrl);
    return urlParams;
  }

  addQueryParams(seriesUrl) {
    if (this.id) {
      seriesUrl += '?id=' + this.id;
    }
    if (this.sa) {
      seriesUrl += '&sa=' + this.sa;
    }
    if (this.geo) {
      seriesUrl += '&geo=' + this.geo;
    }
    if (this.freq) {
      seriesUrl += '&freq=' + this.freq;
    }
    return seriesUrl;
  }

  copyLink(linkUrl) {
    this.clipboard.copy(linkUrl);
  }
}
