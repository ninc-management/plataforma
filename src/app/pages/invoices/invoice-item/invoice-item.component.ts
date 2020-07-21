import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { take } from 'rxjs/operators';
import { DepartmentService } from '../../../shared/services/department.service';
import { InvoiceService } from '../../../shared/services/invoice.service';
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
  revision: number = 0;
  validation = (contract_validation as any).default;
  DEPARTMENTS: string[] = [];
  COORDINATIONS: string[] = [];

  constructor(
    private invoiceService: InvoiceService,
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
      this.revision = +this.invoice.code.slice(this.invoice.code.length - 2);
      this.revision += 1;
    } else {
      this.invoice = {};
    }
    this.invoiceService
      .invoicesSize()
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
      this.updateRevision();
      this.invoiceService.editInvoice(this.invoice);
    } else {
      this.invoiceService.saveInvoice(this.invoice);
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

  updateRevision(): void {
    this.invoice.code =
      this.invoice.code.slice(0, this.invoice.code.length - 2) +
      this.revision.toString().padStart(2, '0');
  }
}
