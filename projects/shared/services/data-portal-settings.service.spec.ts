import { TestBed } from '@angular/core/testing';

import { DataPortalSettingsService } from './data-portal-settings.service';

describe('DataPortalSettingsService', () => {
  let service: DataPortalSettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataPortalSettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
