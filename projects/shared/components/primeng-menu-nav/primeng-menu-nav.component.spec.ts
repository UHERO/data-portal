import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PrimengMenuNavComponent } from './primeng-menu-nav.component';

describe('PrimengMenuNavComponent', () => {
  let component: PrimengMenuNavComponent;
  let fixture: ComponentFixture<PrimengMenuNavComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [PrimengMenuNavComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrimengMenuNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
