import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'common-testing.module';
import { ManagementTabComponent } from '../../management-tab.component';

import { ChecklistItemComponent } from './checklist-item.component';

describe('ChecklistItemComponent', () => {
  let component: ChecklistItemComponent;
  let fixture: ComponentFixture<ChecklistItemComponent>;

  CommonTestingModule.setUpTestBed(ManagementTabComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ChecklistItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
