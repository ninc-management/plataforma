import { AfterViewChecked, AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { trackByIndex } from 'app/shared/utils';

@Component({
  selector: 'ngx-expansive-list',
  templateUrl: './expansive-list.component.html',
  styleUrls: ['./expansive-list.component.scss'],
})
export class ExpansiveListComponent implements OnInit, AfterViewInit {
  @ViewChild('listItem', { read: ElementRef }) listItem!: ElementRef;
  @ViewChild('cardHeader', { read: ElementRef }) cardHeader!: ElementRef;
  @Input() title = '';
  @Input() itens: string[] = [];
  @Input() min?: number;
  @Input() max?: number;

  maxHeight = 0;
  isExpanded = false;

  trackByIndex = trackByIndex;

  constructor() {}

  //se os itens não passarem do limite de height, não precisa mostrar o botão de mostrar mais
  ngOnInit(): void {}

  ngAfterViewInit(): void {
    const cardOffset = 2;

    setTimeout(() => {
      const cardHeaderHeight = this.cardHeader.nativeElement.offsetHeight;
      const listItemHeight = this.listItem.nativeElement.offsetHeight;
      if (this.min) this.maxHeight = cardHeaderHeight - cardOffset + listItemHeight * this.min;
      else this.maxHeight = cardHeaderHeight - cardOffset + listItemHeight * this.itens.length;
    }, 10);
  }

  toggleExpansive(): void {
    this.isExpanded = !this.isExpanded;
  }
}
