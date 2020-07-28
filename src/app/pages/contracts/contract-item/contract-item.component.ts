import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { ContractService } from '../../../shared/services/contract.service';
import { take } from 'rxjs/operators';
import { DepartmentService } from '../../../shared/services/department.service';
import * as contract_validation from '../../../shared/invoice-validation.json';

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
  STATOOS = ['Em análise', 'Fechado', 'Negado'];
  INTERESTS = [...Array(24).keys()].map((index) => index + 1);
  paymentIcon = {
    icon: 'dollar-sign',
    pack: 'fa',
  };

  constructor(
    private contractService: ContractService,
    private departmentService: DepartmentService
  ) {}

  ngOnInit(): void {
    this.contract.interest = this.contract.payments.length;
    this.contract.paid = 0; // Sum all payments
  }

  registerContract(): void {
    this.contract.department = this.departmentService.extractAbreviation(
      this.contract.department
    );
    this.submitted = true;
    this.contractService.editContract(this.contract);
    this.submit.emit();
  }
}
