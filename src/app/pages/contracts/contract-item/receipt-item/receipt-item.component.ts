import { Component, OnInit, Input } from '@angular/core';
import { format, parseISO } from 'date-fns';
import { ContractService } from 'app/shared/services/contract.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import * as contract_validation from '../../../../shared/payment-validation.json';
import * as _ from 'lodash';

@Component({
  selector: 'ngx-receipt-item',
  templateUrl: './receipt-item.component.html',
  styleUrls: ['./receipt-item.component.scss'],
})
export class ReceiptItemComponent implements OnInit {
  @Input() contract: any;
  @Input() contractIndex: number;
  @Input() receiptIndex: number;
  validation = (contract_validation as any).default;
  today = new Date();
  receipt: any = {
    notaFiscal: '15.5', // Porcentagem da nota fiscal
    nortanPercentage: '15', // TODO: Pegar este valor do cargo do autor do contrato
    paid: 'não',
    created: this.today,
    lastUpdate: this.today,
  };
  options = {
    valueType: '$',
    liquid: '0',
    lastUpdateDate: format(this.receipt.lastUpdate, 'dd/MM/yyyy'),
  };

  constructor(
    private contractService: ContractService,
    private stringUtil: StringUtilService
  ) {}

  ngOnInit(): void {
    if (this.receiptIndex !== undefined) {
      this.receipt = _.cloneDeep(this.contract.receipts[this.receiptIndex]);
      if (
        this.receipt.paidDate !== undefined &&
        typeof this.receipt.paidDate !== 'object'
      )
        this.receipt.paidDate = parseISO(this.receipt.paidDate);
      if (
        this.receipt.created !== undefined &&
        typeof this.receipt.created !== 'object'
      )
        this.receipt.created = parseISO(this.receipt.created);
      if (
        this.receipt.lastUpdate !== undefined &&
        typeof this.receipt.lastUpdate !== 'object'
      ) {
        this.receipt.lastUpdate = parseISO(this.receipt.lastUpdate);
        this.receipt.lastUpdate = format(this.receipt.lastUpdate, 'dd/MM/yyyy');
      }
    } else {
      if (this.contract.receipts.length === this.contract.total - 1)
        this.receipt.value = this.notPaid();
    }
  }

  registerReceipt(): void {
    if (this.receiptIndex !== undefined) {
      this.receipt.lastUpdate = new Date();
      this.contract.receipts[this.receiptIndex] = _.cloneDeep(this.receipt);
    } else {
      this.contract.receipts.push(_.cloneDeep(this.receipt));
    }
    this.contract.status =
      this.receipt.paid == 'sim'
        ? this.contract.total == this.contract.receipts.length
          ? 'Concluído'
          : 'Em andamento'
        : 'A receber';
    this.contractService.editContract(this.contract);
  }

  notPaid(): string {
    return this.stringUtil.numberToMoney(
      this.stringUtil.moneyToNumber(this.contract.value) -
        this.stringUtil.moneyToNumber(
          this.contract.paid ? this.contract.paid : '0,00'
        )
    );
  }

  lastPayment(): string {
    if (
      (this.receiptIndex === undefined &&
        this.contract.receipts.length != this.contract.total - 1) ||
      (this.receiptIndex !== undefined &&
        this.contract.receipts.length - 1 != this.contract.total - 1)
    )
      return undefined;
    return this.notPaid();
  }

  toLiquid(value: string): void {
    const result = this.stringUtil.round(
      this.stringUtil.moneyToNumber(value) *
        this.stringUtil.toMutiplyPercentage(this.receipt.notaFiscal) *
        this.stringUtil.toMutiplyPercentage(this.receipt.nortanPercentage)
    );
    this.options.liquid = this.stringUtil.numberToMoney(result);
  }

  updatePaidDate(): void {
    if (this.receipt.paid === 'não') this.receipt.paidDate = undefined;
    else this.receipt.paidDate = new Date();
  }
}
