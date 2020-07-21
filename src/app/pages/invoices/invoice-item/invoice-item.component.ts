import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { ContractService } from '../../../shared/services/contract.service';
import { take } from 'rxjs/operators';
import { DepartmentService } from '../../../shared/services/department.service';
import * as contract_validation from '../../../shared/contract-validation.json';

@Component({
  selector: 'ngx-invoice-item',
  templateUrl: './invoice-item.component.html',
  styleUrls: ['./invoice-item.component.scss'],
})
export class InvoiceItemComponent implements OnInit {
  @Input() invoice: any;
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
    if (this.invoice) {
      this.editing = true;
      this.COORDINATIONS = this.departmentService.buildCoordinationsList(
        this.invoice.department
      );
      this.invoice.department = this.departmentService.composedName(
        this.invoice.department
      );
    } else {
      this.invoice = {};
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
    this.invoice.department = this.departmentService.extractAbreviation(
      this.invoice.department
    );
    this.submitted = true;
    if (this.editing) {
      this.contractService.editContract(this.invoice);
    } else {
      this.contractService.saveContract(this.invoice);
    }
    this.submit.emit();
  }

  onDepartmentChange() {
    this.updateCode();
    this.updateCoordination();
  }

  updateCoordination() {
    this.invoice.coordination = undefined;
    this.COORDINATIONS = this.departmentService.buildCoordinationsList(
      this.departmentService.extractAbreviation(this.invoice.department)
    );
  }

  updateCode(): void {
    if (!this.editing) {
      this.invoice.code =
        'ORC-' +
        this.contractNumber +
        '/' +
        new Date().getFullYear() +
        '-NRT/' +
        (this.invoice.department
          ? this.departmentService.extractAbreviation(this.invoice.department)
          : '') +
        '-00';
    }
  }
}
