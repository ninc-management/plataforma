import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'app/../common-testing.module';

import { SelectorDialogComponent } from './selector-dialog.component';

describe('SelectorDialogComponent', () => {
  let component: SelectorDialogComponent;
  let fixture: ComponentFixture<SelectorDialogComponent>;

  CommonTestingModule.setUpTestBed(SelectorDialogComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
