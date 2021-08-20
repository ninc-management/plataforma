import { Component, Inject, Input, Optional } from '@angular/core';
import { NB_DOCUMENT, NbDialogRef } from '@nebular/theme';
import { BaseDialogComponent } from 'app/shared/components/base-dialog/base-dialog.component';
import { UtilsService } from 'app/shared/services/utils.service';

@Component({
  selector: 'ngx-nortan-expense-dialog',
  templateUrl: './nortan-expense-dialog.component.html',
  styleUrls: ['./nortan-expense-dialog.component.scss'],
})
export class NortanExpenseDialogComponent extends BaseDialogComponent {
  @Input() title = '';

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional()
    protected derivedRef: NbDialogRef<NortanExpenseDialogComponent>,
    public utils: UtilsService
  ) {
    super(derivedDocument, derivedRef);
  }
}
