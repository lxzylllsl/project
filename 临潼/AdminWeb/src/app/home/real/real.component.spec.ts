import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RealComponent } from './real.component';

describe('RealComponent', () => {
  let component: RealComponent;
  let fixture: ComponentFixture<RealComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RealComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RealComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
