import { Component, Input, Inject, OnChanges, OnDestroy } from '@angular/core';
import { AnalyzerService } from '../analyzer.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'lib-share-link',
  templateUrl: './share-link.component.html',
  styleUrls: ['./share-link.component.scss']
})
export class ShareLinkComponent implements OnChanges, OnDestroy {
  @Input() startDate;
  @Input() endDate;
  // View -- 'analyzer' or 'series'
  @Input() view;

  // Series in the analyzer and series drawn in the analyzer chart
  @Input() analyzerSeries;

  @Input() yoy: boolean;
  @Input() ytd: boolean;
  @Input() c5ma: boolean;
  @Input() index: boolean;
  @Input() yRightSeries: Array<any>;
  @Input() yLeftSeries: Array<any>;
  @Input() displayCompare: boolean;
  @Input() seasonallyAdjusted: boolean;
  @Input() seriesId: number;
  shareLink: string;
  embedCode: string;
  compareSeriesSub: Subscription;
  compareChartSeries;
  
  constructor(
    @Inject('environment') private environment,
    private analyzerService: AnalyzerService,
  ) {
    this.compareSeriesSub = this.analyzerService.analyzerSeriesCompare.subscribe((series) => {
      this.compareChartSeries = series.filter(s => s.visible);
      this.updateShareAndEmbed(this.view);
    });
  }

  ngOnChanges() {
    this.updateShareAndEmbed(this.view);
  }

  ngOnDestroy() {
    this.compareSeriesSub.unsubscribe();
  }

  updateShareAndEmbed(view: string) {
    this.embedCode = this.formatEmbedSnippet(this.startDate, this.endDate);
    this.shareLink = this.formatShareLink(this.startDate, this.endDate);
  }

  formatShareLink = (start: string, end: string) => {
    const params = {
      analyzer: `/analyzer${this.addAnalyzerParams(start, end)}`,
      series: `/sereis${this.addQueryParams(start, end)}`
    };
    return `${this.environment['portalUrl']}${params[this.view]}`;
  }

  addQueryParams(start, end) {
    let seriesUrl = '';
    seriesUrl += this.seriesId ? `?id=${this.seriesId}` : '';
    seriesUrl += this.seasonallyAdjusted ? `&sa=${this.seasonallyAdjusted}` : '';
    seriesUrl += start ? `&start=${start}` : '';
    seriesUrl += end ? `&end=${end}` : '';
    return seriesUrl;
  }

  formatEmbedSnippet = (start: string, end: string) => {
    const params = {
      analyzer: this.addAnalyzerParams(start, end),
      series: this.addSingleSeriesParams(start, end)
    };
    return `<div style="position:relative;width:100%;overflow:hidden;padding-top:56.25%;height:475px;"><iframe style="position:absolute;top:0;left:0;bottom:0;right:0;width:100%;height:100%;border:none;" src="${this.environment[`portalUrl`]}/graph${params[this.view]}" scrolling="no"></iframe></div>`;
  }

  addSingleSeriesParams = (start: string, end: string) => {
    let params = `?id=${this.seriesId}`;
    params += start ? `&start=${start}` : '';
    params += end ? `&end=${end}` : '';
    return params;
  }

  addAnalyzerParams(start: string, end: string) {
    let seriesUrl = '';
    let aSeries = '?analyzerSeries=';
    let cSeries = '&chartSeries=';
    if (this.analyzerSeries) {
      aSeries += this.analyzerSeries.map(s => s.id).join('-');
      cSeries += this.compareChartSeries.map(s => s.className).join('-');
    }
    seriesUrl += aSeries + cSeries;
    seriesUrl += `&start=${start}&end=${end}`;
    seriesUrl += this.index ? `&index=${this.index}` : '';
    seriesUrl += this.yoy ? `&yoy=${this.yoy}` : '';
    seriesUrl += this.ytd ? `&ytd=${this.ytd}` : '';
    seriesUrl += this.c5ma ? `&c5ma=${this.c5ma}` : '';
    seriesUrl += this.yRightSeries && this.yRightSeries.length ? `&yright=${this.yRightSeries.join('-')}` : '';
    seriesUrl += this.yLeftSeries && this.yLeftSeries.length ? `&yleft=${this.yLeftSeries.join('-')}` : '';
    seriesUrl += this.displayCompare && this.view === 'analyzer' ? `&compare=${this.displayCompare}` : '';
    return seriesUrl;
  }


  copyLink(inputValue) {
    $('.share-link').attr('title', 'Copied');
    inputValue.select();
    document.execCommand('copy');
    inputValue.setSelectionRange(0, 0);
    setTimeout(() => {
      // Reset share link title
      $('.share-link').attr('title', 'Copy');
    }, 3000);
  }
}
