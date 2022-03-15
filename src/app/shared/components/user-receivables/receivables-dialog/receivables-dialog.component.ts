import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { NbDialogRef, NB_DOCUMENT } from '@nebular/theme';
import { ReceivableByContract } from 'app/shared/services/metrics.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { BaseDialogComponent } from '../../base-dialog/base-dialog.component';

@Component({
  selector: 'npx-receivables-dialog',
  templateUrl: './receivables-dialog.component.html',
  styleUrls: ['./receivables-dialog.component.scss'],
})
export class ReceivablesDialogComponent extends BaseDialogComponent implements OnInit {
  @Input() userReceivableContracts!: ReceivableByContract[];

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<ReceivablesDialogComponent>,
    public utils: UtilsService
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
