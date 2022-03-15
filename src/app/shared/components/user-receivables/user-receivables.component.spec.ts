import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'common-testing.module';

import { UserReceivablesComponent } from './user-receivables.component';

describe('UserReceivablesComponent', () => {
  let component: UserReceivablesComponent;
  let fixture: ComponentFixture<UserReceivablesComponent>;

  CommonTestingModule.setUpTestBed(UserReceivablesComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(UserReceivablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
