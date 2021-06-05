import { Component, OnInit, Inject, Input } from '@angular/core';
import { NB_DOCUMENT, NbDialogRef } from '@nebular/theme';
import { UtilsService } from 'app/shared/services/utils.service';
import { BaseDialogComponent } from 'app/shared/components/base-dialog/base-dialog.component';
import { Contractor } from '../../../../../backend/src/models/contractor';

@Component({
  selector: 'ngx-contractor-dialog',
  templateUrl: './contractor-dialog.component.html',
  styleUrls: ['./contractor-dialog.component.scss'],
})
export class ContractorDialogComponent
  extends BaseDialogComponent
  implements OnInit
{
  @Input() title = '';
  @Input() contractor!: Contractor;
  @Input() contractorIndex?: number;

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    protected derivedRef: NbDialogRef<ContractorDialogComponent>,
    public utils: UtilsService
  ) {
    super(derivedDocument, derivedRef);
  }
}
