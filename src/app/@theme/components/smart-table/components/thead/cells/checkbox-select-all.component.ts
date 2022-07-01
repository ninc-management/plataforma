import { Component, Input } from '@angular/core';

import { DataSource } from '../../../lib/data-source/data-source';
import { LocalDataSource } from '../../../lib/data-source/local/local.data-source';
import { Grid } from '../../../lib/grid';

@Component({
  selector: '[ng2-st-checkbox-select-all]',
  template: `
    <input type="checkbox" [ngModel]="isAllSelected" />
  `,
})
export class CheckboxSelectAllComponent {
  @Input() grid: Grid = new Grid();
  @Input() source: DataSource = new LocalDataSource();
  @Input() isAllSelected: boolean = false;
}
