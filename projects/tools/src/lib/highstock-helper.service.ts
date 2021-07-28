import { Injectable } from '@angular/core';

declare var require: any;
const Highcharts = require('highcharts/highstock');

Highcharts.dateFormats = {
  Q(timestamp) {
    const month = +new Date(timestamp).toISOString().split('T')[0].substr(5, 2);
    if (1 <= month && month <= 3) {
      return 'Q1';
    }
    if (4 <= month && month <= 6) {
      return 'Q2';
    }
    if (7 <= month && month <= 9) {
      return 'Q3';
    }
    if (10 <= month && month <= 12) {
      return 'Q4';
    }
  }
};

@Injectable({
  providedIn: 'root'
})
export class HighstockHelperService {
  constructor() { }

  freqInterval = (freq: string) => {
    const interval = {
      'Q': 3,
      'S': 6,
      'W': 7
    }
    return interval[freq] || 1;
  }

  freqIntervalUnit = (freq: string) => {
    const unit = {
      'A': 'year',
      'W': 'day',
      'D': 'day'
    }
    return unit[freq] || 'month';
  }

  getChartExtremes = (chartObject) => {
    // Gets range of x values to emit
    // Used to redraw table in the single series view
    let selectedRange = null;
    if (!chartObject.series[0].points) {
      return { min: null, max: null };
    }
    if (chartObject.series[0].points) {
      selectedRange = chartObject.series[0].points;
    }
    if (selectedRange.length && chartObject._selectedMin && chartObject._selectedMax) {
      return this.findVisibleMinMax(selectedRange, chartObject);
    }
  }

  getAnalyzerChartExtremes = chartObject => {
    let selectedRange = null;
    if (chartObject) {
      selectedRange = chartObject.series.find(s => s.name === 'Navigator').points;
    }
    return selectedRange ? this.findVisibleMinMax(selectedRange, chartObject) :
     {
      min: new Date(chartObject._selectedMin).toISOString().split('T')[0],
      max: new Date(chartObject._selectedMax).toISOString().split('T')[0]
    }
  }

  findVisibleMinMax = (selectedRange, chartObject) => {
    let maxCounter = selectedRange.length - 1;
    let minCounter = 0;
    let xMin;
    let xMax;
    while (!xMax || xMax > chartObject._selectedMax) {
      xMax = new Date(selectedRange[maxCounter].x).toISOString().split('T')[0];
      maxCounter--;
    }
    while (!xMin || xMin < chartObject._selectedMin) {
      xMin = new Date(selectedRange[minCounter].x).toISOString().split('T')[0];
      minCounter++;
    }
    return { min: xMin, max: xMax };
  }

  setDateToFirstOfMonth = (freq, date) => {
    const month = +date.substr(5, 2);
    const year = +date.substr(0, 4);
    const firstOfMonth = {
      'A': `${year}-01-01`,
      'Q': `${year}-${this.getQuarterMonths(month)}-01`,
      'M': `${date.substr(0, 7)}-01`,
      'S': `${date.substr(0, 7)}-01`
    }
    return firstOfMonth[freq] || date;
  }

  getQuarterMonths = (month) => {
    if (month >= 1 && month <= 3) {
      return '01';
    }
    if (month >= 4 && month <= 6) {
      return '04';
    }
    if (month >= 7 && month <= 9) {
      return '07';
    }
    if (month >= 10 && month <= 12) {
      return '10';
    }
  }

  getTooltipFreqLabel = (frequency, date) => {
    const year = Highcharts.dateFormat('%Y', date);
    const month = Highcharts.dateFormat('%b', date);
    const day = Highcharts.dateFormat('%d', date);
    if (frequency === 'A') {
      return year;
    }
    if (frequency === 'Q') {
      return year + this.getQuarterLabel(month);
    }
    if (frequency === 'M' || frequency === 'S') {
      return `${Highcharts.dateFormat('%b', date)} ${year}`;
    }
    if (frequency === 'W' || frequency === 'D') {
      return `${month} ${day}, ${year}`;
    }
  }

  xAxisLabelFormatter = (chart, freq) => {
    let s = '';
    const month = Highcharts.dateFormat('%b', chart.value);
    const year = Highcharts.dateFormat('%Y', chart.value);
    const first = Highcharts.dateFormat('%Y', chart.axis.userMin);
    const last = Highcharts.dateFormat('%Y', chart.axis.userMax);
    s = ((last - first) <= 5) && freq === 'Q' ? year + this.getQuarterLabel(month) : year;
    return freq === 'Q' ? s : chart.axis.defaultLabelFormatter.call(chart);
  }

  getQuarterLabel = (month: string) => {
    const quarters = {
      'Jan': ' Q1',
      'Apr': ' Q2',
      'Jul': ' Q3',
      'Oct': ' Q4' 
    }
    return quarters[month] || '';
  }

  inputDateFormatter = (freq: string) => {
    const dateFormat = {
      'A': '%Y',
      'Q': '%Y %Q',
      'W': '%b %d %Y',
      'D': '%b %d %Y'
    }
    return dateFormat[freq] || '%b %Y';
  }

  inputEditDateFormatter = (freq: string) => {
    const inputDateFormat = {
      'A': '%Y',
      'Q': '%Y %Q',
      'W': '%Y-%m-%d',
      'D': '%Y-%m-%d'
    }
    return inputDateFormat[freq] || '%Y-%m';
  }

  inputDateParserFormatter = (value: string, freq: string) => {
    const year = value.substr(0, 4);
    if (freq === 'Q') {
      const quarter = value.toUpperCase();
      if (quarter.includes('Q1')) {
        return Date.parse(`${year}-01-01`);
      }
      if (quarter.includes('Q2')) {
        return Date.parse(`${year}-04-01`);
      }
      if (quarter.includes('Q3')) {
        return Date.parse(`${year}-07-01`);
      }
      if (quarter.includes('Q4')) {
        return Date.parse(`${year}-10-01`);
      }
    }
    if (freq === 'A') {
      return Date.parse(`${year}-01-01`);
    }
    if (freq === 'M' || freq === 'S') {
      if (!value.includes('-')) { // i.e. monthly frequency where user removes '-'
        const month = value.substr(4, 2);
        return Date.parse(`${year}-${month}-01`);
      }
      return Date.parse(`${value}-01`);
    }
    if (freq === 'W' || freq === 'D') {
      return Date.parse(`${value}`);
    }
  }
}
