import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';

import { trackByIndex } from 'app/shared/utils';

@Component({
  selector: 'ngx-expansive-list',
  templateUrl: './expansive-list.component.html',
  styleUrls: ['./expansive-list.component.scss'],
})
export class ExpansiveListComponent<T> implements OnInit {
  @ViewChild('list', { read: ElementRef }) list!: ElementRef;
  @Input() title = '';
  @Input() items: T[] = [];
  @Input() min: number = 5;
  @Input() max!: number;
  @Input() isLoading: boolean = false;
  @Input() itemsToString?: (arg0: T) => string;
  @Input() itemClickCallback?: (arg0: T) => void;

  minHeight = 0;
  maxHeight = 0;
  isExpanded = false;

  trackByIndex = trackByIndex;

  ngOnInit(): void {
    if (!this.max) this.max = this.min * 2;

    //All values are used as rem
    const borderWitdh = 0.063;
    //Padding (top + bottom) + line height + border for both constants
    const cardHeaderHeight = 2 + 1.5 + borderWitdh;
    const listItemHeight = 2 + 1.25 + borderWitdh;
    //It's necessary to sum 1 borderWitdh because the first list item has a top border
    this.minHeight = cardHeaderHeight + borderWitdh + listItemHeight * this.min;
    this.maxHeight = cardHeaderHeight + borderWitdh + listItemHeight * this.max;
  }

  toggleExpansive(): void {
    if (this.items.length >= this.max && this.isExpanded) this.list.nativeElement.scrollTop = 0;
    this.isExpanded = !this.isExpanded;
  }
}
