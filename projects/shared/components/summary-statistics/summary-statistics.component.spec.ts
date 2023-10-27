import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SummaryStatisticsComponent } from './summary-statistics.component';

describe('SummaryStatisticsComponent', () => {
  let component: SummaryStatisticsComponent;
  let fixture: ComponentFixture<SummaryStatisticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [SummaryStatisticsComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(SummaryStatisticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
