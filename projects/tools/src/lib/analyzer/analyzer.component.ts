import { Component, OnInit, Inject, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { AnalyzerService } from '../analyzer.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DataPortalSettingsService } from '../data-portal-settings.service';
import { forkJoin } from 'rxjs';
import { ApiService } from '../api.service';

@Component({
  selector: 'lib-analyzer',
  templateUrl: './analyzer.component.html',
  styleUrls: ['./analyzer.component.scss']
})
export class AnalyzerComponent implements OnInit {
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
  analyzerSeriesSub;

  analyzerSeries;

  constructor(
    @Inject('environment') private environment,
    @Inject('portal') private portal,
    private analyzerService: AnalyzerService,
    private dataPortalSettingsServ: DataPortalSettingsService,
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private cdRef: ChangeDetectorRef
  ) {
    this.analyzerSeriesSub = analyzerService.analyzerSeriesTest.subscribe((analyzerSeries) => {
      this.analyzerSeries = analyzerSeries;
    })
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
          this.startDate = params[`start`];
        }
        if (params[`end`]) {
          this.endDate = params[`end`];
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
    this.portalSettings = this.dataPortalSettingsServ.dataPortalSettings[this.portal.universe];
    /* if (this.analyzerService.analyzerSeries.length) {
      this.analyzerData = this.analyzerService.getAnalyzerData(this.analyzerService.analyzerSeries, this.noCache, this.y0Series, this.y1Series);
      this.analyzerShareLink = this.formatShareLink(this.minDate, this.maxDate);
      this.embedCode = this.formatEmbedSnippet(this.minDate, this.maxDate);
    } */
    if (this.analyzerSeries.length) {
      this.analyzerData = this.analyzerService.getAnalyzerData(this.analyzerSeries, this.noCache, this.y0Series, this.y1Series);
      this.analyzerShareLink = this.formatShareLink(this.minDate, this.maxDate);
      this.embedCode = this.formatEmbedSnippet(this.minDate, this.maxDate);
    }
  }

  storeUrlSeries(params) {
    const urlASeries = params[`analyzerSeries`].split('-').map(Number);
    /* urlASeries.forEach((uSeries) => {
      const seriesExists = this.analyzerService.analyzerSeries.find(s => s.id === uSeries);
      if (!seriesExists) {
        this.analyzerService.analyzerSeries.push({ id: uSeries, showInChart: false });
      }
    }); */
    urlASeries.forEach((uSeries) => {
      const seriesExists = this.analyzerSeries.find(s => s.id === uSeries);
      if (!seriesExists) {
        this.analyzerSeries.push({ id: uSeries, showInChart: false });
      }
    });
    //console.log('oninit analyzer series', this.analyzerService.analyzerSeries)
  }

  storeUrlChartSeries(params) {
    const urlCSeries = params[`chartSeries`].split('-').map(Number);
    urlCSeries.forEach((cSeries) => {
      //const aSeries = this.analyzerService.analyzerSeries.find(analyzer => analyzer.id === cSeries);
      const aSeries = this.analyzerSeries.find(analyzer => analyzer.id === cSeries);
      aSeries.showInChart = true;
    });
  }

  // Update table when selecting new ranges in the chart
  setTableDates(e) {
    this.minDate = e.minDate;
    this.maxDate = e.maxDate;
    this.analyzerShareLink = this.formatShareLink(this.minDate, this.maxDate);
    this.embedCode = this.formatEmbedSnippet(this.minDate, this.maxDate);
  }

  setYAxesSeries(e) {
    this.y0 = e.y0.map(s => s.toString()).join('-');
    this.y1 = e.y1.map(s => s.toString()).join('-');
    this.analyzerShareLink = this.formatShareLink(this.minDate, this.maxDate);
    this.embedCode = this.formatEmbedSnippet(this.minDate, this.maxDate);
  }

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
    this.analyzerShareLink = this.formatShareLink(this.minDate, this.maxDate);
    this.embedCode = this.formatEmbedSnippet(this.minDate, this.maxDate);
    // this.analyzerService.toggleIndexedData.emit(this.indexSeries);
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
    if (this.analyzerSeries/* this.analyzerService.analyzerSeries.length */) {
      const chartSeries = this.analyzerService.analyzerData.analyzerSeries.filter(s => s.showInChart);
      this.analyzerService.analyzerData.analyzerSeries.forEach((series, index) => {
        aSeries += index === 0 ? series.seriesDetail.id : `-${series.seriesDetail.id}`;
      });
      chartSeries.forEach((series, index) => {
        cSeries += index === 0 ? series.seriesDetail.id : `-${series.seriesDetail.id}`;
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
    console.log('change freq', freq);
    console.log('change freq - currentSeries', analyzerSeries);
    const queryParams = { analyzerSeries: '', chartSeries: ''
      /*analyzerSeries: this.analyzerService.getSiblingSeriesIDs(analyzerSeries, freq).subscribe(siblings => {

      })*/
    };
    const siblingIds = [];
    const siblingsList = []
    analyzerSeries.forEach((serie) => {
      siblingsList.push(this.apiService.fetchSiblingSeriesByIdAndGeo(serie.seriesDetail.id, serie.currentGeo.handle))
    });
    forkJoin(siblingsList).subscribe((res: any) => {
      this.analyzerService.analyzerSeries = [];
      res.forEach((siblings) => {
        siblings.forEach((series) => {
          if (series.frequencyShort === freq) {
            console.log('series', series)
            siblingIds.push(series.id);
            this.analyzerService.updateAnalyzer(series.id);
          }
        });
      });
      console.log('siblingIds', siblingIds)
      queryParams.analyzerSeries = siblingIds.join('-');
      queryParams.chartSeries = ''
      console.log('analyzer series', this.analyzerService.analyzerSeries)
      //this.router.navigate(['/analyzer/'], { queryParams, relativeTo: this.route })
      //this.ngOnInit();

    });    console.log('analyzer nav change', this.analyzerService.getSiblingSeriesIDs(analyzerSeries, freq));
    //this.router.navigate(['/analyzer/'], { queryParams });
  }

  formatEmbedSnippet(start: string, end: string) {
    const embedURL = this.getAnalyzerParams(start, end, '/graph');
    return `<div style="position:relative;width:100%;overflow:hidden;padding-top:56.25%;height:475px;"><iframe style="position:absolute;top:0;left:0;bottom:0;right:0;width:100%;height:100%;border:none;" src="${this.environment[`portalUrl`]}${embedURL}" scrolling="no"></iframe></div>`;
  }
}
