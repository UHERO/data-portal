import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AnalyzerTableComponent } from './analyzer-table.component';

describe('AnalyzerTableComponent', () => {
  let component: AnalyzerTableComponent;
  let fixture: ComponentFixture<AnalyzerTableComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [AnalyzerTableComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalyzerTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
