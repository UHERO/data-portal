import { Injectable } from '@angular/core';
import * as Highcharts from 'highcharts/highstock';

Highcharts.dateFormats['Q'] = (timestamp) => {
  const month = +new Date(timestamp).toISOString().split('T')[0].substring(5, 7);
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

@Injectable({
  providedIn: 'root'
})
export class HighstockHelperService {
  static getTooltipFreqLabel(frequency: string, date: any): string {
    const year = Highcharts.dateFormat('%Y', date);
    const month = Highcharts.dateFormat('%b', date);
    const day = Highcharts.dateFormat('%d', date);
    if (frequency === 'A') {
      return year;
    }
    if (frequency === 'Q') {
      return `${year} ${Highcharts.dateFormat('%Q', date)}`;
    }
    if (frequency === 'M' || frequency === 'S') {
      return `${Highcharts.dateFormat('%b', date)} ${year}`;
    }
    if (frequency === 'W' || frequency === 'D') {
      return `${month} ${day}, ${year}`;
    }
  }

  static rangeSelectorSetExtremesEvent(eventMin, eventMax, frequency: string, tableExtremes: any) {
    const userMin = new Date(eventMin).toISOString().split('T')[0];
    const userMax = new Date(eventMax).toISOString().split('T')[0];
    const selectedMin = this.setDateToFirstOfMonth(frequency, userMin);
    const selectedMax = this.setDateToFirstOfMonth(frequency, userMax);
    tableExtremes.emit({ seriesStart: selectedMin, seriesEnd: selectedMax });
  }

  static setDateToFirstOfMonth(freq: any, date: string) {
    const month = +date.substring(5, 7);
    const year = +date.substring(0, 4);
    const firstOfMonth = {
      'A': `${year}-01-01`,
      'Q': `${year}-${this.getQuarterMonths(month)}-01`,
      'M': `${date.substring(0, 7)}-01`,
      'S': `${date.substring(0, 7)}-01`
    }
    return firstOfMonth[freq] || date;
  }
  
  static getQuarterMonths(month: number) {
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

  xAxisLabelFormatter = (chartAxis, freq: string) => {
    let s = '';
    const year = Highcharts.dateFormat('%Y', chartAxis.value);
    const first: any = Highcharts.dateFormat('%Y', chartAxis.axis.userMin);
    const last: any = Highcharts.dateFormat('%Y', chartAxis.axis.userMax);
    s = ((last - first) <= 5) && freq === 'Q' ? `${year} ${Highcharts.dateFormat('%Q', chartAxis.value)}` : year;
    return freq === 'Q' ? s : chartAxis.axis.defaultLabelFormatter.call(chartAxis);
  }
}
