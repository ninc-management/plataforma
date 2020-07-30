import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { DepartmentService } from '../../../../shared/services/department.service';
import * as contract_validation from '../../../../shared/payment-validation.json';

@Component({
  selector: 'ngx-payment-item',
  templateUrl: './payment-item.component.html',
  styleUrls: ['./payment-item.component.scss'],
})
export class PaymentItemComponent implements OnInit {
  @Input() contract: any;
  @Output() submit = new EventEmitter<void>();
  COORDINATIONS: string[];
  validation = (contract_validation as any).default;
  submitted = false;
  payment: any = {};
  options = {
    valueType: '%',
    notaFiscal: '6', // Porcentagem da nota fiscal
    nortanPercentage: '15', // TODO: Pegar este valor do cargo do autor do contrato
  };

  constructor(private departmentService: DepartmentService) {}

  ngOnInit(): void {
    this.COORDINATIONS = this.departmentService.buildAllCoordinationsList();
  }

  registerPayment(): void {
    // this.submitted = true;
    // let version = +this.contract.version;
    // version += 1;
    // this.contract.version = version.toString().padStart(2, '0');
    // this.contractService.editContract(this.contract);
    // this.submit.emit();
  }
}
