import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { NbCardBodyComponent } from '@nebular/theme';

import { MetricItem } from '../metric-item/metric-item.component';
import { trackByIndex } from 'app/shared/utils';

@Component({
  selector: 'ngx-expansive-grid',
  templateUrl: './expansive-grid.component.html',
  styleUrls: ['./expansive-grid.component.scss'],
})
export class ExpansiveGridComponent implements OnInit {
  @ViewChild(NbCardBodyComponent, { read: ElementRef }) cardBody!: ElementRef;
  @Input() title = '';
  @Input() items: MetricItem[] = [];
  @Input() minRows?: number = 2;
  @Input() maxRows?: number;
  @Input() isLoading: boolean = false;

  minHeight = 0;
  maxHeight = 0;
  isExpanded = false;

  trackByIndex = trackByIndex;

  constructor() {}

  ngOnInit(): void {
    if (!this.maxRows && this.minRows) this.maxRows = this.minRows * 2;

    //All values are used as rem
    const borderWitdh = 0.063;
    const cardBodyPadding = 1;
    const gridMargin = 1;
    const gridItemHeight = 7;
    const gridGap = 1;
    const rowHeight = gridItemHeight + gridGap;

    //Padding (top + bottom) + line height + border for both constants
    const cardHeaderHeight = 2 + 1.5 + borderWitdh;

    if (this.minRows) this.minHeight = cardHeaderHeight + cardBodyPadding + gridMargin + rowHeight * this.minRows;
    if (this.maxRows) this.maxHeight = cardHeaderHeight + cardBodyPadding + gridMargin + rowHeight * this.maxRows;
  }

  toggleExpansive(): void {
    if (this.maxRows && this.items.length > this.maxRows && this.isExpanded) this.cardBody.nativeElement.scrollTop = 0;
    this.isExpanded = !this.isExpanded;
  }
}
