import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'app/../common-testing.module';

import { TextInputDialogComponent } from './text-input-dialog.component';

describe('TextInputDialogComponent', () => {
  let component: TextInputDialogComponent;
  let fixture: ComponentFixture<TextInputDialogComponent>;

  CommonTestingModule.setUpTestBed(TextInputDialogComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(TextInputDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
