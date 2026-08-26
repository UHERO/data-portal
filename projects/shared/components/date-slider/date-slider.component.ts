import { Component, Input, Inject, OnChanges, EventEmitter, Output, ViewEncapsulation, ViewChild, SimpleChanges } from '@angular/core';
import { HelperService } from 'projects/shared/services/helper.service';
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
  @ViewChild('pickerStart') pickerStart!: MatDatepicker<Date>;
  @ViewChild('pickerEnd') pickerEnd!: MatDatepicker<Date>;

  @Input() portalSettings: any;
  @Input() dates: SeriesDate[] = [];
  @Input() freq!: Frequency;
  @Input() routeStart?: string;
  @Input() routeEnd?: string;
  @Input() previousFreq: string = '';
  @Output() updateRange = new EventEmitter<SliderChangeEvent>();

  start: number = 0;
  end: number = 0;
  sliderDates: string[] = [];
  sliderSelectedRange: [number, number] = [0, 0];
  minDateValue?: Date;
  maxDateValue?: Date;
  calendarStartDate?: Date;
  calendarEndDate?: Date;
  calendarDisplayStart = '';
  calendarDisplayEnd = '';
  datePickerStartView: 'month' | 'year' | 'multi-year' = 'year';

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
      this.updateDateRange(this.dates, this.routeStart ?? '', newEndDate, this.freq, this.defaultRange, false);
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
    if (calendar === 'start' && this.calendarStartDate) {
      this.calendarDisplayStart = this.formatDisplay(this.calendarStartDate);
    } else if (calendar === 'end' && this.calendarEndDate) {
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
