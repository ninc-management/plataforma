import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'common-testing.module';

import { ChecklistItemDialogComponent } from './checklist-item-dialog.component';

describe('ChecklistItemDialogComponent', () => {
  let component: ChecklistItemDialogComponent;
  let fixture: ComponentFixture<ChecklistItemDialogComponent>;

  CommonTestingModule.setUpTestBed(ChecklistItemDialogComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ChecklistItemDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
