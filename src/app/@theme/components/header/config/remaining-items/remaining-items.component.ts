import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { NB_DOCUMENT, NbDialogRef } from '@nebular/theme';

import { BaseDialogComponent } from 'app/shared/components/base-dialog/base-dialog.component';
import { isPhone, tooltipTriggers } from 'app/shared/utils';

@Component({
  selector: 'ngx-remaining-items',
  templateUrl: './remaining-items.component.html',
  styleUrls: ['./remaining-items.component.scss'],
})
export class RemainingItemsComponent extends BaseDialogComponent implements OnInit {
  @Input() title = '';
  @Input() items!: string[];
  isPhone = isPhone;
  tooltipTriggers = tooltipTriggers;
  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<RemainingItemsComponent>
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
