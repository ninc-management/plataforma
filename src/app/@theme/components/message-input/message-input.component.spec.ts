import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'common-testing.module';

import { NbMessageInputComponent } from './message-input.component';

describe('NbMessageInputComponent', () => {
  let component: NbMessageInputComponent;
  let fixture: ComponentFixture<NbMessageInputComponent>;

  CommonTestingModule.setUpTestBed(NbMessageInputComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(NbMessageInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
