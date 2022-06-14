import { Component, Input } from '@angular/core';
import { PlatformConfig } from '@models/platformConfig';
import { ExpenseType } from '@models/team';
import { ConfigService } from 'app/shared/services/config.service';
import { cloneDeep } from 'lodash';
import config_validation from 'app/shared/config-validation.json';
import { isPhone, trackByIndex, tooltipTriggers } from 'app/shared/utils';

@Component({
  selector: 'ngx-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss'],
})
export class ConfigComponent {
  @Input() config: PlatformConfig = new PlatformConfig();
  newExpense: ExpenseType = new ExpenseType();
  newRole = { roleTypeName: '', permission: '' };
  newLevel: string = '';
  PERMISSIONS = ['Administrador', 'Membro', 'Financeiro'];
  PARENTS = ['Diretor de T.I', 'Diretor Financeiro', 'Associado'];
  validation = config_validation as any;
  errorInPositions = false;
  errorInLevels = false;

  isPhone = isPhone;
  trackByIndex = trackByIndex;
  tooltipTriggers = tooltipTriggers;

  expenseIcon = {
    icon: 'minus',
    pack: 'fac',
  };
  invoiceIcon = {
    icon: 'file-invoice-dollar',
    pack: 'fac',
  };
  onedriveIcon = {
    icon: 'onedrive',
    pack: 'fac',
  };
  notificationIcon = {
    icon: 'bell',
    pack: 'fa',
  };

  constructor(private configService: ConfigService) {}

  addExpenseType(): void {
    this.config.expenseTypes.push(cloneDeep(this.newExpense));
    this.newExpense = new ExpenseType();
  }

  addRole(): void {
    this.errorInPositions = this.config.profileConfig.positions.some(
      (pos) => pos.roleTypeName === this.newRole.roleTypeName || this.PARENTS.includes(this.newRole.roleTypeName)
    );
    if (!this.errorInPositions) this.config.profileConfig.positions.push(cloneDeep(this.newRole));
    this.newRole.roleTypeName = '';
    this.newRole.permission = '';
  }

  addLevel(): void {
    this.errorInLevels = this.config.profileConfig.levels.includes(this.newLevel);
    if (!this.errorInLevels) this.config.profileConfig.levels.push(this.newLevel);
    this.newLevel = '';
  }

  updateConfig(): void {
    this.configService.editConfig(this.config);
  }
}
