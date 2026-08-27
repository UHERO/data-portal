import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalyzerHelpDialogComponent } from './analyzer-help-dialog.component';

describe('AnalyzerHelpDialogComponent', () => {
  let component: AnalyzerHelpDialogComponent;
  let fixture: ComponentFixture<AnalyzerHelpDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalyzerHelpDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnalyzerHelpDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
