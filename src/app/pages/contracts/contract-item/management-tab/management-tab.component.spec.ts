import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'app/../common-testing.module';

import { ManagementTabComponent } from './management-tab.component';

describe('ManagementTabComponent', () => {
  let component: ManagementTabComponent;
  let fixture: ComponentFixture<ManagementTabComponent>;

  CommonTestingModule.setUpTestBed(ManagementTabComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ManagementTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
