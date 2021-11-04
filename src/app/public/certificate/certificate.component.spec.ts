import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'app/../common-testing.module';
import { NgxCertificateComponent } from './certificate.component';

describe('NgxCertificateComponent', () => {
  let component: NgxCertificateComponent;
  let fixture: ComponentFixture<NgxCertificateComponent>;

  CommonTestingModule.setUpTestBed();

  beforeEach(() => {
    fixture = TestBed.createComponent(NgxCertificateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
