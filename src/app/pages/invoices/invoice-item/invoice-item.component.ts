import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { take } from 'rxjs/operators';
import { DepartmentService } from '../../../shared/services/department.service';
import { InvoiceService } from '../../../shared/services/invoice.service';
import { ContractService } from '../../../shared/services/contract.service';
import * as invoice_validation from '../../../shared/invoice-validation.json';

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
  invoiceNumber: number;
  revision: number = 0;
  validation = (invoice_validation as any).default;
  oldStatus: string;
  DEPARTMENTS: string[] = [];
  COORDINATIONS: string[] = [];
  STATOOS = ['Em análise', 'Fechado', 'Negado'];

  constructor(
    private invoiceService: InvoiceService,
    private departmentService: DepartmentService,
    private contractService: ContractService
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
      this.oldStatus = this.invoice.status;
    } else {
      this.invoice = {};
    }
    this.invoiceService
      .invoicesSize()
      .pipe(take(2))
      .subscribe((size: number) => {
        this.invoiceNumber = size;
        this.updateCode();
      });
    this.DEPARTMENTS = this.departmentService.buildDepartmentList();
  }

  registerInvoice(): void {
    this.invoice.department = this.departmentService.extractAbreviation(
      this.invoice.department
    );
    this.submitted = true;
    if (this.editing) {
      this.updateRevision();
      this.invoiceService.editInvoice(this.invoice);
      if (this.oldStatus !== this.invoice.status) {
        if (this.invoice.status === 'Fechado')
          this.contractService.saveContract(this.invoice);
      }
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
        this.invoiceNumber +
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
