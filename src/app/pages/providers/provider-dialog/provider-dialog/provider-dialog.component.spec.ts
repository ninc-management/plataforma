import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'common-testing.module';

import { ProviderDialogComponent } from './provider-dialog.component';

describe('ProviderDialogComponent', () => {
  let component: ProviderDialogComponent;
  let fixture: ComponentFixture<ProviderDialogComponent>;

  CommonTestingModule.setUpTestBed(ProviderDialogComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ProviderDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
