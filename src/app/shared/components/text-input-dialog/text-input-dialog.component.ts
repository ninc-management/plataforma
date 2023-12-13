import { Component, ElementRef, Inject, Input, OnInit, Optional, ViewChild } from '@angular/core';
import { NB_DOCUMENT, NbDialogRef } from '@nebular/theme';

import { BaseDialogComponent } from '../base-dialog/base-dialog.component';

export enum INPUT_TYPES {
  INPUT = 'input',
  TEXT_AREA = 'textarea',
  EDITOR = 'editor',
}

@Component({
  selector: 'ngx-text-input-dialog',
  templateUrl: './text-input-dialog.component.html',
  styleUrls: ['./text-input-dialog.component.scss'],
})
export class TextInputDialogComponent extends BaseDialogComponent implements OnInit {
  @ViewChild('name', { read: ElementRef }) inputRef!: ElementRef;
  @Input() title = '';
  @Input() placeholder = '';
  @Input() inputType = INPUT_TYPES.INPUT;
  @Input() editorPreviousText = '';
  INPUT_TYPES = INPUT_TYPES;

  text: string = '';

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<TextInputDialogComponent>
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {
    this.text = this.editorPreviousText;
    super.ngOnInit();
  }

  ngAfterViewInit(): void {
    this.inputRef.nativeElement.focus();
  }

  dismiss(response: string): void {
    this.derivedRef.close(response);
  }

  dialogWidth(): number {
    return window.innerWidth * 0.5;
  }
}
