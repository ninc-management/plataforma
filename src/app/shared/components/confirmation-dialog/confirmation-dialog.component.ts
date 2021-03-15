import { Component, OnInit, Input, Inject } from '@angular/core';
import { NbDialogRef, NB_DOCUMENT } from '@nebular/theme';
import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'ngx-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss'],
})
export class ConfirmationDialogComponent implements OnInit {
  @Input() question: string;

  constructor(
    @Inject(NB_DOCUMENT) protected document,
    protected ref: NbDialogRef<ConfirmationDialogComponent>
  ) {}

  ngOnInit(): void {}

  dismiss(response: boolean): void {
    this.ref.close(response);
  }

  windowWidth(): number {
    return window.innerWidth;
  }

  windowHeight(): number {
    return window.innerHeight * 0.99;
  }
}
