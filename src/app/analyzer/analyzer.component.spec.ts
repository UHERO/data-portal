import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, Input } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { RouterLinkStubDirective, ActivatedRouteStub, ActivatedRoute } from '../../testing/router-stubs';
import { AnalyzerService } from '../analyzer.service';
import { DataPortalSettingsService } from '../data-portal-settings.service';
import { AnalyzerComponent } from './analyzer.component';
import { SeriesHelperService } from '../series-helper.service';
import { HelperService } from '../helper.service';
import { UheroApiService } from '../uhero-api.service';
import { RouterTestingModule } from '@angular/router/testing';

// Create stub for analyzer-highstock
@Component({selector: 'app-analyzer-highstock', template: ''})
class AnalyzerHighstockStubComponent {
  @Input() portalSettings;
  @Input() series;
  @Input() alertMessage;
  @Input() allDates;
  @Input() start;
  @Input() end;
  @Input() nameChecked;
  @Input() unitsChecked;
  @Input() geoChecked;
  @Input() navigator;
}

// Create stub for analyzer-table
@Component({selector: 'app-analyzer-table', template: ''})
class AnalyzerTableStubComponent {
  @Input() minDate;
  @Input() maxDate;
  @Input() chartSeries;
  @Input() series;
  @Input() allTableDates;
  @Input() yoyChecked;
  @Input() ytdChecked;
  @Input() c5maChecked;
}

@Component({selector: 'app-share-link', template: ''})
class ShareStubComponent {
  @Input() analyzerSeries;
  @Input() chartSeries;
  @Input() view;
  @Input() name;
  @Input() units;
  @Input() geography;
  @Input() yoy;
  @Input() ytd;
  @Input() c5ma;
  @Input() startDate;
  @Input() endDate;
}

let activatedRoute: ActivatedRouteStub;

describe('AnalyzerComponent', () => {
  let component: AnalyzerComponent;
  let fixture: ComponentFixture<AnalyzerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AnalyzerComponent, AnalyzerHighstockStubComponent, AnalyzerTableStubComponent, ShareStubComponent ],
      providers: [
        AnalyzerService,
        DataPortalSettingsService,
        HelperService,
        UheroApiService,
        SeriesHelperService,
        {
          provide: 'portal',
          useValue: {
            universe: 'uhero',
            title: 'Data Portal',
            favicon: 'manoa.jpg',
            feedback: true,
            backgroundImg: false
          }
        },
        { provide: 'rootCategory', useValue: 59 },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ],
      imports: [HttpClientModule, RouterTestingModule]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalyzerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
