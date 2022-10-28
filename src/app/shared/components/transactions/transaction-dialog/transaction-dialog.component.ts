import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { NB_DOCUMENT, NbDialogRef } from '@nebular/theme';

import { BaseDialogComponent } from '../../base-dialog/base-dialog.component';
import { isPhone, tooltipTriggers } from 'app/shared/utils';

import { Team } from '@models/team';
import { Transaction } from '@models/transaction';

@Component({
  selector: 'transaction-dialog',
  templateUrl: './transaction-dialog.component.html',
  styleUrls: ['./transaction-dialog.component.scss'],
})
export class TransactionDialogComponent extends BaseDialogComponent implements OnInit {
  @Input() title = '';
  @Input() transaction = new Transaction();
  @Input() team?: Team;

  isPhone = isPhone;
  tooltipTriggers = tooltipTriggers;

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<TransactionDialogComponent>
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {
    super.ngOnInit();
  }
}
