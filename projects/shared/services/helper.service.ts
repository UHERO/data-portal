import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Frequency } from '../models/Frequency';
import { Geography } from '../models/Geography';
import { DateWrapper } from '../models/DateWrapper';
import { DateRange } from '../models/DateRange';

@Injectable({
  providedIn: 'root'
})
export class HelperService {
  // private categoryData = new Subject();
  currentFreqChange: BehaviorSubject<any> = new BehaviorSubject(null);
  currentFreq = this.currentFreqChange.asObservable();
  currentGeoChange: BehaviorSubject<any> = new BehaviorSubject(null);
  currentGeo = this.currentGeoChange.asObservable();
  currentFcChange: BehaviorSubject<any> = new BehaviorSubject(null);
  currentFc = this.currentFcChange.asObservable();
  currentDateRangeChange: BehaviorSubject<any> = new BehaviorSubject(<DateRange>{});
  currentDateRange = this.currentDateRangeChange.asObservable();

  startDate = signal<string>(null);
  endDate = signal<string>(null);
  endOfSample = signal<boolean>(null);
  useDefaultRange = signal<boolean>(null);

  constructor() { }

  setCacheId(category: any, routeParams: any) {
    let id = `category${category}`;
    Object.keys(routeParams).forEach((param) => {
      if (param !== 'routeStart' && param !== 'routeEnd') {
        id += routeParams[param] ? `${param}${routeParams[param]}` : ``;
      }
    });
    return id;
  }

  setStartDate(date: string) {
    this.startDate.set(date);
  }

  setEndDate(date: string) {
    this.endDate.set(date);
  }

  setEndOfSample(isEndOfSample) {
    this.endOfSample.set(isEndOfSample);
  }

  setUseDefaultRange(useDefault: boolean) {
    this.useDefaultRange.set(useDefault);
  }

  updateCurrentFrequency = (newFreq: Frequency) => {
    this.currentFreqChange.next(newFreq);
    return newFreq;
  }

  updateCurrentForecast = (newFc: string) => {
    this.currentFcChange.next(newFc);
    return newFc;
  }

  updateCurrentGeography = (newGeo: Geography) => {
    this.currentGeoChange.next(newGeo);
    return newGeo;
  }

  updateCurrentDateRange = (newDateRange: DateRange) => {
    this.currentDateRangeChange.next(newDateRange);
    return newDateRange;
  }

  setCurrentDateRange = (start: string, end: string, useDefault: boolean, dates: Array<any>) => {
    this.updateCurrentDateRange({
      startDate: start,
      endDate: end,
      useDefaultRange: useDefault,
      endOfSample: end === dates[dates.length - 1].date
    });
  }

  getIdParam = (id: any) => {
    if (id === undefined) {
      return null;
    }
    if (id && isNaN(+id)) {
      // id param is a string, display search results
      return id;
    }
    if (id && +id) {
      // id of category selected in sidebar
      return +id;
    }
  }

  toggleSeriesDisplay = (hasSeasonal: boolean, showSeasonal: boolean, measurement: Array<any>, analyzerView: boolean) => {
    measurement.forEach((series) => {
      const display = this.shouldDisplay(series, showSeasonal, hasSeasonal, analyzerView);
      series.display = display;
      series.displaySeasonalMessage = false;
    });
    if (!measurement.some(series => series.display)) {
      measurement.forEach((series) => {
        series.displaySeasonalMessage = true;
      });
    }
  }

  shouldDisplay = (series: any, showSeasonal: boolean, hasSeasonal: boolean, analyzerView: boolean) => {
    const { seasonalAdjustment, frequencyShort } = series;
    /* series at the annual frequency or where seasonality is not applicable should be displayed
    series should also be displayed if no seasonality is applicable to the entire category or
    if the user is in the analyzer */
    if (!seasonalAdjustment || seasonalAdjustment === 'not_applicable' || analyzerView || frequencyShort === 'A' || !hasSeasonal) {
      return true;
    }
    if (showSeasonal && seasonalAdjustment === 'seasonally_adjusted') {
      return true;
    }
    if (!showSeasonal && seasonalAdjustment === 'not_seasonally_adjusted') {
      return true;
    }
    return false;
  }

  checkIfSeriesAvailable = (noData: boolean, data: Object) => {
    const allSeries = Object.keys(data).reduce((dataArr, measurement) => {
      return dataArr.concat(data[measurement]);
    }, []);
    return noData || (allSeries && !allSeries.some(s => s.display));
  }

  findSelectedDataList = (dataList, dataListId, dataListName) => {
    for (const list of dataList) {
      let name = dataListName || '';
      if (list.id === dataListId) {
        list.dataListName = `${name} ${list.name}`;
        return list;
      } else {
        if (list.children && Array.isArray(list.children)) {
          name += `${list.name} > `;
          const selected = this.findSelectedDataList(list.children, dataListId, name);
          if (selected) {
            return selected;
          }
        }
      }
    }
  }

  getCategoryDataLists = (category, dataListName) => {
    let name = dataListName || '';
    if (!category.children) {
      category.dataListName = `${name} ${category.name}`;
      return category;
    }
    if (category.children && Array.isArray(category.children)) {
      name += `${category.name} > `;
      return this.getCategoryDataLists(category.children[0], name);
    }
  }

  findDateWrapperStart = series => series.reduce((start: string, s) => (s.seriesObservations.observationStart < start || start === '') ? s.seriesObservations.observationStart : start, '');
  fineDateWrapperEnd = series => series.reduce((end: string, s) => (s.seriesObservations.observationEnd > end || end === '') ? s.seriesObservations.observationEnd : end, '');

  createDateArray = (dateStart: string, dateEnd: string, currentFreq: string, dateArray: Array<any>) => {
    const start = this.parseISOString(dateStart);
    const end = this.parseISOString(dateEnd);
    return this.addToDateArray(start, end, dateArray, currentFreq);
  }

  setDateWrapper = (series: Array<any>) => {
    const dateWrapper = {} as DateWrapper;
    dateWrapper.firstDate = this.setCategoryDateWrapperFirstDate(series);
    dateWrapper.endDate = this.setCategoryDateWrapperEndDate(series);
    return dateWrapper;
  }

  setCategoryDateWrapperFirstDate = (series: Array<any>) => {
    const startDates = series.map(s => s.seriesObservations.observationStart);
    return startDates.reduce((a, b) => b < a ? b : a);
  }

  setCategoryDateWrapperEndDate = (series: Array<any>) => {
    const endDates = series.map(s => s.seriesObservations.observationEnd);
    return endDates.reduce((a, b) => b > a ? b : a);
  }

  parseISOString = (dateString: string) => {
    const dateSplit = dateString.split(/\D+/).map(str => +str);
    return new Date(Date.UTC(dateSplit[0], --dateSplit[1], dateSplit[2]));
  }

  addToDateArray = (start: Date, end: Date, dateArray: Array<any>, currentFreq: string) => {
    const monthIncreases = {
      S: 6,
      Q: 3,
      M: 1
    };
    const monthIncrease = monthIncreases[currentFreq] || null;
    while (start <= end) {
      const yearStr = start.getUTCFullYear()
      const monthStr = this.paddedMonthDateString(start.getUTCMonth() + 1);
      const dateStr = this.paddedMonthDateString(start.getUTCDate())
      const q = this.getQuarter(monthStr);
      const dateStrFormat = this.parseISOString(`${yearStr}-${monthStr}-${dateStr}`).toISOString().substring(0, 10);
      const tableDate = this.getTableDate(start, currentFreq, q, dateStrFormat);
      dateArray.push({ date: dateStrFormat, tableDate });
      if (currentFreq === 'A') {
        start.setUTCFullYear(start.getUTCFullYear() + 1);
        start.setUTCMonth(0);
        start.setUTCDate(1);
      }
      if (currentFreq === 'M' || currentFreq === 'S' || currentFreq === 'Q') {
        start.setUTCMonth(start.getUTCMonth() + monthIncrease);
      }
      if (currentFreq === 'W') {
        start.setUTCDate(start.getUTCDate() + 7);
      }
      if (currentFreq === 'D') {
        start.setUTCDate(start.getUTCDate() + 1);
      }
    }
    return dateArray;
  }

  getTableDate = (start: Date, currentFreq: string, q: string, fullDateStr: string) => {
    const dateStr = {
      A: `${start.getUTCFullYear()}`,
      Q: `${start.getUTCFullYear()} ${q}`,
      W: fullDateStr,
      D: fullDateStr
    };
    return dateStr[currentFreq] || `${start.getUTCFullYear()}-${this.paddedMonthDateString(start.getUTCMonth() + 1)}`;
  }

  getQuarter = (month: string) => {
    const quarters = {
      '01': 'Q1',
      '04': 'Q2',
      '07': 'Q3',
      '10': 'Q4'
    };
    return quarters[month];
  }

  paddedMonthDateString = (partialDate: number) => {
    return `0${partialDate}`.slice(-2);
  }

  getTransformations = (transformations: Array<any>) => {
    //possible transformations available
    return {
      level: transformations.find(obj => obj.transformation === 'lvl'),
      yoy: transformations.find(obj => obj.transformation === 'pc1'),
      ytd: transformations.find(obj => obj.transformation === 'ytd'),
      c5ma: transformations.find(obj => obj.transformation === 'c5ma'),
      mom: transformations.find(obj => obj.transformation === 'mom')
    };
  }

  binarySearch = (valueList, date) => {
    let start = 0;
    let end = valueList.length - 1;
    let middle = Math.floor((start + end) / 2);
    // check if array is in descending order
    const descending = valueList[start] > valueList[end];
    while (valueList[middle] !== date && start < end) {
      if (date < valueList[middle]) {
        start = descending ? middle + 1 : start;
        end = descending ? end : middle - 1;
      } else {
        start = descending ? start : middle + 1;
        end = descending ? middle - 1 : end;
      }
      middle = Math.floor((start + end) / 2);
    }
    return (valueList[middle] !== date) ? -1 : middle;
  }

  // find first date that is greater than or equal to dateToFind
  binarySearchStartDate = (dateList: Array<any>, dateToFind: string) => {
    let start = 0;
    let end = dateList.length - 1;
    while (start <= end) {
      const updatedBoundaries = this.findFirstDateGreaterOrEqualTarget(start, end, dateList, dateToFind);
      start = updatedBoundaries.start;
      end = updatedBoundaries.end;
    }
    return start;
  }

  binarySearchEndDate = (dateList: Array<any>, dateToFind: string) => {
    let start = 0;
    let end = dateList.length - 1;
    while (start <= end) {
      const updatedBoundaries = this.findLastDateLessOrEqualTarget(start, end, dateList, dateToFind);
      start = updatedBoundaries.start;
      end = updatedBoundaries.end;
    }
    return end;
  }

  findLastDateLessOrEqualTarget = (start: number, end: number, dateList: Array<any>, dateToFind: string) => {
    let middle = Math.floor((start + end) / 2);
    if (dateList[middle] > dateToFind) {
      end = middle - 1;
    } else {
      start = middle + 1;
    }
    return { start, end };
  }

  findFirstDateGreaterOrEqualTarget = (start: number, end: number, dateList: Array<any>, dateToFind: string) => {
    let middle = Math.floor((start + end) / 2);
    if (dateList[middle] < dateToFind) {
      start = middle + 1;
    } else {
      end = middle - 1;
    }
    return { start, end };
  }

  createSeriesChart(dateRange, transformations, universe: string) {
    const { level, yoy, ytd, c5ma } = transformations;
    const levelValue = [];
    let yoyValue = [];
    let ytdValue = [];
    let c5maValue = [];
    dateRange.forEach((date) => {
      if (level) {
        levelValue.push(this.createDateValuePairs(level.dates, date.date, level.values));
      }
      if (yoy) {
        yoyValue.push(this.createDateValuePairs(yoy.dates, date.date, yoy.values));
      }
      if (ytd) {
        ytdValue.push(this.createDateValuePairs(ytd.dates, date.date, ytd.values));
      }
      if (c5ma) {
        c5maValue.push(this.createDateValuePairs(c5ma.dates, date.date, c5ma.values));
      }
    });
    if (!yoyValue.length) {
      yoyValue = new Array(level.dates.length - 1).fill(null);
    }
    if (!ytdValue.length) {
      ytdValue = new Array(level.dates.length - 1).fill(null);
    }
    return { level: levelValue, yoy: yoyValue, ytd: ytdValue, c5ma: c5maValue };
  }

  createDateValuePairs = (transformationDates: Array<any>, date: string, values: Array<any>) => {
    if (transformationDates) {
      const transformationIndex = this.binarySearch(transformationDates, date);
      return [Date.parse(date), transformationIndex > -1 ? +values[transformationIndex] : null];
    }
  }

  addToTable(valueArray, date, tableObj, value, formattedValue, decimals, universe: string) {
    const tableEntry = this.binarySearch(valueArray.dates, date.date);
    if (tableEntry > -1) {
      tableObj[value] = +valueArray.values[tableEntry];
      tableObj[formattedValue] = this.formattedValue(valueArray.values[tableEntry], decimals, universe);
    }
  }

  formatSeriesForCharts = (series: any) => {
    let dateArray = [];
    const observationNames = {
      lvl: 'Level',
      ytd: 'YTD',
      pc1: 'YOY',
      c5ma: 'Annual Change',
      mom: 'MOM'
    };
    const { observationStart, observationEnd, transformationResults } = series.seriesObservations;
    this.createDateArray(observationStart, observationEnd, series.frequencyShort, dateArray);
    return transformationResults.map((t) => {
      const pseudoZones = this.getPseudoZones(t);
      const dateValuePairs = [];
      const { universe } = series;
      // YTD and YOY transformations should be rounded to 1 decimal place
      if (t.transformation !== 'lvl' && t.transformation !== 'c5ma') {
        t.values = t.values.map(val => this.formattedValue(val, 1, universe).replace(/,/g, ''));
      }
      dateArray.forEach((date) => {
        dateValuePairs.push(this.createDateValuePairs(t.dates, date.date, t.values));
      })
      return {
        name: t.transformation,
        displayName: observationNames[t.transformation],
        values: dateValuePairs,
        pseudoZones,
        start: observationStart,
        end: observationEnd,
        dates: dateArray
      };
    }, {});
  }

  getPseudoZones = (transformation: any) => {
    const pseudoZones = [];
    if (transformation.pseudoHistory) {
      transformation.pseudoHistory.forEach((obs, index) => {
        if (obs && !transformation.pseudoHistory[index + 1]) {
          pseudoZones.push({ value: Date.parse(transformation.dates[index]), dashStyle: 'dash', color: '#7CB5EC', className: 'pseudoHistory' });
        }
      });
    }
    return pseudoZones;
  }

  formatGridDisplay = (serie: any, series0: string, series1: string) => {
    const { observationStart, observationEnd } = serie.seriesObservations;
    const s0 = serie.observations.find(obs => obs.name === series0);
    const s1 = serie.observations.find(obs => obs.name === series1);
    return {
      chartData: {
        series0: s0,
        series1: s1,
        pseudoZones: s0.pseudoZones
      },
      start: observationStart,
      end: observationEnd
    };
  }

  getIndexedTransformation = (transformation: any, baseYear: string) => {
    const { name, start, end, pseudoZones, values, dates } = transformation;
    return {
      name,
      start,
      end,
      pseudoZones,
      dates,
      values: this.formatSeriesIndexData(values, dates, baseYear)
    }
  }

  formatSeriesIndexData = (transformation, dates: Array<any>, baseYear: string) => {
    if (transformation) {
      const indexDateExists = this.binarySearch(dates.map(d => d.date), baseYear);
      return dates.map((curr, ind, arr) => {
        return indexDateExists > -1 ? [Date.parse(curr.date), +transformation[ind][1] / +transformation[indexDateExists][1] * 100] : [Date.parse(curr.date), null];
      });
    }
  }

  createSeriesChartData = (transformation, dates) => {
    if (transformation) {
      const transformationValues = [];
      dates.forEach((sDate) => {
        const dateExists = this.binarySearch(transformation.dates, sDate.date);
        dateExists > -1 ?
          transformationValues.push([Date.parse(sDate.date), +transformation.values[dateExists]]) :
          transformationValues.push([Date.parse(sDate.date), null]);
      });
      return transformationValues;
    }
  }

  createSeriesTable(dateRange: Array<any>, transformations, decimals: number, universe: string) {
    const level = transformations.level;
    const yoy = transformations.yoy;
    const ytd = transformations.ytd;
    const c5ma = transformations.c5ma;
    const table = dateRange.map((date) => {
      const tableObj = {
        date: date.date,
        tableDate: date.tableDate,
        value: Infinity,
        formattedValue: '',
        yoyValue: Infinity,
        formattedYoy: '',
        ytdValue: Infinity,
        formattedYtd: '',
        c5maValue: Infinity,
        formattedC5ma: ''
      };
      if (level) {
        this.addToTable(level, date, tableObj, 'value', 'formattedValue', decimals, universe);
      }
      if (yoy) {
        this.addToTable(yoy, date, tableObj, 'yoyValue', 'formattedYoy', 1, universe);
      }
      if (ytd) {
        this.addToTable(ytd, date, tableObj, 'ytdValue', 'formattedYtd', 1, universe);
      }
      if (c5ma) {
        this.addToTable(c5ma, date, tableObj, 'c5maValue', 'formattedC5ma', decimals, universe);
      }
      return tableObj;
    });
    return table;
  }

  formattedValue = (value, decimals, universe) => {
    return (value === null || value === Infinity) ? '' : this.formatNum(+value, decimals, universe)
  };

  formatDate(date: string, freq: string) {
    const year = date.substring(0, 4);
    const month = date.substring(5, 7);
    if (freq === 'A') {
      return year;
    }
    if (freq === 'Q') {
      const m = +month;
      if (m >= 0 && m <= 2) {
        return `${year} Q1`;
      }
      if (m >= 3 && m <= 5) {
        return `${year} Q2`;
      }
      if (m >= 6 && m <= 8) {
        return `${year} Q3`;
      }
      if (m >= 9 && m <= 11) {
        return `${year} Q4`;
      }
    }
    if (freq === 'M' || freq === 'S') {
      return `${year}-${month}`;
    }
    return date.substring(0, 11);
  }

  formatNum(num: number, decimal: number, universe: string) {
    if (universe === 'NTA' && num >= 1 && decimal === 2) {
      // per Andy Mason: display 2 significant digits, unless the number is >1, then display 1 significant digit.
      decimal = 1;
    }
    return num === Infinity ? ' ' : num.toLocaleString('en-US', { minimumFractionDigits: decimal, maximumFractionDigits: decimal });
  }

  setDefaultCategoryRange(freq, dateArray, defaults) {
    const defaultSettings = defaults.find(ranges => ranges.freq === freq);
    let lastYearInArray = +`${this.parseISOString(dateArray[dateArray.length - 1].date).getUTCFullYear()}`
    const defaultEnd = defaultSettings.end || lastYearInArray;
    let counter = dateArray.length - 1;
    while (lastYearInArray > defaultEnd) {
      counter--;
      lastYearInArray--
    }
    return this.getRanges(freq, counter, defaultSettings.range);
  }

  getSeriesStartAndEnd = (dates: any, start: string, end: string, freq: string, defaultRange) => {
    const defaultRanges = this.setDefaultCategoryRange(freq, dates, defaultRange);
    let { startIndex, endIndex } = defaultRanges;
    if (start) {
      const dateFromExists = this.checkDateExists(start, dates, freq, 'start');
      if (dateFromExists > -1) {
        startIndex = dateFromExists;
      }
      if (dateFromExists === -1) {
        startIndex = 0;
      }
    }
    if (end) {
      const dateToExists = this.checkDateExists(end, dates, freq, 'end');
      if (dateToExists > -1) {
        endIndex = dateToExists;
      }
      if (dateToExists === -1) {
        endIndex = dates.length - 1;
      }
    }
    return { seriesStart: startIndex, seriesEnd: endIndex };
  }

  checkDateExists = (date: string, dates: Array<any>, freq: string, boundary: string) => {
    let dateToCheck = date;
    const year = date.substring(0, 4);
    if (freq === 'A') {
      dateToCheck = `${year}-01-01`;
    }
    if (freq === 'Q') {
      const month = +date.substring(5, 7);
      if (month >= 1 && month <= 3) {
        dateToCheck = `${year}-01-01`;
      }
      if (month >= 4 && month <= 6) {
        dateToCheck = `${year}-04-01`;
      }
      if (month >= 7 && month <= 9) {
        dateToCheck = `${year}-07-01`;
      }
      if (month >= 10 && month <= 12) {
        dateToCheck = `${year}-10-01`;
      }
    }
    const dateArray = dates.map(d => d.date);
    return boundary === 'start' ?
      this.binarySearchStartDate(dateArray, dateToCheck) :
      this.binarySearchEndDate(dateArray, dateToCheck);
  }

  getRanges(freq: string, counter: number, range: number) {
    // Range = default amount of years to display
    const multiplier = {
      A: 1,
      Q: 4,
      S: 2,
      M: 12,
      W: 52,
      D: 365
    };
    return { startIndex: this.getRangeStart(counter, range, multiplier[freq]), endIndex: counter };
  }

  getRangeStart = (counter, range, multiplier) => {
    const index = counter - multiplier * range;
    return index < 0 ? 0 : index;
  }

  getTableDates = (dateArray: Array<any>) => dateArray.map(date => date.tableDate);
}
