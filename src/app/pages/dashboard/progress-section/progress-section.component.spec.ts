import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressSectionComponent } from './progress-section.component';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('ProgressSectionComponent', () => {
  let component: ProgressSectionComponent;
  let fixture: ComponentFixture<ProgressSectionComponent>;

  CommonTestingModule.setUpTestBed(ProgressSectionComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgressSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
