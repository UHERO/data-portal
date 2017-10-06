import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpModule, Http, XHRBackend, BaseRequestOptions, ConnectionBackend, Response, ResponseOptions } from '@angular/http';
import { RouterTestingModule } from '@angular/router/testing';
import { AnalyzerService } from '../analyzer.service';
import { HelperService } from '../helper.service';
import { SeriesHelperService } from '../series-helper.service';
import { TableHelperService } from '../table-helper.service';
import { UheroApiService } from '../uhero-api.service';
import { AnalyzerTableComponent } from './analyzer-table.component';

describe('AnalyzerTableComponent', () => {
  let component: AnalyzerTableComponent;
  let fixture: ComponentFixture<AnalyzerTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AnalyzerTableComponent ],
      providers: [
        AnalyzerService,
        HelperService,
        SeriesHelperService,
        TableHelperService,
        UheroApiService,
        { provide: 'rootCategory', useValue: 59 },
        { provide: 'portal', useValue: 'test' }
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
