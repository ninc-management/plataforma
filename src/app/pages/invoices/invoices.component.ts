import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { NbDialogService, NbComponentStatus } from '@nebular/theme';
import { InvoiceDialogComponent } from './invoice-dialog/invoice-dialog.component';
import { LocalDataSource } from 'ng2-smart-table';
import { take, takeUntil } from 'rxjs/operators';
import { Subject, combineLatest } from 'rxjs';
import { InvoiceService, INVOICE_STATOOS } from 'app/shared/services/invoice.service';
import { ContractorService } from 'app/shared/services/contractor.service';
import { PdfService } from './pdf.service';
import { UserService } from 'app/shared/services/user.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { Invoice } from '@models/invoice';

@Component({
  selector: 'ngx-invoices',
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.scss'],
})
export class InvoicesComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('smartTable', { read: ElementRef }) tableRef!: ElementRef;
  private destroy$ = new Subject<void>();
  invoices: any[] = [];
  searchQuery = '';
  get filtredInvoices(): any[] {
    if (this.searchQuery !== '')
      return this.invoices.filter((invoice) => {
        return (
          invoice.fullName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          invoice.code.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          invoice.contractor.fullName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          invoice.contractor.document.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          invoice.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          invoice.value.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          invoice.status.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      });
    return this.invoices.sort((a, b) => this.utils.codeSort(-1, a.code, b.code));
  }
  settings = {
    mode: 'external',
    noDataMessage: 'Não encontramos nenhum orçamento para o filtro selecionado.',
    add: {
      addButtonContent: '<i class="nb-plus"></i>',
      createButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
    },
    edit: {
      editButtonContent: '<i class="nb-edit"></i>',
      saveButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
    },
    delete: {
      deleteButtonContent: '<i class="far fa-file-pdf pdf"></i>',
      confirmDelete: false,
    },
    actions: {
      columnTitle: 'Ações',
      add: true,
      edit: true,
      delete: true,
    },
    columns: {
      fullName: {
        title: 'Autor',
        type: 'string',
      },
      code: {
        title: 'Código',
        type: 'string',
        sortDirection: 'desc',
        compareFunction: this.utils.codeSort,
      },
      contractorName: {
        title: 'Cliente',
        type: 'string',
      },
      name: {
        title: 'Empreendimento',
        type: 'string',
      },
      role: {
        title: 'Papel',
        type: 'string',
        width: '10%',
        filter: {
          type: 'list',
          config: {
            selectText: 'Todos',
            list: [
              { value: 'Gestor', title: 'Gestor' },
              { value: 'Equipe', title: 'Equipe' },
              { value: 'Equipe Gestor', title: 'Ambos' },
              { value: 'Nenhum', title: 'Nenhum' },
            ],
          },
        },
        filterFunction(cell: string, search?: string): boolean {
          if (search && search.includes(cell)) return true;
          return false;
        },
      },
      value: {
        title: 'Valor',
        type: 'string',
        width: '10%',
        compareFunction: this.utils.valueSort,
      },
      status: {
        title: 'Status',
        type: 'string',
        width: '10%',
        filter: {
          type: 'list',
          config: {
            selectText: 'Todos',
            list: [
              { value: INVOICE_STATOOS.EM_ANALISE, title: 'Em análise' },
              { value: INVOICE_STATOOS.FECHADO, title: 'Fechado' },
              { value: INVOICE_STATOOS.NEGADO, title: 'Negado' },
              { value: INVOICE_STATOOS.INVALIDADO, title: 'Invalidado' },
            ],
          },
        },
      },
    },
  };

  source: LocalDataSource = new LocalDataSource();

  constructor(
    private dialogService: NbDialogService,
    private invoiceService: InvoiceService,
    private utils: UtilsService,
    private contractorService: ContractorService,
    private userService: UserService,
    private pdf: PdfService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    combineLatest([
      this.invoiceService.getInvoices(),
      this.contractorService.getContractors(),
      this.userService.currentUser$,
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([invoices, contractors, user]) => {
        if (invoices.length > 0 && contractors.length > 0) {
          this.invoices = invoices.map((invoice: Invoice) => {
            if (invoice.author) invoice.fullName = this.userService.idToShortName(invoice.author);
            if (invoice.contractor) invoice.contractorName = this.contractorService.idToName(invoice.contractor);
            invoice.role = this.invoiceService.role(invoice, user);
            return invoice;
          });
          this.source.load(invoices);
        }
      });
  }

  ngAfterViewInit(): void {
    combineLatest([this.invoiceService.getInvoices(), this.contractorService.getContractors()])
      .pipe(take(3))
      .subscribe(([invoices, contractors]) => {
        if (invoices.length > 0 && contractors.length > 0 && !this.utils.isPhone()) {
          setTimeout(() => {
            this.tableRef.nativeElement.children[0].children[0].children[1].children[5].children[0].children[0].children[0].children[0].children[0].value =
              'Equipe Gestor';
            this.tableRef.nativeElement.children[0].children[0].children[1].children[5].children[0].children[0].children[0].children[0].children[0].dispatchEvent(
              new Event('change')
            );
            this.tableRef.nativeElement.children[0].children[0].children[1].children[7].children[0].children[0].children[0].children[0].children[0].value =
              'Em análise';
            this.tableRef.nativeElement.children[0].children[0].children[1].children[7].children[0].children[0].children[0].children[0].children[0].dispatchEvent(
              new Event('change')
            );
          }, 1);
        }
      });
  }

  invoiceDialog(event: { data?: Invoice }): void {
    this.dialogService
      .open(InvoiceDialogComponent, {
        context: {
          title: event.data ? (this.utils.isPhone() ? 'EDIÇÃO' : 'EDIÇÃO DE ORÇAMENTO') : 'CADASTRO DE ORÇAMENTO',
          invoice: event.data ? event.data : new Invoice(),
        },
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      })
      .onClose.pipe(take(1))
      .subscribe((invoice) => invoice && this.invoiceDialog({ data: invoice }));
  }

  async generatePDF(event: { data: Invoice }): Promise<void> {
    this.pdf.generate(event.data);
  }

  pageWidth(): number {
    return window.innerWidth;
  }

  statusColor(status: string): NbComponentStatus {
    switch (status) {
      case 'Em análise':
        return 'warning';
      case 'Fechado':
        return 'success';
      case 'Negado':
        return 'danger';
      default:
        return 'warning';
    }
  }
}
