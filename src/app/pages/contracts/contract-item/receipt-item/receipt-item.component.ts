import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NbAccessChecker } from '@nebular/security';
import { cloneDeep } from 'lodash';
import { BehaviorSubject, combineLatest, Observable, of, take } from 'rxjs';
import { map, skipWhile } from 'rxjs/operators';

import contract_validation from '../../../../shared/validators/payment-validation.json';
import { ConfigService } from 'app/shared/services/config.service';
import { CONTRACT_STATOOS, ContractService } from 'app/shared/services/contract.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { NotificationService } from 'app/shared/services/notification.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { UserService } from 'app/shared/services/user.service';
import { formatDate, nfPercentage, nortanPercentage, shouldNotifyManager } from 'app/shared/utils';

import { Contract, ContractReceipt } from '@models/contract';
import { NotificationTags } from '@models/notification';
import { PlatformConfig } from '@models/platformConfig';

@Component({
  selector: 'ngx-receipt-item',
  templateUrl: './receipt-item.component.html',
  styleUrls: ['./receipt-item.component.scss'],
})
export class ReceiptItemComponent implements OnInit {
  @Input() contract = new Contract();
  @Input() availableContracts: Contract[] = [];
  @Input() receiptIndex?: number;
  @Input() isFormDirty = new BehaviorSubject<boolean>(false);
  @ViewChild('form') ngForm = {} as NgForm;

  hasInitialContract = true;
  validation = contract_validation as any;
  today = new Date();
  isEditionGranted = false;
  isFinancialManager = false;
  receipt: ContractReceipt = {
    notaFiscal: '15.5', // Porcentagem da nota fiscal
    nortanPercentage: '15',
    paid: false,
    created: this.today,
    lastUpdate: this.today,
    description: '',
    value: '',
  };
  options = {
    valueType: '$',
    liquid: '0',
  };
  contractSearch = '';
  config: PlatformConfig = new PlatformConfig();

  get availableContractsData(): Observable<Contract[]> {
    return of(this.availableContracts);
  }

  formatDate = formatDate;

  constructor(
    private contractService: ContractService,
    private invoiceService: InvoiceService,
    private notificationService: NotificationService,
    private stringUtil: StringUtilService,
    private userService: UserService,
    private configService: ConfigService,
    public accessChecker: NbAccessChecker
  ) {}

  ngOnInit(): void {
    combineLatest([this.configService.getConfig(), this.configService.isDataLoaded$])
      .pipe(
        skipWhile(([_, isConfigDataLoaded]) => !isConfigDataLoaded),
        take(1)
      )
      .subscribe(([configs, _]) => (this.config = configs[0]));

    if (this.contract._id) this.fillContractData();
    else this.hasInitialContract = false;
  }

  ngAfterViewInit(): void {
    this.ngForm.statusChanges?.subscribe(() => {
      if (this.ngForm.dirty) this.isFormDirty.next(true);
    });
  }

  fillContractData(): void {
    if (this.contract.invoice) {
      const tmp = cloneDeep(this.contract);
      tmp.invoice = this.invoiceService.idToInvoice(this.contract.invoice);
      this.receipt.notaFiscal = nfPercentage(tmp, this.config.invoiceConfig.nfPercentage);
      this.receipt.nortanPercentage = nortanPercentage(tmp, this.config.invoiceConfig.organizationPercentage);
      this.contractService
        .checkEditPermission(tmp.invoice)
        .pipe(take(1))
        .subscribe((isGranted) => {
          this.isEditionGranted = isGranted;
        });
    }
    if (this.receiptIndex !== undefined) {
      this.receipt = cloneDeep(this.contract.receipts[this.receiptIndex]);
      this.toLiquid(this.receipt.value);
    } else {
      if (this.contract.total && this.contract.receipts.length === +this.contract.total - 1) {
        this.receipt.value = this.notPaid();
        this.toLiquid(this.receipt.value);
      } else {
        if (this.contract.invoice) {
          const invoice = this.invoiceService.idToInvoice(this.contract.invoice);
          const stage = invoice.stages[this.contract.receipts.length];
          if (stage) {
            this.receipt.value = stage.value;
          }
        }
      }
    }
    this.accessChecker
      .isGranted('df', 'receipt-financial-manager')
      .pipe(take(1))
      .subscribe((isGranted) => (this.isFinancialManager = isGranted));
  }

  registerReceipt(): void {
    let isOtherPaid = true;
    if (
      (this.contract.receipts.length >= 2 && this.receiptIndex !== undefined) ||
      (this.contract.receipts.length >= 1 && this.receiptIndex !== undefined)
    ) {
      isOtherPaid = this.contract.receipts
        .filter((receipt: ContractReceipt, idx: number) => this.receiptIndex != idx)
        .every((receipt: ContractReceipt) => receipt.paid);
    }

    if (this.receiptIndex != undefined) {
      this.receipt.lastUpdate = new Date();
      if (shouldNotifyManager(this.contract.receipts[this.receiptIndex], this.receipt)) this.notifyManager();
      this.contract.receipts[this.receiptIndex] = cloneDeep(this.receipt);
    } else {
      this.contract.receipts.push(cloneDeep(this.receipt));
    }

    if (
      isOtherPaid &&
      this.receipt.paid &&
      this.contract.total != this.contract.receipts.length.toString() &&
      this.contract.status != CONTRACT_STATOOS.EM_ANDAMENTO
    ) {
      this.contract.status = CONTRACT_STATOOS.EM_ANDAMENTO;
      this.updateContractStatusHistory();
    }
    if ((!isOtherPaid || !this.receipt.paid) && this.contract.status != CONTRACT_STATOOS.A_RECEBER) {
      this.contract.status = CONTRACT_STATOOS.A_RECEBER;
      this.updateContractStatusHistory();
    }

    this.isFormDirty.next(false);
    if (this.contract.invoice) {
      const invoice = this.invoiceService.idToInvoice(this.contract.invoice);
      if (invoice.author) {
        const manager = this.userService.idToUser(invoice.author);
        this.notificationService.notifyFinancial({
          title: 'Nova ordem de empenho ' + this.contract.locals.code,
          tag: NotificationTags.RECEIPT_ORDER_CREATED,
          message: `${manager.article.toUpperCase()} ${manager.article == 'a' ? 'gestora' : 'gestor'} do contrato ${
            manager.fullName
          } criou a ordem de empenho no valor de R$${this.receipt.value} no contrato ${this.contract.locals.code}.`,
        });
      }
    }
    this.contractService.editContract(this.contract);
  }

  updateContractStatusHistory(): void {
    this.contract.lastUpdate = new Date();
    const lastStatusIndex = this.contract.statusHistory.length - 1;
    this.contract.statusHistory[lastStatusIndex].end = this.contract.lastUpdate;
    this.contract.statusHistory.push({
      status: this.contract.status,
      start: this.contract.lastUpdate,
    });
  }

  notPaid(): string {
    let result =
      this.stringUtil.moneyToNumber(this.contract.locals.value) -
      this.contract.receipts.reduce(
        (sum: number, receipt: ContractReceipt) => (sum += this.stringUtil.moneyToNumber(receipt.value)),
        0
      );

    if (this.receiptIndex != undefined)
      result += this.stringUtil.moneyToNumber(this.contract.receipts[this.receiptIndex].value);

    return this.stringUtil.numberToMoney(result);
  }

  lastPayment(): string {
    if (
      this.contract.total &&
      ((this.receiptIndex === undefined && this.contract.receipts.length != +this.contract.total - 1) ||
        (this.receiptIndex !== undefined && this.contract.receipts.length - 1 != +this.contract.total - 1))
    )
      return '';
    return this.notPaid();
  }

  toLiquid(value: string): void {
    this.options.liquid = this.stringUtil.removePercentage(
      this.stringUtil.removePercentage(value, this.receipt.notaFiscal),
      this.receipt.nortanPercentage
    );
  }

  updatePaidDate(): void {
    if (!this.receipt.paid) this.receipt.paidDate = undefined;
    else this.receipt.paidDate = new Date();
  }

  notifyManager(): void {
    if (this.contract.invoice) {
      const invoice = this.invoiceService.idToInvoice(this.contract.invoice);
      this.notificationService.notify(invoice.author, {
        title: 'Uma ordem de empenho do contrato ' + this.contract.locals.code + ' foi paga!',
        tag: NotificationTags.RECEIPT_PAID,
        message:
          'A ordem de empenho de código #' +
          this.receiptIndex +
          ' com o valor de R$ ' +
          this.receipt.value +
          ' foi paga.',
      });
    }
  }

  onContractSelected(selectedContract: Contract): void {
    this.contract = selectedContract;
    this.fillContractData();
  }
}
