// Common function used for category multi-chart and table displays

import { Injectable } from '@angular/core';
import { dateWrapper } from './date-wrapper';

@Injectable()
export class HelperService {

  constructor() { }

  calculateDateArray(dateStart: string, dateEnd: string, currentFreq: string, dateArray: Array<any>) {
    let start = +dateStart.substring(0, 4);
    let end = +dateEnd.substring(0, 4);

    while (start <= end) {
      if (currentFreq === 'A') {
        dateArray.push({ date: start.toString() + '-01-01', tableDate: start.toString() });
        start += 1;
      } else if (currentFreq === 'S') {
        let month = ['01', '07'];
        month.forEach((mon, index) => {
          dateArray.push({ date: start.toString() + '-' + month[index] + '-01', tableDate: start.toString() + '-' + month[index] });
        });
        start += 1;
      } else if (currentFreq === 'M') {
        let month = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
        month.forEach((mon, index) => {
          dateArray.push({ date: start.toString() + '-' + month[index] + '-01', tableDate: start.toString() + '-' + month[index] });
        });
        start += 1;
      } else {
        let quarterMonth = ['01', '04', '07', '10'];
        let quarter = ['Q1', 'Q2', 'Q3', 'Q4'];
        quarterMonth.forEach((quart, index) => {
          dateArray.push({ date: start.toString() + '-' + quarterMonth[index] + '-01', tableDate: start.toString() + ' ' + quarter[index] });
        });
        start += 1;
      }
    }
    return dateArray;
  }

  seriesTable(tableData, dateRange) {
    let results = [];
    if (dateRange && tableData) {
      for (let i = 0; i < dateRange.length; i++) {
        results.push({ date: dateRange[i].date, tableDate: dateRange[i].tableDate, value: ' ', yoy: ' ', ytd: ' ' });
        for (let j = 0; j < tableData.length; j++) {
          if (results[i].date === tableData[j].date) {
            results[i].value = tableData[j].value;
            results[i].formattedValue = tableData[j].value === ' ' ? ' ' : this.formatNum(+tableData[j].value, 2);
            results[i].yoy = tableData[j].yoyValue;
            results[i].formattedYoy = tableData[j].yoyValue === ' ' ? ' ' : this.formatNum(+tableData[j].yoyValue, 2);
            break;
          }
        }
      }
      return results;
    }
  }

  // Get summary statistics for single series displays
  // Min & Max values (and their dates) for the selected date range; (%) change from first to last observation; standard deviation
  summaryStats(seriesData, freq) {
    let stats = { minValue: Infinity, minValueDate: '', maxValue: Infinity, maxValueDate: '', change: Infinity, sd: Infinity };
    let formatStats = { minValue: '', minValueDate: '', maxValue: '', maxValueDate: '', change: '', sd: '', selectedStart: '', selectedEnd: '' };
    let levelSum = 0;
    seriesData.forEach((item, index) => {
      if (stats.minValue === Infinity || seriesData[index].value < stats.minValue) {
        stats.minValue = seriesData[index].value;
        stats.minValueDate = seriesData[index].date;
      }
      if (stats.maxValue === Infinity || seriesData[index].value > stats.maxValue) {
        stats.maxValue = seriesData[index].value;
        stats.maxValueDate = seriesData[index].date;
      }
      levelSum += seriesData[index].value;
    });

    // Calculate standard deviation
    let avg = levelSum / seriesData.length;
    let sqDiff = 0;
    seriesData.forEach((item, index) => {
      sqDiff += Math.pow((seriesData[index].value - avg), 2);
    });
    let sd = Math.sqrt(sqDiff / seriesData.length);
    stats.change = ((stats.maxValue - stats.minValue) / stats.minValue) * 100;
    stats.sd = sd;

    // Format numbers
    formatStats.minValue = this.formatNum(stats.minValue, 2);
    formatStats.minValueDate = this.formatDate(stats.minValueDate, freq.freq);
    formatStats.maxValue = this.formatNum(stats.maxValue, 2);
    formatStats.maxValueDate = this.formatDate(stats.maxValueDate, freq.freq);
    formatStats.change = this.formatNum(stats.change, 2);
    formatStats.sd = this.formatNum(stats.sd, 2);
    formatStats.selectedStart = this.formatDate(seriesData[0].date, freq.freq);
    formatStats.selectedEnd = this.formatDate(seriesData[seriesData.length - 1].date, freq);
    return formatStats;
  }

  dataTransform(seriesObs) {
    let results = null;
    let observations = seriesObs;
    let start = observations.observationStart;
    let end = observations.observationEnd;
    let level = observations.transformationResults[0].observations;
    let yoy = observations.transformationResults[1].observations;
    let ytd = observations.transformationResults[2].observations;

    let levelValue = [];
    let pseudoZones = [];
    let yoyValue = [];
    let ytdValue = [];

    if (level) {
      level.forEach((entry, i) => {
        // Create [date, value] level pairs for charts
        levelValue.push([Date.parse(level[i].date), +level[i].value]);
        if (level[i].pseudoHistory && !level[i + 1].pseudoHistory) {
          pseudoZones.push({ value: Date.parse(level[i].date), dashStyle: 'dash', color: '#7CB5EC' });
        }
      });
    }
    if (yoy) {
      yoy.forEach((entry, i) => {
        // Create [date, value] percent pairs for charts
        yoyValue.push([Date.parse(yoy[i].date), +yoy[i].value]);
      });
    }
    if (ytd) {
      ytd.forEach((entry, i) => {
        // Create [date, value] YTD pairs
        ytdValue.push([Date.parse(ytd[i].date), +ytd[i].value]);
      });
    }
    if (level) {
      let tableData = this.combineObsData(level, yoy, ytd);
      let chartData = { level: levelValue, pseudoZones: pseudoZones, yoy: yoyValue, ytd: ytdValue };
      let data = { chartData: chartData, tableData: tableData, start: start, end: end };
      results = { chartData: chartData, tableData: tableData, start: start, end: end };
    }
    return results;
  }

  catTable(seriesTableData: Array<any>, dateRange: Array<any>, dateWrapper: dateWrapper, sa?: Boolean, freq?: string) {
    let categoryTable = [];
    // Set datewrapper first and end date based on seasonally adjusted series only for non-annual/non-semiannual frequencies
    let seasonalFreq = true;
    if ((freq !== 'A' && !sa) && (freq !== 'S' && !sa)) {
      seasonalFreq = false;
    }
    for (let i = 0; i < dateRange.length; i++) {
      categoryTable.push({ date: dateRange[i].date, tableDate: dateRange[i].tableDate, level: '', yoy: '', ytd: '' });
      if (seriesTableData) {
        this.catTableDateWrapper(categoryTable[i], seriesTableData, dateWrapper, seasonalFreq);
      }
    }
    return categoryTable;
  }

  catTableDateWrapper(categoryTable, seriesTable, dateWrapper, seasonal) {
    for (let j = 0; j < seriesTable.length; j++) {
      if (dateWrapper.firstDate === '' || seasonal && seriesTable[j].date < dateWrapper.firstDate) {
        dateWrapper.firstDate = seriesTable[j].date;
      }
      if (dateWrapper.endDate === '' || seasonal && seriesTable[j].date > dateWrapper.endDate) {
        dateWrapper.endDate = seriesTable[j].date;
      }
      // Format values for category table
      if (categoryTable.date === seriesTable[j].date) {
        categoryTable.level = this.formatNum(+seriesTable[j].value, 2);
        categoryTable.yoy = this.formatNum(+seriesTable[j].yoyValue, 2);
        categoryTable.ytd = this.formatNum(+seriesTable[j].ytdValue, 2);
        break;
      }
    }
  }

  // Combine level and percent arrays from Observation data
  // Used to construct table data for single series view
  combineObsData(level, yoy, ytd) {
    // Check that level and perc arrays are not null
    if (level && yoy && ytd) {
      let table = level;
      for (let i = 0; i < level.length; i++) {
        table[i].yoyValue = ' ';
        table[i].ytdValue = ' ';
        table[i].value = +level[i].value;
        for (let j = 0; j < yoy.length; j++) {
          if (level[i].date === yoy[j].date) {
            table[i].yoyValue = +yoy[j].value;
            table[i].ytdValue = +ytd[j].value;
            break;
          }
        }
      }
      return table;
    } else if (level && (!yoy || !ytd)) {
      let table = level;
      for (let i = 0; i < level.length; i++) {
        table[i].yoyValue = ' ';
        table[i].ytdValue = ' ';
        table[i].value = +level[i].value;
      }
      return table;
    }
  }

  formatDate(date: string, freq: string) {
    let formattedDate;
    let year = date.substring(0, 4);
    let month = date.substring(5, 7);
    if (freq === 'A') {
      formattedDate = year;
    }
    if (freq === 'Q') {
      let quarter = ['Q1', 'Q2', 'Q3', 'Q4'];
      let qMonth = ['01', '04', '07', '10'];
      qMonth.forEach((q, index) => {
        if (month === qMonth[index]) {
          formattedDate = quarter[index] + ' ' + year;
        }
      });
    }
    if (freq === 'M' || freq == 'S') {
      formattedDate = month + '-' + year;
    }
    return formattedDate;
  }

  formatNum(num: number, decimal: number) {
    let fixedNum: any;
    fixedNum = num.toFixed(decimal);
    // remove decimals 
    let int = fixedNum | 0;
    let signCheck = num < 0 ? 1 : 0;
    // store deicmal value
    let remainder = Math.abs(fixedNum - int);
    let decimalString = ('' + remainder.toFixed(decimal)).substr(2, decimal);
    let intString = '' + int, i = intString.length;
    let r = '';
    while ((i -= 3) > signCheck) { r = ',' + intString.substr(i, 3) + r; }
    return intString.substr(0, i + 3) + r + (decimalString ? '.' + decimalString : '');
  }

  // Get a unique array of available regions for a category
  uniqueGeos(geo, geoList) {
    let exist = false;
    for (let i in geoList) {
      if (geo.handle === geoList[i].handle) {
        exist = true;
        // If region already exists, check it's list of frequencies
        // Get a unique list of frequencies available for a region
        let freqs = geo.freqs;
        for (let j in freqs) {
          if (!this.freqExist(geoList[i].freqs, freqs[j].freq)) {
            geoList[i].freqs.push(freqs[j]);
          }
        }
      }
    }
    if (!exist) {
      geoList.push(geo);
    }
  }

  freqExist(freqArray, freq) {
    for (let n in freqArray) {
      if (freq === freqArray[n].freq) {
        return true;
      }
    }
    return false;
  }

  // Get a unique array of available frequencies for a category
  uniqueFreqs(freq, freqList) {
    let exist = false;
    for (let i in freqList) {
      if (freq.label === freqList[i].label) {
        exist = true;
        // If frequency already exists, check it's list of regions
        // Get a unique list of regions available for a frequency
        let geos = freq.geos;
        for (let j in geos) {
          if (!this.geoExist(freqList[i].geos, geos[j].handle)) {
            freqList[i].geos.push(geos[j]);
          }
        }
      }
    }
    if (!exist) {
      freqList.push(freq);
    }
  }

  geoExist(geoArray, geo) {
    for (let n in geoArray) {
      if (geo === geoArray[n].handle) {
        return true;
      }
    }
    return false;
  }
}
