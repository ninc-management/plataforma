import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';

import { DataSource } from '../../lib/data-source/data-source';
import { Grid } from '../../lib/grid';

@Component({
  selector: '[ng2-st-thead]',
  templateUrl: './thead.component.html',
})
export class Ng2SmartTableTheadComponent implements OnChanges {
  @Input() grid!: Grid;
  @Input() source!: DataSource;
  @Input() isAllSelected: boolean = false;
  @Input() createConfirm = new EventEmitter<any>();

  @Output() sort = new EventEmitter<any>();
  @Output() selectAllRows = new EventEmitter<any>();
  @Output() create = new EventEmitter<any>();
  @Output() filter = new EventEmitter<any>();

  isHideHeader: boolean = false;
  isHideSubHeader: boolean = false;

  ngOnChanges() {
    this.isHideHeader = this.grid.getSetting('hideHeader');
    this.isHideSubHeader = this.grid.getSetting('hideSubHeader');
  }
}
