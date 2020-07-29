import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { ContractService } from '../../../shared/services/contract.service';
import * as contract_validation from '../../../shared/contract-validation.json';

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

  constructor(private contractService: ContractService) {}

  ngOnInit(): void {
    this.contract.interest = this.contract.payments.length;
    this.contract.paid = 0; // Sum all payments
    console.log(this.contract);
  }

  registerContract(): void {
    console.log(this.contract);
    this.submitted = true;
    let version = +this.contract.version;
    version += 1;
    this.contract.version = version.toString().padStart(2, '0');
    this.contractService.editContract(this.contract);
    this.submit.emit();
  }
}
