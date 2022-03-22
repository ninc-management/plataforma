import { Component, OnInit } from '@angular/core';
import { PlatformConfig } from '@models/platformConfig';
import { ExpenseType } from '@models/team';
import { UtilsService } from 'app/shared/services/utils.service';
import { cloneDeep } from 'lodash';

@Component({
  selector: 'ngx-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss'],
})
export class ConfigComponent implements OnInit {
  config: PlatformConfig = new PlatformConfig();
  newExpense: ExpenseType = new ExpenseType();

  constructor(public utils: UtilsService) {}

  ngOnInit(): void {}

  addExpenseType(): void {
    this.config.expenseTypes.push(cloneDeep(this.newExpense));
    this.newExpense = new ExpenseType();
  }
}
