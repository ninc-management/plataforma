import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  Input,
  OnDestroy,
} from '@angular/core';
import { take, takeUntil } from 'rxjs/operators';
import { DepartmentService } from '../../../shared/services/department.service';
import { InvoiceService } from '../../../shared/services/invoice.service';
import { ContractService } from '../../../shared/services/contract.service';
import { ContractorService } from '../../../shared/services/contractor.service';
import { Subject } from 'rxjs';
import * as invoice_validation from '../../../shared/invoice-validation.json';
import { NbDialogService } from '@nebular/theme';
import { ContractorDialogComponent } from '../../contractors/contractor-dialog/contractor-dialog.component';

@Component({
  selector: 'ngx-invoice-item',
  templateUrl: './invoice-item.component.html',
  styleUrls: ['./invoice-item.component.scss'],
})
export class InvoiceItemComponent implements OnInit, OnDestroy {
  @Input() invoice: any;
  @Output() submit = new EventEmitter<void>();
  destroy$ = new Subject<void>();
  editing = false;
  submitted = false;
  invoiceNumber: number;
  revision: number = 0;
  validation = (invoice_validation as any).default;
  oldStatus: string;
  DEPARTMENTS: string[] = [];
  COORDINATIONS: string[] = [];
  STATOOS = ['Em análise', 'Fechado', 'Negado'];
  CONTRACTORS = [];

  constructor(
    private dialogService: NbDialogService,
    private invoiceService: InvoiceService,
    private departmentService: DepartmentService,
    private contractService: ContractService,
    public contractorService: ContractorService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

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
      if (this.invoice.contractor._id !== undefined)
        this.invoice.contractor = this.invoice.contractor._id;
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
    this.contractorService
      .getContractors()
      .pipe(takeUntil(this.destroy$))
      .subscribe((contractors) => {
        this.CONTRACTORS = contractors;
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
      this.invoice.contractorName = this.contractorService.idToName(
        this.invoice.contractor
      );
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

  addContractor(): void {
    this.dialogService.open(ContractorDialogComponent, {
      context: {
        title: 'ADICIONAR CLIENTE',
      },
      dialogClass: 'my-dialog',
      closeOnBackdropClick: false,
      closeOnEsc: false,
      autoFocus: false,
    });
  }
}
