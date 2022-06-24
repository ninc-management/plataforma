import { Component, EventEmitter, Input, OnChanges } from '@angular/core';

import { Row } from '../../../lib/data-set/row';
import { Grid } from '../../../lib/grid';

@Component({
  selector: 'ng2-st-tbody-create-cancel',
  template: `
    <a
      href="#"
      class="ng2-smart-action ng2-smart-action-edit-save"
      [innerHTML]="saveButtonContent"
      (click)="onSave($event)"
    ></a>
    <a
      href="#"
      class="ng2-smart-action ng2-smart-action-edit-cancel"
      [innerHTML]="cancelButtonContent"
      (click)="onCancelEdit($event)"
    ></a>
  `,
})
export class TbodyCreateCancelComponent implements OnChanges {
  @Input() grid!: Grid;
  @Input() row!: Row;
  @Input() editConfirm = new EventEmitter<any>();

  cancelButtonContent: string = '';
  saveButtonContent: string = '';

  onSave(event: any) {
    event.preventDefault();
    event.stopPropagation();

    this.grid.save(this.row, this.editConfirm);
  }

  onCancelEdit(event: any) {
    event.preventDefault();
    event.stopPropagation();

    this.row.isInEditing = false;
  }

  ngOnChanges() {
    this.saveButtonContent = this.grid.getSetting('edit.saveButtonContent');
    this.cancelButtonContent = this.grid.getSetting('edit.cancelButtonContent');
  }
}
