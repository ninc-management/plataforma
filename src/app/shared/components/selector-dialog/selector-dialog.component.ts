import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { NbDialogRef, NB_DOCUMENT } from '@nebular/theme';
import { BaseDialogComponent } from '../base-dialog/base-dialog.component';

@Component({
  selector: 'ngx-selector-dialog',
  templateUrl: './selector-dialog.component.html',
  styleUrls: ['./selector-dialog.component.scss'],
})
export class SelectorDialogComponent extends BaseDialogComponent implements OnInit {
  @Input() selectorList: string[] = [];
  @Input() title: string = '';
  @Input() label: string = '';
  @Input() placeholder: string = '';
  selected = '';

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<SelectorDialogComponent>
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  dismiss(): void {
    super.dismiss(this.selected);
  }

  dialogWidth(): number {
    return window.innerWidth * 0.5;
  }
}
