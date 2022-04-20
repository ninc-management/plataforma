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
  newRole: string = '';
  newLevel: string = '';

  constructor(private configService: ConfigService, public utils: UtilsService) {}

  expenseIcon = {
    icon: 'minus',
    pack: 'fac',
  };
  invoiceIcon = {
    icon: 'file-invoice-dollar',
    pack: 'fac',
  };

  ngOnInit(): void {}

  addExpenseType(): void {
    this.config.expenseTypes.push(cloneDeep(this.newExpense));
    this.newExpense = new ExpenseType();
  }

  addLevel(): void {
    this.config.profileConfig.levels.push(this.newLevel);
    this.newLevel = '';
  }

  addRole(): void {
    this.config.profileConfig.positions.push(this.newRole);
    this.newRole = '';
  }

  updateConfig(): void {
    this.configService.editConfig(this.config);
  }
}
