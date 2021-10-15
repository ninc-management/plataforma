import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'common-testing.module';

import { ParticipantItemComponent } from './participant-item.component';

describe('ParticipantItemComponent', () => {
  let component: ParticipantItemComponent;
  let fixture: ComponentFixture<ParticipantItemComponent>;

  CommonTestingModule.setUpTestBed(ParticipantItemComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ParticipantItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
