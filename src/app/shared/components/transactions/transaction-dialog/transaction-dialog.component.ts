import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { NB_DOCUMENT, NbDialogRef, NbDialogService } from '@nebular/theme';

import { BaseDialogComponent } from '../../base-dialog/base-dialog.component';
import { INPUT_TYPES, TextInputDialogComponent } from '../../text-input-dialog/text-input-dialog.component';
import { isPhone, tooltipTriggers } from 'app/shared/utils';

import { Team } from '@models/team';
import { Transaction } from '@models/transaction';

@Component({
  selector: 'ngx-transaction-dialog',
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
    private dialogService: NbDialogService,
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<TransactionDialogComponent>
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  openDialog(): void {
    this.dialogService.open(TextInputDialogComponent, {
      context: {
        title: 'HISTÓRICO DE ALTERAÇÕES',
        inputType: INPUT_TYPES.textList,
        textList: this.transaction.editionHistory,
        dialogProperties: {
          displayCloseButton: true,
          displayButtonMessage: false,
          closeOnEsc: true,
          bottomButtonMessage: '',
        },
      },
      dialogClass: 'my-dialog',
      closeOnBackdropClick: false,
      closeOnEsc: false,
      autoFocus: false,
    });
  }
}
