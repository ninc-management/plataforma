import { Component, Inject, OnInit, Optional } from '@angular/core';
import { NB_DOCUMENT, NbDialogRef } from '@nebular/theme';
import { BehaviorSubject, fromEvent, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'ngx-base-dialog',
  template: '',
  styleUrls: ['./base-dialog.component.scss'],
})
export class BaseDialogComponent implements OnInit {
  protected destroy$ = new Subject<void>();
  isBlocked = new BehaviorSubject<boolean>(false);
  isFormDirty = new BehaviorSubject<boolean>(false);

  constructor(@Inject(NB_DOCUMENT) protected document: Document, @Optional() protected ref: NbDialogRef<any>) {}

  ngOnInit(): void {
    fromEvent<KeyboardEvent>(this.document, 'keyup')
      .pipe(
        filter(() => !this.isBlocked.value),
        filter((event: KeyboardEvent) => event.keyCode === 27),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.dismiss());
  }

  dismiss(res: any = ''): void {
    this.ref?.close(res);
    this.destroy$.next();
    this.destroy$.complete();
  }

  windowWidth(): number {
    return window.innerWidth;
  }

  windowHeight(): number {
    return window.innerHeight * 0.99;
  }
}
