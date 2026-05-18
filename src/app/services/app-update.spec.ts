import { TestBed } from '@angular/core/testing';

import { AppUpdate } from './app-update';

describe('AppUpdate', () => {
  let service: AppUpdate;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppUpdate);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
