import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  Input,
  OnDestroy,
} from '@angular/core';
import { DepartmentService } from '../../../shared/services/department.service';
import { InvoiceService } from '../../../shared/services/invoice.service';
import { ContractService } from '../../../shared/services/contract.service';
import { ContractorService } from '../../../shared/services/contractor.service';
import { UserService } from '../../../shared/services/user.service';
import { NbDialogService, NbMediaBreakpointsService } from '@nebular/theme';
import { ContractorDialogComponent } from '../../contractors/contractor-dialog/contractor-dialog.component';
import { take, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { parseISO } from 'date-fns';
import * as invoice_validation from '../../../shared/invoice-validation.json';

@Component({
  selector: 'ngx-invoice-item',
  templateUrl: './invoice-item.component.html',
  styleUrls: ['./invoice-item.component.scss'],
})
export class InvoiceItemComponent implements OnInit, OnDestroy {
  @Input() iInvoice: any;
  @Output() submit = new EventEmitter<void>();
  invoice: any;
  teamMember: any = {};
  destroy$ = new Subject<void>();
  editing = false;
  submitted = false;
  today = new Date();
  invoiceNumber: number;
  revision: number = 0;
  validation = (invoice_validation as any).default;
  oldStatus: string;
  DEPARTMENTS: string[] = [];
  COORDINATIONS: string[] = [];
  ALL_COORDINATIONS: string[] = [];
  USER_COORDINATIONS: string[] = [];
  STATOOS = ['Em análise', 'Fechado', 'Negado'];
  CONTRACTORS = [];
  USERS = [];

  constructor(
    private dialogService: NbDialogService,
    private invoiceService: InvoiceService,
    private departmentService: DepartmentService,
    private contractService: ContractService,
    private userService: UserService,
    private breakpointService: NbMediaBreakpointsService,
    public contractorService: ContractorService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    if (this.iInvoice) {
      this.invoice = Object.assign({}, this.iInvoice);
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
      if (
        this.invoice.created !== undefined &&
        typeof this.invoice.created !== 'object'
      )
        this.invoice.created = parseISO(this.invoice.created);
      if (
        this.invoice.lastUpdate !== undefined &&
        typeof this.invoice.lastUpdate !== 'object'
      )
        this.invoice.lastUpdate = parseISO(this.invoice.lastUpdate);
      if (this.invoice.contractor._id !== undefined)
        this.invoice.contractor = this.invoice.contractor._id;
      if (this.invoice.peep == undefined)
        this.invoice.peep =
          '20 dias úteis para o primeiro estudo preliminar, mais 15 dias úteis para cada pedido de alteração feito pelo cliente';
    } else {
      this.invoice = {
        created: new Date(),
        lastUpdate: new Date(),
      };
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
    this.userService.getUsersList().then((uL: any[]) => {
      this.USERS = uL;
    });
    this.DEPARTMENTS = this.departmentService.buildDepartmentList();
    this.ALL_COORDINATIONS = this.departmentService
      .buildAllCoordinationsList()
      .sort();
  }

  registerInvoice(): void {
    this.invoice.department = this.departmentService.extractAbreviation(
      this.invoice.department
    );
    this.submitted = true;
    this.invoice.lastUpdate = new Date();
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
      this.iInvoice = Object.assign({}, this.invoice);
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

  addColaborator(): void {
    this.invoice.team.push(Object.assign({}, this.teamMember));
    this.teamMember = {};
    this.USER_COORDINATIONS = [];
  }

  idToName(id: string): string {
    const entry = this.USERS.find((el) => el._id === id);
    return entry?.fullName;
  }

  updateUserCoordinations(): void {
    const selectedUser = this.USERS.find(
      (el) => el._id === this.teamMember.user
    );
    const active: boolean[] = [
      selectedUser.adm,
      selectedUser.design,
      selectedUser.obras,
      selectedUser.impermeabilizacao,
      selectedUser.instalacoes,
      selectedUser.ambiental,
      selectedUser.arquitetura,
      selectedUser.hidrico,
      selectedUser.eletrica,
      selectedUser.civil,
      selectedUser.sanitaria,
    ];
    this.USER_COORDINATIONS = this.ALL_COORDINATIONS.filter(
      (cd: string, idx: number) => {
        return active[idx];
      }
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

  tooltipText(contractorItem: any): string {
    if (contractorItem === undefined) return undefined;
    const contractor = contractorItem.fullName
      ? contractorItem
      : this.contractorService.idToContractor(this.invoice.contractor);
    return (
      `CPF/CNPJ: ` +
      contractor?.document +
      `\nEmail: ` +
      contractor?.email +
      `\nEndereço: ` +
      contractor?.address
    );
  }

  isPhone(): boolean {
    const { md } = this.breakpointService.getBreakpointsMap();
    return document.documentElement.clientWidth <= md;
  }

  fixHours(): void {
    const currentTime = new Date();
    this.invoice.created.setHours(currentTime.getHours());
    this.invoice.created.setMinutes(currentTime.getMinutes());
    this.invoice.created.setSeconds(currentTime.getSeconds());
  }
}
