import { of as observableOf, forkJoin as observableForkJoin,  Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { AnalyzerService } from './analyzer.service';
import { ApiService } from './api.service';
import { HelperService } from './helper.service';
import { Frequency, Geography, Series } from './tools.models';

@Injectable({
  providedIn: 'root'
})
export class SeriesHelperService {
  private errorMessage: string;
  private seriesData;

  constructor(
    private apiService: ApiService,
    private analyzerService: AnalyzerService,
    private helperService: HelperService
  ) { }

  getSeriesData(id: number, noCache: boolean, catId?: number): Observable<any> {
    let currentFreq;
    let currentGeo;
    let currentForecast;
    let decimals;
    this.seriesData = {
      seriesDetail: {} as Series,
      saPairAvail: null,
      regions: [],
      currentGeo: {} as Geography,
      frequencies: [],
      currentFreq: {} as Frequency,
      chartData: [],
      seriesTableData: [],
      minDate: null,
      maxDate: null,
      siblings: [],
      sliderDates: [],
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
      this.seriesData.forecasts = data.forecasts;
      this.seriesData.forecastList = data.forecasts?.map(f => f.forecast) || [];
      currentForecast = data.forecasts?.find(f => f.freq === currentFreq.freq && data.series.name.includes(f.forecast)).forecast || '';
      this.helperService.updateCurrentForecast(currentForecast);
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
      this.seriesData.sliderDates = this.seriesData.seriesTableData.map((d) => {
        return { date: d.date }
      });
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
  findGeoFreqSibling = (seriesSiblings, geo, freq, forecast = null) => {
    const filteredByFreqAndGeo = seriesSiblings.filter((sib) => {
      const { geography, frequencyShort } = sib;
      return geography.handle === geo && frequencyShort === freq;
    });
    return forecast !== null ?
      filteredByFreqAndGeo.filter(s => s.name.includes(forecast.forecast)) :
      filteredByFreqAndGeo;
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
    const { frequencyShort: freq, decimals, percent } = seriesDetail;
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
      missing: false,
      range: null,
    };
    const { formatNum, formatDate } = this.helperService;
    formattedStats.range = `${formatDate(startDate, freq)} - ${formatDate(endDate, freq)}`;
    const { dates, level } = chartData;
    const startDateExists = dates.find(d => d.date === startDate);
    const endDateExists = dates.find(d => d.date === endDate);
    // if selected date range has its start or end date beyond the range available for a series,
    // do not calculate stats
    if (!startDateExists || !endDateExists) {
      formattedStats.missing = true;
      return formattedStats;
    }
    const values = indexed ? this.analyzerService.getChartIndexedValues(level, indexBase) : level;
    const datesInRange = dates.filter(date => date.date >= startDate && date.date <= endDate);
    const valuesInRange = values.filter(l => new Date(l[0]).toISOString().split('T')[0] >= startDate && new Date(l[0]).toISOString().split('T')[0] <= endDate).map(value => value[1]);
    const min = this.findMinAndIndex(valuesInRange.filter(val => val !== null));
    const max = this.findMaxAndIndex(valuesInRange.filter(val => val !== null));
    const sum = valuesInRange.reduce((a, b) => a + b, 0);
    formattedStats.total = formatNum(sum, decimals);
    formattedStats.avg = formatNum(sum / valuesInRange.length, decimals);
    formattedStats.minValue = `${formatNum(min.value, decimals)} (${formatDate(datesInRange[min.index].date, freq)})`;
    formattedStats.maxValue = `${formatNum(max.value, decimals)} (${formatDate(datesInRange[max.index].date, freq)})`;
    // if starting and ending values are missing, do not calculate change or % change
    if (valuesInRange[valuesInRange.length - 1] === null || valuesInRange[0] === null) {
      formattedStats.missing = true;
      return formattedStats;
    }
    const diff = valuesInRange[valuesInRange.length - 1] - valuesInRange[0];
    const percChange = valuesInRange[0] !== null ? formatNum((diff / valuesInRange[0]) * 100, decimals) : 'N/A';
    const periods = valuesInRange.length - 1;
    const cagr = this.calculateCAGR(valuesInRange[0], valuesInRange[valuesInRange.length - 1], freq, periods);
    formattedStats.percChange = percent ? null : percChange;
    formattedStats.levelChange = formatNum(diff, decimals);
    formattedStats.cagr = formatNum(cagr, decimals);
    return formattedStats;
  }

  findMinAndIndex = (values: Array<any>) => {
    const value = Math.min(...values);
    return { value, index: values.indexOf(value) };
  }
  
  findMaxAndIndex = (values: Array<any>) => {
    const value = Math.max(...values);
    return { value, index: values.indexOf(value) };
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

  selectSibling(geoFreqSiblings: Array<any>, sa: boolean, freq: string) {
    const saSeries = this.seasonalityAndFreqFilter(geoFreqSiblings, 'seasonally_adjusted', freq);
    const nsaSeries = this.seasonalityAndFreqFilter(geoFreqSiblings, 'not_seasonally_adjusted', freq);
    const naSeries = this.seasonalityAndFreqFilter(geoFreqSiblings, 'not_applicable', freq);
    // If more than one sibling exists (i.e. seasonal & non-seasonal)
    // Select series where seasonalAdjustment matches sa setting
    if (freq === 'A') {
      return geoFreqSiblings.find(s => s.frequencyShort === 'A').id;
    }
    if (saSeries && nsaSeries) {
      return sa ? saSeries?.id : nsaSeries?.id;
    }
    if (!saSeries && nsaSeries) {
      return nsaSeries?.id;
    }
    if (saSeries && !nsaSeries) {
      return saSeries?.id;
    }
    if (!saSeries && !nsaSeries) {
      return naSeries?.id;
    }
  }

  seasonalityAndFreqFilter = (seriesSiblings: Array<any>, seasonality: string, freq: string) => {
    return seriesSiblings.find(s => (s.seasonalAdjustment === seasonality && s.frequencyShort === freq) || !s.seasonalAdjustment);
  }
}
