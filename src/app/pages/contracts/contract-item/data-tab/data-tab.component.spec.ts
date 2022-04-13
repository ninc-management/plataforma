import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'common-testing.module';

import { DataTabComponent } from './data-tab.component';

describe('DataTabComponent', () => {
  let component: DataTabComponent;
  let fixture: ComponentFixture<DataTabComponent>;

  CommonTestingModule.setUpTestBed(DataTabComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(DataTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
