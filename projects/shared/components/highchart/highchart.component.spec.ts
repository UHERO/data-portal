import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HighchartComponent } from './highchart.component';

describe('HighchartComponent', () => {
  let component: HighchartComponent;
  let fixture: ComponentFixture<HighchartComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [HighchartComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HighchartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
