import { Component, OnInit, Input, Inject, Optional } from '@angular/core';
import { NbDialogRef, NB_DOCUMENT } from '@nebular/theme';
import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { BaseDialogComponent } from '../base-dialog/base-dialog.component';

@Component({
  selector: 'ngx-pdf-dialog',
  templateUrl: './pdf-dialog.component.html',
  styleUrls: ['./pdf-dialog.component.scss'],
})
export class PdfDialogComponent extends BaseDialogComponent implements OnInit {
  @Input() dataUrl$ = new Subject<string>();
  data = '';

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<PdfDialogComponent>
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.dataUrl$.pipe(take(1)).subscribe((data) => (this.data = data));
  }

  dismiss(): void {
    this.derivedRef.close();
  }

  windowWidth(): number {
    return window.innerWidth;
  }

  windowHeight(): number {
    return window.innerHeight * 0.99;
  }
}
