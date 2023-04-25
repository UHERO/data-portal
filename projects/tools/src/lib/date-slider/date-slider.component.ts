import { Component, Input, Inject, OnChanges, EventEmitter, Output, ViewEncapsulation, ViewChild, SimpleChanges } from '@angular/core';
import { HelperService } from '../helper.service';
import { DateRange } from '../tools.models';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'lib-date-slider',
  templateUrl: './date-slider.component.html',
  styleUrls: ['./date-slider.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DateSliderComponent implements OnChanges {
  @ViewChild('calendarStart') calendarStart;
  @ViewChild('calendarEnd') calendarEnd;
  @Input() portalSettings;
  @Input() dates;
  @Input() freq;
  @Input() dateFrom;
  @Input() dateTo;
  @Input() routeStart: string;
  @Input() routeEnd: string;
  @Input() previousFreq: string;
  @Output() updateRange = new EventEmitter(true);
  start;
  end;
  sliderDates;
  sliderSelectedRange;
  minDateValue;
  maxDateValue;
  value;
  calendarStartDateFormat: string;
  calendarEndDateFormat: string;
  calendarView: string;
  calendarYearRange: string;
  calendarStartDate: Date;
  calendarEndDate: Date;
  invalidStartDates: Array<any>;
  invalidEndDates: Array<any>
  displayMonthNavigator: boolean;
  placeholderStr: string;
  dateSubscription: Subscription;
  selectedDateRange: DateRange;
  routeSubscription: Subscription

  constructor(
    @Inject('defaultRange') private defaultRange,
    private helperService: HelperService,
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    this.sliderDates = this.dates.map(d => d.date);
    if (this.routeStart && this.routeEnd && (this.previousFreq === '' || this.previousFreq === this.freq)) {
      this.updateDateRange(this.dates, this.routeStart, this.routeEnd, this.freq, this.defaultRange, false);
    } else if (this.routeEnd && this.previousFreq !== '' && this.previousFreq !== this.freq) {
      // when switching frequencies (i.e. annual to quarterly), the date ranges should adjust to cover the same range
      // for example, if 2010 - 2020 is selected at the annual level, and the user switches the frequency to quarterly
      // the quarterly date range should adjust to 2010 Q1 - 2020 Q4 rather than 2010 Q1 - 2020 Q1
      // otherwise matching on the annual date (stored as Jan. 1 of selected year in DB) will match with Q1 rather than Q4
      const newEndDate = this.updateEndDateAfterFreqChange(this.previousFreq, this.freq, this.dates, this.routeEnd) || '';
      this.updateDateRange(this.dates, this.routeStart, newEndDate, this.freq, this.defaultRange, false);
    } else if (this.routeStart && !this.routeEnd) {
      // if start date specified without an end date, display until end of availble data
      this.updateDateRange(this.dates, this.routeStart, this.dates[this.dates.length - 1].date, this.freq, this.defaultRange, false);
    } else {
      this.updateDateRange(this.dates, '', '', this.freq, this.defaultRange, true);
    }
    this.setDatePickerInputs();
  }

  updateEndDateAfterFreqChange = (previousFreq: string, currentFreq: string, dates: any, routeEnd: string) => {
    const year = routeEnd.substring(0, 4);
    if (previousFreq === 'A') {
      return dates.findLast(date => date.date.includes(year))?.date;
    }
    if (previousFreq === 'Q' || previousFreq === 'S') {
      const month = this.routeEnd.substring(5, 7);
      const newMonth = this.findMonthLimit(previousFreq, +month);
      return currentFreq === 'A' ? 
        this.dates.findLast(date => date.date.includes(year))?.date :
        this.dates.findLast(date => date.date < `${month === '10' ? +year + 1 : year}-${newMonth}-01`)?.date;
    }
    return currentFreq === 'A' ?
      this.dates.findLast(date => date.date.substring(0, 4) <= year)?.date :
      this.dates.findLast(date => date.date <= this.routeEnd)?.date;
  }

  findMonthLimit = (previousFreq: string, month: number) => {
    if (previousFreq === 'Q') {
      return month === 10 ? `01` : month === 7 ? '10' : `0${month + 3}`;
    }
    // semi-annual case
    return month === 7 ? `01` : `07`;
  }

  updateDateRange(dates: Array<any>, start: string, end: string, freq: string, defaultRange, useDefaultRange: boolean) {
    const defaultRanges = this.helperService.getSeriesStartAndEnd(dates, start, end, freq, defaultRange);
    const { seriesStart, seriesEnd } = defaultRanges;
    this.start = seriesStart;
    this.end = seriesEnd;
    this.helperService.setCurrentDateRange(dates[seriesStart].date, dates[seriesEnd].date, useDefaultRange, dates);
    this.sliderSelectedRange = [seriesStart, seriesEnd];
    if (this.previousFreq && this.previousFreq !== this.freq) {
      this.updateChartsAndTables(this.sliderDates[this.start], this.sliderDates[this.end]);
    }
  }

  setDatePickerInputs() {
    // Date picker inputs
    this.displayMonthNavigator = this.freq === 'W' || this.freq === 'D';
    this.calendarView = this.setCalendarView(this.freq);
    this.calendarYearRange = this.setCalendarYearRange(this.sliderDates);
    this.calendarStartDate = new Date(this.dates[this.start].date.replace(/-/g, '/'));
    this.calendarEndDate = new Date(this.dates[this.end].date.replace(/-/g, '/'));
    this.calendarStartDateFormat = this.setCalendarDateFormat(this.freq, this.calendarStartDate);
    this.calendarEndDateFormat = this.setCalendarDateFormat(this.freq, this.calendarEndDate);
    this.invalidStartDates = this.setInvalidDates(this.calendarStartDate.getFullYear(), this.freq, this.calendarStartDate.getMonth() + 1);
    this.invalidEndDates = this.setInvalidDates(this.calendarEndDate.getFullYear(), this.freq, this.calendarEndDate.getMonth() + 1);
    this.placeholderStr = this.setPlaceholderText(this.freq);
    this.setMinMaxDates();
  }

  setPlaceholderText = (freq: string) => {
    const placeholderFormats = {
      A: 'YYYY',
      S: 'YYYY-MM',
      Q: 'YYYY Q#',
      M: 'YYYY-MM',
      W: 'YYYY-MM-DD',
      D: 'YYYY-MM-DD'
    };
    return placeholderFormats[freq];
  }

  setInvalidDates = (year: number, freq: string, month?: number) => {
    const datesToDisable = {
      A: [],
      S: this.getInvalidMonths(year, freq),
      Q: this.getInvalidMonths(year, freq),
      M: [],
      W: this.getInvalidWeeklyDates(year, month)
    };
    return datesToDisable[freq] || [];
  }

  getInvalidMonths = (year: number, freq: string) => {
    // For quarterly and semi-annual series
    // Months not evenly divisible by 3 should be invalidated for quarterly series
    // Month not evenly divisible by 6 should be invalidated for semi-annual series
    let invalidDates = [];
    const m = freq === 'Q' ? 3 : 6;
    for (let month = 0; month < 12; month++) {
      if ((month % m)) {
        invalidDates = invalidDates.concat(this.getAllDaysInMonth(year, month));
      }
    }
    return invalidDates;
  }

  getAllDaysInMonth = (year: number, month: number) => {
    let date = new Date(year, month, 1);
    let dateArray = [];
    while (date.getMonth() === month) {
      dateArray.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return dateArray;
  }

  getInvalidWeeklyDates = (year: number, month: number) => {
    const invalidDates = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const paddedDay = day.toString().length === 1 ? `0${day}` : day;
      const paddedMonth = (month).toString().length === 1 ? `0${month}` : month;
      if (!this.sliderDates.find(date => date === `${year}-${paddedMonth}-${paddedDay}`)) {
        invalidDates.push(new Date(year, month - 1, day));
      }
    }
    return invalidDates;
  }

  setCalendarYearRange = (sliderDates: Array<any>) => `${sliderDates[0].substr(0, 4)}:${sliderDates[sliderDates.length - 1].substr(0, 4)}`;

  setCalendarView = (freq: string) => (freq === 'W' || freq === 'D') ? 'date' : 'month';

  setCalendarDateFormat = (freq: string, value: Date) => {
    const quarters = { 0: 'Q1', 3: 'Q2', 6: 'Q3', 9: 'Q4' };
    const format = {
      A: 'yy',
      S: 'yy-mm',
      Q: `yy ${quarters[value.getMonth()]}`,
      M: 'yy-mm',
      W: 'yy-mm-dd',
      D: 'yy-mm-dd'
    }
    return format[freq] || 'yy-mm-dd';
  }

  onCalendarInput(e: any, calendar: string, freq: string) {
    const isValidInput = this.checkValidCalendarInput(e.target.value.toUpperCase(), freq);
    if (isValidInput) {
      this.updateCalendarDate(e.target.value.toUpperCase(), calendar, freq);
    }
  }

  getDate = (date: string, freq: string, separator: string) => {
    const qMonths = { 'Q1': '01', 'Q2': '04', 'Q3': '07', 'Q4': '10' };
    const newDate = {
      A: `${date}${separator}01${separator}01`,
      S: `${date}${separator}01`,
      Q: `${date.slice(0, 4)}${separator}${qMonths[date.slice(5, 7)]}${separator}01`,
      M: `${date}${separator}01`,
      W:  date,
      D:  date
    };
    return newDate[freq];
  }

  checkValidCalendarInput = (value: string, freq: string) => {
    return this.sliderDates.indexOf(this.getDate(value, freq, '-')) > -1
  }

  onCalendarBlur(calendar: string, selectedDate) {
    // in case user deletes part of date from input and input is no longer valid
    if (!selectedDate && calendar === 'calendar-start') {
      this.calendarStartDate = new Date(this.dates[this.start].date.replace(/-/g, '/'));
    }
    if (!selectedDate && calendar === 'calendar-end') {
      this.calendarEndDate = new Date(this.dates[this.end].date.replace(/-/g, '/'));
    }
  }

  updateCalendarDate(value: string, calendar: string, freq: string) {
    calendar === 'calendar-start' ?
      this.setCalendarStartVars(this.getDate(value, freq, '/'), freq) :
      this.setCalendarEndVars(this.getDate(value, freq, '/'), freq);
    this.sliderSelectedRange = [this.start, this.end];
    this.updateChartsAndTables(this.sliderDates[this.start], this.sliderDates[this.end]);
  }

  onCalendarSelect(e: any, calendar: string, freq: string) {
    const date = e.toISOString().substr(0, 10);
    calendar === 'calendar-start' ? this.setCalendarStartVars(date, freq) : this.setCalendarEndVars(date, freq);
    this.sliderSelectedRange = [this.start, this.end];
    this.updateChartsAndTables(this.sliderDates[this.start], this.sliderDates[this.end]);
  }

  setCalendarStartVars(date: string, freq: string) {
    this.calendarStartDate = new Date(date.replace(/-/g, '/'));
    this.calendarStartDateFormat = this.setCalendarDateFormat(freq, this.calendarStartDate);
    this.start = this.dates.map(d => d.date).indexOf(date.replace(/\//g, '-'));
    this.invalidStartDates = this.setInvalidDates(this.calendarStartDate.getFullYear(), freq, this.calendarStartDate.getMonth() + 1);  
}

  setCalendarEndVars(date: string, freq: string) {
    this.calendarEndDate = new Date(date.replace(/-/g, '/'));
    this.calendarEndDateFormat = this.setCalendarDateFormat(freq, this.calendarEndDate);
    this.end = this.dates.map(d => d.date).indexOf(date.replace(/\//g, '-'));
    this.invalidEndDates = this.setInvalidDates(this.calendarEndDate.getFullYear(), freq, this.calendarEndDate.getMonth() + 1);
  }

  onCalendarClose(calendar: string, selectedDate) {
    if (calendar === 'calendar-start') {
      this.calendarStartDate = new Date(selectedDate) || new Date(this.dates[this.start].date.replace(/-/g, '/'));
      this.invalidStartDates = this.setInvalidDates(this.calendarStartDate.getFullYear(), this.freq, this.calendarStartDate.getMonth() + 1);
    }
    if (calendar === 'calendar-end') {
      this.calendarEndDate = new Date(selectedDate) || new Date(this.dates[this.end].date.replace(/-/g, '/'));
      this.invalidEndDates = this.setInvalidDates(this.calendarEndDate.getFullYear(), this.freq, this.calendarEndDate.getMonth() + 1);
    }
  }

  onMonthChange(e:any, calendar: string, freq: string) {
    if (calendar === 'calendar-start') {
      this.invalidStartDates = this.setInvalidDates(e.year, freq, e.month);
    }
    if (calendar === 'calendar-end') {
      this.invalidEndDates = this.setInvalidDates(e.year, freq, e.month);
    }
    this.setMinMaxDates();
  }

  onYearChange(e: any, calendar: string, freq: string) {
    if (freq === 'A') {
      this.updateCalendarDate(e.year.toString(), calendar, freq);
      this.closeCalendarOverlay(calendar);
    }
    this.onMonthChange(e, calendar, freq);
  }

  closeCalendarOverlay(calendar: string) {
    if (calendar === 'calendarStart') {
      this.calendarStart.overlayVisible = false;
    }
    if (calendar === 'calendarEnd') {
      this.calendarEnd.overlayVisible = false;
    }
  }

  setMinMaxDates() {
    this.maxDateValue = new Date(this.dates[this.dates.length - 1].date.replace(/-/g, '/'));
    this.minDateValue = new Date(this.dates[0].date.replace(/-/g, '/'));
  }

  slideChange(e) {
    this.start = e.values[0];
    this.end = e.values[1];
    // workaround for onSlideEnd not firing when not using the slide handles
    this.sliderSelectedRange = [this.start, this.end];
    this.updateChartsAndTables(this.sliderDates[this.start], this.sliderDates[this.end]);
    const startDate = this.dates[this.start].date;
    const endDate = this.dates[this.end].date;
    this.calendarStartDate = new Date(startDate.replace(/-/g, '/'));
    this.calendarStartDateFormat = this.setCalendarDateFormat(this.freq, this.calendarStartDate);
    this.invalidStartDates = this.setInvalidDates(this.calendarStartDate.getFullYear(), this.freq, this.calendarStartDate.getMonth() + 1);  
    this.calendarEndDate = new Date(endDate.replace(/-/g, '/'));
    this.calendarEndDateFormat = this.setCalendarDateFormat(this.freq, this.calendarEndDate);
    this.invalidEndDates = this.setInvalidDates(this.calendarEndDate.getFullYear(), this.freq, this.calendarEndDate.getMonth() + 1);
  }

  onChange(e) {
    if (e.event.type === 'click') {
      this.slideChange(e)
    }
  }

  updateChartsAndTables(from, to) {
    const endOfSample = this.dates[this.dates.length - 1].date === to;
    this.helperService.updateCurrentDateRange({
      startDate: this.dates[this.start].date,
      endDate: this.dates[this.end].date,
      useDefaultRange: false,
      endOfSample
    });
    this.updateRange.emit({ startDate: from, endDate: to, useDefaultRange: false, endOfSample });
  }
}
