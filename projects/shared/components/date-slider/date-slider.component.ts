/* import { Component, Input, Inject, OnChanges, EventEmitter, Output, ViewEncapsulation, ViewChild, SimpleChanges } from '@angular/core';
import { HelperService } from 'projects/shared/services/helper.service';
import { DateRange } from 'projects/shared/models/DateRange';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { SliderModule } from 'primeng/slider';
import { FormsModule } from '@angular/forms';
import { CalendarModule } from 'primeng/calendar';

@Component({
    selector: 'lib-date-slider',
    templateUrl: './date-slider.component.html',
    styleUrls: ['./date-slider.component.scss'],
    encapsulation: ViewEncapsulation.None,
    imports: [CalendarModule, FormsModule, SliderModule]
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
} */
import { Component, Input, Inject, OnChanges, EventEmitter, Output, ViewEncapsulation, ViewChild, SimpleChanges } from '@angular/core';
import { HelperService } from 'projects/shared/services/helper.service';
import { DateRange } from 'projects/shared/models/DateRange';
import { Subscription } from 'rxjs';
import { MatDatepickerModule, MatDatepicker } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';

export type Frequency = 'A' | 'S' | 'Q' | 'M' | 'W' | 'D';

export interface SeriesDate {
  date: string; // 'YYYY-MM-DD'
}

export interface SliderChangeEvent {
  startDate: string;
  endDate: string;
  useDefaultRange: boolean;
  endOfSample: boolean;
}

const MONTH_GRID_FREQS: Frequency[] = ['S', 'Q', 'M'];
const DAY_GRID_FREQS: Frequency[] = ['W', 'D'];

@Component({
  selector: 'lib-date-slider',
  templateUrl: './date-slider.component.html',
  styleUrls: ['./date-slider.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [MatDatepickerModule, MatFormFieldModule, MatInputModule, MatNativeDateModule, MatSliderModule, FormsModule]
})
export class DateSliderComponent implements OnChanges {
  @ViewChild('pickerStart') pickerStart: MatDatepicker<Date>;
  @ViewChild('pickerEnd') pickerEnd: MatDatepicker<Date>;

  @Input() portalSettings: any;
  @Input() dates: SeriesDate[] = [];
  @Input() freq: Frequency;
  @Input() dateFrom: string;
  @Input() dateTo: string;
  @Input() routeStart: string;
  @Input() routeEnd: string;
  @Input() previousFreq: string;
  @Output() updateRange = new EventEmitter<SliderChangeEvent>();

  start: number;
  end: number;
  sliderDates: string[];
  sliderSelectedRange: [number, number];
  minDateValue: Date;
  maxDateValue: Date;
  calendarStartDate: Date;
  calendarEndDate: Date;
  calendarDisplayStart = '';
  calendarDisplayEnd = '';
  datePickerStartView: 'month' | 'year' | 'multi-year';
  dateSubscription: Subscription;
  selectedDateRange: DateRange;
  routeSubscription: Subscription;

  constructor(
    @Inject('defaultRange') private defaultRange: unknown,
    private helperService: HelperService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.sliderDates = this.dates.map(d => d.date);
    this.datePickerStartView = this.getStartView(this.freq);

    if (this.routeStart && this.routeEnd && (this.previousFreq === '' || this.previousFreq === this.freq)) {
      this.updateDateRange(this.dates, this.routeStart, this.routeEnd, this.freq, this.defaultRange, false);
    } else if (this.routeEnd && this.previousFreq !== '' && this.previousFreq !== this.freq) {
      // when switching frequencies (i.e. annual to quarterly), the date ranges should adjust to cover the same range
      // for example, if 2010 - 2020 is selected at the annual level, and the user switches the frequency to quarterly
      // the quarterly date range should adjust to 2010 Q1 - 2020 Q4 rather than 2010 Q1 - 2020 Q1
      const newEndDate = this.updateEndDateAfterFreqChange(this.previousFreq, this.freq, this.dates, this.routeEnd) || '';
      this.updateDateRange(this.dates, this.routeStart, newEndDate, this.freq, this.defaultRange, false);
    } else if (this.routeStart && !this.routeEnd) {
      this.updateDateRange(this.dates, this.routeStart, this.dates[this.dates.length - 1].date, this.freq, this.defaultRange, false);
    } else {
      this.updateDateRange(this.dates, '', '', this.freq, this.defaultRange, true);
    }
    this.setDatePickerInputs();
  }

  // --- Grid level / filter selection ---

  getStartView(freq: Frequency): 'month' | 'year' | 'multi-year' {
    if (freq === 'A') return 'multi-year';
    if (MONTH_GRID_FREQS.includes(freq)) return 'year';
    return 'month'; // W, D
  }

  dateFilter = (date: Date | null): boolean => {
    if (!date) return false;
    switch (this.freq) {
      case 'Q':
        return [0, 3, 6, 9].includes(date.getMonth());
      case 'S':
        return [0, 6].includes(date.getMonth());
      case 'M':
      case 'A':
        return true;
      case 'W':
      case 'D':
        return this.sliderDates.includes(this.formatDateForCompare(date));
      default:
        return true;
    }
  };

  formatDateForCompare(date: Date): string {
    const y = date.getFullYear();
    const m = `${date.getMonth() + 1}`.padStart(2, '0');
    const d = `${date.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  isMonthGrid(): boolean {
    return MONTH_GRID_FREQS.includes(this.freq);
  }

  isDayGrid(): boolean {
    return DAY_GRID_FREQS.includes(this.freq);
  }

  // --- Grid selection handlers ---

  onYearSelected(date: Date, calendar: 'start' | 'end', picker: MatDatepicker<Date>): void {
    this.applySelection(date, calendar);
    picker.close();
  }

  onMonthSelected(date: Date, calendar: 'start' | 'end', picker: MatDatepicker<Date>): void {
    this.applySelection(date, calendar);
    picker.close();
  }

  onDaySelected(date: Date | null, calendar: 'start' | 'end'): void {
    if (!date) return;
    this.applySelection(date, calendar);
  }

  private applySelection(date: Date, calendar: 'start' | 'end'): void {
    const iso = this.formatDateForCompare(date);
    if (calendar === 'start') {
      this.calendarStartDate = date;
      this.calendarDisplayStart = this.formatDisplay(date);
      this.start = this.sliderDates.indexOf(iso);
    } else {
      this.calendarEndDate = date;
      this.calendarDisplayEnd = this.formatDisplay(date);
      this.end = this.sliderDates.indexOf(iso);
    }
    this.sliderSelectedRange = [this.start, this.end];
    this.updateChartsAndTables(this.sliderDates[this.start], this.sliderDates[this.end]);
  }

  formatDisplay(date: Date): string {
    const year = date.getFullYear();
    switch (this.freq) {
      case 'A': return `${year}`;
      case 'S': return `${year} H${date.getMonth() === 0 ? '1' : '2'}`;
      case 'Q': return `${year} Q${Math.floor(date.getMonth() / 3) + 1}`;
      case 'M': return `${year}-${`${date.getMonth() + 1}`.padStart(2, '0')}`;
      default: return this.formatDateForCompare(date);
    }
  }

  // --- Typed-entry support ---

  parseTypedInput(value: string): Date | null {
    const v = value.trim().toUpperCase();
    switch (this.freq) {
      case 'A': {
        if (!/^\d{4}$/.test(v)) return null;
        return new Date(+v, 0, 1);
      }
      case 'S': {
        const match = v.match(/^(\d{4})\s*H([12])$/);
        if (!match) return null;
        const [, year, half] = match;
        return new Date(+year, half === '1' ? 0 : 6, 1);
      }
      case 'Q': {
        const match = v.match(/^(\d{4})\s*Q([1-4])$/);
        if (!match) return null;
        const [, year, quarter] = match;
        return new Date(+year, (+quarter - 1) * 3, 1);
      }
      case 'M': {
        const match = v.match(/^(\d{4})-(\d{2})$/);
        if (!match) return null;
        const [, year, month] = match;
        return new Date(+year, +month - 1, 1);
      }
      case 'W':
      case 'D': {
        const match = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) return null;
        const [, year, month, day] = match;
        return new Date(+year, +month - 1, +day);
      }
      default:
        return null;
    }
  }

  isValidTypedDate(date: Date | null): boolean {
    if (!date) return false;
    if (!this.dateFilter(date)) return false;
    const iso = this.formatDateForCompare(date);
    return this.sliderDates.includes(iso);
  }

  onTypedInputChange(rawValue: string, calendar: 'start' | 'end'): void {
    const parsed = this.parseTypedInput(rawValue);
    if (this.isValidTypedDate(parsed)) {
      this.applySelection(parsed as Date, calendar);
    }
  }

  onInputBlur(calendar: 'start' | 'end'): void {
    if (calendar === 'start') {
      this.calendarDisplayStart = this.formatDisplay(this.calendarStartDate);
    } else {
      this.calendarDisplayEnd = this.formatDisplay(this.calendarEndDate);
    }
  }

  // --- Range calc / slider sync ---

  updateEndDateAfterFreqChange = (previousFreq: string, currentFreq: string, dates: SeriesDate[], routeEnd: string): string | undefined => {
    const year = routeEnd.substring(0, 4);
    if (previousFreq === 'A') {
      return dates.findLast(date => date.date.includes(year))?.date;
    }
    if (previousFreq === 'Q' || previousFreq === 'S') {
      const month = routeEnd.substring(5, 7);
      const newMonth = this.findMonthLimit(previousFreq, +month);
      return currentFreq === 'A'
        ? dates.findLast(date => date.date.includes(year))?.date
        : dates.findLast(date => date.date < `${month === '10' ? +year + 1 : year}-${newMonth}-01`)?.date;
    }
    return currentFreq === 'A'
      ? dates.findLast(date => date.date.substring(0, 4) <= year)?.date
      : dates.findLast(date => date.date <= routeEnd)?.date;
  };

  findMonthLimit = (previousFreq: string, month: number): string => {
    if (previousFreq === 'Q') {
      return month === 10 ? '01' : month === 7 ? '10' : `0${month + 3}`;
    }
    return month === 7 ? '01' : '07';
  };

  updateDateRange(dates: SeriesDate[], start: string, end: string, freq: Frequency, defaultRange: unknown, useDefaultRange: boolean): void {
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

  setDatePickerInputs(): void {
    this.calendarStartDate = new Date(this.dates[this.start].date.replace(/-/g, '/'));
    this.calendarEndDate = new Date(this.dates[this.end].date.replace(/-/g, '/'));
    this.calendarDisplayStart = this.formatDisplay(this.calendarStartDate);
    this.calendarDisplayEnd = this.formatDisplay(this.calendarEndDate);
    this.minDateValue = new Date(this.dates[0].date.replace(/-/g, '/'));
    this.maxDateValue = new Date(this.dates[this.dates.length - 1].date.replace(/-/g, '/'));
  }

  onSlideChange(): void {
    this.sliderSelectedRange = [this.start, this.end];
    this.updateChartsAndTables(this.sliderDates[this.start], this.sliderDates[this.end]);
    this.calendarStartDate = new Date(this.dates[this.start].date.replace(/-/g, '/'));
    this.calendarEndDate = new Date(this.dates[this.end].date.replace(/-/g, '/'));
    this.calendarDisplayStart = this.formatDisplay(this.calendarStartDate);
    this.calendarDisplayEnd = this.formatDisplay(this.calendarEndDate);
  }

  updateChartsAndTables(from: string, to: string): void {
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
