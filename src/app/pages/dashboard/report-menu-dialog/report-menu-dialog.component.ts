import { Component, Inject, OnInit, Optional } from '@angular/core';
import { NB_DOCUMENT, NbDialogRef } from '@nebular/theme';

import { BaseDialogComponent } from 'app/shared/components/base-dialog/base-dialog.component';
import { isPhone, tooltipTriggers } from 'app/shared/utils';

@Component({
  selector: 'ngx-report-menu-dialog',
  templateUrl: './report-menu-dialog.component.html',
  styleUrls: ['./report-menu-dialog.component.scss'],
})
export class ReportMenuDialogComponent extends BaseDialogComponent implements OnInit {
  isPhone = isPhone;
  tooltipTriggers = tooltipTriggers;

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<ReportMenuDialogComponent>
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
