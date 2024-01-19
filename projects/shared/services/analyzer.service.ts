import { Inject, Injectable, EventEmitter, Output, signal, computed } from '@angular/core';
import { ApiService } from './api.service';
import { HelperService } from './helper.service';
import { DataPortalSettingsService } from './data-portal-settings.service';
import { DateWrapper } from '../models/DateWrapper';
import { AnalyzerDataInterface } from '../models/AnalyzerDataInterface';

class AnalyzerData implements AnalyzerDataInterface {
  analyzerTableDates = [];
  analyzerMeasurements = {};
  sliderDates = [];
  analyzerDateWrapper = { firstDate: '', endDate: '' };
  analyzerSeries = [];
  displayFreqSelector = false;
  siblingFreqs = [];
  analyzerFrequency = null;
  requestComplete = false;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyzerService {
  // Keep track of series in the analyzer
  analyzerSeriesStore = signal<number[]>([]);
  yRightSeries = signal<number[]>([]);
  yLeftSeries = signal<number[]>([]);
  column = signal<number[]>([]);
  area = signal<number[]>([]);
  
  chartYoy = signal<number[]>([]);
  chartYtd = signal<number[]>([]);
  chartMom = signal<number[]>([]);
  chartC5ma = signal<number[]>([]);

  leftMin = signal<number>(null);
  leftMax = signal<number>(null);
  rightMin = signal<number>(null);
  rightMax = signal<number>(null);
  urlChartSeries = signal<number[]>([]);
  indexed = signal<boolean>(false);
  baseYear = signal<string>(null);

  analyzerData = signal<AnalyzerData>(new AnalyzerData());
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

  analyzerParams = computed(() => {
    const analyzerSeries = this.analyzerSeriesStore().join('-');
    const params = {
      analyzerSeries: analyzerSeries,
      ...(this.urlChartSeries()?.length && {chartSeries: this.urlChartSeries().join('-')}),
      ...(this.indexed() && {index: `${this.indexed()}`}),
      ...(this.yRightSeries()?.length && { yright: `${this.yRightSeries().join('-')}`}),
      ...(this.yLeftSeries()?.length && { yleft: `${this.yLeftSeries().join('-')}`}),
      ...(this.leftMin() && { leftMin: `${this.leftMin()}`}),
      ...(this.leftMax() && { leftMax: `${this.leftMax()}`}),
      ...(this.rightMin() && { rightMin: `${this.rightMin()}`}),
      ...(this.rightMax() && { rightMax: `${this.rightMax()}`}),
      ...(this.column()?.length && {column: `${this.column().join('-')}`}),
      ...(this.area()?.length && {area: `${this.area().join('-')}`}),
      ...(this.chartYoy()?.length && {chartYoy: `${this.chartYoy().join('-')}`}),
      ...(this.chartYtd()?.length && {chartYtd: `${this.chartYtd().join('-')}`}),
      ...(this.chartMom()?.length && {chartMom: `${this.chartMom().join('-')}`}),
      ...(this.chartC5ma()?.length && {chartC5ma: `${this.chartC5ma().join('-')}`}),
    }
    return params;
  });

  checkAnalyzer = (seriesInfo: any) => this.analyzerSeriesStore().some(id => id === seriesInfo.id);

  updateAnalyzerSeries(data: number[]) {
    this.analyzerSeriesStore.update(() => [...data])
  }

  getVisibleCompareSeries = (series) => series.filter(s => s.visible);

  setCompareChartSeriesObject(series, startDate: string) {
    const indexed = this.indexed();
    const analyzerSeries = this.analyzerData().analyzerSeries;
    if (analyzerSeries.length && indexed) {
      const visibleCompareSeries = this.getVisibleCompareSeries(analyzerSeries);
      const seriesToCalcBaseYear = visibleCompareSeries.length ? visibleCompareSeries : analyzerSeries;
      this.baseYear.set(this.getIndexBaseYear(seriesToCalcBaseYear, startDate));
    }
    const baseYear = this.baseYear();
    const chartValues = series.observations.map(obs => obs.displayName);
    const selectedChartTransformation = chartValues.find(name => name === this.assignChartTransformation(+series.id)) || chartValues[0];
    const selectedTransformation = series.observations.find(t => t.displayName === selectedChartTransformation).values;
    const selectedChartType = this.assignChartType(series);
    const units = analyzerSeries.map(s => s.yAxisText);
    series.yAxisText = this.setYAxisLabel(indexed, baseYear, series, selectedChartTransformation);
    series.className = series.id;
    series.name = this.formatDisplayName(series, indexed, selectedChartTransformation);
    series.data = indexed ? this.getChartIndexedValues(selectedTransformation, baseYear) : [...selectedTransformation];
    series.levelData = [...selectedTransformation];
    series.yAxis = this.assignYAxisSide(series, units);
    series.type = selectedChartType;
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
    series.selectedChartType = selectedChartType;
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

  makeCompareSeriesVisible(series: any, startDate: string) {
    const { analyzerSeries } = this.analyzerData();
    const indexed = this.indexed();
    analyzerSeries.find(s => s.id === series?.id).visible = true;
    const visibleCompareSeries = analyzerSeries.filter(s => s.visible);
    const seriesToCalcBaseYear = visibleCompareSeries.length ? visibleCompareSeries : analyzerSeries;
    this.baseYear.set(this.getIndexBaseYear(seriesToCalcBaseYear, startDate));
    if (visibleCompareSeries.length && indexed) {
      this.updateBaseYear(startDate);
    }
    this.analyzerData.update(data => data = {...data, analyzerSeries: [...analyzerSeries]});
    this.urlChartSeries.update(chartSeries => chartSeries = [...chartSeries, series.id]);
  }

  updateCompareSeriesAxis(seriesId: any, axis: string) {
    const { analyzerSeries } = this.analyzerData();
    const visibleCompareSeries = analyzerSeries.filter(s => s.visible);
    const selectedCompareSeries = visibleCompareSeries.find(s => s.className === seriesId);
    const rightSeriesMatch = this.yRightSeries().find(id => id === seriesId);
    const leftSeriesMatch = this.yLeftSeries().find(id => id === seriesId);
    const indexed = this.indexed();
    const baseYear = this.baseYear();
    if (axis === 'right' && !rightSeriesMatch) {
      this.yRightSeries.update(series => [...series, seriesId]);
    }
    if (axis === 'left' && rightSeriesMatch) {
      const matchIndex = this.yRightSeries().findIndex(id => id === seriesId);
      this.yRightSeries.update((series) => {
        series.splice(matchIndex, 1);
        return series;
      });
    }
    if (axis === 'right' && leftSeriesMatch) {
      const matchIndex = this.yLeftSeries().findIndex(id => id === seriesId);
      this.yLeftSeries.update((series) => {
        series.splice(matchIndex, 1);
        return series;
      });
    }
    if (axis === 'left' && !leftSeriesMatch) {
      this.yLeftSeries.update(series => [...series, seriesId]);
    }
    selectedCompareSeries.yAxis = axis;
    selectedCompareSeries.yAxisText = this.setYAxisLabel(indexed, baseYear, selectedCompareSeries, selectedCompareSeries.selectedChartTransformation);
    this.analyzerData.update((data) => {
      return {...data, analyzerSeries: [...data.analyzerSeries]}
    });
  }

  findSelectedCompareSeries = (seriesId) => {
    const { analyzerSeries } = this.analyzerData();
    const compareSeries = analyzerSeries.filter(s => s.visible);
    return compareSeries.find(s => s.className === seriesId);
  }

  updateCompareChartType(seriesId: number, chartType: string) {
    const column = this.column();
    const area = this.area();
    const matchInArea = area.find(id => id === seriesId);
    const matchInColumn = column.find(id => id === seriesId);
    const selectedCompareSeries = this.findSelectedCompareSeries(seriesId);
    if (chartType === 'column' && !matchInArea) {
      this.column.update(series => [...series, seriesId]);
    }
    if (chartType === 'column' && matchInArea) {
      const matchIndex = area.findIndex(id => id === seriesId);
      this.column.update(series => [...series, seriesId]);
      this.area.update((series) => {
        series.splice(matchIndex, 1);
        return series;
      });
    }
    if (chartType === 'area' && !matchInColumn) {
      this.area.update(series => [...series, seriesId]);
    }
    if (chartType === 'area' && matchInColumn) {
      const matchIndex = column.findIndex(id => id === seriesId);
      this.column.update((series) => {
        series.splice(matchIndex, 1);
        return series;
      });
      this.area.update(series => [...series, seriesId]);
    }
    if (chartType === 'line' && matchInColumn) {
      const matchIndex = column.findIndex(id => id === seriesId);
      this.column.update((series) => {
        series.splice(matchIndex, 1);
        return series;
      });
    }
    if (chartType === 'line' && matchInArea) {
      const matchIndex = area.findIndex(id => id === seriesId);
      this.area.update((series) => {
        series.splice(matchIndex, 1);
        return series;
      });
    }
    selectedCompareSeries.type = chartType;
    selectedCompareSeries.selectedChartType = chartType;
    this.analyzerData.update((data) => {
      const selected = data.analyzerSeries.findIndex(series => series.id === seriesId);
      data.analyzerSeries[selected].selectedChartType = chartType;
      return {...data, analyzerSeries: [...data.analyzerSeries]}
    });
  }

  updateCompareChartTransformation(seriesId: number, transformation: string) {
    const { analyzerSeries } = this.analyzerData();
    const selectedCompareSeries = analyzerSeries.find(s => s.className === seriesId)
    if (selectedCompareSeries) {
      selectedCompareSeries.selectedChartTransformation = selectedCompareSeries.chartValues.find(t => t === transformation);
      this.updateCompareSeriesDataAndAxes(analyzerSeries);
    }
  }

  filterTransformationTrackers(transformationArr, seriesId) {
    const matchIndex = transformationArr.findIndex(id => id === seriesId);
    if (matchIndex > -1) {
      transformationArr.splice(matchIndex, 1);
    }
  }

  updateCompareSeriesDataAndAxes(series: Array<any>) {
    const indexed = this.indexed();
    const baseYear = this.baseYear();
    const { analyzerSeries } = this.analyzerData();
    series.forEach((s) => {
      s.name = this.formatDisplayName(s, indexed, s.selectedChartTransformation);
      s.data = indexed ? this.getChartIndexedValues(s.levelData, baseYear) : [...s.observations.find(t => t.displayName === s.selectedChartTransformation).values];
      s.levelData =  [...s.observations.find(t => t.displayName === s.selectedChartTransformation).values];
      s.yAxisText = this.setYAxisLabel(indexed, baseYear, s, s.selectedChartTransformation);
    });
    this.analyzerData.update(data => data = { ...data, analyzerSeries: [...series]});
  }

  removeFromComparisonChart(id: number, startDate: string) {
    const { analyzerSeries } = this.analyzerData();
    analyzerSeries.find(s => s.id === id).visible = false;
    this.urlChartSeries.update(series => series.filter(sId => sId !== id));
    this.updateBaseYear(startDate);
    this.analyzerData.update(data => data = {...data, analyzerSeries: [...analyzerSeries]});
  }

  toggleIndexValues(index: boolean, minYear: string) {
    this.indexed.set(index);
    const { analyzerSeries }  = this.analyzerData();
    const visibleCompareSeries = analyzerSeries.filter(s => s.visible);
    const seriesToCalcBaseYear = visibleCompareSeries.length ? visibleCompareSeries : analyzerSeries;
    const baseYear = this.getIndexBaseYear(seriesToCalcBaseYear, minYear);
    this.baseYear.set(baseYear);
    if (analyzerSeries) {
      this.updateCompareSeriesDataAndAxes(analyzerSeries);
    }
    analyzerSeries.forEach((s) => {
      s.gridDisplay = this.helperService.formatGridDisplay(s, 'lvl', 'ytd');
    })
    this.analyzerData.update(data => ({...data, analyzerSeries: analyzerSeries}));
  }

  updateBaseYear(startDate: string) {
    const { analyzerSeries } = this.analyzerData();
    const visibleCompareSeries = analyzerSeries.filter(s => s.visible);
    const seriesToCalcBaseYear = visibleCompareSeries.length ? visibleCompareSeries : analyzerSeries;
    if (seriesToCalcBaseYear.length) {
      this.baseYear.set(this.getIndexBaseYear(seriesToCalcBaseYear, startDate))
    }
    if (analyzerSeries) {
      this.updateCompareSeriesDataAndAxes(analyzerSeries);
    }
  }

  addToAnalyzer(seriesID: number) {
    this.analyzerSeriesStore.update(() => [...this.analyzerSeriesStore(), seriesID]);
  }

  removeFromAnalyzer(seriesID: number, startDate: string) {
    const { analyzerSeries } = this.analyzerData();
    this.analyzerSeriesStore.update(() => {
      return this.analyzerSeriesStore().filter(id => id !== seriesID);
    });
    this.analyzerData.update((data) => {
      return {...data, analyzerSeries: analyzerSeries.filter(s => s.id !== seriesID)};
    });
    this.updateBaseYear(startDate);
  }

  getAnalyzerData(aSeriesTracker: Array<any>, startDate: string, noCache: boolean) {
    this.analyzerData.update((data) => ({...new AnalyzerData()}));
    const ids = aSeriesTracker.map(id => id).join();
    this.portalSettings = this.dataPortalSettingsServ.dataPortalSettings[this.portal.universe];
    this.apiService.fetchPackageAnalyzer(ids, noCache).subscribe((results) => {
      const { series } = results;
      const analyzerDateWrapper = {} as DateWrapper;
      analyzerDateWrapper.firstDate = this.helperService.findDateWrapperStart(series);
      analyzerDateWrapper.endDate = this.helperService.fineDateWrapperEnd(series);
      const { series1Name } = this.portalSettings.highcharts;
      let analyzerSeries = [];
      const analyzerMeasurements = {};
      series.forEach((s) => {
        s.observations = this.helperService.formatSeriesForCharts(s);
        s.gridDisplay = this.helperService.formatGridDisplay(s, 'lvl', series1Name); 
        const seriesExists = analyzerSeries.find(aSeries => aSeries.id === s.id);
        if (!seriesExists) {
          const seriesData = this.formatSeriesForAnalyzer(s);
          seriesData.visible = this.isVisible(s, analyzerSeries);
          analyzerSeries.push(seriesData);
          this.setCompareChartSeriesObject(seriesData, startDate);

          if (analyzerMeasurements[seriesData.measurementName]) {
            analyzerMeasurements[seriesData.measurementName].push(seriesData);
          }
          if (!analyzerMeasurements[seriesData.measurementName]) {
            analyzerMeasurements[seriesData.measurementName] = [seriesData];
          }
        }
      });
      analyzerSeries = series;
      const siblingFreqs = this.getSiblingFrequencies(series);
      const displayFreqSelector = this.singleFrequencyAnalyzer(series);
      const analyzerFrequency = displayFreqSelector ? this.getCurrentAnalyzerFrequency(series, siblingFreqs) :
        this.getHighestFrequency(analyzerSeries);
      if (this.allowMoMTransformation(analyzerFrequency.freq)) {
        this.analyzerData.set({
          analyzerTableDates: [],
          sliderDates: [],
          displayFreqSelector,
          siblingFreqs,
          analyzerFrequency,
          analyzerSeries,
          analyzerMeasurements,
          analyzerDateWrapper,
          requestComplete: false
        });
        this.addMoMTransformation(ids, noCache);
      } else {
        const { tableDates, sliderDates } = this.createAnalyzerTable(analyzerSeries);
        this.analyzerData.set({
          analyzerTableDates: tableDates,
          sliderDates,
          displayFreqSelector,
          siblingFreqs,
          analyzerFrequency,
          analyzerSeries,
          analyzerMeasurements,
          analyzerDateWrapper,
          requestComplete: true
        });
      }
    });
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
      const { analyzerSeries } = this.analyzerData();
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
      const { tableDates, sliderDates } = this.createAnalyzerTable(analyzerSeries);
      this.analyzerData.update(data => data = {...data, analyzerTableDates: tableDates, sliderDates, requestComplete: true});
    });
  }

  isVisible = (series: any, analyzerSeries: Array<any>) => {
    const urlChartSeries = this.urlChartSeries();
    const inCompare = urlChartSeries.includes(series.id);
    // On load, analyzer should add 1 (or 2 if available) series to comparison chart
    // if user has not already added/removed series for comparison
    if ((!urlChartSeries.length || urlChartSeries.length < 2) && !inCompare) {
      this.urlChartSeries.update(chartSeries => [...chartSeries, series.id]);
      return true;
    }
    return urlChartSeries.includes(series.id);
  }

  addToCompareChart(compareSeries: Array<any>, seriesData: any, startDate: string) {
    const seriesExistsInCompare = compareSeries.find(s => s.className === seriesData.id);
    const urlChartSeries = this.urlChartSeries();

    if (!seriesExistsInCompare || urlChartSeries.find(chartSeries => chartSeries === seriesData.id)) {
      this.setCompareChartSeriesObject(seriesData, startDate);
    }
  }

  storeUrlChartSeries(urlChartSeries: string) {
    const urlCSeries = urlChartSeries.split('-').map(Number);
    this.urlChartSeries.update(series => series = [...series, ...urlCSeries])
  }

  removeAll() {
    this.analyzerSeriesStore.update(series => series = []);
    this.analyzerData.set(new AnalyzerData());
    this.yRightSeries.update(yRight => yRight = []);
    this.yLeftSeries.update(yLeft => yLeft = []);
    this.area.update(area => area = []);
    this.chartYoy.update(chartYoy => chartYoy = []);
    this.chartYtd.update(chartYtd => chartYtd = []);
    this.chartMom.update(chartMom => chartMom = []);
    this.chartC5ma.update(chartC5ma => chartC5ma = []);
    this.leftMin.set(null);
    this.leftMax.set(null);
    this.rightMin.set(null);
    this.rightMax.set(null);
    this.urlChartSeries.update(chartSeries => chartSeries = []);
    this.indexed.set(false);
    this.baseYear.set(null);
  }

  resetAnalyzerData = () => {
    return new AnalyzerData();
  }

  formatSeriesForAnalyzer = (series) => {
    const { frequency, seasonalAdjustment, frequencyShort } = series;
    const indexed = this.indexed();
    series.displayName = this.formatDisplayName(series, indexed);
    series.indexDisplayName = this.formatDisplayName(series, indexed);    
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

  assignYAxisSide(series: any, units: string[]) {
    const yLeftSeries = this.yLeftSeries();
    const yRightSeries = this.yRightSeries();
    if (yLeftSeries.length && yLeftSeries.some(id => id === series.id)) {
      return 'left';
    }
    if (yRightSeries.length && yRightSeries.some(id => id === series.id)) {
      return 'right';
    }
    const indexed = this.indexed();
    return !units.length || units[0] === series.yAxisText || indexed ? 'left' : 'right';
  }

  assignChartType(series: any) {
    const column = this.column();
    const area = this.area();
    if (column.length && column.some(id => id === series.id)) {
      return 'column';
    }
    if (area.length && area.some(id => id === series.id)) {
      return 'area';
    }
    return 'line';
  }

  assignChartTransformation = (id: number) => {
    if (this.chartYoy().includes(id)) {
      return 'YOY';
    }
    if (this.chartYtd().includes(id)) {
      return 'YTD';
    }
    if (this.chartMom().includes(id)) {
      return 'MOM';
    }
    if (this.chartC5ma().includes(id)) {
      return 'Annual Change';
    }
    return 'Level';
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
    const tableDates = this.createAnalyzerTableDates(analyzerSeries);
    const sliderDates = this.createSliderDates(tableDates);
    return { tableDates, sliderDates };
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
    if (start && end) {
      allDates = allDates.filter(date => date.date >= start && date.date <= end);
    }
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
    this.baseYear.set((maxObsStartDate > start || !start) ? maxObsStartDate : start);
    return this.baseYear();
  }
}
