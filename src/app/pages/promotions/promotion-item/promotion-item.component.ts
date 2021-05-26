import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'ngx-promotion-item',
  templateUrl: './promotion-item.component.html',
  styleUrls: ['./promotion-item.component.scss'],
})
export class PromotionItemComponent implements OnInit {
  @Input() promotion = {};
  constructor() {}

  ngOnInit(): void {}
}
