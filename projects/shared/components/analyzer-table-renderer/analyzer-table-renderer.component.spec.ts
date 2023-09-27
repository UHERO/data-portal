import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AnalyzerTableRendererComponent } from './analyzer-table-renderer.component';

describe('AnalyzerTableRendererComponent', () => {
  let component: AnalyzerTableRendererComponent;
  let fixture: ComponentFixture<AnalyzerTableRendererComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [AnalyzerTableRendererComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalyzerTableRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
