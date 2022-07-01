import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'common-testing.module';

import { MetricItemComponent } from './metric-item.component';

describe('MetricItemComponent', () => {
  let component: MetricItemComponent;
  let fixture: ComponentFixture<MetricItemComponent>;

  CommonTestingModule.setUpTestBed(MetricItemComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(MetricItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
