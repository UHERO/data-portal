import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HighstockComponent } from './highstock.component';

describe('HighstockComponent', () => {
  let component: HighstockComponent;
  let fixture: ComponentFixture<HighstockComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [HighstockComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HighstockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
