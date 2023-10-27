import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AnalyzerStatsRendererComponent } from './analyzer-stats-renderer.component';

describe('AnalyzerStatsRendererComponent', () => {
  let component: AnalyzerStatsRendererComponent;
  let fixture: ComponentFixture<AnalyzerStatsRendererComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [AnalyzerStatsRendererComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalyzerStatsRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
