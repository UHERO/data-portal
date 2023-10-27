import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FreqSelectorComponent } from './freq-selector.component';

describe('FreqSelectorComponent', () => {
  let component: FreqSelectorComponent;
  let fixture: ComponentFixture<FreqSelectorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [FreqSelectorComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FreqSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
