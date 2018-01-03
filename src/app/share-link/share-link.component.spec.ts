import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterLinkStubDirective, ActivatedRouteStub, ActivatedRoute } from '../../testing/router-stubs';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpModule, Http, XHRBackend, BaseRequestOptions, ConnectionBackend, Response, ResponseOptions } from '@angular/http';

import { ShareLinkComponent } from './share-link.component';
import { ClipboardService } from '../clipboard.service';
import { AnalyzerService } from '../analyzer.service';
import { UheroApiService } from '../uhero-api.service';
import { HelperService } from '../helper.service';

let activatedRoute: ActivatedRouteStub;

describe('ShareLinkComponent', () => {
  let component: ShareLinkComponent;
  let fixture: ComponentFixture<ShareLinkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShareLinkComponent ],
      providers: [
        AnalyzerService,
        ClipboardService,
        HelperService,
        UheroApiService,
        { provide: 'portal', useValue: 'test' },
        { provide: 'rootCategory', useValue: 59 },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ],
      imports: [ HttpModule, RouterTestingModule ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShareLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
