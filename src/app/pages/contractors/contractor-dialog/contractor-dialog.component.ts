import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { NB_DOCUMENT, NbComponentStatus, NbDialogRef, NbDialogService, NbToastrService } from '@nebular/theme';
import { take } from 'rxjs';

import { BaseDialogComponent } from 'app/shared/components/base-dialog/base-dialog.component';
import { ConfirmationDialogComponent } from 'app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { isPhone, tooltipTriggers } from 'app/shared/utils';

import { ComercialRepresentative, Contractor, LegalRepresentative } from '@models/contractor';

@Component({
  selector: 'ngx-contractor-dialog',
  templateUrl: './contractor-dialog.component.html',
  styleUrls: ['./contractor-dialog.component.scss'],
})
export class ContractorDialogComponent extends BaseDialogComponent implements OnInit {
  @Input() title = '';
  @Input() contractor = new Contractor();
  @Input() contractors?: Contractor[];
  @Input() representative?: LegalRepresentative | ComercialRepresentative;

  isPhone = isPhone;
  tooltipTriggers = tooltipTriggers;
  baseUrl = location.origin;

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<ContractorDialogComponent>,
    private dialogService: NbDialogService,
    private nbToastrService: NbToastrService
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

  notify(status: NbComponentStatus): void {
    this.nbToastrService.show(status, `Link do Cliente copiado!`, { status });
  }
}
