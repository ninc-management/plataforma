import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'app/../common-testing.module';

import { ProfileComponent } from './profile.component';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  CommonTestingModule.setUpTestBed(ProfileComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
