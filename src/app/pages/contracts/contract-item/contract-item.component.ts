import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { ContractService } from '../../../shared/services/contract.service';
import * as contract_validation from '../../../shared/contract-validation.json';
import { StringUtilService } from '../../../shared/services/string-util.service';
import { NbDialogService } from '@nebular/theme';
import { ContractDialogComponent } from '../contract-dialog/contract-dialog.component';

@Component({
  selector: 'ngx-contract-item',
  templateUrl: './contract-item.component.html',
  styleUrls: ['./contract-item.component.scss'],
})
export class ContractItemComponent implements OnInit {
  @Input() contract: any;
  @Output() submit = new EventEmitter<void>();
  submitted = false;
  contractNumber: number;
  validation = (contract_validation as any).default;
  STATOOS = ['Em andamento', 'Concluído', 'Arquivado'];
  INTERESTS = [...Array(24).keys()].map((index) => (index + 1).toString());
  paymentIcon = {
    icon: 'dollar-sign',
    pack: 'fa',
  };

  constructor(
    private contractService: ContractService,
    private dialogService: NbDialogService,
    private stringUtil: StringUtilService
  ) {}

  ngOnInit(): void {
    console.log(this.contract);
    this.contract.interest = this.contract.payments.length;
    this.contract.paid = this.stringUtil.numberToMoney(
      this.contract.payments.reduce(
        (accumulator: number, payment: any) =>
          accumulator + this.stringUtil.moneyToNumber(payment.value),
        0
      )
    );
  }

  updateContract(): void {
    this.submitted = true;
    let version = +this.contract.version;
    version += 1;
    this.contract.version = version.toString().padStart(2, '0');
    this.contractService.editContract(this.contract);
    this.submit.emit();
  }

  paymentDialog(index: number): void {
    this.dialogService.open(ContractDialogComponent, {
      context: {
        title:
          index != undefined
            ? 'ORDEM DE EMPENHO'
            : 'ADICIONAR ORDEM DE EMPENHO',
        contract: this.contract,
        paymentIndex: index != undefined ? index : undefined,
      },
      dialogClass: 'my-dialog',
      closeOnBackdropClick: false,
      closeOnEsc: false,
      autoFocus: false,
    });
  }

  tooltipText(): string {
    return (
      `CPF/CNPJ: ` +
      this.contract.invoice.contractor.document +
      `\nEmail: ` +
      this.contract.invoice.contractor.email +
      `\nEndereço: ` +
      this.contract.invoice.contractor.address
    );
  }
}
