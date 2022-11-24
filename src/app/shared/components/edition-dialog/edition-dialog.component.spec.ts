import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'common-testing.module';

import { EditionDialogComponent } from './edition-dialog.component';

describe('EditionDialogComponent', () => {
  let component: EditionDialogComponent;
  let fixture: ComponentFixture<EditionDialogComponent>;

  CommonTestingModule.setUpTestBed(EditionDialogComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(EditionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});