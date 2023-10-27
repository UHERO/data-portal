import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CategoryTableViewComponent } from './category-table-view.component';

describe('CategoryTableViewComponent', () => {
  let component: CategoryTableViewComponent;
  let fixture: ComponentFixture<CategoryTableViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [CategoryTableViewComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CategoryTableViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
