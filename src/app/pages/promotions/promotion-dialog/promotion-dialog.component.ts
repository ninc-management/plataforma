import { Component, OnInit, Input, Inject, Optional } from '@angular/core';
import { NbDialogRef, NB_DOCUMENT } from '@nebular/theme';
import { BaseDialogComponent } from 'app/shared/components/base-dialog/base-dialog.component';
import { Promotion } from '@models/promotion';
import { isPhone, tooltipTriggers } from 'app/shared/utils';

@Component({
  selector: 'ngx-promotion-dialog',
  templateUrl: './promotion-dialog.component.html',
  styleUrls: ['./promotion-dialog.component.scss'],
})
export class PromotionDialogComponent extends BaseDialogComponent implements OnInit {
  @Input() title = '';
  @Input() promotion = new Promotion();

  isPhone = isPhone;
  tooltipTriggers = tooltipTriggers;

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<PromotionDialogComponent>
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {
    super.ngOnInit();
  }
}
