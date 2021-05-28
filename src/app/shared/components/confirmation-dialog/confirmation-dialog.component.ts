import { Component, OnInit, Input, Inject } from '@angular/core';
import { NbDialogRef, NB_DOCUMENT } from '@nebular/theme';
import { Subject, fromEvent, BehaviorSubject } from 'rxjs';
import { take, filter, takeUntil } from 'rxjs/operators';
import { BaseDialogComponent } from '../base-dialog/base-dialog.component';

@Component({
  selector: 'ngx-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss'],
})
export class ConfirmationDialogComponent
  extends BaseDialogComponent
  implements OnInit
{
  @Input() question: string;

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    protected derivedRef: NbDialogRef<ConfirmationDialogComponent>
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  dismiss(response: boolean | any = ''): void {
    this.derivedRef.close(response);
  }
}
