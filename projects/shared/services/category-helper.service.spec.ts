import { TestBed } from '@angular/core/testing';

import { CategoryHelperService } from './category-helper.service';

describe('CategoryHelperService', () => {
  let service: CategoryHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CategoryHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
