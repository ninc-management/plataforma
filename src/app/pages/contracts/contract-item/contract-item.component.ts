import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { ContractService } from '../../../shared/services/contract.service';
import { take } from 'rxjs/operators';
import { DepartmentService } from '../../../shared/services/department.service';
import * as contract_validation from '../../../shared/contract-validation.json';

@Component({
  selector: 'ngx-contract-item',
  templateUrl: './contract-item.component.html',
  styleUrls: ['./contract-item.component.scss'],
})
export class ContractItemComponent implements OnInit {
  @Input() contract: any;
  @Output() submit = new EventEmitter<void>();
  editing = false;
  submitted = false;
  contractNumber: number;
  validation = (contract_validation as any).default;
  DEPARTMENTS: string[] = [];
  COORDINATIONS: string[] = [];

  constructor(
    private contractService: ContractService,
    private departmentService: DepartmentService
  ) {}

  ngOnInit(): void {
    if (this.contract) {
      this.editing = true;
      this.COORDINATIONS = this.departmentService.buildCoordinationsList(
        this.contract.department
      );
      this.contract.department = this.departmentService.composedName(
        this.contract.department
      );
    } else {
      this.contract = {};
    }
    this.contractService
      .contractsSize()
      .pipe(take(2))
      .subscribe((size: number) => {
        this.contractNumber = size;
        this.updateCode();
      });
    this.DEPARTMENTS = this.departmentService.buildDepartmentList();
  }

  registerContract(): void {
    this.contract.department = this.departmentService.extractAbreviation(
      this.contract.department
    );
    this.submitted = true;
    if (this.editing) {
      this.contractService.editContract(this.contract);
    } else {
      this.contractService.saveContract(this.contract);
    }
    this.submit.emit();
  }

  onDepartmentChange() {
    this.updateCode();
    this.updateCoordination();
  }

  updateCoordination() {
    this.contract.coordination = undefined;
    this.COORDINATIONS = this.departmentService.buildCoordinationsList(
      this.departmentService.extractAbreviation(this.contract.department)
    );
  }

  updateCode(): void {
    if (!this.editing) {
      this.contract.code =
        'ORC-' +
        this.contractNumber +
        '/' +
        new Date().getFullYear() +
        '-NRT/' +
        (this.contract.department
          ? this.departmentService.extractAbreviation(this.contract.department)
          : '') +
        '-00';
    }
  }
}
