import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { NB_DOCUMENT, NbDialogRef } from '@nebular/theme';

import { BaseDialogComponent } from '../base-dialog/base-dialog.component';
import { isPhone, tooltipTriggers } from 'app/shared/utils';

import { Message } from '@models/message';
import { EditionHistoryItem } from '@models/shared';

export enum INPUT_TYPES {
  input = 'input',
  textArea = 'text-area',
  textList = 'text-list',
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
  @Input() textList: (Message | EditionHistoryItem)[] = [];
  @Input() buttonProperties = {
    closeOnEsc: true,
    displayCloseButton: false,
    displayButtonMessage: true,
    bottomButtonMessage: 'ADICIONAR',
  };
  INPUT_TYPES = INPUT_TYPES;

  response = '';

  isPhone = isPhone;
  tooltipTriggers = tooltipTriggers;

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<TextInputDialogComponent>
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.isBlocked.next(!this.buttonProperties.closeOnEsc);
  }

  addResponse(response: string): void {
    this.derivedRef.close(response);
  }

  dialogWidth(): number {
    return window.innerWidth * 0.5;
  }
}
