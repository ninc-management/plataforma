import { Component, Input, OnInit } from '@angular/core';
import { PlatformConfig } from '@models/platformConfig';
import { ExpenseType } from '@models/team';
import { ConfigService } from 'app/shared/services/config.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { cloneDeep } from 'lodash';

@Component({
  selector: 'ngx-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss'],
})
export class ConfigComponent implements OnInit {
  @Input() config: PlatformConfig = new PlatformConfig();
  newExpense: ExpenseType = new ExpenseType();

  constructor(private configService: ConfigService, public utils: UtilsService) {}

  ngOnInit(): void {}

  addExpenseType(): void {
    this.config.expenseTypes.push(cloneDeep(this.newExpense));
    this.newExpense = new ExpenseType();
  }

  updateConfig(): void {
    this.configService.editConfig(this.config);
  }
}
