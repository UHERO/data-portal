import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MeasurementSelectorComponent } from './measurement-selector.component';

describe('MeasurementSelectorComponent', () => {
  let component: MeasurementSelectorComponent;
  let fixture: ComponentFixture<MeasurementSelectorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [MeasurementSelectorComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MeasurementSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
