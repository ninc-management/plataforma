import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagementTabComponent } from './management-tab.component';
import { CommonTestingModule } from 'app/../common-testing.module';

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
