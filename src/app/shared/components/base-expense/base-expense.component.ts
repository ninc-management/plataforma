import { Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NbDialogService } from '@nebular/theme';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { skipWhile, take } from 'rxjs/operators';

import { OneDriveDocumentUploader } from '../onedrive-document-uploader/onedrive-document-uploader.component';
import { SPLIT_TYPES } from 'app/shared/services/contract.service';
import { OneDriveService } from 'app/shared/services/onedrive.service';
import { ProviderService } from 'app/shared/services/provider.service';
import { UserService } from 'app/shared/services/user.service';

import { Provider } from '@models/provider';
import { User } from '@models/user';

@Component({
  selector: 'ngx-base-expense',
  template: '',
  styleUrls: ['./base-expense.component.scss'],
})
export class BaseExpenseComponent extends OneDriveDocumentUploader implements OnInit, OnDestroy {
  @ViewChild('form', { static: true })
  formRef!: NgForm;
  @Output()
  submit: EventEmitter<void> = new EventEmitter<void>();
  validation: any;
  sTypes = Object.values(SPLIT_TYPES);
  today = new Date();

  userSearch = '';
  userData: Observable<User[]> = of([]);

  sourceSearch = '';
  sourceData: Observable<User[]> = of([]);

  providerSearch = '';
  providerData: Observable<Provider[]> = of([]);

  protected sourceArray = new BehaviorSubject<User[]>([]);
  protected userArray = new BehaviorSubject<User[]>([]);
  protected providerArray = new BehaviorSubject<Provider[]>([]);

  constructor(
    protected onedrive: OneDriveService,
    protected dialogService: NbDialogService,
    protected providerService: ProviderService,
    public userService: UserService
  ) {
    super(onedrive, dialogService);
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  ngOnInit(): void {
    super.ngOnInit();

    this.userData = this.userArray;
    this.sourceData = this.sourceArray;
    this.providerData = this.providerArray;

    this.providerService
      .getProviders()
      .pipe(
        take(2),
        skipWhile((providers) => providers.length == 0)
      )
      .subscribe((providers) => {
        this.providerArray.next(providers);
      });
  }
}
