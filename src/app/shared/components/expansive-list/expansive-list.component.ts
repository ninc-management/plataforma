import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { trackByIndex } from 'app/shared/utils';

@Component({
  selector: 'ngx-expansive-list',
  templateUrl: './expansive-list.component.html',
  styleUrls: ['./expansive-list.component.scss'],
})
export class ExpansiveListComponent implements OnInit, AfterViewInit {
  @ViewChild('list', { read: ElementRef }) list!: ElementRef;
  @ViewChild('listItem', { read: ElementRef }) listItem!: ElementRef;
  @ViewChild('cardHeader', { read: ElementRef }) cardHeader!: ElementRef;
  @Input() title = '';
  @Input() itens: string[] = [];
  @Input() min?: number = 5;
  @Input() max?: number;

  minHeight = 0;
  maxHeight = 0;
  hasOverflow = false;
  hasUnderflow = false;
  isExpanded = false;

  trackByIndex = trackByIndex;

  constructor() {}

  ngOnInit(): void {
    if (!this.max && this.min) {
      this.max = this.min * 2;
      if (this.itens.length > this.max) this.hasOverflow = true;
      if (this.itens.length < this.min) this.hasUnderflow = true;
    }
  }

  ngAfterViewInit(): void {
    const cardOffset = 4;

    setTimeout(() => {
      const cardHeaderHeight = this.cardHeader.nativeElement.offsetHeight;
      const listItemHeight = this.listItem.nativeElement.offsetHeight;
      if (this.min) this.minHeight = cardHeaderHeight - cardOffset + listItemHeight * this.min;
      if (this.max) this.maxHeight = cardHeaderHeight - cardOffset + listItemHeight * this.max;
    }, 10);
  }

  toggleExpansive(): void {
    if (this.hasOverflow && this.isExpanded) this.list.nativeElement.scrollTop = 0;
    this.isExpanded = !this.isExpanded;
  }
}
