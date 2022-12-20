import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'app/../common-testing.module';

import { OneDriveDocumentUploader } from './onedrive-document-uploader.component';

describe('OneDriveDocumentUploader', () => {
  let component: OneDriveDocumentUploader;
  let fixture: ComponentFixture<OneDriveDocumentUploader>;

  CommonTestingModule.setUpTestBed(OneDriveDocumentUploader);

  beforeEach(() => {
    fixture = TestBed.createComponent(OneDriveDocumentUploader);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
