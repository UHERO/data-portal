import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Frequency, Geography, DateWrapper } from './tools.models';

@Injectable({
  providedIn: 'root'
})
export class HelperService {
  private categoryData = new Subject();
  currentFreqChange: BehaviorSubject<any> = new BehaviorSubject(null);
  currentFreq = this.currentFreqChange.asObservable();
  currentGeoChange: BehaviorSubject<any> = new BehaviorSubject(null);
  currentGeo = this.currentGeoChange.asObservable();
  currentFcChange: BehaviorSubject<any> = new BehaviorSubject(null);
  currentFc = this.currentFcChange.asObservable();


  constructor() { }

  setCacheId(category: any, routeParams: any) {
    let id = `category${category}`;
    Object.keys(routeParams).forEach((param) => {
      id += routeParams[param] ? `${param}${routeParams[param]}` : ``;
    });
    return id;
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

  toggleSeriesForSeasonalDisplay = (series: any, showSeasonal: boolean, hasSeasonal: boolean) => {
    const seasonalAdjustment = series.seasonalAdjustment;
    if (!hasSeasonal) {
      return true;
    }
    if (!showSeasonal && (seasonalAdjustment !== 'seasonally_adjusted' || seasonalAdjustment === 'not_applicable')) {
      return true;
    }
    return showSeasonal && (seasonalAdjustment === 'seasonally_adjusted' || seasonalAdjustment === 'not_applicable');
  }

  checkIfSeriesAvailable = (noData: boolean, data: Array<any>) => {
    return noData || (data && !data.some(s => s.display));
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
      const dateStrFormat = this.parseISOString(`${yearStr}-${monthStr}-${dateStr}`).toISOString().substr(0, 10);
      const tableDate = this.getTableDate(start, currentFreq, q, dateStrFormat);
      dateArray.push({ date: dateStrFormat , tableDate });
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
      c5ma: transformations.find(obj => obj.transformation === 'c5ma')
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

  createSeriesChart(dateRange, transformations) {
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
      return [ Date.parse(date), transformationIndex > -1 ? +values[transformationIndex] : null ];  
    }
  }

  addToTable(valueArray, date, tableObj, value, formattedValue, decimals) {
    const tableEntry = this.binarySearch(valueArray.dates, date.date);
    if (tableEntry > -1) {
      tableObj[value] = +valueArray.values[tableEntry];
      tableObj[formattedValue] = this.formattedValue(valueArray.values[tableEntry], decimals);
    }
  }

  formatSeriesForCharts = (series: any) => {
    let dateArray = [];
    const observationNames = {
      lvl: 'Level',
      ytd: 'Year-to-Date',
      pc1: 'Year-over-Year',
      c5ma: 'Annual Change'
    };
    const { observationStart, observationEnd, transformationResults } = series.seriesObservations;
    this.createDateArray(observationStart, observationEnd, series.frequencyShort, dateArray);
    return transformationResults.map((t) => {
      const pseudoZones = this.getPseudoZones(t);
      const dateValuePairs = [];
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

  createSeriesTable(dateRange: Array<any>, transformations, decimals: number) {
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
        this.addToTable(level, date, tableObj, 'value', 'formattedValue', decimals);
      }
      if (yoy) {
        this.addToTable(yoy, date, tableObj, 'yoyValue', 'formattedYoy', decimals);
      }
      if (ytd) {
        this.addToTable(ytd, date, tableObj, 'ytdValue', 'formattedYtd', decimals);
      }
      if (c5ma) {
        this.addToTable(c5ma, date, tableObj, 'c5maValue', 'formattedC5ma', decimals);
      }
      return tableObj;
    });
    return table;
  }

  formattedValue = (value, decimals) => (value === null || value === Infinity) ? '' : this.formatNum(+value, decimals);

  formatDate(date: string, freq: string) {
    const year = date.substr(0, 4);
    const month = date.substr(5, 2);
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
    return date.substr(0, 10);
  }

  formatNum(num: number, decimal: number) {
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

  getSeriesStartAndEnd = (dates: Array<any>, start: string, end: string, freq: string, defaultRange) => {
    const defaultRanges = this.setDefaultCategoryRange(freq, dates, defaultRange);
    let { startIndex, endIndex } = defaultRanges;
    if (start) {
      const dateFromExists = this.checkDateExists(start, dates, freq);
      if (dateFromExists > -1) {
        startIndex = dateFromExists;
      }
      if (start < dates[0].date) {
        startIndex = defaultRanges.startIndex;
      }
    }
    if (end) {
      const dateToExists = this.checkDateExists(end, dates, freq);
      if (dateToExists > -1) {
        endIndex = dateToExists;
      }
      if (end > dates[dates.length - 1].date) {
        endIndex = defaultRanges.endIndex;
      }
    }
    return { seriesStart: startIndex, seriesEnd: endIndex };
  }

  checkDateExists = (date: string, dates: Array<any>, freq: string) => {
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
    return this.binarySearch(dateArray, dateToCheck);
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
