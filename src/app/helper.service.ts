// Common function used for category multi-chart and table displays

import { Injectable } from '@angular/core';
import { DateWrapper } from './date-wrapper';

@Injectable()
export class HelperService {

  constructor() { }

  createDateArray(dateStart: string, dateEnd: string, currentFreq: string, dateArray: Array<any>) {
    let startYear = +dateStart.substr(0, 4);
    const endYear = +dateEnd.substr(0, 4);
    let startMonth = +dateStart.substr(5, 2);
    const endMonth = +dateEnd.substr(5, 2);
    const m = { 1: '01', 2: '02', 3: '03', 4: '04', 5: '05', 6: '06', 7: '07', 8: '08', 9: '09', 10: '10', 11: '11', 12: '12' };
    const q = { 1: 'Q1', 4: 'Q2', 7: 'Q3', 10: 'Q4' };
    while (startYear + '-' + m[startMonth] + '-01' <= endYear + '-' + m[endMonth] + '-01') {
      if (currentFreq === 'A') {
        dateArray.push({ date: startYear.toString() + '-01-01', tableDate: startYear.toString() });
        startYear += 1;
      }
      if (currentFreq === 'S') {
        dateArray.push({ date: startYear.toString() + '-' + m[startMonth] + '-01', tableDate: startYear.toString() + '-' + m[startMonth] });
        startYear = startMonth === 7 ? startYear += 1 : startYear;
        startMonth = startMonth === 1 ? 7 : 1;
      }
      if (currentFreq === 'M') {
        dateArray.push({ date: startYear.toString() + '-' + m[startMonth] + '-01', tableDate: startYear.toString() + '-' + m[startMonth] });
        startYear = startMonth === 12 ? startYear += 1 : startYear;
        startMonth = startMonth === 12 ? 1 : startMonth += 1;
      }
      if (currentFreq === 'Q') {
        dateArray.push({ date: startYear.toString() + '-' + m[startMonth] + '-01', tableDate: startYear.toString() + ' ' + q[startMonth] });
        startYear = startMonth === 10 ? startYear += 1 : startYear;
        startMonth = startMonth === 10 ? startMonth = 1 : startMonth += 3;
      }
    }
    return dateArray;
  }

  dataTransform(seriesObs, dates, decimals) {
    let results = null;
    const observations = seriesObs;
    const start = observations.observationStart;
    const end = observations.observationEnd;
    const levelResults = observations.transformationResults.find(obs => obs.transformation === 'lvl');
    const yoyResults = observations.transformationResults.find(obs => obs.transformation === 'pc1');
    const ytdResults = observations.transformationResults.find(obs => obs.transformation === 'ytd');
    const c5maResults = observations.transformationResults.find(obs => obs.transformation === 'c5ma');
    const pseudoZones = [];
    let level, yoy, ytd, c5ma, combinedObservations;
    // Method for new API observation responses
    if (levelResults.dates) {
      level = this.formatObservations(levelResults);
      level.forEach((l, index) => {
        if (l.pseudoHistory && !level[index + 1].pseudoHistory) {
          pseudoZones.push({ value: Date.parse(l.date), dashStyle: 'dash', color: '#7CB5EC', className: 'pseudoHistory' });
        }
      });
    }
    if (yoyResults && yoyResults.dates) {
      yoy = this.formatObservations(yoyResults);
    }
    if (ytdResults && ytdResults.dates) {
      ytd = this.formatObservations(ytdResults);
    }
    if (c5maResults && c5maResults.dates) {
      c5ma = this.formatObservations(c5maResults);
    }
    combinedObservations = level.map((entry, index) => {
      const obj = { date: '', value: null, yoyValue: null, ytdValue: null, c5maValue: null };
      const yoyDateIndex = yoy ? yoy.findIndex(y => y.date === entry.date) : -1;
      const ytdDateIndex = ytd ? ytd.findIndex(y => y.date === entry.date) : -1;
      const c5maDateIndex = c5ma ? c5ma.findIndex(c => c.date === entry.date) : -1;
      obj.date = entry.date;
      obj.value = entry.value;
      obj.yoyValue = yoyDateIndex > -1 ? yoy[yoyDateIndex].value : null;
      obj.ytdValue = ytdDateIndex > -1 ? ytd[ytdDateIndex].value : null;
      obj.c5maValue = c5maDateIndex > -1 ? c5ma[c5maDateIndex].value : null;
      return obj;
    });
    const tableData = this.seriesTable(combinedObservations, dates, decimals);
    const chart = this.seriesChart(combinedObservations, dates);
    const chartData = { level: chart.level, pseudoZones: pseudoZones, yoy: chart.yoy, ytd: chart.ytd, c5ma: chart.c5ma };
    results = { chartData: chartData, tableData: tableData, start: start, end: end };
    return results;
  }

  formatObservations(results) {
    const dates = results.dates;
    const values = results.values;
    const pseudoHistory = results.pseudoHistory;
    const formattedResults = dates.map((d, index) => {
      const entry = { date: '', value: Infinity, pseudoHistory: false };
      entry.date = d;
      entry.value = +values[index];
      entry.pseudoHistory = pseudoHistory[index];
      return entry;
    });
    return formattedResults;
  }

  seriesTable(seriesData, dateRange, decimals) {
    const table = [];
    dateRange.forEach((date) => {
      table.push({
        date: date.date,
        tableDate: date.tableDate,
        value: Infinity,
        yoyValue: Infinity,
        ytdValue: Infinity,
        c5maValue: Infinity
      });
    });
    seriesData.forEach((data) => {
      const seriesDate = data.tableDate ? data.tableDate : data.date;
      const tableEntry = table.find(date => data.tableDate ? date.tableDate === seriesDate : date.date === seriesDate);
      tableEntry.value = data.value;
      tableEntry.formattedValue = (data.value === null || data.value === Infinity) ? ' ' : this.formatNum(+data.value, decimals);
      tableEntry.yoyValue = data.yoyValue;
      tableEntry.formattedYoy = (data.yoyValue === null || data.yoyValue === Infinity) ? ' ' : this.formatNum(+data.yoyValue, decimals);
      tableEntry.ytdValue = data.ytdValue;
      tableEntry.formattedYtd = (data.ytdValue === null || data.ytdValue === Infinity) ? ' ' : this.formatNum(+data.ytdValue, decimals);
      tableEntry.c5maValue = data.c5maValue;
      tableEntry.formattedC5ma = (data.c5maValue === null || data.c5maValue === Infinity) ? ' ' : this.formatNum(+data.c5maValue, decimals);
    });
    return table;
  }

  seriesChart(seriesData, dateRange) {
    const levelValue = [];
    const yoyValue = [];
    const ytdValue = [];
    const c5maValue = [];
    dateRange.forEach((date) => {
      const data = seriesData.find(obs => obs.date === date.date);
      if (data) {
        levelValue.push([Date.parse(date.date), data.value]);
        yoyValue.push([Date.parse(date.date), data.yoyValue]);
        ytdValue.push([Date.parse(date.date), data.ytdValue]);
        c5maValue.push([Date.parse(date.date), data.c5maValue]);
      } else {
        levelValue.push([Date.parse(date.date), null]);
        yoyValue.push([Date.parse(date.date), null]);
        ytdValue.push([Date.parse(date.date), null]);
        c5maValue.push([Date.parse(date.date), null]);
      }
    });
    return { level: levelValue, yoy: yoyValue, ytd: ytdValue, c5ma: c5maValue };
  }

  setDateWrapper(displaySeries: Array<any>, dateWrapper: DateWrapper) {
    dateWrapper.firstDate = '';
    dateWrapper.endDate = '';
    displaySeries.forEach((series) => {
      if (dateWrapper.firstDate === '' || series.seriesInfo.seriesObservations.observationStart < dateWrapper.firstDate) {
        dateWrapper.firstDate = series.seriesInfo.seriesObservations.observationStart;
      }
      if (dateWrapper.endDate === '' || series.seriesInfo.seriesObservations.observationEnd > dateWrapper.endDate) {
        dateWrapper.endDate = series.seriesInfo.seriesObservations.observationEnd;
      }
    });
  }

  // Combine level and percent arrays from Observation data
  // Used to construct table data for single series view
  combineObsData(level, yoy, ytd, c5ma) {
    let data;
    data = level.map((obs) => {
      const obsObject = { date: obs.date, yoyValue: null, ytdValue: null, c5maValue: null, value: +obs.value };
      if (yoy) {
        const yoyObs = yoy.find(y => y.date === obs.date);
        obsObject.yoyValue = yoyObs ? +yoyObs.value : null;
      }
      if (ytd) {
        const ytdObs = ytd.find(y => y.date === obs.date);
        obsObject.ytdValue = ytdObs ? +ytdObs.value : null;
      }
      if (c5ma) {
        const c5maObs = c5ma.find(c => c.date === obs.date);
        obsObject.c5maValue = c5maObs ? +c5maObs.value : null;
      }
      return obsObject;
    });
    return data;
  }

  formatDate(date: string, freq: string) {
    const year = date.substr(0, 4);
    const month = date.substr(5, 2);
    const quarter = ['Q1', 'Q2', 'Q3', 'Q4'];
    const qMonth = ['01', '04', '07', '10'];
    if (freq === 'A') {
      return year;
    }
    if (freq === 'Q') {
      const monthIndex = qMonth.indexOf(month);
      return quarter[monthIndex] + ' ' + year;
    }
    if (freq === 'M' || freq === 'S') {
      return month + '-' + year;
    }
  }

  formatNum(num: number, decimal: number) {
    let fixedNum: any;
    fixedNum = num.toFixed(decimal);
    // remove decimals
    const int = fixedNum | 0;
    const signCheck = num < 0 ? 1 : 0;
    // store deicmal value
    const remainder = Math.abs(fixedNum - int);
    const decimalString = ('' + remainder.toFixed(decimal)).substr(2, decimal);
    const intString = '' + int;
    let i = intString.length;
    let r = '';
    while ((i -= 3) > signCheck) { r = ',' + intString.substr(i, 3) + r; }
    const returnValue = intString.substr(0, i + 3) + r + (decimalString ? '.' + decimalString : '');
    // If int == 0, converting int to string drops minus sign
    if (int === 0 && num < 0) {
      // Check if decimal string contains only 0's (i.e. return value === 0.00)
      return /^0*$/.test(decimalString) ? returnValue : '-' + returnValue;
    }
    return returnValue;
  }

  // Get a unique array of available regions for a category
  uniqueGeos(geo, geoList) {
    const existGeo = geoList.find(region => region.handle === geo.handle);
    if (existGeo) {
      const freqs = geo.freqs;
      // If region already exists, check it's list of frequencies
      // Add frequency if it doesn't exist
      this.addFreq(freqs, existGeo);
    }
    if (!existGeo) {
      geoList.push(geo);
    }
  }

  // Check if freq exists in freqArray
  freqExist(freqArray, freq) {
    const exist = freqArray.find(frequency => frequency.freq === freq);
    return exist ? true : false;
  }

  addFreq(freqList, geo) {
    freqList.forEach((freq) => {
      if (!this.freqExist(geo.freqs, freq.freq)) {
        geo.freqs.push(freq);
      }
    });
  }

  // Get a unique array of available frequencies for a category
  uniqueFreqs(freq, freqList) {
    const existFreq = freqList.find(frequency => frequency.label === freq.label);
    if (existFreq) {
      const geos = freq.geos;
      // If frequency already exists, check it's list of regions
      // Add geo if it doesn't exist
      this.addGeo(geos, existFreq);
    }
    if (!existFreq) {
      freqList.push(freq);
    }
  }

  // Check if geo exists in geoArray
  geoExist(geoArray, geo) {
    const exist = geoArray.find(region => region.handle === geo);
    return exist ? true : false;
  }

  addGeo(geoList, freq) {
    geoList.forEach((geo) => {
      if (!this.geoExist(freq.geos, geo.handle)) {
        freq.geos.push(geo);
      }
    });
  }

  setDefaultChartRange(freq, dataArray, defaults) {
    const defaultEnd = defaults.end;
    let counter = dataArray.length - 1;
    while (new Date(dataArray[counter][0]).toISOString().substr(0, 4) > defaultEnd) {
      counter--;
    }
    return this.getRanges(freq, counter, defaults.range);
  }

  setDefaultSliderRange(freq, dateArray, defaults) {
    const defaultEnd = defaults.end;
    let counter = dateArray.length - 1;
    // https://github.com/IonDen/ion.rangeSlider/issues/298
    // Slider values being converted from strings to numbers for annual dates
    while (new Date(dateArray[counter].toString().substr(0, 4)).toISOString().substr(0, 4) > defaultEnd) {
      counter--;
    }
    return this.getRanges(freq, counter, defaults.range);
  }

  setDefaultTableRange(freq, dateArray, defaults) {
    const defaultEnd = defaults.end;
    let counter = dateArray.length - 1;
    while (new Date(dateArray[counter].date).toISOString().substr(0, 4) > defaultEnd) {
      counter--;
    }
    return this.getRanges(freq, counter, defaults.range);
  }

  getRanges(freq, counter, range) {
    // Range = default amount of years to display
    if (freq === 'A') {
      return { start: counter - 1 * range, end: counter };
    }
    if (freq === 'Q') {
      return { start: counter - 4 * range, end: counter };
    }
    if (freq === 'S') {
      return { start: counter - 2 * range, end: counter };
    }
    if (freq === 'M') {
      return { start: counter - 12 * range, end: counter };
    }
  }

  getTableDates(dateArray: Array<any>) {
    const tableDates = [];
    dateArray.forEach((date) => {
      tableDates.push(date.tableDate);
    });
    return tableDates;
  }
}
