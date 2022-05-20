import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { NbDialogRef, NB_DOCUMENT } from '@nebular/theme';
import { ReceivableByContract } from 'app/shared/services/metrics.service';
import { BaseDialogComponent } from '../../../../shared/components/base-dialog/base-dialog.component';
import { isPhone, tooltipTriggers } from 'app/shared/utils';

@Component({
  selector: 'npx-receivables-dialog',
  templateUrl: './receivables-dialog.component.html',
  styleUrls: ['./receivables-dialog.component.scss'],
})
export class ReceivablesDialogComponent extends BaseDialogComponent implements OnInit {
  @Input() userReceivableContracts!: ReceivableByContract[];

  isPhone = isPhone;
  tooltipTriggers = tooltipTriggers;

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<ReceivablesDialogComponent>
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  dismiss(): void {
    super.dismiss();
  }
}
