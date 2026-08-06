import { TestBed } from '@angular/core/testing';

import { SystemSetting } from './system-setting';

describe('SystemSetting', () => {
  let service: SystemSetting;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SystemSetting);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
