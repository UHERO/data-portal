import { Component, OnInit, OnChanges, Input, Inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ClipboardService } from '../clipboard.service';

@Component({
  selector: 'lib-share-link',
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
  private seriesCat;
  private sa;

  private baseUrl;
  shareLink;

  constructor(
    @Inject('environment') private environment,
    private route: ActivatedRoute,
    private clipboard: ClipboardService,
  ) { }

  ngOnInit() {
    if (this.route) {
      this.route.queryParams.subscribe(params => {
        this.id = params[`id`];
        this.geo = params[`geo`] ? params[`geo`] : null;
        this.freq = params[`freq`] ? params[`freq`] : null;
        this.sa = params[`sa`] ? params[`sa`] : null;
        this.seriesCat = params[`seriesCat`] ? params[`seriesCat`] : null;
        this.shareLink = this.createSeriesShareLink();
      });
    }
  }

  ngOnChanges() {
    this.shareLink = this.createSeriesShareLink();
  }

  createSeriesShareLink() {
    const start = this.startDate ? this.startDate : '';
    const end = this.endDate ? this.endDate : '';
    if (this.view === 'series') {
      const seriesUrl = '/series';
      const urlParams = this.getSeriesUrlParams(start, end, seriesUrl);
      return this.environment[`portalUrl`] + urlParams;
    }
    if (this.view === 'analyzer') {
      const seriesUrl = '/analyzer';
      const urlParams = this.getAnalyzerParams(start, end, seriesUrl);
      return this.environment[`portalUrl`] + urlParams;
    }
  }

  getAnalyzerParams(start, end, seriesUrl) {
    let aSeries = '?analyzerSeries=';
    let cSeries = '&chartSeries=';
    if (this.analyzerSeries.length) {
      const chartSeries = this.analyzerSeries.filter(s => s.showInChart);
      this.analyzerSeries.forEach((series, index) => {
        aSeries += index === 0 ? series.seriesDetail.id : '-' + series.seriesDetail.id;
      });
      chartSeries.forEach((series, index) => {
        cSeries += index === 0 ? series.seriesDetail.id : '-' + series.seriesDetail.id;
      });
    }
    seriesUrl += aSeries + cSeries;
    seriesUrl += '&start=' + start + '&end=' + end;
    seriesUrl += this.name ? '&name=' + this.name : '';
    seriesUrl += this.units ? '&units=' + this.units : '';
    seriesUrl += this.geography ? '&geography=' + this.geography : '';
    seriesUrl += this.yoy ? '&yoy=' + this.yoy : '';
    seriesUrl += this.ytd ? '&ytd=' + this.ytd : '';
    seriesUrl += this.c5ma ? '&c5ma=' + this.c5ma : '';
    return seriesUrl;
  }

  getSeriesUrlParams(start, end, seriesUrl) {
    const urlParams = this.addQueryParams(seriesUrl, start, end);
    return urlParams;
  }

  addQueryParams(seriesUrl, start, end) {
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
    if (this.seriesCat)  {
      seriesUrl += '&seriesCat=' + this.seriesCat;
    }
    if (start) {
      seriesUrl += '&start=' + start;
    }
    if (end) {
      seriesUrl += '&end=' + end;
    }
    return seriesUrl;
  }

  copyLink(linkUrl) {
    $('.share-link').attr('title', 'Link Copied');
    this.clipboard.copy(linkUrl);
    setTimeout(() => {
      // Reset share link title
      $('.share-link').attr('title', 'Copy Link');
    }, 3000);
  }
}
