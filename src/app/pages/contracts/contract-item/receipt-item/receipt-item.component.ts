import { Component, OnInit, Input } from '@angular/core';
import { cloneDeep } from 'lodash';
import { Observable, of } from 'rxjs';
import { take } from 'rxjs/operators';
import { NbAccessChecker } from '@nebular/security';
import { ContractService, CONTRACT_STATOOS } from 'app/shared/services/contract.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { ContractReceipt, Contract } from '@models/contract';
import contract_validation from '../../../../shared/payment-validation.json';

@Component({
  selector: 'ngx-receipt-item',
  templateUrl: './receipt-item.component.html',
  styleUrls: ['./receipt-item.component.scss'],
})
export class ReceiptItemComponent implements OnInit {
  @Input() contract = new Contract();
  @Input() availableContracts: Contract[] = [];
  @Input() receiptIndex?: number;
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
  get availableContractsData(): Observable<Contract[]> {
    return of(this.availableContracts);
  }

  constructor(
    private contractService: ContractService,
    private invoiceService: InvoiceService,
    private stringUtil: StringUtilService,
    public utils: UtilsService,
    public accessChecker: NbAccessChecker
  ) {}

  ngOnInit(): void {
    if (this.contract._id) this.fillContractData();
    else this.hasInitialContract = false;
  }

  fillContractData(): void {
    if (this.contract.invoice) {
      const tmp = cloneDeep(this.contract);
      tmp.invoice = this.invoiceService.idToInvoice(this.contract.invoice);
      this.receipt.notaFiscal = this.utils.nfPercentage(tmp);
      this.receipt.nortanPercentage = this.utils.nortanPercentage(tmp);
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
      this.stringUtil.moneyToNumber(this.contract.value) -
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
}
