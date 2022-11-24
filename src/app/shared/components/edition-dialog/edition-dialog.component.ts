import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { NB_DOCUMENT, NbDialogRef } from '@nebular/theme';

import { BaseDialogComponent } from '../base-dialog/base-dialog.component';
import { isPhone, tooltipTriggers } from 'app/shared/utils';

import { EditionHistoryItem } from '@models/shared';
import { Transaction } from '@models/transaction';

import transaction_validation from 'app/shared/validators/transaction-validation.json';
@Component({
  selector: 'edition-dialog',
  templateUrl: './edition-dialog.component.html',
  styleUrls: ['./edition-dialog.component.scss'],
})
export class EditionDialogComponent extends BaseDialogComponent implements OnInit {
  @Input() transaction = new Transaction();
  latestEdition = new EditionHistoryItem();

  isPhone = isPhone;
  tooltipTriggers = tooltipTriggers;
  validation = transaction_validation as any;

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<EditionDialogComponent>
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  saveComment(): void {
    this.latestEdition.author = this.transaction.author;
    this.transaction.editionHistory.push(this.latestEdition);
    this.derivedRef.close(true);
  }
}
