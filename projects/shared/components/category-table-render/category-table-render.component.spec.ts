import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CategoryTableRenderComponent } from './category-table-render.component';

describe('CategoryTableRenderComponent', () => {
  let component: CategoryTableRenderComponent;
  let fixture: ComponentFixture<CategoryTableRenderComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [CategoryTableRenderComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CategoryTableRenderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
