import { of as observableOf, forkJoin as observableForkJoin,  Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { AnalyzerService } from './analyzer.service';
import { ApiService } from './api.service';
import { HelperService } from './helper.service';
import { Frequency } from './tools.models';
import { Geography } from './tools.models';

@Injectable({
  providedIn: 'root'
})
export class SeriesHelperService {
  private errorMessage: string;
  // Table header to indicate % change if series is not a rate
  private change;
  private seriesData;

  constructor(
    private apiService: ApiService,
    private analyzerService: AnalyzerService,
    private helperService: HelperService
  ) { }

  getSeriesData(id: number, noCache: boolean, catId?: number): Observable<any> {
    let currentFreq;
    let currentGeo;
    let decimals;
    this.seriesData = {
      seriesDetail: {},
      saPairAvail: null,
      regions: [],
      currentGeo: {} as Geography,
      frequencies: [],
      currentFreq: {} as Frequency,
      chartData: [],
      seriesTableData: [],
      siblings: [],
      error: null,
      noData: '',
      requestComplete: false
    };
    const dateArray = [];
    this.apiService.fetchPackageSeries(id, noCache, catId).subscribe((data) => {
      this.seriesData.seriesDetail = data.series;
      this.seriesData.seriesDetail.analyze = this.analyzerService.checkAnalyzer(data.series);
      this.seriesData.seriesDetail.saParam = data.series.seasonalAdjustment !== 'not_seasonally_adjusted';
      const geos = data.series.geos;
      const freqs = data.series.freqs;
      decimals = data.series.decimals || 1;
      currentGeo = data.series.geography;
      currentFreq = { freq: data.series.frequencyShort, label: data.series.frequency, observationStart: '', observationEnd: '' };
      this.helperService.updateCurrentFrequency(currentFreq);
      this.helperService.updateCurrentGeography(currentGeo);
      this.seriesData.regions = geos || [data.series.geography];
      this.seriesData.frequencies = freqs || [{ freq: data.series.frequencyShort, label: data.series.frequency }];
      this.seriesData.yoyChange = data.series.percent ? 'Year/Year Change' : 'Year/Year % Change';
      this.seriesData.ytdChange = data.series.percent ? 'Year-to-Date Change' : 'Year-to-Date % Change';
      this.seriesData.siblings = data.siblings;
      const geoFreqPair = this.findGeoFreqSibling(data.siblings, currentGeo.handle, currentFreq.freq);
      // If a series has a seasonal and a non-seasonal sibling, display SA toggle in single series view
      this.seriesData.saPairAvail = this.checkSaPairs(geoFreqPair);
      const obs = data.observations;
      this.seriesData.seriesDetail.seriesObservations = obs;
      const levelData = obs.transformationResults[0].dates;
      const obsStart = obs.observationStart;
      const obsEnd = obs.observationEnd;
      if (levelData && levelData.length) {
        // Use to format dates for table
        this.helperService.createDateArray(obsStart, obsEnd, currentFreq.freq, dateArray);
        const formattedData = this.dataTransform(obs, dateArray, decimals);
        this.seriesData.chartData = formattedData.chartData;
        this.seriesData.seriesTableData = formattedData.tableData;
        this.seriesData.requestComplete = true;
      } else {
        this.seriesData.noData = 'Data not available';
        this.seriesData.requestComplete = true;
      }
    },
      (error) => {
        error = this.errorMessage = error;
        this.seriesData.eror = true;
        this.seriesData.requestComplete = true;
      });
    return observableForkJoin([observableOf(this.seriesData)]);
  }

  dataTransform(seriesObs, dates, decimals) {
    const observations = seriesObs;
    const start = observations.observationStart;
    const end = observations.observationEnd;
    const transformations = this.helperService.getTransformations(observations.transformationResults);
    const { level } = transformations;
    const pseudoZones = [];
    if (level.pseudoHistory) {
      level.pseudoHistory.forEach((obs, index) => {
        if (obs && !level.pseudoHistory[index + 1]) {
          pseudoZones.push({ value: Date.parse(level.dates[index]), dashStyle: 'dash', color: '#7CB5EC', className: 'pseudoHistory' });
        }
      });
    }
    const seriesTable = this.helperService.createSeriesTable(dates, transformations, decimals);
    const chart = this.helperService.createSeriesChart(dates, transformations);
    const chartData = { level: chart.level, pseudoZones, yoy: chart.yoy, ytd: chart.ytd, c5ma: chart.c5ma, dates };
    const results = { chartData, tableData: seriesTable, start, end };
    return results;
  }


  // Find series siblings for a particular geo-frequency combination
  findGeoFreqSibling(seriesSiblings, geo, freq) {
    if (seriesSiblings) {
      return seriesSiblings.filter(sib => sib.geography.handle === geo && sib.frequencyShort === freq);
    }
  }

  checkSaPairs(seriesSiblings) {
    if (seriesSiblings) {
      const saSeries = seriesSiblings.find(series => series.seasonalAdjustment === 'seasonally_adjusted');
      const nsaSeries = seriesSiblings.find(series => series.seasonalAdjustment === 'not_seasonally_adjusted');
      if (saSeries && nsaSeries) {
        return true;
      }
      return false;
    }
    return false;
  }

  calculateSeriesSummaryStats = (seriesDetail, chartData, startDate: string, endDate: string, indexed: boolean, indexBase) => {
    const freq = seriesDetail.frequencyShort;
    const formattedStats = {
      series: '',
      seriesInfo: seriesDetail,
      minValue: 'N/A',
      maxValue: 'N/A',
      percChange: 'N/A',
      levelChange: 'N/A',
      total: 'N/A',
      avg: 'N/A',
      cagr: 'N/A',
      missing: null,
      range: null,
      showInChart: null,
      interactionSettings: {
        showInChart: null,
        color: null,
        seriesInfo: seriesDetail
      }
    };
    formattedStats.range = `${this.helperService.formatDate(startDate, freq)} - ${this.helperService.formatDate(endDate, freq)}`;
    const decimals = seriesDetail.decimals;
    const { dates, level } = chartData;
    const values = indexed ? this.analyzerService.getChartIndexedValues(level, indexBase) : level;
    const datesInRange = dates.filter(date => date.date >= startDate && date.date <= endDate);
    const valuesInRange = values.filter(l => new Date(l[0]).toISOString().split('T')[0] >= startDate && new Date(l[0]).toISOString().split('T')[0] <= endDate).map(value => value[1]);
    if (valuesInRange.includes(null) || !datesInRange.length || !valuesInRange.length) {
      formattedStats.missing = true;
      return formattedStats;
    }
    const minValue = Math.min(...valuesInRange);
    const minValueIndex = valuesInRange.indexOf(minValue);
    const maxValue = Math.max(...valuesInRange);
    const maxValueIndex = valuesInRange.indexOf(maxValue);
    const diff = valuesInRange[valuesInRange.length - 1] - valuesInRange[0];
    const percChange = this.helperService.formatNum((diff / valuesInRange[0]) * 100, decimals);
    const sum = valuesInRange.reduce((a, b) => a + b, 0);
    const periods = valuesInRange.length - 1;
    const cagr = this.calculateCAGR(valuesInRange[0], valuesInRange[valuesInRange.length - 1], freq, periods);
    formattedStats.minValue = `${this.helperService.formatNum(Math.min(...valuesInRange), decimals)} (${this.helperService.formatDate(datesInRange[minValueIndex].date, freq)})`;
    formattedStats.maxValue = `${this.helperService.formatNum(Math.max(...valuesInRange), decimals)} (${this.helperService.formatDate(datesInRange[maxValueIndex].date, freq)})`;
    formattedStats.percChange = seriesDetail.percent ? null : percChange;
    formattedStats.levelChange = this.helperService.formatNum(diff, decimals);
    formattedStats.total = this.helperService.formatNum(sum, decimals);
    formattedStats.avg = this.helperService.formatNum(sum / valuesInRange.length, decimals);
    formattedStats.cagr = this.helperService.formatNum(cagr, decimals);
    return formattedStats;
  }

  calculateCAGR(firstValue: number, lastValue: number, freq: string, periods: number) {
    // Calculate compound annual growth rate
    const multiplier = {
      A: 1,
      Q: 4,
      S: 2,
      M: 12,
      W: 52,
      D: 365
    };
    return (Math.pow((lastValue / firstValue), multiplier[freq] / periods) - 1) * 100 || Infinity;
  }
}
