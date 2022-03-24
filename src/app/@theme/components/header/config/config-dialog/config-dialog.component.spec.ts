import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlatformConfig } from '@models/platformConfig';
import { CommonTestingModule } from 'common-testing.module';

import { ConfigDialogComponent } from './config-dialog.component';

describe('ConfigDialogComponent', () => {
  let component: ConfigDialogComponent;
  let fixture: ComponentFixture<ConfigDialogComponent>;

  CommonTestingModule.setUpTestBed(ConfigDialogComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigDialogComponent);
    component = fixture.componentInstance;
    component.config = new PlatformConfig();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
