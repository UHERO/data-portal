import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeriesHelpDialogComponent } from './series-help-dialog.component';

describe('SeriesHelpDialogComponent', () => {
  let component: SeriesHelpDialogComponent;
  let fixture: ComponentFixture<SeriesHelpDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeriesHelpDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeriesHelpDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
