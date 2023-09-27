import { TestBed } from '@angular/core/testing';

import { HighstockHelperService } from './highstock-helper.service';

describe('HighstockHelperService', () => {
  let service: HighstockHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HighstockHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
