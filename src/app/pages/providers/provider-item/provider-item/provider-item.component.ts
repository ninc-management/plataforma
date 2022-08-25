import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NbDialogService } from '@nebular/theme';
import { cloneDeep } from 'lodash';
import { BehaviorSubject, skipWhile, Subject, take, takeUntil } from 'rxjs';

import { FileUploadDialogComponent } from 'app/shared/components/file-upload/file-upload.component';
import { ProviderService } from 'app/shared/services/provider.service';
import { trackByIndex } from 'app/shared/utils';

import { Provider } from '@models/provider';

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
export class ProviderItemComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() clonedProvider = new Provider();
  @Input() isFormDirty = new BehaviorSubject<boolean>(false);
  isDialogBlocked = new BehaviorSubject<boolean>(false);
  @Output() submit = new EventEmitter<void>();
  @ViewChild('form') ngForm = {} as NgForm;
  private destroy$ = new Subject<void>();
  provider = new Provider();
  editing = false;
  submitted = false;
  validation = provider_validation as any;
  typeOfPerson = TypesOfPerson;
  isDataLoading = true;
  selectedOption = TypesOfPerson.PESSOA_FISICA;
  options = { serviceName: '', productName: '' };
  trackByIndex = trackByIndex;

  constructor(private providerService: ProviderService, private dialogService: NbDialogService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  ngOnInit(): void {
    if (this.clonedProvider._id !== undefined) {
      this.editing = true;
      this.provider = cloneDeep(this.clonedProvider);
    }
    this.providerService.isDataLoaded$
      .pipe(
        skipWhile((isProviderLoaded) => !isProviderLoaded),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.isDataLoading = false;
      });
  }

  ngAfterViewInit() {
    if (this.ngForm)
      this.ngForm.statusChanges?.subscribe(() => {
        if (this.ngForm.dirty) this.isFormDirty.next(true);
      });
  }

  registerProvider(): void {
    this.submitted = true;
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
}
