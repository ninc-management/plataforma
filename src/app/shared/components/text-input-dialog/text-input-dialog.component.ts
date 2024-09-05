import { Component, ElementRef, Inject, Input, OnInit, Optional, ViewChild } from '@angular/core';
import { NB_DOCUMENT, NbDialogRef } from '@nebular/theme';

import { BaseDialogComponent } from '../base-dialog/base-dialog.component';
import { THEMES } from 'app/@theme/theme.module';
import { isPhone, tooltipTriggers } from 'app/shared/utils';

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
  @Input() currentTheme = '';
  INPUT_TYPES = INPUT_TYPES;
  THEMES = THEMES;
  text: string = '';

  isPhone = isPhone;
  tooltipTriggers = tooltipTriggers;

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

  dismiss(res: any = ''): void {
    this.ref?.close(this.editorPreviousText);
    this.destroy$.next();
    this.destroy$.complete();
  }

  save(): void {
    this.ref?.close(this.text);
  }

  dialogWidth(): number {
    return window.innerWidth * 0.5;
  }
}
