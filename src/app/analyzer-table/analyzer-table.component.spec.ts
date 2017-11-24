import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, Input } from '@angular/core';
import { HttpModule, Http, XHRBackend, BaseRequestOptions, ConnectionBackend, Response, ResponseOptions } from '@angular/http';
import { RouterTestingModule } from '@angular/router/testing';
import { AnalyzerService } from '../analyzer.service';
import { HelperService } from '../helper.service';
import { SeriesHelperService } from '../series-helper.service';
import { GoogleAnalyticsEventsService } from '../google-analytics-events.service';
import { TableHelperService } from '../table-helper.service';
import { UheroApiService } from '../uhero-api.service';
import { DataPortalSettingsService } from '../data-portal-settings.service';
import { AnalyzerTableComponent } from './analyzer-table.component';

// Create stub for datatable component
@Component({selector: 'app-category-datatables', template: ''})
class ChartStubComponent {
  @Input() portalSettings;
  @Input() yoy;
  @Input() ytd;
  @Input() c5ma;
  @Input() categoryDates;
  @Input() analyzerSeries;
  @Input() analyzer;
  @Input() tableId;
}

describe('AnalyzerTableComponent', () => {
  let component: AnalyzerTableComponent;
  let fixture: ComponentFixture<AnalyzerTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AnalyzerTableComponent, ChartStubComponent ],
      providers: [
        AnalyzerService,
        DataPortalSettingsService,
        GoogleAnalyticsEventsService,
        HelperService,
        SeriesHelperService,
        TableHelperService,
        UheroApiService,
        { provide: 'rootCategory', useValue: 59 },
        { provide: 'portal', useValue: 'uhero' }
      ],
      imports: [ RouterTestingModule, HttpModule ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalyzerTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
