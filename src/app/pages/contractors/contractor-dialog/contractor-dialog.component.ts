import { Component, OnInit, Inject, Input, Optional } from '@angular/core';
import { NB_DOCUMENT, NbDialogRef } from '@nebular/theme';
import { BaseDialogComponent } from 'app/shared/components/base-dialog/base-dialog.component';
import { Contractor } from '@models/contractor';
import { isPhone, tooltipTriggers } from 'app/shared/utils';

@Component({
  selector: 'ngx-contractor-dialog',
  templateUrl: './contractor-dialog.component.html',
  styleUrls: ['./contractor-dialog.component.scss'],
})
export class ContractorDialogComponent extends BaseDialogComponent implements OnInit {
  @Input() title = '';
  @Input() contractor = new Contractor();

  isPhone = isPhone;
  tooltipTriggers = tooltipTriggers;

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<ContractorDialogComponent>
  ) {
    super(derivedDocument, derivedRef);
  }
}
