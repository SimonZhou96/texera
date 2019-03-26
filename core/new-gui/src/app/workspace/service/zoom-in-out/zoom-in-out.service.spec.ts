import { TestBed, inject } from '@angular/core/testing';

import { ZoomInOutService } from './zoom-in-out.service';

describe('ZoomInOutService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ZoomInOutService]
    });
  });

  it('should be created', inject([ZoomInOutService], (service: ZoomInOutService) => {
    expect(service).toBeTruthy();
  }));
});
