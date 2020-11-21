import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompleterComponent } from './completer.component';

describe('CompleterComponent', () => {
  let component: CompleterComponent;
  let fixture: ComponentFixture<CompleterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CompleterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CompleterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
