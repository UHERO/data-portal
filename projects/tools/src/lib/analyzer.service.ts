import { of as observableOf, forkJoin as observableForkJoin, BehaviorSubject } from 'rxjs';
import { Inject, Injectable, EventEmitter, Output } from '@angular/core';
import { ApiService } from './api.service';
import { HelperService } from './helper.service';
import { DataPortalSettingsService } from './data-portal-settings.service';
import { DateWrapper, AnalyzerDataInterface } from './tools.models';

class AnalyzerData implements AnalyzerDataInterface {
  analyzerTableDates = [];
  analyzerMeasurements = {};
  sliderDates = [];
  analyzerDateWrapper = { firstDate: '', endDate: '' };
  analyzerSeries = [];
  displayFreqSelector = false;
  siblingFreqs = [];
  analyzerFrequency = null;
  y0Series = null;
  yRightSeries = [];
  yLeftSeries = [];
  leftMin = null;
  leftMax = null;
  rightMin = null;
  rightMax = null;
  urlChartSeries = [];
  minDate = null;
  maxDate = null;
  requestComplete = false;
  indexed = false;
  baseYear = null;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyzerService {
  // Keep track of series in the analyzer
  analyzerSeriesTrackerSource: BehaviorSubject<any> = new BehaviorSubject([]);
  analyzerSeriesTracker = this.analyzerSeriesTrackerSource.asObservable();
  analyzerSeriesCount = new BehaviorSubject(this.analyzerSeriesTrackerSource.value.length);
  analyzerSeriesCount$ = this.analyzerSeriesCount.asObservable();

  public analyzerData = new AnalyzerData();
  public embedData = {
    analyzerTableDates: [],
    analyzerSeries: [],
  };
  portalSettings;

  @Output() public switchYAxes: EventEmitter<any> = new EventEmitter();

  constructor(
    private apiService: ApiService,
    private helperService: HelperService,
    @Inject('portal') public portal,
    private dataPortalSettingsServ: DataPortalSettingsService,
  ) { }

  checkAnalyzer = (seriesInfo: any) => this.analyzerSeriesTrackerSource.value.some(series => series.id === seriesInfo.id);

  updateAnalyzerSeries(data) {
    this.analyzerSeriesTrackerSource.next(data);
    this.analyzerSeriesCount.next(this.analyzerSeriesTrackerSource.value.length);
  }

  getVisibleCompareSeries = (series) => series.filter(s => s.visible);

  setCompareChartSeriesObject(series) {
    const { indexed, baseYear, analyzerSeries, minDate } = this.analyzerData;
    if (analyzerSeries.length && indexed) {
      const visibleCompareSeries = this.getVisibleCompareSeries(analyzerSeries);
      const seriesToCalcBaseYear = visibleCompareSeries.length ? visibleCompareSeries : analyzerSeries;
      this.analyzerData.baseYear = this.getIndexBaseYear(seriesToCalcBaseYear, minDate);
    }
    const chartValues = series.observations.map(obs => obs.displayName);
    const selectedChartTransformation = chartValues.find(name => name === 'Level') || chartValues[0];
    const selectedTransformation = series.observations.find(t => t.displayName === selectedChartTransformation).values;
    series.yAxisText = this.setYAxisLabel(indexed, baseYear, series, selectedChartTransformation);
    series.className = series.id;
    series.name = this.formatDisplayName(series, indexed, selectedChartTransformation);
    series.data = indexed ? this.getChartIndexedValues(selectedTransformation, baseYear) : [...selectedTransformation];
    series.levelData = [...selectedTransformation];
    series.yAxis = this.assignYAxisSide(series);
    series.type = series.selectedChartType;
    series.currentFreq = { freq: series.frequencyShort, label: series.frequency };
    series.includeInDataExport = true;
    series.showInLegend = true;
    series.showInNavigator = false;
    series.events = {
      legendItemClick() {
        return false;
      }
    };
    series.seasonallyAdjusted = series.seasonalAdjustment === 'seasonally_adjusted';
    series.chartType = [
      'line',
      'column',
      'area'
    ];
    series.selectedChartType = 'line';
    series.yAxisSides = [
      'left',
      'right'
    ];
    series.chartValues = chartValues;
    series.selectedChartTransformation = selectedChartTransformation;
  }

  setYAxisLabel = (indexed: boolean, baseYear, series, transformation: string) => {
    if (indexed) {
      return `Index (${baseYear})`;
    }
    if (transformation !== 'Level') {
      return series.percent ? 'Change' : '% Change';
    }
    return`${series.unitsLabelShort}`;
  }

  getIndexedValues = (values: Array<number>, dates: Array<string>, baseYear: string) => {
    return values.map((curr, ind, arr) => {
      const dateIndex = dates.findIndex(date => date === baseYear);
      return dateIndex > -1 ? curr / arr[dateIndex] * 100 : Infinity;
    });
  }

  getChartIndexedValues = (values: Array<number>, baseYear: string) => {
    return values.map((curr, ind, arr) => {
      const dateIndex = arr.findIndex(dateValuePair => new Date(dateValuePair[0]).toISOString().substring(0, 10) === baseYear);
      return dateIndex > -1 ? [curr[0], curr[1] / arr[dateIndex][1] * 100] : [curr[0], null];
    });
  }

  makeCompareSeriesVisible(series: any) {
    const { analyzerSeries, minDate, indexed } = this.analyzerData;
    analyzerSeries.find(s => s.id === series?.id).visible = true;
    const visibleCompareSeries = analyzerSeries.filter(s => s.visible);
    const seriesToCalcBaseYear = visibleCompareSeries.length ? visibleCompareSeries : analyzerSeries;
    this.analyzerData.baseYear = this.getIndexBaseYear(seriesToCalcBaseYear, minDate);
    if (visibleCompareSeries.length && indexed) {
      this.updateBaseYear();
    }
    this.analyzerData.analyzerSeries = [].concat(analyzerSeries);
  }

  updateCompareSeriesAxis(seriesId: any, axis: string) {
    const { yRightSeries, yLeftSeries, analyzerSeries } = this.analyzerData;
    const visibleCompareSeries = analyzerSeries.filter(s => s.visible);
    const selectedCompareSeries = visibleCompareSeries.find(s => s.className === seriesId);
    const rightSeriesMatch = yRightSeries.find(id => id === seriesId);
    const leftSeriesMatch = yLeftSeries.find(id => id === seriesId);
    const { indexed, baseYear } = this.analyzerData;
    if (axis === 'right' && !rightSeriesMatch) {
      yRightSeries.push(seriesId);
    }
    if (axis === 'left' && rightSeriesMatch) {
      const matchIndex = yRightSeries.findIndex(id => id === seriesId);
      yRightSeries.splice(matchIndex, 1);
    }
    if (axis === 'right' && leftSeriesMatch) {
      const matchIndex = yLeftSeries.findIndex(id => id === seriesId);
      yLeftSeries.splice(matchIndex, 1);
    }
    if (axis === 'left' && !leftSeriesMatch) {
      yLeftSeries.push(seriesId);
    }
    selectedCompareSeries.yAxis = axis;
    selectedCompareSeries.yAxisText = this.setYAxisLabel(indexed, baseYear, selectedCompareSeries, selectedCompareSeries.selectedChartTransformation);
    this.analyzerData.analyzerSeries = [].concat(this.analyzerData.analyzerSeries)
  }

  findSelectedCompareSeries = (seriesId) => {
    const { analyzerSeries } = this.analyzerData;
    const compareSeries = analyzerSeries.filter(s => s.visible);
    return compareSeries.find(s => s.className === seriesId);
  }

  updateCompareChartType(seriesId: number, chartType: string) {
    const { analyzerSeries } = this.analyzerData;
    const selectedCompareSeries = this.findSelectedCompareSeries(seriesId);
    selectedCompareSeries.type = chartType;
    selectedCompareSeries.selectedChartType = chartType;
    this.analyzerData.analyzerSeries = [].concat(analyzerSeries);
  }

  updateCompareChartTransformation(seriesId: number, transformation: string) {
    const { analyzerSeries } = this.analyzerData;
    const selectedCompareSeries = this.findSelectedCompareSeries(seriesId);
    if (selectedCompareSeries) {
      selectedCompareSeries.selectedChartTransformation = selectedCompareSeries.chartValues.find(t => t === transformation)
      this.updateCompareSeriesDataAndAxes(analyzerSeries);
    }
  }

  updateCompareSeriesDataAndAxes(series: Array<any>) {
    const { indexed, baseYear } = this.analyzerData;
    series.forEach((s) => {
      s.name = this.formatDisplayName(s, indexed, s.selectedChartTransformation);
      s.data = indexed ? this.getChartIndexedValues(s.levelData, baseYear) : [...s.observations.find(t => t.displayName === s.selectedChartTransformation).values];
      s.levelData =  [...s.observations.find(t => t.displayName === s.selectedChartTransformation).values];
      s.yAxisText = this.setYAxisLabel(indexed, baseYear, s, s.selectedChartTransformation);
      s.yAxis = this.assignYAxisSide(s);
    });
    this.analyzerData.analyzerSeries = [].concat(this.analyzerData.analyzerSeries);
  }

  removeFromComparisonChart(id: number) {
    const { analyzerSeries } = this.analyzerData;
    analyzerSeries.find(s => s.id === id).visible = false;
    this.analyzerData.urlChartSeries = this.analyzerData.urlChartSeries.filter(ids => ids !== id);
    this.updateBaseYear();
    this.analyzerData.analyzerSeries = [].concat(analyzerSeries);
  }

  toggleIndexValues(index: boolean, minYear: string) {
    this.analyzerData.indexed = index;
    const { analyzerSeries }  = this.analyzerData;
    const visibleCompareSeries = analyzerSeries.filter(s => s.visible);
    const seriesToCalcBaseYear = visibleCompareSeries.length ? visibleCompareSeries : analyzerSeries;
    const baseYear = this.getIndexBaseYear(seriesToCalcBaseYear, minYear);
    this.analyzerData.baseYear = baseYear;
    if (analyzerSeries) {
      this.updateCompareSeriesDataAndAxes(analyzerSeries);
    }
    this.analyzerData.analyzerSeries.forEach((s) => {
      s.gridDisplay = this.helperService.formatGridDisplay(s, 'lvl', 'ytd');
    });
  }

  updateBaseYear() {
    const { minDate, analyzerSeries } = this.analyzerData;
    const visibleCompareSeries = analyzerSeries.filter(s => s.visible);
    const seriesToCalcBaseYear = visibleCompareSeries.length ? visibleCompareSeries : analyzerSeries;
    if (seriesToCalcBaseYear.length) {
      this.analyzerData.baseYear = this.getIndexBaseYear(seriesToCalcBaseYear, minDate);
    }
    if (analyzerSeries) {
      this.updateCompareSeriesDataAndAxes(analyzerSeries);
    }
  }

  addToAnalyzer(seriesID: number) {
    let currentAnalyzerTracker = this.analyzerSeriesTrackerSource.value;
    currentAnalyzerTracker = [...currentAnalyzerTracker, { id: seriesID }];
    this.analyzerSeriesTrackerSource.next(currentAnalyzerTracker);
    this.analyzerSeriesCount.next(this.analyzerSeriesTrackerSource.value.length);
  }

  removeFromAnalyzer(seriesID: number) {
    let currentAnalyzerTracker = this.analyzerSeriesTrackerSource.value;
    const { analyzerSeries } = this.analyzerData;
    this.analyzerData.analyzerSeries = analyzerSeries.filter(s => s.id !== seriesID);
    this.analyzerSeriesTrackerSource.next(currentAnalyzerTracker.filter(s => s.id !== seriesID));
    this.analyzerSeriesCount.next(this.analyzerSeriesTrackerSource.value.length);
    this.updateBaseYear();
    this.analyzerData.analyzerSeries = [].concat(this.analyzerData.analyzerSeries);
  }

  getAnalyzerData(aSeriesTracker: Array<any>, noCache: boolean) {
    this.analyzerData.analyzerSeries = [];
    this.analyzerData.analyzerMeasurements = {}
    this.analyzerData.requestComplete = false;
    this.portalSettings = this.dataPortalSettingsServ.dataPortalSettings[this.portal.universe];
    this.analyzerData.requestComplete = false;
    const ids = aSeriesTracker.map(s => s.id).join();
    this.apiService.fetchPackageAnalyzer(ids, noCache).subscribe((results) => {
      const series = results.series;
      const analyzerDateWrapper = { } as DateWrapper;
      analyzerDateWrapper.firstDate = this.helperService.findDateWrapperStart(series);
      analyzerDateWrapper.endDate = this.helperService.fineDateWrapperEnd(series);
      this.analyzerData.analyzerDateWrapper = analyzerDateWrapper
      this.analyzerData.displayFreqSelector = this.singleFrequencyAnalyzer(series);
      this.analyzerData.siblingFreqs = this.getSiblingFrequencies(series);
      const { series1Name } = this.portalSettings.highcharts;
      series.forEach((s) => {
        s.observations = this.helperService.formatSeriesForCharts(s);
        s.gridDisplay = this.helperService.formatGridDisplay(s, 'lvl', series1Name); 
        this.addSeriesToAnalyzerData(s, this.analyzerData.analyzerSeries, this.analyzerData.analyzerMeasurements);
      });
      this.analyzerData.analyzerFrequency = this.analyzerData.displayFreqSelector ?
        this.getCurrentAnalyzerFrequency(series, this.analyzerData.siblingFreqs) :
        this.getHighestFrequency(this.analyzerData.analyzerSeries);
      if (this.allowMoMTransformation(this.analyzerData.analyzerFrequency.freq)) {
        this.addMoMTransformation(ids, noCache);
      } else {
        this.createAnalyzerTable(this.analyzerData.analyzerSeries);
        this.analyzerData.requestComplete = true;
      }
    });
    return observableForkJoin([observableOf(this.analyzerData)]);
  }

  allowMoMTransformation = (analyzerFrequency: string) => {
    if (analyzerFrequency === 'M' || analyzerFrequency === 'W' || analyzerFrequency === 'D') {
      return true;
    }
    return false;
  }

  addMoMTransformation(ids: string, noCache: boolean) {
    this.apiService.fetchPackageMomTransformation(ids, noCache).subscribe((results) => {
      const { series: momSeries } = results;
      const { analyzerSeries } = this.analyzerData;
      momSeries.forEach((m) => {
        m.observations = this.helperService.formatSeriesForCharts(m);
      });
      analyzerSeries.forEach((series) => {
        if (!series.chartValues.includes('MOM')) {
          series.chartValues.push('MOM');
        }
        if (series.observations.findIndex(ob => ob.name === 'mom') === -1) {
          const seriesMatch = momSeries.find(s => s.id === series.id);
          series.observations.push(seriesMatch.observations[0]);
          series.seriesObservations.transformationResults.push(seriesMatch.seriesObservations.transformationResults[0])
        }
      });
      this.createAnalyzerTable(this.analyzerData.analyzerSeries);
      this.analyzerData.requestComplete = true;
    });
  }

  addSeriesToAnalyzerData(series: any, analyzerSeries: Array<any>, analyzerMeasurements) {
    const seriesExists = analyzerSeries.find(s => series.id === s.id);
    if (!seriesExists) {
      const seriesData = this.formatSeriesForAnalyzer(series);
      seriesData.visible = this.isVisible(series, analyzerSeries);
      analyzerSeries.push(seriesData);
      this.setCompareChartSeriesObject(seriesData);

      if (analyzerMeasurements[seriesData.measurementName]) {
        analyzerMeasurements[seriesData.measurementName].push(seriesData);
      }
      if (!analyzerMeasurements[seriesData.measurementName]) {
        analyzerMeasurements[seriesData.measurementName] = [seriesData];
      }
    }
  }

  isVisible = (series: any, analyzerSeries: Array<any>) => {
    const { urlChartSeries } = this.analyzerData;
    // On load, analyzer should add 1 (or 2 if available) series to comparison chart
    // if user has not already added/removed series for comparison
    if (!urlChartSeries.length) {
      return analyzerSeries.filter(series => series.visible).length < 2;
    }
    return urlChartSeries.includes(series.id);
  }

  addToCompareChart(compareSeries: Array<any>, seriesData: any) {
    const seriesExistsInCompare = compareSeries.find(s => s.className === seriesData.id);
    const { urlChartSeries } = this.analyzerData;
    if (!seriesExistsInCompare || urlChartSeries.find(chartSeries => chartSeries === seriesData.id)) {
      this.setCompareChartSeriesObject(seriesData)
    }
  }

  storeUrlChartSeries(urlChartSeries: string) {
    const urlCSeries = urlChartSeries.split('-').map(Number);
    urlCSeries.forEach((cSeries) => {
      this.analyzerData.urlChartSeries.push(cSeries);
    });
  }

  removeAll() {
    this.updateAnalyzerSeries([]);
    this.analyzerData = this.resetAnalyzerData();
  }

  resetAnalyzerData = () => {
    return new AnalyzerData();
  }

  formatSeriesForAnalyzer = (series) => {
    const { frequency, seasonalAdjustment, frequencyShort } = series;
    series.displayName = this.formatDisplayName(series, this.analyzerData.indexed);
    series.indexDisplayName = this.formatDisplayName(series, this.analyzerData.indexed);
    series.saParam = seasonalAdjustment !== 'not_seasonally_adjusted';
    series.currentGeo = series.geography;
    series.currentFreq = { freq: frequencyShort, label: frequency };
    const { observationStart, observationEnd, transformationResults } = series.seriesObservations;
    const levelDates = transformationResults[0].dates;
    const dateArray = [];
    if (levelDates) {
      const level = transformationResults[0];
      const pseudoZones = this.helperService.getPseudoZones(level); 
      // Use to format dates for table
      this.helperService.createDateArray(observationStart, observationEnd, series.currentFreq.freq, dateArray);
      const levelChartData = this.helperService.createSeriesChartData(transformationResults[0], dateArray);
      series.chartData = { level: levelChartData, dates: dateArray, pseudoZones, ...series.observations };
    } else {
      series.noData = 'Data not available';
    }
    return series;
  }

  assignYAxisSide(series: any) {
    const { yLeftSeries, yRightSeries } = this.analyzerData;
    if (yLeftSeries.length && yLeftSeries.some(id => id === series.id)) {
      return 'left';
    }
    if (yRightSeries.length && yRightSeries.some(id => id === series.id)) {
      return 'right';
    }
    const { analyzerSeries } = this.analyzerData;
    const units = analyzerSeries.map(s => s.yAxisText);
    return !units.length || units[0] === series.yAxisText || this.analyzerData.indexed ? 'left' : 'right';
  }

  singleFrequencyAnalyzer = (series: Array<any>) => {
    const freqs = series.map((s) => { return { freq: s.frequencyShort, label: s.frequency }});
    return freqs.filter((freq, index, self) => self.findIndex((f) => (f.freq === freq.freq)) === index).length === 1;
  }

  getSiblingFrequencies = (series: Array<any>) => {
    const freqs  = series.map(s => s.freqs.map((f) => { return { freq: f.freq, label: f.label } }));
    return freqs.reduce((prev, curr) => prev.filter(f => curr.some(freq => freq.freq === f.freq)));
  }

  getCurrentAnalyzerFrequency = (series: Array<any>, freqList: Array<any>) => {
    const currentFreq = freqList.filter(f => f.freq === series[0].frequencyShort)[0];
    this.helperService.updateCurrentFrequency(currentFreq);
    return currentFreq;
  }

  getHighestFrequency = (series) => {
    const freqs = series.map(s => s.currentFreq).filter((val, ind, arr) => arr.findIndex(f => (f.freq === val.freq)) === ind);
    const ordering = {};
    const freqOrder = ['D', 'W', 'M', 'Q', 'S', 'A'];
    for (let i = 0; i < freqOrder.length; i++) {
      ordering[freqOrder[i]] = i;
    }
    const sorted = freqs.sort((a, b) => {
      return (ordering[a.freq] - ordering[b.freq]);
    });
    // display label to select a single frequency for users who want to index series
    if (sorted.length > 1) this.helperService.updateCurrentFrequency({ freq: null, label: null });
    return sorted[0];
  }

  createAnalyzerTable(analyzerSeries) {
    analyzerSeries.forEach((aSeries) => {
      const { observationStart, observationEnd, transformationResults } = aSeries.seriesObservations;
      const dateArray = [];
      this.helperService.createDateArray(observationStart, observationEnd, aSeries.frequencyShort, dateArray);
      aSeries.seriesTableData = this.createSeriesTable(transformationResults, dateArray);
    });
    this.analyzerData.analyzerTableDates = this.createAnalyzerTableDates(analyzerSeries);
    this.analyzerData.sliderDates = this.createSliderDates(this.analyzerData.analyzerTableDates);
  }

  createSliderDates = (allDates: Array<any>) => allDates.filter((e, i) => allDates.findIndex(a => a.date === e.date) === i);

  dateComparison = (a, b) => {
    if (a.date === b.date) {
      return a.tableDate < b.tableDate ? -1 : a.tableDate > b.tableDate ? 1 : 0;
    }
    return a.date < b.date ? -1 : 1;
  }

  createAnalyzerTableDates = (series, start?, end?) => {
    let allDates = [];
    series.forEach((serie) => {
      serie.seriesTableData.lvl.forEach((date) => {
        const dateExists = allDates.map(d => d.tableDate).find(tableDate => tableDate === date.tableDate);
        if (!dateExists) { allDates.push(date); }
      });
    });
    allDates = allDates.sort(this.dateComparison);
    if (start && end) { allDates = allDates.filter(date => date.date >= start && date.date <= end); }
    return allDates;
  }

  createSeriesTable = (transformations, tableDates) => {
    const categoryTable = {};
    transformations.forEach((t) => {
      const { transformation, dates, values } = t;
      if (dates && values) {
        categoryTable[`${transformation}`] = tableDates.map((date) => {
          const dateExists = this.helperService.binarySearch(dates, date.date);
          return dateExists > -1 ?
            { date: date.date, tableDate: date.tableDate, value: +values[dateExists], formattedValue: '' } :
            { date: date.date, tableDate: date.tableDate, value: Infinity, formattedValue: '' };
        });
      }
    });
    return categoryTable;
  }

  formatDisplayName = (series, indexed: boolean, transformation: string = 'Level') => {
    const { seasonalAdjustment, unitsLabel, unitsLabelShort, geography, frequency, title } = series;
    let ending = '';
    if (seasonalAdjustment === 'seasonally_adjusted') {
      ending = '; Seasonally Adjusted';
    }
    if (seasonalAdjustment === 'not_seasonally_adjusted') {
      ending = '; Not Seasonally Adjusted';
    }
    let units = unitsLabelShort || unitsLabel;
    units = transformation !== 'Level' ? `${transformation}` : units;
    const displayUnits = indexed ? `Index - ${transformation}` : `${units}`
    return `${title} (${displayUnits}) (${geography.shortName}; ${frequency}${ending})`;
  }

  getIndexBaseYear = (series: any, start: string) => {
    const maxObsStartDate = series.reduce((prev, current) => {
      const prevObsStart = prev.seriesObservations.observationStart;
      const currentObsStart = current.seriesObservations.observationStart;
      return prevObsStart > currentObsStart ? prev : current;
    }).seriesObservations.observationStart;
    this.analyzerData.baseYear = (maxObsStartDate > start || !start) ? maxObsStartDate : start;
    return this.analyzerData.baseYear;
  }
}
