import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { NB_DOCUMENT, NbDialogRef } from '@nebular/theme';

import { BaseDialogComponent } from '../base-dialog/base-dialog.component';

export enum INPUT_TYPES {
  input = 'input',
  textArea = 'text-area',
}

@Component({
  selector: 'ngx-text-input-dialog',
  templateUrl: './text-input-dialog.component.html',
  styleUrls: ['./text-input-dialog.component.scss'],
})
export class TextInputDialogComponent extends BaseDialogComponent implements OnInit {
  @Input() title = '';
  @Input() placeholder = '';
  @Input() inputType: INPUT_TYPES = INPUT_TYPES.input;
  @Input() buttonMessage = 'ADICIONAR';
  @Input() closeOnEsc = true;
  INPUT_TYPES = INPUT_TYPES;

  value = '';

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<TextInputDialogComponent>
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.isBlocked.next(!this.closeOnEsc);
  }

  dismiss(response: string): void {
    this.derivedRef.close(response);
  }

  dialogWidth(): number {
    return window.innerWidth * 0.5;
  }
}
