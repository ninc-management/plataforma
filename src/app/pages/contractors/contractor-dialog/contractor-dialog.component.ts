import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { NB_DOCUMENT, NbComponentStatus, NbDialogRef, NbDialogService, NbToastrService } from '@nebular/theme';
import { Subject, take, takeUntil } from 'rxjs';

import { BaseDialogComponent } from 'app/shared/components/base-dialog/base-dialog.component';
import { ConfirmationDialogComponent } from 'app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { ContractorService } from 'app/shared/services/contractor.service';
import { isObjectUpdated, isPhone, tooltipTriggers } from 'app/shared/utils';

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
  objectOutdated$ = new Subject<void>();
  isOutdated = false;

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<ContractorDialogComponent>,
    private dialogService: NbDialogService,
    private nbToastrService: NbToastrService,
    private contractorService: ContractorService
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {
    this.objectOutdated$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.isOutdated = true;
    });
    if (this.contractor.__v) {
      isObjectUpdated(
        this.contractorService.getContractors(),
        this.contractor._id,
        this.contractor.__v,
        this.destroy$,
        this.objectOutdated$
      );
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

  notify(status: NbComponentStatus): void {
    this.nbToastrService.show(status, `Link do Cliente copiado!`, { status });
  }
}
