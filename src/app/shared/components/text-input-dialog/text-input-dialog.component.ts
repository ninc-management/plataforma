import { Component, OnInit, Input, Inject, Optional, ViewChild, ElementRef } from '@angular/core';
import { NbDialogRef, NB_DOCUMENT } from '@nebular/theme';
import { BaseDialogComponent } from '../base-dialog/base-dialog.component';

@Component({
  selector: 'ngx-text-input-dialog',
  templateUrl: './text-input-dialog.component.html',
  styleUrls: ['./text-input-dialog.component.scss'],
})
export class TextInputDialogComponent extends BaseDialogComponent implements OnInit {
  @ViewChild('name', { read: ElementRef }) inputRef!: ElementRef;
  @Input() title = '';
  @Input() placeholder = '';

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<TextInputDialogComponent>
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  ngAfterViewInit(): void {
    this.inputRef.nativeElement.focus();
  }

  dismiss(response: boolean): void {
    this.derivedRef.close(response);
  }

  dialogWidth(): number {
    return window.innerWidth * 0.5;
  }
}
