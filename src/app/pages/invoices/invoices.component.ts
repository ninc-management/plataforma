import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NbComponentStatus, NbDialogService } from '@nebular/theme';
import { combineLatest, Subject } from 'rxjs';
import { skipWhile, take, takeUntil } from 'rxjs/operators';

import { InvoiceDialogComponent } from './invoice-dialog/invoice-dialog.component';
import { PdfService } from './pdf.service';
import {
  DateFilterComponent,
  dateRangeFilter,
} from 'app/@theme/components/smart-table/components/filter/filter-types/date-filter.component';
import { sliderRangeFilter } from 'app/@theme/components/smart-table/components/filter/filter-types/range-slider.component';
import { LocalDataSource } from 'app/@theme/components/smart-table/lib/data-source/local/local.data-source';
import { ContractorService } from 'app/shared/services/contractor.service';
import { INVOICE_STATOOS, InvoiceService } from 'app/shared/services/invoice.service';
import { TeamService } from 'app/shared/services/team.service';
import { UserService } from 'app/shared/services/user.service';
import { codeSort, formatDate, greaterAndSmallerValue, idToProperty, isPhone, valueSort } from 'app/shared/utils';

import { Invoice, InvoiceLocals } from '@models/invoice';
import { User } from '@models/user';

@Component({
  selector: 'ngx-invoices',
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.scss'],
})
export class InvoicesComponent implements OnInit, OnDestroy {
  @ViewChild('smartTable', { read: ElementRef }) tableRef!: ElementRef;
  private destroy$ = new Subject<void>();
  invoices: any[] = [];
  searchQuery = '';
  user = new User();
  isDataLoaded = false;

  idToProperty = idToProperty;

  get filteredInvoices(): any[] {
    if (this.searchQuery !== '')
      return this.invoices.filter((invoice) => {
        return (
          (invoice.author &&
            idToProperty(invoice.author, this.userService.idToUser.bind(this.userService), 'exibitionName')
              .toLowerCase()
              .includes(this.searchQuery.toLowerCase())) ||
          invoice.code.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          invoice.contractorFullName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          (invoice.contractor &&
            idToProperty(
              invoice.contractor,
              this.contractorService.idToContractor.bind(this.contractorService),
              'document'
            )
              .toLowerCase()
              .includes(this.searchQuery.toLowerCase())) ||
          invoice.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          invoice.value.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          invoice.status.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      });
    return this.invoices.sort((a, b) => codeSort(-1, a.code, b.code));
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
      author: {
        title: 'Autor',
        type: 'string',
        valuePrepareFunction: (author: User | string | undefined): string => {
          return author ? this.userService.idToShortName(author) : '';
        },
        filterFunction: (author: User | string | undefined, search?: string): boolean => {
          return author && search
            ? this.userService.idToShortName(author).toLowerCase().includes(search.toLowerCase())
            : false;
        },
      },
      code: {
        title: 'Código',
        type: 'string',
        sortDirection: 'desc',
        compareFunction: codeSort,
      },
      contractorFullName: {
        title: 'Cliente',
        type: 'string',
      },
      name: {
        title: 'Empreendimento',
        type: 'string',
      },
      'locals.role': {
        title: 'Papel',
        type: 'string',
        width: '10%',
        filter: {
          type: 'list',
          config: {
            multiple: true,
            selectText: 'Todos',
            list: [
              { value: 'Gestor', title: 'Gestor' },
              { value: 'Equipe', title: 'Equipe' },
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
        filter: {
          type: 'slider',
          config: {
            minValue: 0,
            maxValue: 0,
          },
        },
        compareFunction: valueSort,
        filterFunction: (cell: any, search?: string) => sliderRangeFilter(cell, search),
      },
      status: {
        title: 'Status',
        type: 'string',
        width: '10%',
        filter: {
          type: 'list',
          config: {
            selectText: 'Todos',
            list: Object.values(INVOICE_STATOOS).map((status) => ({ value: status, title: status })),
          },
        },
      },
      created: {
        title: 'Data de criação',
        type: 'string',
        width: '10%',
        filter: {
          type: 'date',
          component: DateFilterComponent,
        },
        valuePrepareFunction: (date: Date) => formatDate(date) as any,
        filterFunction: (cell: any, search?: string) => dateRangeFilter(cell, search),
      },
    },
  };

  source: LocalDataSource = new LocalDataSource();

  constructor(
    private contractorService: ContractorService,
    private dialogService: NbDialogService,
    private invoiceService: InvoiceService,
    private userService: UserService,
    private teamService: TeamService,
    private pdf: PdfService,
    private http: HttpClient
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    combineLatest([
      this.userService.currentUser$,
      this.invoiceService.getInvoices(),
      this.contractorService.getContractors(),
      this.teamService.getTeams(),
      this.invoiceService.isDataLoaded$,
      this.contractorService.isDataLoaded$,
      this.teamService.isDataLoaded$,
    ])
      .pipe(
        skipWhile(
          ([, , , , isInvoiceDataLoaded, isContractorDataLoaded, isTeamDataLoaded]) =>
            !(isInvoiceDataLoaded && isContractorDataLoaded && isTeamDataLoaded)
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(([user, invoices, , , , ,]) => {
        this.invoices = invoices;
        this.user = user;
        this.loadInvoiceTable();
      });
    this.source.setFilter([
      { field: 'locals.role', search: 'Equipe Gestor' },
      { field: 'status', search: 'Em análise' },
    ]);
  }

  loadInvoiceTable(): void {
    this.invoices.map((invoice: Invoice) => {
      invoice.locals = {} as InvoiceLocals;
      invoice.locals.role = this.invoiceService.role(invoice, this.user);
      return invoice;
    });
    this.source.load(this.invoices);
    const invoicesValues = greaterAndSmallerValue(this.invoices);
    this.settings.columns.value.filter.config.minValue = invoicesValues.min;
    this.settings.columns.value.filter.config.maxValue = invoicesValues.max;
    this.isDataLoaded = true;
  }

  invoiceDialog(event: { data?: Invoice }): void {
    this.dialogService
      .open(InvoiceDialogComponent, {
        context: {
          title: event.data ? (isPhone() ? 'EDIÇÃO' : 'EDIÇÃO DE ORÇAMENTO') : 'CADASTRO DE ORÇAMENTO',
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
    this.http
      .post('/api/public/metric/all/', {})
      .pipe(take(1))
      .subscribe((metrics: any) => {
        this.pdf.generate(this.invoiceService.idToInvoice(event.data), metrics);
      });
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
