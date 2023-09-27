import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CategoryChartsComponent } from './category-charts.component';

describe('CategoryChartsComponent', () => {
  let component: CategoryChartsComponent;
  let fixture: ComponentFixture<CategoryChartsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [CategoryChartsComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CategoryChartsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
