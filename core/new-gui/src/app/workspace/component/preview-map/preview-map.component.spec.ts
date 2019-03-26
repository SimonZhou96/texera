import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviewMapComponent } from './preview-map.component';

describe('PreviewMapComponent', () => {
  let component: PreviewMapComponent;
  let fixture: ComponentFixture<PreviewMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PreviewMapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PreviewMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
