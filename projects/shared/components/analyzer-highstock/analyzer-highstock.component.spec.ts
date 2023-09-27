import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AnalyzerHighstockComponent } from './analyzer-highstock.component';

describe('AnalyzerHighstockComponent', () => {
  let component: AnalyzerHighstockComponent;
  let fixture: ComponentFixture<AnalyzerHighstockComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [AnalyzerHighstockComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalyzerHighstockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
