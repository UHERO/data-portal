import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EmbedGraphComponent } from './embed-graph.component';

describe('EmbedGraphComponent', () => {
  let component: EmbedGraphComponent;
  let fixture: ComponentFixture<EmbedGraphComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [EmbedGraphComponent]
})
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EmbedGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
