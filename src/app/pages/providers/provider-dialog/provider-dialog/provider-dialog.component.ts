import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { NB_DOCUMENT, NbDialogRef, NbDialogService } from '@nebular/theme';
import { take } from 'rxjs';

import { BaseDialogComponent } from 'app/shared/components/base-dialog/base-dialog.component';
import { ConfirmationDialogComponent } from 'app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { isPhone, tooltipTriggers } from 'app/shared/utils';

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

  isPhone = isPhone;
  tooltipTriggers = tooltipTriggers;

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<ProviderDialogComponent>,
    private dialogService: NbDialogService
  ) {
    super(derivedDocument, derivedRef);
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
