import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EchartsBarComponent } from './echarts-bar.component';
import { CommonTestingModule } from 'app/../common-testing.module';

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
