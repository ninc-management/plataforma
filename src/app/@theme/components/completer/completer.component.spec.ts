import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'app/../common-testing.module';

import { NbCompleterComponent } from './completer.component';

describe('NbCompleterComponent', () => {
  let component: NbCompleterComponent;
  let fixture: ComponentFixture<NbCompleterComponent>;

  CommonTestingModule.setUpTestBed(NbCompleterComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(NbCompleterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
