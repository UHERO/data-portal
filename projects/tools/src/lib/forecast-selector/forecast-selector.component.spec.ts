import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForecastSelectorComponent } from './forecast-selector.component';

describe('ForecastSelectorComponent', () => {
  let component: ForecastSelectorComponent;
  let fixture: ComponentFixture<ForecastSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ForecastSelectorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ForecastSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
