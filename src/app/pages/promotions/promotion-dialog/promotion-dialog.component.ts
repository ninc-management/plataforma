import { Component, OnInit, Input, Inject } from '@angular/core';
import { NbDialogRef, NB_DOCUMENT } from '@nebular/theme';
import { UtilsService } from 'app/shared/services/utils.service';
import { BaseDialogComponent } from 'app/shared/components/base-dialog/base-dialog.component';

@Component({
  selector: 'ngx-promotion-dialog',
  templateUrl: './promotion-dialog.component.html',
  styleUrls: ['./promotion-dialog.component.scss'],
})
export class PromotionDialogComponent
  extends BaseDialogComponent
  implements OnInit
{
  @Input() title: string;
  @Input() promotion: any;

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    protected derivedRef: NbDialogRef<PromotionDialogComponent>,
    public utils: UtilsService
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {
    super.ngOnInit();
  }
}
