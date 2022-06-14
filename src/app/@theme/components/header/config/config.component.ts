import { Component, Input, OnInit } from '@angular/core';

import { ConfigService } from 'app/shared/services/config.service';
import { isPhone, trackByIndex, tooltipTriggers } from 'app/shared/utils';
import { cloneDeep } from 'lodash';

import { PlatformConfig } from '@models/platformConfig';

import config_validation from 'app/shared/config-validation.json';

interface SubTypeItem {
  name: string;
  isNew: boolean;
}

interface TypeItem {
  name: string;
  subTypes: SubTypeItem[];
}

enum CONFIG_EXPENSE_TYPES {
  ADMINISTRATIVA = 'Administrativa',
  CONTRATO = 'Contrato',
}

@Component({
  selector: 'ngx-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss'],
})
export class ConfigComponent implements OnInit {
  @Input() config: PlatformConfig = new PlatformConfig();
  clonedConfig: PlatformConfig = new PlatformConfig();
  newAdminExpense: TypeItem = { name: '', subTypes: [] };
  newContractExpense: TypeItem = { name: '', subTypes: [] };
  adminExpenseTypes: TypeItem[] = [];
  contractExpenseTypes: TypeItem[] = [];
  PERMISSIONS = ['Administrador', 'Membro', 'Financeiro'];
  PARENTS = ['Diretor de T.I', 'Diretor Financeiro', 'Associado'];
  newRole = { roleTypeName: '', permission: '' };
  newLevel: string = '';
  validation = config_validation as any;
  errorInPositions = false;
  errorInLevels = false;
  configExpenseTypes = CONFIG_EXPENSE_TYPES;
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

  ngOnInit() {
    this.clonedConfig = cloneDeep(this.config);
    this.adminExpenseTypes = this.clonedConfig.adminExpenses.map((eType: any) => {
      if (eType.subTypes.length) {
        eType.subTypes = eType.subTypes.map((subType: any) => ({
          name: subType,
          isNew: false,
        }));
      }
      eType.subTypes = eType.subTypes as SubTypeItem[];
      return eType;
    });
    this.contractExpenseTypes = this.clonedConfig.contractExpenses.map((eType: any) => {
      if (eType.subTypes.length) {
        eType.subTypes = eType.subTypes.map((subType: any) => ({
          name: subType,
          isNew: false,
        }));
      }
      eType.subTypes = eType.subTypes as SubTypeItem[];
      return eType;
    });
  }

  addExpenseType(expenseType: CONFIG_EXPENSE_TYPES): void {
    if (expenseType == CONFIG_EXPENSE_TYPES.ADMINISTRATIVA) {
      this.adminExpenseTypes.push(this.newAdminExpense);
      this.newAdminExpense = { name: '', subTypes: [] };
    } else if (expenseType == CONFIG_EXPENSE_TYPES.CONTRATO) {
      this.contractExpenseTypes.push(cloneDeep(this.newContractExpense));
      this.newContractExpense = { name: '', subTypes: [] };
    }
  }

  addRole(): void {
    this.errorInPositions = this.clonedConfig.profileConfig.positions.some(
      (pos) => pos.roleTypeName === this.newRole.roleTypeName || this.PARENTS.includes(this.newRole.roleTypeName)
    );
    if (!this.errorInPositions) this.clonedConfig.profileConfig.positions.push(cloneDeep(this.newRole));
    this.newRole.roleTypeName = '';
    this.newRole.permission = '';
  }

  addLevel(): void {
    this.errorInLevels = this.clonedConfig.profileConfig.levels.includes(this.newLevel);
    if (!this.errorInLevels) this.clonedConfig.profileConfig.levels.push(this.newLevel);
    this.newLevel = '';
  }

  updateConfig(): void {
    this.clonedConfig.adminExpenses = this.adminExpenseTypes.map((eType: any) => {
      if (eType.subTypes.length) {
        eType.subTypes = eType.subTypes.map((subType: any) => subType.name);
      }
      eType.subTypes = eType.subTypes as string[];
      return eType;
    });
    this.clonedConfig.contractExpenses = this.contractExpenseTypes.map((eType: any) => {
      if (eType.subTypes.length) {
        eType.subTypes = eType.subTypes.map((subType: any) => subType.name);
      }
      eType.subTypes = eType.subTypes as string[];
      return eType;
    });
    this.configService.editConfig(this.clonedConfig);
  }
}
