import { Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { User } from '@models/user';
import { NbFileItem, NbFileUploaderOptions, StorageProvider } from 'app/@theme/components';
import { UploadedFile } from 'app/@theme/components/file-uploader/file-uploader.service';
import { SPLIT_TYPES } from 'app/shared/services/contract.service';
import { OnedriveService } from 'app/shared/services/onedrive.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { UserService } from 'app/shared/services/user.service';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';

@Component({
  selector: 'ngx-base-expense',
  template: '',
  styleUrls: ['./base-expense.component.scss'],
})
export class BaseExpenseComponent implements OnInit, OnDestroy {
  @ViewChild('form', { static: true })
  formRef!: NgForm;
  @Output()
  submit: EventEmitter<void> = new EventEmitter<void>();
  protected destroy$ = new Subject<void>();
  protected newExpense$ = new Subject<void>();
  uploadedFiles: UploadedFile[] = [];
  validation: any;
  sTypes = Object.values(SPLIT_TYPES);
  today = new Date();

  uploaderOptions: NbFileUploaderOptions = {
    multiple: true,
    directory: false,
    showUploadQueue: true,
    storageProvider: StorageProvider.ONEDRIVE,
    mediaFolderPath: 'profileImages/',
  };
  allowedMimeType = ['image/png', 'image/jpg', 'image/jpeg', 'application/pdf'];
  fileTypesAllowed: string[] = [];
  maxFileSize = 4;

  userSearch = '';
  userData: Observable<User[]> = of([]);

  sourceSearch = '';
  sourceData: Observable<User[]> = of([]);
  protected sourceArray = new BehaviorSubject<User[]>([]);
  protected userArray = new BehaviorSubject<User[]>([]);

  constructor(
    protected stringUtil: StringUtilService,
    protected onedrive: OnedriveService,
    public userService: UserService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.newExpense$.next();
    this.newExpense$.complete();
  }

  ngOnInit(): void {
    this.fileTypesAllowed = this.allowedMimeType.map((fileType: string) =>
      fileType.substring(fileType.lastIndexOf('/') + 1, fileType.length)
    );

    this.userData = this.userArray;
    this.sourceData = this.sourceArray;
  }

  updateUploaderOptions(folderPath: string, nameFn: (name: string) => string, isTeamFolder?: boolean): void {
    this.uploaderOptions = {
      multiple: true,
      directory: false,
      showUploadQueue: true,
      storageProvider: StorageProvider.ONEDRIVE,
      mediaFolderPath: folderPath,
      allowedFileTypes: this.allowedMimeType,
      isTeamFolder: isTeamFolder,
      filter: {
        fn: (item?: File) => {
          if (!item) return false;
          // Verifica se arquivo é maior que maxFileSize mb
          if (item.size / 1024 / 1024 > this.maxFileSize) {
            return false;
          }
          const itemType = item.name.substring(item.name.lastIndexOf('.') + 1, item.name.length) || item.name;
          if (!this.fileTypesAllowed.includes(itemType)) {
            return false;
          }
          return true;
        },
      },
      name: {
        fn: nameFn,
      },
    };
  }

  urlReceiver(uploadedFile$: Observable<BehaviorSubject<NbFileItem>>): void {
    uploadedFile$.pipe(takeUntil(this.newExpense$)).subscribe((file$) => {
      if (file$)
        file$.pipe(take(2)).subscribe((file) => {
          if (file$.getValue().isSuccess) this.uploadedFiles.push({ name: file.name, url: file.url });
        });
    });
  }

  removeFile(index: number): void {
    //TODO: Remove file on Onedrive
    this.uploadedFiles.splice(index, 1);
  }
}
