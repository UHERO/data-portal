/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { HelperService } from './helper.service';

describe('Service: Helper', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HelperService]
    });
  });

  it('should ...', inject([HelperService], (service: HelperService) => {
    expect(service).toBeTruthy();
  }));

  it('createDateArray should create an array of dates', inject([HelperService], (service: HelperService) => {
    const dateArray = [];
    const freq = 'A';
    const startDate = '2000-01-01';
    const endDate = '2005-01-01';
    const expected = [
      { date: '2000-01-01', tableDate: '2000' },
      { date: '2001-01-01', tableDate: '2001' },
      { date: '2002-01-01', tableDate: '2002' },
      { date: '2003-01-01', tableDate: '2003' },
      { date: '2004-01-01', tableDate: '2004' },
      { date: '2005-01-01', tableDate: '2005' }
    ];
    expect(service.createDateArray(startDate, endDate, freq, dateArray)).toEqual(expected);
  }));

  it('dataTransform should format series observation data for charts and tables', inject([HelperService], (service: HelperService) => {
    const seriesObservations = {
      observationStart: '1960-01-01',
      observationEnd: '1962-01-01',
      orderBy: '',
      sortOrder: '',
      transformationResults: [
        {
          transformation: 'lvl',
          observations: [
            {
              date: '1962-01-01',
              value: '195.2833'
            }
          ]
        }, {
          transformation: 'pc1',
          observations: []
        }, {
          transformation: 'ytd',
          observations: []
        }, {
          transformation: 'c5ma',
          observations: []
        }
      ]
    };
    const dates = [
      { date: '1960-01-01', tableDate: '1960' },
      { date: '1961-01-01', tableDate: '1961' },
      { date: '1962-01-01', tableDate: '1962' }
    ];
    const decimals = 2;
    const level = [
      [Date.parse('1960-01-01'), null],
      [Date.parse('1961-01-01'), null],
      [Date.parse('1962-01-01'), 195.2833]
    ];
    const yoy = [
      [Date.parse('1960-01-01'), null],
      [Date.parse('1961-01-01'), null],
      [Date.parse('1962-01-01'), null]
    ];
    const c5ma = [
      [Date.parse('1960-01-01'), null],
      [Date.parse('1961-01-01'), null],
      [Date.parse('1962-01-01'), null]
    ];
    const chartData = {
      level: level,
      pseudoZones: [],
      yoy: yoy,
      ytd: yoy,
      c5ma: c5ma
    };
    const tableData = [{
      date: '1960-01-01',
      tableDate: '1960',
      value: Infinity,
      yoyValue: Infinity,
      ytdValue: Infinity,
      c5maValue: Infinity
    },
    {
      date: '1961-01-01',
      tableDate: '1961',
      value: Infinity,
      yoyValue: Infinity,
      ytdValue: Infinity,
      c5maValue: Infinity
    },
    {
      date: '1962-01-01',
      tableDate: '1962',
      value: 195.2833,
      yoyValue: null,
      ytdValue: null,
      c5maValue: null,
      formattedValue: '195.28',
      formattedYoy: ' ',
      formattedYtd: ' ',
      formattedC5ma: ' '
    }];
    const expected = {
      chartData: chartData,
      tableData: tableData,
      start: '1960-01-01',
      end: '1962-01-01'
    };
    expect(service.dataTransform(seriesObservations, dates, decimals)).toEqual(expected);
  }));

  it('formatDate should return a formatted date string', inject([HelperService], (service: HelperService) => {
    const freqs = ['A', 'Q', 'M', 'S'];
    const date = '2000-01-01';
    const expected = ['2000', 'Q1 2000', '01-2000', '01-2000'];
    freqs.forEach((freq, index) => {
      expect(service.formatDate(date, freq)).toEqual(expected[index]);
    });
  }));

  it('formatNum should round and convert number to string', inject([HelperService], (service: HelperService) => {
    const actual = [-2540.2545, -150.3498, -0.2786, 0.3586, 157.5867, 2587693.7586];
    const decimal = [2, 2, 2, 1, 3, 2];
    const expected = ['-2,540.25', '-150.35', '-0.28', '0.4', '157.587', '2,587,693.76'];
    actual.forEach((item, index) => {
      expect(service.formatNum(item, decimal[index])).toEqual(expected[index]);
    });
  }));
});
