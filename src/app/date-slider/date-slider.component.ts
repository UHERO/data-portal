import { Component, Input, Inject, OnInit, ChangeDetectorRef, AfterViewInit, EventEmitter, Output } from '@angular/core';
import { HelperService } from '../helper.service';
import 'jquery';
declare var $: any;

@Component({
  selector: 'app-date-slider',
  templateUrl: './date-slider.component.html',
  styleUrls: ['./date-slider.component.scss']
})
export class DateSliderComponent implements OnInit, AfterViewInit {
  @Input() portalSettings;
  @Input() dates;
  @Input() freq;
  @Input() dateFrom;
  @Input() dateTo;
  @Output() updateRange = new EventEmitter(true);
  start;
  end;
  sliderDates;

  constructor(
    @Inject('defaultRange') private defaultRange,
    private _helper: HelperService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {
    if (this.dates && this.dates.length) {
      const defaultRanges = this.findDefaultRange(this.dates, this.freq, this.defaultRange, this.dateFrom, this.dateTo);
      // Start and end used for 'from' and 'to' inputs in slider
      // If start/end exist in values array, position handles at start/end; otherwise, use default range
      this.start = defaultRanges.start;
      this.end = defaultRanges.end;
      this.sliderDates = defaultRanges.sliderDates;
    }
  }

  ngAfterViewInit() {
    const $fromInput = $(`#dateFrom`);
    const $toInput = $(`#dateTo`);
    this.initRangeSlider(this.sliderDates, this.start, this.end, this.freq, this.portalSettings);
    const $range = $(`#slider`).data('ionRangeSlider');
    // Set change functions for 'from' and 'to' date inputs
    this.setInputChangeFunction($fromInput, this.sliderDates, $range, 'from', this.portalSettings, this.freq);
    this.setInputChangeFunction($toInput, this.sliderDates, $range, 'to', this.portalSettings, this.freq);
    this.updateChartsAndTables($fromInput.prop('value'), $toInput.prop('value'), this.freq)
    this.cd.detectChanges();
  }

  initRangeSlider(sliderDates: Array<any>, start: number, end: number, freq: string, portalSettings) {
    const updateChartsAndTables = (from, to, freq) => this.updateChartsAndTables(from, to, freq);
    const $fromInput = $(`#dateFrom`);
    const $toInput = $(`#dateTo`);
    $(`#slider`).ionRangeSlider({
      min: 0,
      from: start,
      to: end,
      values: sliderDates,
      prettify_enabled: false,
      hide_min_max: true,
      hide_from_to: true,
      keyboard: true,
      keyboard_step: 1,
      skin: 'round',
      type: 'double',
      onChange: function (data) {
        $fromInput.prop('value', data.from_value);
        $toInput.prop('value', data.to_value);
        console.log('date change', data.to_value)
      },
      onFinish: function (data) {
        updateChartsAndTables(data.from_value, data.to_value, freq);
      }
    });
  }

  updateChartsAndTables(from, to, freq: string) {
    const seriesStart = this.formatChartDate(from, freq);
    const seriesEnd = this.formatChartDate(to, freq);
    const endOfSample = this.dates[this.dates.length - 1].date === seriesEnd;
    this.updateRange.emit({ seriesStart: seriesStart, seriesEnd: seriesEnd, endOfSample: endOfSample });
  }

  updateRanges(from, to, freq: string) {
    this.updateChartsAndTables(from, to, freq);
  }

  updateRangeSlider(rangeSlider, key, valueIndex) {
    rangeSlider.update({
      [key]: valueIndex
    });
  }

  checkValidInputString = (value, freq: string) => {
    // Accepted input formats:
    // Annual: YYYY; Quarterly: YYYY Q#, YYYYQ#, YYYY q#, YYYYq#; Monthly/Semiannual: YYYY-MM, YYYYMM
    if (freq === 'A') {
      return /^\d{4}$/.test(value);
    }
    if (freq === 'Q') {
      return /^\d{4}( |)[Q]\d{1}$/.test(value); 
    }
    if (freq === 'M' || freq === 'S') {
      return /^\d{4}(|-)\d{2}$/.test(value);
    }
  }

  checkValidInputs = (value, siblingValue, key: string, freq: string) => {
    const validString = this.checkValidInputString(value.toUpperCase(), freq);
    if (!validString) {
      return false;
    }
    if (key === 'from') {
      return value <= siblingValue ? true : false;
    }
    if (key === 'to') {
      return value >= siblingValue ? true : false;
    }
  }

  formatInput = (value: string, freq: string) => {
    if (freq === 'Q') {
      return value.includes(' ') ? value : value.slice(0, 4) + ' ' + value.slice(4);
    }
    if (freq === 'M' || freq === 'S') {
      return value.includes('-') ? value : value.slice(0, 4) + '-' + value.slice(4);
    }
    return value;
  }

  setInputChangeFunction(input, sliderDates: Array<any>, rangeSlider, key: string, portalSettings, freq: string) {
    const updateRanges = (portalSettings, fromIndex, toIndex, from, to, freq) => this.updateRanges(from, to, freq);
    const updateRangeSlider = (rangeSlider, key, valueIndex) => this.updateRangeSlider(rangeSlider, key, valueIndex);
    const checkValidInputs = (value, siblingValue, key, freq) => this.checkValidInputs(value, siblingValue, key, freq);
    const formatInput = (value, freq) => this.formatInput(value, freq);
    input.on('change', function () {
      let value = formatInput($(this).prop('value').toUpperCase(), freq);
      let valueIndex = sliderDates.findIndex(date => date == value);
      const siblingValue = $(this).siblings('.date-input').prop('value');
      const siblingValueIndex = sliderDates.findIndex(date => date == siblingValue);
      const validInputs = checkValidInputs(value, siblingValue, key, freq);
      if (valueIndex >= 0 && validInputs) {
        input.prop('value', value);
        updateRangeSlider(rangeSlider, key, valueIndex);
        if (key === 'from') {
          updateRanges(portalSettings, valueIndex, siblingValueIndex, value, siblingValue, freq);
        }
        if (key === 'to') {
          updateRanges(portalSettings, siblingValueIndex, valueIndex, siblingValue, value, freq);
        }
      }
    });
  }

  findDefaultRange = (dates: Array<any>, freq: string, defaultRange, dateFrom, dateTo) => {
    const sliderDates = dates.map(date => date.tableDate);
    const defaultRanges = this._helper.setDefaultSliderRange(freq, sliderDates, defaultRange);
    let { startIndex, endIndex } = defaultRanges;
    if (dateFrom) {
      const dateFromExists = this.checkDateExists(dateFrom, dates, freq);
      if (dateFromExists > -1) {
        startIndex = dateFromExists;
      }
      if (dateFrom < dates[0].date) {
        startIndex = 0;
      }
    }
    if (dateTo) {
      console.log('DATE TO', dateTo)
      const dateToExists = this.checkDateExists(dateTo, dates, freq);
      if (dateToExists > -1) {
        endIndex = dateToExists;
      }
      if (dateTo > dates[dates.length - 1].date) {
        endIndex = dates.length - 1;
      }
    }
    return { start: startIndex, end: endIndex, sliderDates: sliderDates };
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
        dateToCheck = `${year}-04-01`
      }
      if (month >= 7 && month <= 9) {
        dateToCheck = `${year}-07-01`
      }
      if (month >= 10 && month <= 12) {
        dateToCheck = `${year}-10-01`;
      }
    }
    console.log('dateToCheck', date)
    return dates.findIndex(date => date.date == dateToCheck);
  }

  formatChartDate = (value, freq) => {
    const quarters = { Q1: '01', Q2: '04', Q3: '07', Q4: '10' };
    if (freq === 'A') {
      return `${value.toString()}-01-01`;
    }
    if (freq === 'Q') {
      const q = value.substring(5, 7);
      return `${value.substring(0, 4)}-${quarters[q]}-01`;
    }
    if (freq === 'M' || freq === 'S') {
      return `${value}-01`;
    }
    if (freq === 'W') {
      return value;
    }
  }
}
