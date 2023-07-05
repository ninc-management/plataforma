import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NbAccessChecker } from '@nebular/security';
import { NbComponentStatus, NbDialogService } from '@nebular/theme';
import { cloneDeep } from 'lodash';
import { BehaviorSubject, combineLatest, Observable, of, skipWhile, take } from 'rxjs';

import { INPUT_TYPES, TextInputDialogComponent } from '../../text-input-dialog/text-input-dialog.component';
import { NbFileUploaderOptions, StorageProvider } from 'app/@theme/components';
import { ConfigService } from 'app/shared/services/config.service';
import { CONTRACT_STATOOS, ContractService } from 'app/shared/services/contract.service';
import { ContractorService } from 'app/shared/services/contractor.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { ProviderService } from 'app/shared/services/provider.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { CLIENT, TeamService } from 'app/shared/services/team.service';
import { TRANSACTION_TYPES, TransactionService } from 'app/shared/services/transaction.service';
import { UserService } from 'app/shared/services/user.service';
import {
  codeSort,
  formatDate,
  idToProperty,
  isPhone,
  nfPercentage,
  nortanPercentage,
  populateList,
} from 'app/shared/utils';

import { Contract } from '@models/contract';
import { PlatformConfig } from '@models/platformConfig';
import { Provider } from '@models/provider';
import { EditionHistoryItem } from '@models/shared/editionHistoryItem';
import { UploadedFile } from '@models/shared/uploadedFiles';
import { ExpenseType, Team } from '@models/team';
import { COST_CENTER_TYPES, Transaction } from '@models/transaction';
import { User } from '@models/user';

import transaction_validation from 'app/shared/validators/transaction-validation.json';

export enum STATUS_RULES {
  FIRST_RULE = 'FIRST-RULE',
  SECOND_RULE = 'SECOND-RULE',
  THIRD_RULE = 'THIRD-RULE',
  FOURTH_RULE = 'FOURTH-RULE',
  FIFTH_RULE = 'FIFTH-RULE',
}

@Component({
  selector: 'ngx-transaction-item',
  templateUrl: './transaction-item.component.html',
  styleUrls: ['./transaction-item.component.scss'],
})
export class TransactionItemComponent implements OnInit {
  @Input() contract?: Contract;
  @Input() iTransaction = new Transaction();
  @Input() type?: TRANSACTION_TYPES;
  @Input() team?: Team;
  @Input() isDialogBlocked = new BehaviorSubject<boolean>(false);
  @Output()
  submit: EventEmitter<void> = new EventEmitter<void>();

  STATUS_RULES = STATUS_RULES;
  validation = transaction_validation as any;
  user: User = new User();
  cloneDeep = cloneDeep;
  clonedTeam: Team = new Team();
  clonedContract: Contract = new Contract();
  transaction: Transaction = new Transaction();
  platformConfig: PlatformConfig = new PlatformConfig();
  availableContracts: Contract[] = [];
  teams: Team[] = [];
  users: User[] = [];
  filteredContracts: Contract[] = [];
  hasInputContract = false;
  requiredContract = false;
  options = {
    liquid: '0,00',
    type: '',
    relatedWithContract: false,
    hasISS: false,
  };
  transactionKinds: ExpenseType[] = [];
  tTypes = TRANSACTION_TYPES;
  transactionTypes: string[] = Object.values(TRANSACTION_TYPES);
  expenseSubTypes: string[] = [];
  costCenterTypes: COST_CENTER_TYPES[] = Object.values(COST_CENTER_TYPES);
  cCTypes = COST_CENTER_TYPES;
  isEditionGranted: boolean = true;
  isFinancialManager: boolean = false;

  contractSearch = '';
  get availableContractsData$(): Observable<Contract[]> {
    return of(this.availableContracts);
  }
  userSearch = '';
  userData: Observable<User[]> = of([]);

  costCenterSearch = '';
  costCenterData$ = new BehaviorSubject<(User | Team)[]>([]);

  providerSearch = '';
  providerData$: Observable<Provider[]> = of([]);

  today = new Date();

  uploadedFiles: UploadedFile[] = [];

  formatDate = formatDate;
  isPhone = isPhone;

  uploaderOptions: NbFileUploaderOptions = {
    multiple: true,
    directory: false,
    showUploadQueue: true,
    storageProvider: StorageProvider.ONEDRIVE,
    mediaFolderPath: 'profileImages/',
  };

  constructor(
    private contractService: ContractService,
    private invoiceService: InvoiceService,
    private teamService: TeamService,
    private transactionService: TransactionService,
    private userService: UserService,
    private configService: ConfigService,
    private providerService: ProviderService,
    private dialogService: NbDialogService,
    private stringUtil: StringUtilService,
    private contractorService: ContractorService,
    public accessChecker: NbAccessChecker
  ) {}

  ngOnInit(): void {
    if (this.type) {
      this.options.type = this.type;
    }
    this.accessChecker
      .isGranted('df', 'receipt-financial-manager')
      .pipe(take(1))
      .subscribe((isGranted) => (this.isFinancialManager = isGranted));
    if (this.contract) this.configureContractTransaction();
    if (this.team) this.configureTeamTransaction();
    combineLatest([
      this.userService.currentUser$,
      this.contractService.getContracts(),
      this.invoiceService.getInvoices(),
      this.teamService.getTeams(),
      this.configService.getConfig(),
      this.userService.getActiveUsers(),
      this.providerService.getProviders(),
      this.contractorService.getContractors(),
      this.contractService.isDataLoaded$,
      this.invoiceService.isDataLoaded$,
      this.teamService.isDataLoaded$,
      this.configService.isDataLoaded$,
      this.userService.isDataLoaded$,
      this.providerService.isDataLoaded$,
      this.contractorService.isDataLoaded$,
    ])
      .pipe(
        skipWhile(
          ([
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            contractsLoaded,
            invoicesLoaded,
            teamsLoaded,
            configLoaded,
            usersLoaded,
            providerLoaded,
            contractorsLoaded,
          ]) =>
            !(
              contractsLoaded &&
              invoicesLoaded &&
              teamsLoaded &&
              configLoaded &&
              usersLoaded &&
              providerLoaded &&
              contractorsLoaded
            )
        ),
        take(1)
      )
      .subscribe(([user, contracts, , teams, config, users, , , , , , , , ,]) => {
        this.user = user;
        this.filteredContracts = contracts.filter(
          (contract) =>
            contract.invoice &&
            (contract.status == CONTRACT_STATOOS.EM_ANDAMENTO || contract.status == CONTRACT_STATOOS.A_RECEBER) &&
            (this.invoiceService.isInvoiceAuthor(contract.invoice, this.user) ||
              this.invoiceService.isInvoiceMember(contract.invoice, this.user))
        );
        this.handleType();
        this.userSearch = user.name;
        this.userData =
          user.AER.length > 0
            ? of(populateList(user.AER, this.userService.idToUser.bind(this.userService)))
            : of([user]);
        this.platformConfig = config[0];
        this.teams = teams;
        this.users = users;
        if (this.iTransaction._id) {
          this.transaction = cloneDeep(this.iTransaction);
          this.updateLiquidValue();
          this.providerSearch = idToProperty(
            this.transaction.provider,
            this.providerService.idToProvider.bind(this.providerService),
            'name'
          );
          this.costCenterSearch = this.transactionService.populateCostCenter(
            this.transaction,
            this.teamService.idToTeam.bind(this.teamService),
            this.userService.idToUser.bind(this.userService)
          ).name;
        } else {
          this.transaction.author = user;
          if (!this.transaction.modelCostCenter) this.transaction.modelCostCenter = COST_CENTER_TYPES.USER;
        }
        this.setCostCenterData();
        this.updateTransactionKinds();
      });
    this.providerData$ = this.providerService.getProviders();
  }

  fillContractData(): void {
    if (this.clonedContract._id && this.clonedContract.invoice) {
      this.contractService
        .checkEditPermission(this.invoiceService.idToInvoice(this.clonedContract.invoice))
        .pipe(take(1))
        .subscribe((isGranted) => {
          this.isEditionGranted = isGranted;
        });
      this.transaction.notaFiscal = nfPercentage(this.clonedContract, this.platformConfig.invoiceConfig);
      this.transaction.companyPercentage = nortanPercentage(this.clonedContract, this.platformConfig.invoiceConfig);
      if (this.options.type == TRANSACTION_TYPES.RECEIPT) {
        if (this.clonedContract.total && this.clonedContract.receipts.length === +this.clonedContract.total - 1) {
          this.transaction.value = this.notPaid();
        } else {
          const invoice = this.invoiceService.idToInvoice(this.clonedContract.invoice);
          const stage = invoice.stages[this.clonedContract.receipts.length];
          if (stage) {
            this.transaction.value = stage.value;
          }
        }
      }
    }
  }

  notPaid(): string {
    let result =
      this.stringUtil.moneyToNumber(this.transaction.value) -
      this.clonedContract.receipts.reduce(
        (sum: number, receipt: Transaction | string | undefined) =>
          (sum += this.stringUtil.moneyToNumber(
            idToProperty(receipt, this.transactionService.idToTransaction.bind(this.transactionService), 'value')
          )),
        0
      );

    if (this.iTransaction._id) result += this.stringUtil.moneyToNumber(this.iTransaction.value);
    return this.stringUtil.numberToMoney(result);
  }

  overPaid(): string {
    return '1.000,00';
  }

  currentTypeHasSubTypes(): boolean {
    if (this.expenseSubTypes.length > 0) return true;
    return false;
  }

  removeFile(fileIndex: number): void {
    console.log('remover arquivo');
  }

  saveRefTransaction(savedTransaction: Transaction): void {
    const property = this.options.type == TRANSACTION_TYPES.EXPENSE ? 'expenses' : 'receipts';

    if (this.clonedTeam._id != CLIENT._id) {
      this.clonedTeam[property].push(savedTransaction);
      this.teamService.editTeam(this.clonedTeam);
    }
    if (this.options.relatedWithContract) {
      this.clonedContract[property].push(savedTransaction);
      this.contractService.editContract(this.clonedContract);
    }
  }

  registerTransaction(): void {
    if (this.transaction.modelCostCenter == COST_CENTER_TYPES.TEAM) {
      if (this.clonedTeam) {
        this.clonedTeam = cloneDeep(this.transaction.costCenter as Team);
      }
      this.transaction.costCenter = (this.transaction.costCenter as User | Team)._id;
      this.transactionService.saveTransaction(this.transaction, this.saveRefTransaction.bind(this));
    }
    this.submit.emit();
  }

  editTransaction(): void {
    this.isDialogBlocked.next(true);

    this.dialogService
      .open(TextInputDialogComponent, {
        context: {
          title: 'MOTIVO DA EDIÇÃO',
          placeholder: 'Motivo',
          inputType: INPUT_TYPES.textArea,
          dialogProperties: {
            closeOnEsc: false,
            displayCloseButton: false,
            displayButtonMessage: true,
            bottomButtonMessage: 'ADICIONAR COMENTÁRIO',
          },
        },
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      })
      .onClose.pipe(take(1))
      .subscribe((response) => {
        if (response) {
          const editionHistoryItem = new EditionHistoryItem();
          editionHistoryItem.author = this.user;
          editionHistoryItem.comment = response;
          this.transactionService.editTransaction(this.transaction, editionHistoryItem);
          this.submit.emit();
        }
      });
  }

  addAndClean(): void {}

  updatePaidDate(): void {
    if (!this.transaction.paid) this.transaction.paidDate = undefined;
    else this.transaction.paidDate = new Date();
  }

  urlReceiver(event: any): void {}

  updateLiquidValue(): void {
    if (this.options.type == TRANSACTION_TYPES.RECEIPT) {
      this.options.liquid = this.contractService.receiptNetValue(this.transaction);
    } else {
      if (this.transaction.notaFiscal && this.transaction.companyPercentage)
        this.options.liquid = this.contractService.toNetValue(
          this.transaction.value,
          this.transaction.notaFiscal,
          this.transaction.companyPercentage,
          this.transaction.created
        );
    }
  }

  handleType(): void {
    switch (this.options.type) {
      case TRANSACTION_TYPES.RECEIPT: {
        this.requiredContract = true;
        this.options.relatedWithContract = true;
        if (!this.iTransaction._id) {
          this.transaction.costCenter = this.teamService.idToTeam(
            idToProperty(
              this.contract?.invoice,
              this.invoiceService.idToInvoice.bind(this.invoiceService),
              'nortanTeam'
            )
          );
          this.transaction.modelCostCenter = COST_CENTER_TYPES.TEAM;
        }
        break;
      }

      case TRANSACTION_TYPES.EXPENSE: {
        this.requiredContract = false;
        break;
      }

      case 'default':
        break;
    }
    this.availableContracts = this.filteredContracts.filter(
      (contract) =>
        (this.options.type == TRANSACTION_TYPES.RECEIPT &&
          contract.total &&
          contract.receipts.length < +contract.total) ||
        this.options.type == TRANSACTION_TYPES.EXPENSE
    );
    this.availableContracts = this.availableContracts
      .map((contract) => this.contractService.fillContract(contract))
      .sort((a, b) => codeSort(-1, a.locals.code, b.locals.code));
  }

  setCostCenterData(): void {
    if (this.options.relatedWithContract && this.contract) {
      if (this.contract.invoice) {
        if (this.transaction.modelCostCenter == COST_CENTER_TYPES.TEAM)
          setTimeout(() => {
            this.costCenterData$.next([CLIENT].concat(this.teams));
          }, 50);
        else {
          const invoice = this.invoiceService.idToInvoice(this.contract.invoice);
          const invoiceTeamMembers = this.invoiceService.teamMembers(invoice);
          setTimeout(() => {
            this.costCenterData$.next(invoiceTeamMembers);
          }, 50);
        }
      }
    } else {
      if (this.transaction.modelCostCenter == COST_CENTER_TYPES.TEAM) {
        setTimeout(() => {
          this.costCenterData$.next([CLIENT].concat(this.teams));
        }, 50);
      } else {
        setTimeout(() => {
          this.costCenterData$.next(this.users);
        }, 50);
      }
    }
  }

  updateTransactionKinds(): void {
    if (!this.options.relatedWithContract) {
      this.transactionKinds = this.platformConfig.expenseConfig.adminExpenseTypes;
    } else this.transactionKinds = this.platformConfig.expenseConfig.contractExpenseTypes;
  }

  updateExpenseSubTypes(): void {
    const kind = this.transactionKinds.find((kind) => kind.name === this.transaction.type);
    if (kind) {
      this.expenseSubTypes = kind.subTypes;
    } else this.expenseSubTypes = [];
    if (!this.expenseSubTypes.includes(this.transaction.subType)) this.transaction.subType = '';
  }

  private configureTeamTransaction(): void {
    if (this.team) {
      this.clonedTeam = cloneDeep(this.team);
      if (!this.iTransaction._id) {
        this.transaction.modelCostCenter = COST_CENTER_TYPES.TEAM;
        this.transaction.costCenter = this.clonedTeam;
      }
      this.costCenterSearch = this.clonedTeam.name;
    }
  }

  private configureContractTransaction(): void {
    if (this.contract) {
      this.hasInputContract = this.options.relatedWithContract = true;
      this.clonedContract = cloneDeep(this.contract);
      this.contractSearch = this.clonedContract.locals.code;
      this.fillContractData();
    }
  }

  setStatus(form: any, rule: string, property?: keyof Transaction, secondCondition: boolean = true): NbComponentStatus {
    switch (rule) {
      case STATUS_RULES.FIRST_RULE:
        return form.dirty ? (form.invalid ? 'danger' : 'success') : 'basic';
      case STATUS_RULES.SECOND_RULE:
        if (property)
          return form.dirty
            ? form.invalid
              ? 'danger'
              : 'success'
            : this.transaction[property] !== undefined
            ? 'success'
            : 'basic';
        return 'basic';
      case STATUS_RULES.THIRD_RULE:
        if (property)
          return form.dirty
            ? form.invalid
              ? 'danger'
              : form.value
              ? 'success'
              : 'basic'
            : this.transaction[property] !== undefined
            ? 'success'
            : 'basic';
        return 'basic';
      case STATUS_RULES.FOURTH_RULE:
        if (property)
          return form.dirty
            ? form.invalid
              ? 'danger'
              : 'success'
            : this.transaction[property] === undefined && secondCondition
            ? 'success'
            : 'basic';
        return 'basic';
      case STATUS_RULES.FIFTH_RULE:
        if (property) return form.dirty ? 'success' : this.transaction[property] === undefined ? 'success' : 'basic';
        return 'basic';
      default:
        return 'basic';
    }
  }

  handleISSToggle(): void {
    this.transaction.ISS = '0,00';
    this.updateLiquidValue();
  }
}
