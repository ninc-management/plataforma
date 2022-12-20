import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'app/../common-testing.module';

import { FabItemComponent } from './fab-item.component';

describe('FabItemComponent', () => {
  let component: FabItemComponent;
  let fixture: ComponentFixture<FabItemComponent>;

  CommonTestingModule.setUpTestBed(FabItemComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(FabItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
