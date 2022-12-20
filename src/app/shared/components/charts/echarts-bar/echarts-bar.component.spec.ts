import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'app/../common-testing.module';

import { EchartsBarComponent } from './echarts-bar.component';

describe('EchartsBarComponent', () => {
  let component: EchartsBarComponent;
  let fixture: ComponentFixture<EchartsBarComponent>;

  CommonTestingModule.setUpTestBed(EchartsBarComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(EchartsBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
