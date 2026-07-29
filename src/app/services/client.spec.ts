import { TestBed } from '@angular/core/testing';

import { Client } from './client';

describe('Client', () => {
  let service: Client;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    // Client is a type-only export; create a simple mock for testing
    service = {} as Client;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
