import { Component, Input, Inject, OnChanges, SimpleChanges } from '@angular/core';
import { AnalyzerService } from 'projects/shared/services/analyzer.service';

@Component({
    selector: 'lib-share-link',
    templateUrl: './share-link.component.html',
    styleUrls: ['./share-link.component.scss'],
    standalone: true
})
export class ShareLinkComponent implements OnChanges {
  // View -- 'analyzer' or 'series'
  @Input() view;
  @Input() startDate;
  @Input() endDate;
  @Input() routeStart;
  @Input() routeEnd;
  @Input() analyzerParams: string;
  @Input() yoy: boolean;
  @Input() ytd: boolean;
  @Input() c5ma: boolean;
  @Input() displayCompare: boolean;
  @Input() seriesId: number;
  @Input() seasonallyAdjusted: boolean;
  shareLink: string;
  embedCode: string;
  
  constructor(
    @Inject('environment') private environment,
    public analyzerService: AnalyzerService,
  ) { }

  ngOnChanges() {
    this.updateShareAndEmbed(this.view);
  }

  updateShareAndEmbed(view: string) {
    this.embedCode = this.formatEmbedSnippet(this.routeStart, this.routeEnd);
    this.shareLink = this.formatShareLink(this.routeStart, this.routeEnd);
  }

  formatShareLink = (start: string, end: string) => {
    const params = {
      analyzer: this.view === 'analyzer' ? `/analyzer${this.addAnalyzerParams(start, end)}` : '',
      series: `/series${this.addQueryParams(start, end)}`
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

  addAnalyzerParams(start, end) {
    let shareUrl = Object.keys(this.analyzerParams).reduce((prev, current, index) => {
      const lastKey = Object.keys(this.analyzerParams).length - 1 === index;
      if (lastKey) {
        prev += `${current}=${this.analyzerParams[current]}`;
      }
      if (!lastKey) {
        prev += `${current}=${this.analyzerParams[current]}&`;
      }
      return prev;
    }, '?');
    shareUrl += start ? `&start=${start}` : '';
    shareUrl += end ? `&end=${end}` : '';
    shareUrl += this.yoy ? `&yoy=${this.yoy}` : '';
    shareUrl += this.ytd ? `&ytd=${this.ytd}` : '';
    shareUrl += this.c5ma ? `&c5ma=${this.c5ma}` : '';
    shareUrl += this.displayCompare && this.view === 'analyzer' ? `&compare=${this.displayCompare}` : '';
    return shareUrl;
  }

  formatEmbedSnippet = (start: string, end: string) => {
    const params = {
      analyzer: this.view === 'analyzer' ? this.addAnalyzerParams(start, end) : '',
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

  copyLink(inputValue, shareText) {
    document.querySelector<HTMLElement>('.share-link').setAttribute('title', 'Copied');
    inputValue.select();
    if (!navigator.clipboard) {
      // execCommand is deprecated
      // leave in as fallback if user's browser does not allow navigator.clipboard
      inputValue.select();
      document.execCommand('copy');
      inputValue.setSelectionRange(0, 0);
    } else {
      navigator.clipboard.writeText(shareText);
    }
    setTimeout(() => {
      // Reset share link title
      document.querySelector<HTMLElement>('.share-link').setAttribute('title', 'Copy');
    }, 3000);
  }
}
