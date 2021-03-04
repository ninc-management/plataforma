import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'ngx-receipt-item',
  templateUrl: './receipt-item.component.html',
  styleUrls: ['./receipt-item.component.scss'],
})
export class ReceiptItemComponent implements OnInit {
  @Input() contract: any;
  @Input() contractIndex: number;
  @Input() receiptIndex: number;

  constructor() {}

  ngOnInit(): void {}
}
