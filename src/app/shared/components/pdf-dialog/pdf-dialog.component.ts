import { Component, OnInit, Input, Inject } from '@angular/core';
import { NbDialogRef, NB_DOCUMENT } from '@nebular/theme';
import { SafeResourceUrl } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';

@Component({
  selector: 'pdf-dialog',
  templateUrl: './pdf-dialog.component.html',
  styleUrls: ['./pdf-dialog.component.scss'],
})
export class PdfDialogComponent implements OnInit {
  @Input() dataUrl$: Subject<string>;
  data: string;

  constructor(
    @Inject(NB_DOCUMENT) protected document,
    protected ref: NbDialogRef<PdfDialogComponent>
  ) {}

  ngOnInit(): void {
    this.dataUrl$.pipe(take(1)).subscribe((data) => (this.data = data));
  }

  dismiss(): void {
    this.ref.close();
  }

  windowWidth(): number {
    return window.innerWidth;
  }

  windowHeight(): number {
    return window.innerHeight * 0.99;
  }
}
