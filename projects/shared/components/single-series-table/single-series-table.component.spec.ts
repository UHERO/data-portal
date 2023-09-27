import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleSeriesTableComponent } from './single-series-table.component';

describe('SingleSeriesTableComponent', () => {
  let component: SingleSeriesTableComponent;
  let fixture: ComponentFixture<SingleSeriesTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [SingleSeriesTableComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(SingleSeriesTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
