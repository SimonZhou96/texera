import { TestBed, inject } from '@angular/core/testing';

import { PreviewMapService } from './preview-map.service';

describe('PreviewMapService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PreviewMapService]
    });
  });

  it('should be created', inject([PreviewMapService], (service: PreviewMapService) => {
    expect(service).toBeTruthy();
  }));
});
