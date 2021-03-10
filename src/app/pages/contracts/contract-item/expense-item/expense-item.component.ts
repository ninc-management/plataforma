import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'ngx-expense-item',
  templateUrl: './expense-item.component.html',
  styleUrls: ['./expense-item.component.scss'],
})
export class ExpenseItemComponent implements OnInit {
  @Input() contract: any;
  @Input() contractIndex: number;
  @Input() expenseIndex: number;

  constructor() {}

  ngOnInit(): void {}
}
