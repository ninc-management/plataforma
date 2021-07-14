import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FabComponent } from './fab.component';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('FabComponent', () => {
  let component: FabComponent;
  let fixture: ComponentFixture<FabComponent>;

  CommonTestingModule.setUpTestBed(FabComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(FabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
