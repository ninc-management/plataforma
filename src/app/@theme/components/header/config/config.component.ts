import { AfterViewInit, Component, Input, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NbDialogService } from '@nebular/theme';
import { cloneDeep } from 'lodash';
import { BehaviorSubject, combineLatest, Observable, skipWhile, Subject, take } from 'rxjs';

import { RemainingItemsComponent } from './remaining-items/remaining-items.component';
import { FileUploadDialogComponent } from 'app/shared/components/file-upload/file-upload.component';
import { CompanyService } from 'app/shared/services/company.service';
import { ConfigService, EXPENSE_TYPES } from 'app/shared/services/config.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { UserService } from 'app/shared/services/user.service';
import { getItemsWithValue, idToProperty, isPhone, tooltipTriggers, trackByIndex } from 'app/shared/utils';

import { ColorShades, Company } from '@models/company';
import { Invoice } from '@models/invoice';
import { PlatformConfig } from '@models/platformConfig';
import { UploadedFile } from '@models/shared';
import { User } from '@models/user';

import config_validation from 'app/shared/validators/config-validation.json';

interface SubTypeItem {
  name: string;
  isNew: boolean;
}

interface TypeItem {
  name: string;
  subTypes: SubTypeItem[];
}
enum KEYS_TO_VERIFY {
  POSITION = 'position',
  LEVEL = 'level',
  UNIT = 'products.unit',
}

enum CONFIG_EXPENSE_TYPES {
  ADMINISTRATIVA = 'Administrativa',
  CONTRATO = 'Contrato',
}

enum LOGO_TYPES {
  logoDefault = 'logoDefault',
  logoWithoutName = 'logoWithoutName',
  logoWhite = 'logoWhite',
  logoWhiteWithoutName = 'logoWhiteWithoutName',
}

enum AVALIABLE_TEXT_COLORS {
  white = 'white',
  black = 'black',
}

@Component({
  selector: 'ngx-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss'],
})
export class ConfigComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChildren(NgForm) ngForms = {} as QueryList<NgForm>;
  @Input() config: PlatformConfig = new PlatformConfig();
  @Input() isFormDirty = new BehaviorSubject<boolean>(false);
  clonedConfig: PlatformConfig = new PlatformConfig();
  configCompany: Company = new Company();
  newAdminExpense: TypeItem = { name: '', subTypes: [] };
  newContractExpense: TypeItem = { name: '', subTypes: [] };
  newRole = { roleTypeName: '', permission: '' };
  adminExpenseTypes: TypeItem[] = [];
  contractExpenseTypes: TypeItem[] = [];
  invoices: Invoice[] = [];
  users: User[] = [];
  PERMISSIONS = ['Administrador', 'Membro', 'Financeiro', 'AER Natan®'];
  PARENTS = ['Diretor de T.I', 'Diretor Financeiro', 'Associado', 'Assessor Executivo Remoto'];

  newLevel: string = '';
  newUnit: string = '';
  validation = config_validation as any;
  errorInPositions = false;
  errorInLevels = false;
  forms: NgForm[] = [];

  isPhone = isPhone;
  idToProperty = idToProperty;
  trackByIndex = trackByIndex;
  tooltipTriggers = tooltipTriggers;

  EXPENSE_TYPES = EXPENSE_TYPES;
  configExpenseTypes = CONFIG_EXPENSE_TYPES;
  KEYS_TO_VERIFY = KEYS_TO_VERIFY;
  LOGO_TYPES = LOGO_TYPES;
  AVALIABLE_TEXT_COLORS = AVALIABLE_TEXT_COLORS;

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

  destroy$ = new Subject<void>();

  constructor(
    private configService: ConfigService,
    private invoiceService: InvoiceService,
    private dialogService: NbDialogService,
    public userService: UserService,
    public companyService: CompanyService
  ) {}

  ngOnInit() {
    this.clonedConfig = cloneDeep(this.config);
    if (this.clonedConfig.company)
      this.configCompany = cloneDeep(this.companyService.idToCompany(this.clonedConfig.company));
    this.adminExpenseTypes = this.clonedConfig.expenseConfig.adminExpenseTypes.map((eType: any) => {
      const typeItem = cloneDeep(eType);
      if (typeItem.subTypes.length) {
        typeItem.subTypes = typeItem.subTypes.map((subType: any) => ({
          name: subType,
          isNew: false,
        }));
      }
      typeItem.subTypes = typeItem.subTypes as SubTypeItem[];
      return typeItem;
    });
    this.contractExpenseTypes = this.clonedConfig.expenseConfig.contractExpenseTypes.map((eType: any) => {
      const typeItem = cloneDeep(eType);
      if (typeItem.subTypes.length) {
        typeItem.subTypes = typeItem.subTypes.map((subType: any) => ({
          name: subType,
          isNew: false,
        }));
      }
      typeItem.subTypes = typeItem.subTypes as SubTypeItem[];
      return typeItem;
    });

    this.verifyEmptyLogos();
  }

  ngAfterViewInit() {
    const observables$ = this.ngForms
      .map((form) => form.statusChanges)
      .filter((observable$): observable$ is Observable<any> => observable$ != undefined);
    this.forms = this.ngForms.toArray();
    combineLatest(observables$).subscribe(() => {
      const isDirty = this.forms.some((form) => {
        if (form.dirty) return true;
        return false;
      });
      if (isDirty) {
        this.isFormDirty.next(true);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openDialog(itemsWithValue: string[], warning: string): void {
    this.dialogService.open(RemainingItemsComponent, {
      context: {
        title: warning,
        items: itemsWithValue,
      },
      dialogClass: 'my-dialog',
      closeOnBackdropClick: false,
      closeOnEsc: false,
      autoFocus: false,
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

  addUnit(): void {
    this.clonedConfig.invoiceConfig.units.push(this.newUnit);
    this.newUnit = '';
  }

  updateConfig(): void {
    this.clonedConfig.expenseConfig.adminExpenseTypes = this.adminExpenseTypes.map((eType: any) => {
      const typeItem = cloneDeep(eType);
      if (typeItem.subTypes.length) {
        typeItem.subTypes = typeItem.subTypes.map((subType: any) => subType.name);
      }
      typeItem.subTypes = typeItem.subTypes as string[];
      return typeItem;
    });
    this.clonedConfig.expenseConfig.contractExpenseTypes = this.contractExpenseTypes.map((eType: any) => {
      const typeItem = cloneDeep(eType);
      if (typeItem.subTypes.length) {
        typeItem.subTypes = typeItem.subTypes.map((subType: any) => subType.name);
      }
      typeItem.subTypes = typeItem.subTypes as string[];
      return typeItem;
    });
    this.isFormDirty.next(false);
    if (this.clonedConfig.expenseConfig.isDuplicated)
      this.clonedConfig.expenseConfig.contractExpenseTypes = cloneDeep(
        this.clonedConfig.expenseConfig.adminExpenseTypes
      );
    this.companyService.editCompany(this.configCompany);
    this.configService.editConfig(this.clonedConfig);
  }

  deleteUnit(index: number): void {
    combineLatest([this.invoiceService.getInvoices(), this.invoiceService.isDataLoaded$])
      .pipe(
        skipWhile(([, isInvoiceDataLoaded]) => !isInvoiceDataLoaded),
        take(1)
      )
      .subscribe(([invoices, _]) => {
        const invoicesWithUnit = getItemsWithValue(
          invoices,
          KEYS_TO_VERIFY.UNIT,
          this.clonedConfig.invoiceConfig.units[index]
        );
        const productsWithValue: string[] = [];
        invoicesWithUnit.forEach((invoice) => {
          invoice.products.forEach((product) => productsWithValue.push(product.name + ': ' + invoice.code));
        });
        if (invoicesWithUnit.length != 0) {
          this.openDialog(
            productsWithValue,
            'Não é possível remover o item. Os seguintes produtos dos orçamentos estão utilizando esta unidade:'
          );
        } else {
          this.clonedConfig.invoiceConfig.units.splice(index, 1);
          this.isFormDirty.next(true);
        }
      });
  }

  deletePositionOrLevel(index: number, key: string): void {
    combineLatest([this.userService.getUsers(), this.userService.isDataLoaded$])
      .pipe(
        skipWhile(([, isUserDataLoaded]) => !isUserDataLoaded),
        take(1)
      )
      .subscribe(([users, _]) => {
        const usersWithValue = getItemsWithValue(
          users,
          key,
          key == 'position'
            ? this.clonedConfig.profileConfig.positions[index].roleTypeName
            : this.clonedConfig.profileConfig.levels[index]
        );
        if (usersWithValue.length != 0) {
          this.openDialog(
            usersWithValue.map((user) => user.fullName),
            'Não é possível remover o item. Os seguintes usuários estão utilizando este ' +
              (key == 'position' ? 'papel:' : 'cargo:')
          );
        } else {
          if (key == 'position') this.clonedConfig.profileConfig.positions.splice(index, 1);
          else this.clonedConfig.profileConfig.levels.splice(index, 1);

          this.isFormDirty.next(true);
        }
      });
  }

  openUploadDialog(logoType: LOGO_TYPES): void {
    this.dialogService
      .open(FileUploadDialogComponent, {
        context: {
          title: 'Envio de logo',
          allowedMimeType: ['image/png', 'image/jpg', 'image/jpeg'],
          maxFileSize: 0.5,
          mediaFolderPath: 'logoImages/',
          name: {
            fn: (name: string) => {
              //TODO Replace company name with ID
              return this.configCompany.companyName.toLowerCase() + '_' + this.translateLogoType(logoType);
            },
          },
        },
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
      })
      .onClose.pipe(take(1))
      .subscribe((files) => {
        if (files.length > 0) {
          const uploadedLogo = new UploadedFile();
          uploadedLogo.name = files[0].name;
          uploadedLogo.url = files[0].url;
          this.configCompany[logoType] = uploadedLogo;
        }
      });
  }

  getEvaColors(): void {
    this.configService.sendEvaColorsRequest(this.configCompany.colors.primary.color500).subscribe((colors) => {
      this.configCompany.colors.primary = this.getColorShadesObject(colors.primary);
      this.configCompany.colors.success = this.getColorShadesObject(colors.success);
      this.configCompany.colors.warning = this.getColorShadesObject(colors.warning);
      this.configCompany.colors.info = this.getColorShadesObject(colors.info);
      this.configCompany.colors.danger = this.getColorShadesObject(colors.danger);
      this.configService.applyCustomColors(this.clonedConfig);
    });
  }

  private verifyEmptyLogos(): void {
    Object.values(LOGO_TYPES).forEach((logoType: LOGO_TYPES) => {
      if (this.configCompany[logoType] && this.configCompany[logoType].url == '') {
        this.configCompany[logoType].name = 'Anexe uma logo';
        this.configCompany[logoType].url =
          'https://firebasestorage.googleapis.com/v0/b/plataforma-nortan.appspot.com/o/logoImages%2Flogo.png?alt=media&token=9ea298d9-0be5-4197-a40d-12d425c98999';
      }
    });
  }

  private translateLogoType(type: LOGO_TYPES): string {
    switch (type) {
      case LOGO_TYPES.logoDefault:
        return 'logo_padrao';
      case LOGO_TYPES.logoWithoutName:
        return 'logo_padrao_sem_nome';
      case LOGO_TYPES.logoWhite:
        return 'logo_tema_escuro';
      case LOGO_TYPES.logoWhiteWithoutName:
        return 'logo_tema_escuro_sem_nome';

      default:
        return 'logo';
    }
  }

  private getColorShadesObject(colors: string[]): ColorShades {
    const colorShades = new ColorShades();

    colorShades.color100 = colors[0];
    colorShades.color200 = colors[1];
    colorShades.color300 = colors[2];
    colorShades.color400 = colors[3];
    colorShades.color500 = colors[4];
    colorShades.color600 = colors[5];
    colorShades.color700 = colors[6];
    colorShades.color800 = colors[7];
    colorShades.color900 = colors[8];

    return colorShades;
  }
}
