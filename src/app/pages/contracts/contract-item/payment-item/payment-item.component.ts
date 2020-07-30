import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import { DepartmentService } from '../../../../shared/services/department.service';
import * as contract_validation from '../../../../shared/payment-validation.json';
import { ContractService } from '../../../../shared/services/contract.service';
import { UserService } from '../../../../shared/services/user.service';

@Component({
  selector: 'ngx-payment-item',
  templateUrl: './payment-item.component.html',
  styleUrls: ['./payment-item.component.scss'],
})
export class PaymentItemComponent implements OnInit {
  @Input() contract: any;
  @Output() submit = new EventEmitter<void>();
  COORDINATIONS: string[];
  USERS: any[];
  validation = (contract_validation as any).default;
  submitted = false;
  payment: any = {};
  userPayment: any = {};
  options = {
    valueType: '%',
    notaFiscal: '6', // Porcentagem da nota fiscal
    nortanPercentage: '15', // TODO: Pegar este valor do cargo do autor do contrato
  };

  constructor(
    private departmentService: DepartmentService,
    private contractService: ContractService,
    private userService: UserService
  ) {}

  async ngOnInit(): Promise<void> {
    this.COORDINATIONS = this.departmentService.buildAllCoordinationsList();
    this.USERS = await this.userService.getUsersList();
    this.payment.team = []; // TODO: Tratar carregamento de OE
  }

  registerPayment(): void {
    // this.submitted = true;
    // let version = +this.contract.version;
    // version += 1;
    // this.contract.version = version.toString().padStart(2, '0');
    // this.contractService.editContract(this.contract);
    // this.submit.emit();
  }

  async addColaborator(): Promise<void> {
    this.payment.team.push(Object.assign({}, this.userPayment));
    this.userPayment = {};
    console.log(this.payment.team);
  }

  idToName(id: string): string {
    const entry = this.USERS.find((el) => el._id === id);
    return entry.fullName;
  }
}
