import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryDatatablesComponent } from './category-datatables.component';

describe('CategoryDatatablesComponent', () => {
  let component: CategoryDatatablesComponent;
  let fixture: ComponentFixture<CategoryDatatablesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CategoryDatatablesComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CategoryDatatablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('formatTable should should format category data for table download', () => {
    const displaySeries = [{
      categoryDisplay: {
        chartData: {},
        tableData: [{
          c5maValue: 3.9867,
          date: '1972-01-01',
          formattedC5maValue: '4.0',
          formattedValue: '312.7',
          formattedYoy: '3.7',
          formattedYtd: '3.7',
          tableDate: '1972',
          value: 312.7,
          yoyValue: 3.7004,
          ytdValue: 3.7004
        }, {
          c5maValue: 3.9867,
          date: '1973-01-01',
          formattedC5maValue: '4.0',
          formattedValue: '312.7',
          formattedYoy: '3.7',
          formattedYtd: '3.7',
          tableDate: '1973',
          value: 312.7,
          yoyValue: 3.7004,
          ytdValue: 3.7004
        }],
      },
      seriesInfo: {
        displayName: 'Series Title'
      }
    }];
    const tableDates = [{
      date: '1972-01-01',
      tableDate: '1972'
    }, {
      date: '1973-01-01',
      tableDate: '1973'
    }];
    const expectedColumns = [{
      data: 'series',
      title: 'Series',
    }, {
      data: 'observations.1972',
      title: '1972'
    }, {
      data: 'observations.1973',
      title: '1973'
    }];
    const expectedData = [{
      observations: {
        1972: 312.7,
        1973: 312.7
      },
      series: 'Series Title'
    }];
    const sublist = { displaySeries: displaySeries };
    const analyzer = false;
    const analyzerSeries = [];
    const expected = { tableColumns: expectedColumns, tableData: expectedData };
    expect(component.formatTable(tableDates, analyzer, analyzerSeries, sublist)).toEqual(expected);
  });

  it('formatTable should should format analyzer series data for analyzer table download', () => {
    const analyzerSeries = [{
      categoryChart: {},
      analyzerTableData: [{
        c5maValue: 3.9867,
        date: '1972-01-01',
        formattedC5maValue: '4.0',
        formattedValue: '312.7',
        formattedYoy: '3.7',
        formattedYtd: '3.7',
        tableDate: '1972',
        value: 312.7,
        yoyValue: 3.7004,
        ytdValue: 3.7004
      }, {
        c5maValue: 3.9867,
        date: '1973-01-01',
        formattedC5maValue: '4.0',
        formattedValue: '312.7',
        formattedYoy: '3.7',
        formattedYtd: '3.7',
        tableDate: '1973',
        value: 312.7,
        yoyValue: 3.7004,
        ytdValue: 3.7004
      }],
      displayName: 'Series Title'
    }];
    const tableDates = [{
      date: '1972-01-01',
      tableDate: '1972'
    }, {
      date: '1973-01-01',
      tableDate: '1973'
    }];
    const expectedColumns = [{
      data: 'series',
      title: 'Series',
    }, {
      data: 'observations.1972',
      title: '1972'
    }, {
      data: 'observations.1973',
      title: '1973'
    }];
    const expectedData = [{
      observations: {
        1972: 312.7,
        1973: 312.7
      },
      series: 'Series Title'
    }];
    const sublist = {};
    const analyzer = true;
    const expected = { tableColumns: expectedColumns, tableData: expectedData };
    expect(component.formatTable(tableDates, analyzer, analyzerSeries, sublist)).toEqual(expected);
  });
});
