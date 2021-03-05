import { Component, OnInit, Input } from '@angular/core';
import { format, parseISO } from 'date-fns';
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

  constructor(private stringUtil: StringUtilService) {}

  ngOnInit(): void {}

  registerPayment(): void {}

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
