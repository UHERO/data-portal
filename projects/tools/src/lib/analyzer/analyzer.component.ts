import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { AnalyzerService } from '../analyzer.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DataPortalSettingsService } from '../data-portal-settings.service';
import { forkJoin, Subscription } from 'rxjs';
import { ApiService } from '../api.service';

@Component({
  selector: 'lib-analyzer',
  templateUrl: './analyzer.component.html',
  styleUrls: ['./analyzer.component.scss']
})
export class AnalyzerComponent implements OnInit, OnDestroy {
  minDate;
  maxDate;
  portalSettings;
  tableYoy;
  tableYtd;
  tableC5ma;
  startDate;
  endDate;
  private noCache: boolean;
  tooltipName;
  tooltipUnits;
  tooltipGeo;
  analyzerData;
  y0;
  y1;
  y0Series;
  y1Series;
  analyzerShareLink: string;
  embedCode: string;
  indexSeries: boolean;
  analyzerSeriesSub: Subscription;
  analyzerSeries;
  routeView: string;
  queryParams: any = {};
  displayCompare: boolean = false;


  constructor(
    @Inject('environment') private environment,
    @Inject('portal') private portal,
    private analyzerService: AnalyzerService,
    private dataPortalSettingsServ: DataPortalSettingsService,
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
  ) {
    this.analyzerSeriesSub = analyzerService.analyzerSeries.subscribe((analyzerSeries) => {
      this.analyzerSeries = analyzerSeries;
      if (analyzerSeries.length) {
        this.updateAnalyzer(analyzerSeries);
      }
    });
  }

  ngOnInit() {
    if (this.route) {
      this.route.queryParams.subscribe(params => {
        if (params[`analyzerSeries`]) {
          this.storeUrlSeries(params);
        }
        if (params[`chartSeries`]) {
          this.storeUrlChartSeries(params);
        }
        if (params[`start`]) {
          this.analyzerService.analyzerData.minDate = params[`start`];
        }
        if (params[`end`]) {
          this.analyzerService.analyzerData.maxDate = params[`end`];
        }
        if (params[`index`]) {
          this.indexSeries = params[`index`];
        }
        if (params[`name`]) {
          this.tooltipName = (params[`name`] === 'true');
        }
        if (params[`units`]) {
          this.tooltipUnits = (params[`units`] === 'true');
        }
        if (params[`geography`]) {
          this.tooltipGeo = (params[`geography`] === 'true');
        }
        if (params[`yoy`]) {
          this.tableYoy = (params[`yoy`] === 'true');
        }
        if (params[`ytd`]) {
          this.tableYtd = (params[`ytd`] === 'true');
        }
        if (params[`c5ma`]) {
          this.tableC5ma = (params[`c5ma`] === 'true');
        }
        if (params[`y0`]) {
          this.y0Series = params[`y0`];
        }
        if (params[`y1`]) {
          this.y1Series = params[`y1`];
        }
        if (params[`nocache`]) {
          this.noCache = params[`nocache`] === 'true';
        }
      });
    }
    if (this.analyzerSeries.length) {
      this.updateAnalyzer(this.analyzerSeries)
    }
    this.portalSettings = this.dataPortalSettingsServ.dataPortalSettings[this.portal.universe];
  }

  updateAnalyzer = (analyzerSeries) => {
    console.log('y1', this.y1Series)
    this.analyzerData = this.analyzerService.getAnalyzerData(analyzerSeries, this.noCache, this.y0Series, this.y1Series);
    this.analyzerShareLink = this.formatShareLink(this.minDate, this.maxDate);
    this.embedCode = this.formatEmbedSnippet(this.minDate, this.maxDate);
  }

  ngOnDestroy() {
    this.analyzerSeriesSub.unsubscribe();
  }

  storeUrlSeries(params) {
    const urlASeries = params[`analyzerSeries`].split('-').map((id) => { return { id: +id } });
    this.analyzerService.updateAnalyzerSeries(urlASeries);
  }

  storeUrlChartSeries(params) {
    const urlCSeries = params[`chartSeries`].split('-').map(Number);
    urlCSeries.forEach((cSeries) => {
      const aSeries = this.analyzerSeries.find(analyzer => analyzer.id === cSeries);
      aSeries.showInChart = true;
    });
  }

  // Update table when selecting new ranges in the chart
  setTableDates(e) {
    this.minDate = e.minDate;
    this.maxDate = e.maxDate;
    this.analyzerService.analyzerData.minDate = e.minDate;
    this.analyzerService.analyzerData.maxDate = e.maxDate;
    this.analyzerShareLink = this.formatShareLink(this.minDate, this.maxDate);
    this.embedCode = this.formatEmbedSnippet(this.minDate, this.maxDate);
  }

  /* setYAxesSeries(e) {
    this.y0 = e.y0.map(s => s.toString()).join('-');
    this.y1 = e.y1.map(s => s.toString()).join('-');
    this.analyzerShareLink = this.formatShareLink(this.minDate, this.maxDate);
    this.embedCode = this.formatEmbedSnippet(this.minDate, this.maxDate);
  } */

  checkTooltip(e) {
    if (e.label === 'name') {
      this.tooltipName = e.value;
    }
    if (e.label === 'units') {
      this.tooltipUnits = e.value;
    }
    if (e.label === 'geo') {
      this.tooltipGeo = e.value;
    }
    this.analyzerShareLink = this.formatShareLink(this.minDate, this.maxDate);
    this.embedCode = this.formatEmbedSnippet(this.minDate, this.maxDate);
  }

  indexActive(e) {
    this.indexSeries = e.target.checked;
    if (this.indexSeries) {
      this.y0 = null;
      this.y1 = null;
    }
    this.analyzerService.toggleIndexValues(e.target.checked, this.analyzerService.analyzerData.minDate)
    this.analyzerShareLink = this.formatShareLink(this.minDate, this.maxDate);
    this.embedCode = this.formatEmbedSnippet(this.minDate, this.maxDate);
  }

  checkTransforms(e) {
    if (e.label === 'yoy') {
      this.tableYoy = e.value;
    }
    if (e.label === 'ytd') {
      this.tableYtd = e.value;
    }
    if (e.label === 'c5ma') {
      this.tableC5ma = e.value;
    }
    this.analyzerShareLink = this.formatShareLink(this.minDate, this.maxDate);
    this.embedCode = this.formatEmbedSnippet(this.minDate, this.maxDate);
  }

  formatShareLink = (start: string, end: string) => this.environment[`portalUrl`] + this.getAnalyzerParams(start, end, '/analyzer');

  getAnalyzerParams(start, end, seriesUrl) {
    let aSeries = '?analyzerSeries=';
    let cSeries = '&chartSeries=';
    if (this.analyzerSeries) {
      const chartSeries = this.analyzerService.analyzerData.analyzerSeries.filter(s => s.compare);
      this.analyzerSeries.forEach((series, index) => {
        aSeries += index === 0 ? series.id : `-${series.id}`;
      });
      chartSeries.forEach((series, index) => {
        cSeries += index === 0 ? series.id : `-${series.id}`;
      });
    }
    seriesUrl += aSeries + cSeries;
    seriesUrl += `&start=${start}&end=${end}`;
    seriesUrl += this.indexSeries ? `&index=${this.indexSeries}` : '';
    seriesUrl += this.tooltipName ? `&name=${this.tooltipName}` : '';
    seriesUrl += this.tooltipUnits ? `&units${this.tooltipUnits}` : '';
    seriesUrl += this.tooltipGeo ? `&geography=${this.tooltipGeo}` : '';
    seriesUrl += this.tableYoy ? `&yoy=${this.tableYoy}` : '';
    seriesUrl += this.tableYtd ? `&ytd=${this.tableYtd}` : '';
    seriesUrl += this.tableC5ma ? `&c5ma=${this.tableC5ma}` : '';
    seriesUrl += this.y0 ? `&y0=${this.y0}` : '';
    seriesUrl += this.y1 ? `&y1=${this.y1}` : '';
    return seriesUrl;
  }

  changeAnalyzerFrequency(freq, analyzerSeries) {
    const siblingIds = [];
    this.analyzerService.analyzerSeriesCompareSource.next([]);
    const siblingsList = analyzerSeries.map((serie) => {
      const nonSeasonal = serie.seasonalAdjustment === 'not_seasonally_adjusted' && freq !== 'A';
      return this.apiService.fetchSiblingSeriesByIdAndGeo(serie.id, serie.currentGeo.handle, nonSeasonal);
    });
    forkJoin(siblingsList).subscribe((res: any) => {
      res.forEach((siblings) => {
        siblings.forEach((series) => {
          if (series.frequencyShort === freq && !siblingIds.includes(series.id)) {
            const drawInCompare = analyzerSeries.find(s => s.title === series.title).compare === true;
            siblingIds.push({ id: series.id, compare: drawInCompare });
          }
        });
      });
      this.analyzerService.updateAnalyzerSeries(siblingIds);
    });
  }

  removeAllAnalyzerSeries() {
    this.analyzerService.removeAll();
  }

  formatEmbedSnippet(start: string, end: string) {
    const embedURL = this.getAnalyzerParams(start, end, '/graph');
    return `<div style="position:relative;width:100%;overflow:hidden;padding-top:56.25%;height:475px;"><iframe style="position:absolute;top:0;left:0;bottom:0;right:0;width:100%;height:100%;border:none;" src="${this.environment[`portalUrl`]}${embedURL}" scrolling="no"></iframe></div>`;
  }

  toggleAnalyzerDisplay() {
    this.displayCompare = !this.displayCompare;
  }

  changeRange(e) {
    console.log('CHANGE RANGE', e);
    this.minDate = e.seriesStart;
    this.maxDate = e.seriesEnd;
    this.analyzerService.analyzerData.minDate = e.seriesStart;
    this.analyzerService.analyzerData.maxDate = e.seriesEnd;
  }
}
