import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { NB_DOCUMENT, NbDialogRef, NbDialogService } from '@nebular/theme';
import { Subject, take } from 'rxjs';

import { BaseDialogComponent } from 'app/shared/components/base-dialog/base-dialog.component';
import { ConfirmationDialogComponent } from 'app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { ProviderService } from 'app/shared/services/provider.service';
import { isObjectUpdated, isPhone, tooltipTriggers } from 'app/shared/utils';

import { Provider } from '@models/provider';

export enum DIALOG_TYPES {
  PROVIDER,
  CONTACT,
}
@Component({
  selector: 'ngx-provider-dialog',
  templateUrl: './provider-dialog.component.html',
  styleUrls: ['./provider-dialog.component.scss'],
})
export class ProviderDialogComponent extends BaseDialogComponent implements OnInit {
  @Input() title = '';
  @Input() provider = new Provider();
  @Input() componentType = DIALOG_TYPES.PROVIDER;
  dtypes = DIALOG_TYPES;
  providerversion?: number = 0;
  objectOutdated$ = new Subject<void>();
  isOutdated: boolean = false;

  isPhone = isPhone;
  tooltipTriggers = tooltipTriggers;

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<ProviderDialogComponent>,
    private dialogService: NbDialogService,
    private providerService: ProviderService
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {
    this.providerversion = this.provider.__v;
    if (this.providerversion != undefined) {
      isObjectUpdated(
        this.providerService.getProviders(),
        { _id: this.provider._id, __v: this.providerversion },
        this.destroy$,
        this.objectOutdated$
      );
      this.objectOutdated$.subscribe(() => {
        this.isOutdated = true;
      });
    }
  }

  dismiss(): void {
    if (this.isFormDirty.value) {
      this.dialogService
        .open(ConfirmationDialogComponent, {
          context: {
            question: 'Deseja descartar as alterações feitas?',
          },
          dialogClass: 'my-dialog',
          closeOnBackdropClick: false,
          closeOnEsc: false,
          autoFocus: false,
        })
        .onClose.pipe(take(1))
        .subscribe((response: boolean) => {
          if (response) {
            super.dismiss();
          }
        });
    } else {
      super.dismiss();
    }
  }
}
