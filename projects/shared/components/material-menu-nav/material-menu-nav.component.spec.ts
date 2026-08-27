import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaterialMenuNavComponent } from './material-menu-nav.component';

describe('MaterialMenuNavComponent', () => {
  let component: MaterialMenuNavComponent;
  let fixture: ComponentFixture<MaterialMenuNavComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaterialMenuNavComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaterialMenuNavComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
