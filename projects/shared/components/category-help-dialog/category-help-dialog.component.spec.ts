import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryHelpDialogComponent } from './category-help-dialog.component';

describe('CategoryHelpDialogComponent', () => {
  let component: CategoryHelpDialogComponent;
  let fixture: ComponentFixture<CategoryHelpDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryHelpDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategoryHelpDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
