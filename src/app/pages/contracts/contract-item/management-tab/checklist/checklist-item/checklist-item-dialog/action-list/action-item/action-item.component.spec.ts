import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'common-testing.module';

import { ActionItemComponent } from './action-item.component';

describe('ActionItemComponent', () => {
  let component: ActionItemComponent;
  let fixture: ComponentFixture<ActionItemComponent>;

  CommonTestingModule.setUpTestBed(ActionItemComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ActionItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
