import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NbDialogService } from '@nebular/theme';
import { cloneDeep, isEqual } from 'lodash';
import { BehaviorSubject, skip, skipWhile, take, takeUntil } from 'rxjs';

import { FileUploadDialogComponent } from 'app/shared/components/file-upload/file-upload.component';
import { OneDriveDocumentUploader } from 'app/shared/components/onedrive-document-uploader/onedrive-document-uploader.component';
import { OneDriveFolders, OneDriveService } from 'app/shared/services/onedrive.service';
import { ProviderService } from 'app/shared/services/provider.service';
import { compareFiles, trackByIndex } from 'app/shared/utils';

import { Provider } from '@models/provider';
import { UploadedFile, UploadedFileWithDescription } from '@models/shared';

import provider_validation from 'app/shared/validators/provider-validation.json';

enum TypesOfPerson {
  PESSOA_FISICA = 'pessoa física',
  PESSOA_JURIDICA = 'pessoa jurídica',
}

@Component({
  selector: 'ngx-provider-item',
  templateUrl: './provider-item.component.html',
  styleUrls: ['./provider-item.component.scss'],
})
export class ProviderItemComponent extends OneDriveDocumentUploader implements OnInit, OnDestroy, AfterViewInit {
  @Input() clonedProvider = new Provider();
  @Input() isFormDirty = new BehaviorSubject<boolean>(false);
  isDialogBlocked = new BehaviorSubject<boolean>(false);
  @Output() submit = new EventEmitter<void>();
  @ViewChild('form') ngForm = {} as NgForm;
  provider = new Provider();
  editing = false;
  submitted = false;
  validation = provider_validation as any;
  typeOfPerson = TypesOfPerson;
  isDataLoading = true;
  selectedOption = TypesOfPerson.PESSOA_FISICA;
  options = { serviceName: '', productName: '' };
  folderPath: string = '';
  initialFiles: UploadedFileWithDescription[] = [];
  trackByIndex = trackByIndex;

  constructor(
    private providerService: ProviderService,
    private dialogService: NbDialogService,
    protected onedrive: OneDriveService
  ) {
    super(onedrive);
  }

  ngOnDestroy(): void {
    if (!this.submitted && !isEqual(this.initialFiles, this.uploadedFiles)) {
      this.deleteFiles();
    }
    super.ngOnDestroy();
  }

  ngOnInit(): void {
    super.ngOnInit();
    if (this.clonedProvider._id !== undefined) {
      this.editing = true;
      this.provider = cloneDeep(this.clonedProvider);
      this.uploadedFiles = cloneDeep(this.provider.uploadedFiles);
    }
    this.providerService.isDataLoaded$
      .pipe(
        skipWhile((isProviderLoaded) => !isProviderLoaded),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.isDataLoading = false;
      });
    this.initialFiles = cloneDeep(this.uploadedFiles) as UploadedFileWithDescription[];
  }

  ngAfterViewInit() {
    this.ngForm?.control.statusChanges.pipe(skip(1), takeUntil(this.destroy$)).subscribe((status) => {
      if (this.ngForm.dirty) this.isFormDirty.next(true);
      if (status == 'VALID') this.updateUploaderOptions();
    });
  }

  getFile(file: UploadedFile | UploadedFileWithDescription): UploadedFileWithDescription {
    return file as UploadedFileWithDescription;
  }

  updateUploaderOptions(): void {
    const mediaFolderPath = this.provider.fullName;
    const fn = (name: string) => {
      const extension = name.match('[.].+');
      return 'documento' + extension;
    };
    this.folderPath = mediaFolderPath;
    super.updateUploaderOptions(mediaFolderPath, fn, OneDriveFolders.PROVIDERS);
  }

  registerProvider(): void {
    this.submitted = true;
    this.provider.uploadedFiles = cloneDeep(this.uploadedFiles) as UploadedFileWithDescription[];
    if (this.editing) this.providerService.editProvider(this.provider);
    else this.providerService.saveProvider(this.provider);
    this.isFormDirty.next(false);
    this.submit.emit();
  }

  uploadDialog(): void {
    this.isDialogBlocked.next(true);
    this.dialogService
      .open(FileUploadDialogComponent, {
        context: {
          title: 'Envio de foto de perfil',
          allowedMimeType: ['image/png', 'image/jpg', 'image/jpeg'],
          maxFileSize: 0.5,
          name: {
            fn: (name: string) => {
              return this.provider._id;
            },
          },
        },
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
      })
      .onClose.pipe(take(1))
      .subscribe((urls) => {
        this.isDialogBlocked.next(false);
        if (urls.length > 0) {
          this.provider.profilePicture = urls[0].url;
          this.providerService.editProvider(this.provider);
        }
      });
  }

  deleteFiles(): void {
    const filesToRemove = this.uploadedFiles.filter((file) => !compareFiles(this.initialFiles, file));
    if (filesToRemove.length > 0) this.onedrive.deleteFiles(this.folderPath, filesToRemove);
  }
}
