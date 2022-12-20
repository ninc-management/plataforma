import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'app/../common-testing.module';

import { ProgressSectionComponent } from './progress-section.component';

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
