import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeSeriesComponent } from './time-series.component';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('TimeSeriesComponent', () => {
  let component: TimeSeriesComponent;
  let fixture: ComponentFixture<TimeSeriesComponent>;

  CommonTestingModule.setUpTestBed(TimeSeriesComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(TimeSeriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
