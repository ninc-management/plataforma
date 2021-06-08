import { Component, OnInit, Inject, Optional } from '@angular/core';
import { NbDialogRef, NB_DOCUMENT } from '@nebular/theme';
import { filter, takeUntil } from 'rxjs/operators';
import { fromEvent, BehaviorSubject, Subject } from 'rxjs';

@Component({
  selector: 'ngx-base-dialog',
  template: '',
  styleUrls: ['./base-dialog.component.scss'],
})
export class BaseDialogComponent implements OnInit {
  protected destroy$ = new Subject<void>();
  isBlocked = new BehaviorSubject<boolean>(false);

  constructor(
    @Inject(NB_DOCUMENT) protected document: Document,
    @Optional() protected ref: NbDialogRef<any>
  ) {}

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
    this.ref?.close();
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
