import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { BehaviorSubject, combineLatest, Observable, of, skipWhile, take } from 'rxjs';

import { EditionDialogComponent } from '../../edition-dialog/edition-dialog.component';
import { NbFileUploaderOptions, StorageProvider } from 'app/@theme/components';
import { ConfigService } from 'app/shared/services/config.service';
import { CONTRACT_STATOOS, ContractService } from 'app/shared/services/contract.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { ProviderService } from 'app/shared/services/provider.service';
import { TeamService } from 'app/shared/services/team.service';
import { COST_CENTER_TYPES, TRANSACTION_TYPES, TransactionService } from 'app/shared/services/transaction.service';
import { CLIENT, UserService } from 'app/shared/services/user.service';
import { codeSort, formatDate, isPhone, nfPercentage, nortanPercentage, populateList } from 'app/shared/utils';

import { Contract } from '@models/contract';
import { PlatformConfig } from '@models/platformConfig';
import { Provider } from '@models/provider';
import { UploadedFile } from '@models/shared';
import { ExpenseType, Team } from '@models/team';
import { MODEL_COST_CENTER_TYPES, Transaction } from '@models/transaction';
import { User } from '@models/user';

import transaction_validation from 'app/shared/validators/transaction-validation.json';

@Component({
  selector: 'ngx-transaction-item',
  templateUrl: './transaction-item.component.html',
  styleUrls: ['./transaction-item.component.scss'],
})
export class TransactionItemComponent implements OnInit {
  @Input() contract?: Contract;
  @Input() transactionIndex?: number;
  @Input() team?: Team;
  @Output()
  submit: EventEmitter<void> = new EventEmitter<void>();

  validation = transaction_validation as any;
  transaction: Transaction = new Transaction();
  platformConfig: PlatformConfig = new PlatformConfig();
  availableContracts: Contract[] = [];
  teams: Team[] = [];
  users: User[] = [];
  hasInputContract = false;
  requiredContract = false;
  options = {
    liquid: '0,00',
    type: '',
    relatedWithContract: false,
    costCenterListType: COST_CENTER_TYPES.USER,
  };
  transactionKinds: ExpenseType[] = [];
  tTypes = TRANSACTION_TYPES;
  transactionTypes: string[] = Object.values(TRANSACTION_TYPES);
  expenseSubTypes: string[] = [];
  costCenterTypes: COST_CENTER_TYPES[] = Object.values(COST_CENTER_TYPES);
  cCTypes = COST_CENTER_TYPES;

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
    private dialogService: NbDialogService
  ) {}

  ngOnInit(): void {
    if (this.contract) this.hasInputContract = this.options.relatedWithContract = true;
    if (this.team) this.buildTeamTransaction();
    combineLatest([
      this.userService.currentUser$,
      this.contractService.getContracts(),
      this.invoiceService.getInvoices(),
      this.teamService.getTeams(),
      this.configService.getConfig(),
      this.userService.getActiveUsers(),
      this.contractService.isDataLoaded$,
      this.invoiceService.isDataLoaded$,
      this.teamService.isDataLoaded$,
      this.configService.isDataLoaded$,
      this.userService.isDataLoaded$,
    ])
      .pipe(
        skipWhile(
          ([, , , , , , contractsLoaded, invoicesLoaded, teamsLoaded, configLoaded, usersLoaded]) =>
            !contractsLoaded || !invoicesLoaded || !teamsLoaded || !configLoaded || !usersLoaded
        ),
        take(1)
      )
      .subscribe(([user, contracts, , teams, config, users, , , ,]) => {
        this.availableContracts = contracts.filter(
          (contract) =>
            contract.invoice &&
            (contract.status == CONTRACT_STATOOS.EM_ANDAMENTO || contract.status == CONTRACT_STATOOS.A_RECEBER) &&
            (this.invoiceService.isInvoiceAuthor(contract.invoice, user) ||
              this.invoiceService.isInvoiceMember(contract.invoice, user))
        );
        this.availableContracts = this.availableContracts
          .map((contract) => this.contractService.fillContract(contract))
          .sort((a, b) => codeSort(-1, a.locals.code, b.locals.code));
        this.userSearch = user.name;
        this.userData =
          user.AER.length > 0
            ? of(populateList(user.AER, this.userService.idToUser.bind(this.userService)))
            : of([user]);
        this.platformConfig = config[0];
        this.teams = teams;
        this.users = users;
        if (!this.transactionIndex) this.transaction.author = user;
        this.setCostCenterData();
      });
    this.updateTransactionKinds();
    this.providerData$ = this.providerService.getProviders();
  }

  fillContractData(): void {
    if (this.contract) {
      this.transaction.notaFiscal = nfPercentage(this.contract, this.platformConfig.invoiceConfig);
      this.transaction.companyPercentage = nortanPercentage(this.contract, this.platformConfig.invoiceConfig);
    }
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

  registerTransaction(): void {
    if (this.team) {
      this.transaction.costCenter = (this.transaction.costCenter as User | Team)._id;
      this.team.expenses.push(this.transaction);
      this.teamService.editTeam(this.team, true);
    }
    this.submit.emit();
  }

  editTransaction(): void {
    this.dialogService
      .open(EditionDialogComponent, {
        context: {
          transaction: this.transaction,
        },
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      })
      .onClose.pipe(take(1))
      .subscribe((response: boolean) => {
        if (response) {
          this.transactionService.saveTransaction(this.transaction).subscribe((saveTransactionResponse) => {
            if (this.team) {
              this.team.transactions.push(saveTransactionResponse.transaction._id);
            }
          });
          this.submit.emit();
        }
      });
  }

  addAndClean(): void {}

  urlReceiver(event: any): void {}

  updateLiquidValue(): void {
    if (this.transaction.notaFiscal && this.transaction.companyPercentage)
      this.options.liquid = this.contractService.toNetValue(
        this.transaction.value,
        this.transaction.notaFiscal,
        this.transaction.companyPercentage,
        this.transaction.created
      );
  }

  handleType(): void {
    switch (this.options.type) {
      case TRANSACTION_TYPES.RECEIPT: {
        this.requiredContract = true;
        this.options.relatedWithContract = true;
        this.transaction.costCenter = CLIENT;
        this.transaction.modelCostCenter = COST_CENTER_TYPES.USER;
        break;
      }

      case TRANSACTION_TYPES.EXPENSE: {
        this.requiredContract = false;
        break;
      }

      case 'default':
        break;
    }
  }

  setCostCenterData(): void {
    if (this.options.relatedWithContract && this.contract) {
      if (this.contract.invoice) {
        if (this.options.costCenterListType == COST_CENTER_TYPES.TEAM)
          setTimeout(() => {
            this.costCenterData$.next(this.teams);
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
      if (this.options.costCenterListType == COST_CENTER_TYPES.TEAM) {
        setTimeout(() => {
          this.costCenterData$.next(this.teams);
        }, 50);
      } else {
        setTimeout(() => {
          this.costCenterData$.next(this.users);
        }, 50);
      }
    }

    this.transaction.modelCostCenter =
      this.options.costCenterListType == COST_CENTER_TYPES.USER
        ? MODEL_COST_CENTER_TYPES.USER
        : MODEL_COST_CENTER_TYPES.TEAM;
  }

  updateTransactionKinds(): void {
    if (this.options.relatedWithContract) {
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

  private buildTeamTransaction(): void {
    if (this.team) {
      this.options.type = TRANSACTION_TYPES.EXPENSE;
      this.handleType();
      this.options.costCenterListType = COST_CENTER_TYPES.TEAM;
      this.transaction.costCenter = this.team;
      this.costCenterSearch = this.team.name;
    }
  }
}
