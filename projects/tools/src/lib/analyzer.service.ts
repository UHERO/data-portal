import { of as observableOf, forkJoin as observableForkJoin, BehaviorSubject } from 'rxjs';
import { Injectable, EventEmitter, Output } from '@angular/core';
import { ApiService } from './api.service';
import { HelperService } from './helper.service';
import { DateWrapper } from './tools.models';

@Injectable({
  providedIn: 'root'
})
export class AnalyzerService {
  // Keep track of series in the analyzer
  analyzerSeriesTrackerSource: BehaviorSubject<any> = new BehaviorSubject([]);
  analyzerSeriesTracker = this.analyzerSeriesTrackerSource.asObservable();
  private analyzerSeriesCount = new BehaviorSubject(this.analyzerSeriesTrackerSource.value.length);
  analyzerSeriesCount$ = this.analyzerSeriesCount.asObservable();
  analyzerSeriesCompareSource: BehaviorSubject<any> = new BehaviorSubject([]);
  analyzerSeriesCompare = this.analyzerSeriesCompareSource.asObservable();

  public analyzerData = {
    analyzerTableDates: [],
    sliderDates: [],
    analyzerDateWrapper: { firstDate: '', endDate: '' },
    analyzerSeries: [],
    displayFreqSelector: false,
    siblingFreqs: [],
    analyzerFrequency: {},
    y0Series: null,
    yRightSeries: null,
    minDate: null,
    maxDate: null,
    requestComplete: false,
    indexed: false,
    baseYear: null
  };
  public embedData = {
    analyzerTableDates: [],
    analyzerSeries: [],
  };

  @Output() public switchYAxes: EventEmitter<any> = new EventEmitter();

  @Output() public toggleSeriesInChart: EventEmitter<any> = new EventEmitter();

  @Output() public toggleIndexedData: EventEmitter<any> = new EventEmitter();

  @Output() public updateAnalyzerCount: EventEmitter<any> = new EventEmitter();

  constructor(private apiService: ApiService, private helperService: HelperService) { }

  checkAnalyzer = (seriesInfo: any) => this.analyzerSeriesTrackerSource.value.some(series => series.id === seriesInfo.id);

  updateAnalyzerSeries(data) {
    this.analyzerSeriesTrackerSource.next(data);
    this.analyzerSeriesCount.next(this.analyzerSeriesTrackerSource.value.length);
  }

  setCompareChartSeriesObject(series) {
    const currentCompare = this.analyzerSeriesCompareSource.value;
    //this.analyzerData.analyzerSeries.find(s => s.id === series.id).compare = true;
    //this.analyzerData.baseYear = this.getIndexBaseYear([...currentCompare, { seriesInfo: series }], this.analyzerData.minDate);
    const { indexed, baseYear } = this.analyzerData;
    if (currentCompare.length && indexed) {
      this.updateCompareSeriesDataAndAxes(currentCompare);
    }
    currentCompare.push({
      className: series.id,
      name: indexed ? series.indexDisplayName : series.displayName,
      tooltipName: series.title,
      data: indexed ? this.getChartIndexedValues(series.chartData.level, baseYear) : series.chartData.level,
      levelData: series.chartData.level,
      yAxis: indexed ? `Index (${baseYear})-${series.selectedYAxis}` : `${series.unitsLabelShort}-${series.selectedYAxis}`,
      yAxisText: indexed ? `Index (${baseYear})` : `${series.unitsLabelShort}`,
      yAxisSide: series.selectedYAxis,
      type: series.selectedChartType,
      decimals: series.decimals,
      frequency: series.frequencyShort,
      geography: series.geography.name,
      includeInDataExport: true,
      showInLegend: true,
      showInNavigator: false,
      seriesInfo: series,
      events: {
        legendItemClick() {
          return false;
        }
      },
      observations: series.observations,
      unitsLabelShort: series.unitsLabelShort,
      seasonallyAdjusted: series.seasonalAdjustment === 'seasonally_adjusted',
      dataGrouping: {
        enabled: false
      },
      pseudoZones: series.chartData.pseudoZones,
      visible: series.compare//this.isVisible(currentCompare, this.analyzerSeriesTrackerSource.value, series) || false//true
    });
    console.log('currentCompare', currentCompare)
    this.analyzerSeriesCompareSource.next(currentCompare);
  }

  makeCompareSeriesVisible(series) {
    const currentCompare = this.analyzerSeriesCompareSource.value;
    const compareSeries = currentCompare.find(c => c.className === series.id);
    compareSeries.visible = true;
    const seriesToCalcBaseYear = currentCompare.filter(s => s.visible).length ? currentCompare.filter(s => s.visible) : currentCompare;
    this.analyzerData.baseYear = this.getIndexBaseYear(seriesToCalcBaseYear, this.analyzerData.minDate);
    const indexed = this.analyzerData.indexed;
    if (currentCompare.filter(s => s.visible).length && indexed) {
      this.updateCompareSeriesDataAndAxes(currentCompare);
    }

    this.analyzerSeriesCompareSource.next(currentCompare);
  }

  getIndexedValues = (values: Array<number>, dates: Array<string>, baseYear: string) => {
    return values.map((curr, ind, arr) => {
      const dateIndex = dates.findIndex(date => date === baseYear);
      return dateIndex > -1 ? curr / arr[dateIndex] * 100 : Infinity;
    });
  }

  getChartIndexedValues = (values: Array<number>, baseYear: string) => {
    return values.map((curr, ind, arr) => {
      const dateIndex = arr.findIndex(dateValuePair => new Date(dateValuePair[0]).toISOString().substr(0, 10) === baseYear);
      return dateIndex > -1 ? [curr[0], curr[1] / arr[dateIndex][1] * 100] : [curr[0], null];
    });
  }

  updateCompareSeriesAxis(seriesInfo: any, axis: string) {
    const currentCompare = this.analyzerSeriesCompareSource.value;
    //this.updateCompareSeriesDataAndAxes(currentCompare);
    const series = currentCompare.find(s => s.className === seriesInfo.id);
    const aSeriesMatch = this.analyzerData.yRightSeries.find(id => id === seriesInfo.id);
    const { indexed, baseYear } = this.analyzerData;
    if (axis === 'right' && !aSeriesMatch) {
      this.analyzerData.yRightSeries.push(seriesInfo.id);
    }
    if (axis === 'left' && aSeriesMatch) {
      const matchIndex = this.analyzerData.yRightSeries.findIndex(id => id === seriesInfo.id);
      this.analyzerData.yRightSeries.splice(matchIndex, 1);
    }
    series.yAxisSide = axis;
    series.seriesInfo.selectedYAxis = axis;
    series.yAxis = indexed ? `Index (${baseYear})-${axis}` : `${series.unitsLabelShort}-${axis}`;
    series.yAxisText = indexed ? `Index (${baseYear})` : `${series.seriesInfo.unitsLabelShort}`;
    this.analyzerSeriesCompareSource.next(currentCompare);
  }

  updateCompareChartType(seriesInfo: any, chartType: string) {
    const currentCompare = this.analyzerSeriesCompareSource.value;
    currentCompare.find(s => s.className === seriesInfo.id).type = chartType;
    this.analyzerSeriesCompareSource.next(currentCompare);
  }

  removeFromComparisonChart(id: number) {
    const currentCompare = this.analyzerSeriesCompareSource.value;
    console.log('remove analyzerSeries', this.analyzerData.analyzerSeries)
    this.analyzerData.analyzerSeries.find(s => s.id === id).compare = false;
    const compareSeries = currentCompare.find(c => c.className === id);
    compareSeries.visible = false;
    const seriesToCalcBaseYear = currentCompare.filter(s => s.visible).length ? currentCompare.filter(s => s.visible) : currentCompare;
    this.analyzerData.baseYear = this.getIndexBaseYear(seriesToCalcBaseYear, this.analyzerData.minDate);
    const indexed = this.analyzerData.indexed;
    if (currentCompare.filter(s => s.visible).length && indexed) {
      this.updateCompareSeriesDataAndAxes(currentCompare);
    }
    /*const newCompare = currentCompare.filter(s => s.className !== id);
    if (newCompare.length) {
      this.analyzerData.baseYear = this.getIndexBaseYear(newCompare, this.analyzerData.minDate);
    }
    const indexed = this.analyzerData.indexed;
    if (newCompare.length && indexed) {
      this.updateCompareSeriesDataAndAxes(newCompare);
    }
    this.analyzerSeriesCompareSource.next(newCompare);*/
    this.analyzerSeriesCompareSource.next(currentCompare);
  }

  toggleIndexValues(index: boolean, minYear: string) {
    this.analyzerData.indexed = index;
    const currentCompareSeries = this.analyzerSeriesCompareSource.value;
    const seriesToCalcBaseYear = currentCompareSeries.filter(s => s.visible).length ? currentCompareSeries.filter(s => s.visible) : currentCompareSeries;

    const baseYear = this.getIndexBaseYear(seriesToCalcBaseYear, minYear);
    this.analyzerData.baseYear = baseYear;
    if (currentCompareSeries) {
      this.updateCompareSeriesDataAndAxes(currentCompareSeries);
      this.analyzerSeriesCompareSource.next(currentCompareSeries);
    }
    this.analyzerData.analyzerSeries.forEach((s) => {
      s.gridDisplay = this.helperService.formatGridDisplay(s, 'lvl', 'pc1');
    })
  }

  updateCompareSeriesDataAndAxes(series: Array<any>) {
    const { indexed, baseYear } = this.analyzerData;
    series.forEach((s) => {
      s.data = indexed ? this.getChartIndexedValues(s.levelData, baseYear) : s.levelData;
      s.yAxis = indexed ? `Index (${baseYear})-${s.seriesInfo.selectedYAxis}` : `${s.unitsLabelShort}-${s.seriesInfo.selectedYAxis}`;
      s.yAxisText = indexed ? `Index (${baseYear})` : `${s.unitsLabelShort}`;
    });
  }

  addToAnalzyer(seriesID: number) {
    let currentValue = this.analyzerSeriesTrackerSource.value;
    currentValue = [...currentValue, { id: seriesID }];
    this.analyzerSeriesTrackerSource.next(currentValue);
    this.analyzerSeriesCount.next(this.analyzerSeriesTrackerSource.value.length);
  }

  removeFromAnalyzer(seriesID: number) {
    let currentValue = this.analyzerSeriesTrackerSource.value;
    const compareSeries = this.analyzerSeriesCompareSource.value.find(s => s.className === seriesID);
    if (compareSeries) {
      this.analyzerSeriesCompareSource.next(this.analyzerSeriesCompareSource.value.filter(s => s.className !== seriesID));
    }
    this.analyzerData.analyzerSeries.filter(s => s.id !== seriesID)
    this.analyzerSeriesTrackerSource.next(currentValue.filter(s => s.id !== seriesID));
    this.analyzerSeriesCount.next(this.analyzerSeriesTrackerSource.value.length);
  }

  getAnalyzerData(aSeriesTracker: Array<any>, noCache: boolean, rightY: string) {
    this.analyzerData.analyzerSeries = [];
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
      series.forEach((s) => {
        s.observations = this.helperService.formatSeriesForCharts(s);
        s.gridDisplay = this.helperService.formatGridDisplay(s, 'lvl', 'pc1'); 
        this.addSeriesToAnalyzerData(s, this.analyzerData.analyzerSeries, aSeriesTracker);
      });
      this.analyzerData.analyzerFrequency = this.analyzerData.displayFreqSelector ? this.getCurrentAnalyzerFrequency(series, this.analyzerData.siblingFreqs) : this.getHighestFrequency(this.analyzerData.analyzerSeries);
      this.analyzerData.yRightSeries = rightY ? rightY.split('-').map(s => +s) : [];
      const currentCompareSeries = this.analyzerSeriesCompareSource.value;
      const seriesToCalcBaseYear = currentCompareSeries.filter(s => s.visible).length ? currentCompareSeries.filter(s => s.visible) : currentCompareSeries;
  
      this.analyzerData.baseYear = this.getIndexBaseYear(seriesToCalcBaseYear, this.analyzerData.minDate);
      this.createAnalyzerTable(this.analyzerData.analyzerSeries);
      this.assignYAxisSide(this.analyzerData.yRightSeries)
      this.analyzerData.requestComplete = true;
    });
    console.log('ANALYZER DATA', this.analyzerData)
    return observableForkJoin([observableOf(this.analyzerData)]);
  }

  addSeriesToAnalyzerData(series: any, analyzerSeries: Array<any>, aSeriesTracker: Array<any>) {
    const seriesExists = analyzerSeries.find(s => series.id === s.id);
    if (!seriesExists) {
      const seriesData = this.formatSeriesForAnalyzer(series);
      seriesData.compare = this.isVisible(aSeriesTracker, series, analyzerSeries);
      analyzerSeries.push(seriesData);
      this.addToCompareChart(this.analyzerSeriesCompareSource.value, seriesData);
    }
  }

  isVisible = (aSeriesTracker: Array<any>, series: any, analyzerSeries: Array<any>) => {
    // On load, analyzer should add 1 (or 2 if available) series to comparison chart
    // if user has not already added/removed series for comparison
    if (aSeriesTracker.find(s => s.id === series.id && s.compare) || analyzerSeries.filter(series => series.compare).length < 2) {
      return true;
    }
    return false;
  }

  addToCompareChart(compareSource: Array<any>, seriesData: any) {
    const seriesExistsInCompare = compareSource.find(s => s.className === seriesData.id);
    if (!seriesExistsInCompare) {
      this.setCompareChartSeriesObject(seriesData)
    }
  }

  removeAll() {
    this.updateAnalyzerSeries([]);
    this.analyzerData = this.resetAnalyzerData();
  }

  resetAnalyzerData = () => {
    return {
      analyzerTableDates: [],
      sliderDates: [],
      analyzerDateWrapper: { firstDate: '', endDate: '' },
      analyzerSeries: [],
      displayFreqSelector: false,
      siblingFreqs: [],
      analyzerFrequency: {},
      y0Series: null,
      yRightSeries: null,
      requestComplete: false,
      indexed: false,
      baseYear: null,
      minDate: null,
      maxDate: null
    };
  }

  formatSeriesForAnalyzer = (series) => {
    const { title, geography, frequency, seasonalAdjustment, unitsLabelShort, unitsLabel, frequencyShort } = series;
    const abbreviatedNameDetails = {
      title,
      geography: geography.shortName,
      frequency,
      seasonalAdjustment,
      units: unitsLabelShort || unitsLabel
    };
    const indexNameDetails = {
      title,
      geography: geography.shortName,
      frequency,
      seasonalAdjustment,
      units: 'Index'
    }
    const indexNameNoValues = {
      title,
      geography: geography.shortName,
      frequency,
      seasonalAdjustment,
      units: 'Not available for current base year'
    }
    series.displayName = this.formatDisplayName(abbreviatedNameDetails);
    series.indexDisplayName = this.formatDisplayName(indexNameDetails);
    series.naIndex = this.formatDisplayName(indexNameNoValues);
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
      series.chartData = { level: levelChartData, dates: dateArray, pseudoZones };
      series.chartType = [
        'line',
        'column',
        'area',
      ];
      series.selectedChartType = 'line';
      series.yAxis = [
        'left',
        'right'
      ];
      series.selectedYAxis = 'left';
    } else {
      series.noData = 'Data not available';
    }
    return series;
  }

  assignYAxisSide(rightY: Array<number>) {
    this.analyzerData.analyzerSeries.forEach((s) => {
      if (rightY && rightY.includes(s.id)) {
        s.selectedYAxis = 'right';
      }
    });
    const currentCompare = this.analyzerSeriesCompareSource.value;
    currentCompare.forEach((compare) => {
      const match = this.analyzerData.analyzerSeries.find(s => s.id === compare.className);
      compare.yAxis = `${match.unitsLabelShort}-${match.selectedYAxis}`;
      compare.yAxisSide = match.selectedYAxis;
    });
    this.analyzerSeriesCompareSource.next(currentCompare);
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

  formatDisplayName({ title, geography, frequency, seasonalAdjustment, units }) {
    let ending = '';
    if (seasonalAdjustment === 'seasonally_adjusted') {
      ending = '; Seasonally Adjusted';
    }
    if (seasonalAdjustment === 'not_seasonally_adjusted') {
      ending = '; Not Seasonally Adjusted';
    }
    return `${title} (${units}) (${geography}; ${frequency}${ending})`;
  }

  getIndexBaseYear = (series: any, start: string) => {
    const maxObsStartDate = series.reduce((prev, current) => {
      const prevObsStart = prev.seriesInfo.seriesObservations.observationStart;
      const currentObsStart = current.seriesInfo.seriesObservations.observationStart;
      return prevObsStart > currentObsStart ? prev : current;
    }).seriesInfo.seriesObservations.observationStart;
    this.analyzerData.baseYear = (maxObsStartDate > start || !start) ? maxObsStartDate : start;
    return this.analyzerData.baseYear;
  }
}
