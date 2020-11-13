import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  NbDialogService,
  NbIconLibraries,
  NbMediaBreakpointsService,
} from '@nebular/theme';
import { InvoiceDialogComponent } from './invoice-dialog/invoice-dialog.component';
import { LocalDataSource } from 'ng2-smart-table';
import { take, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { InvoiceService } from '../../shared/services/invoice.service';
import { ContractorService } from '../../shared/services/contractor.service';
import { PdfService } from './pdf.service';

@Component({
  selector: 'ngx-invoices',
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.scss'],
})
export class InvoicesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  invoices: any[] = [];
  searchQuery = '';
  get filtredInvoices(): any[] {
    if (this.searchQuery !== '')
      return this.invoices.filter((invoice) => {
        return (
          invoice.fullName
            .toLowerCase()
            .includes(this.searchQuery.toLowerCase()) ||
          invoice.code.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          invoice.contractor.fullName
            .toLowerCase()
            .includes(this.searchQuery.toLowerCase()) ||
          invoice.contractor.document
            .toLowerCase()
            .includes(this.searchQuery.toLowerCase()) ||
          invoice.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          invoice.value
            .toLowerCase()
            .includes(this.searchQuery.toLowerCase()) ||
          invoice.status.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      });
    return this.invoices.sort((a, b) => this.codeSort(-1, a.code, b.code));
  }
  settings = {
    mode: 'external',
    noDataMessage:
      'Não encontramos nenhum orçamento para o filtro selecionado.',
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
        compareFunction: this.codeSort,
      },
      contractorName: {
        title: 'Cliente',
        type: 'string',
      },
      name: {
        title: 'Empreendimento',
        type: 'string',
      },
      value: {
        title: 'Valor',
        type: 'string',
        width: '10%',
        compareFunction: this.valueSort,
      },
      status: {
        title: 'Status',
        type: 'string',
        width: '10%',
        filter: {
          type: 'list',
          config: {
            selectText: 'Status',
            list: [
              { value: 'Em análise', title: 'Em análise' },
              { value: 'Fechado', title: 'Fechado' },
              { value: 'Negado', title: 'Negado' },
            ],
          },
        },
      },
    },
  };

  source: LocalDataSource = new LocalDataSource();

  constructor(
    private dialogService: NbDialogService,
    private invoicetService: InvoiceService,
    private breakpointService: NbMediaBreakpointsService,
    private contractorService: ContractorService,
    private pdf: PdfService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.invoicetService
      .getInvoices()
      .pipe(takeUntil(this.destroy$))
      .subscribe((invoices: any[]) => {
        this.invoices = invoices.map((invoice: any) => {
          if (!invoice.fullName) invoice.fullName = invoice.author.fullName;
          if (!invoice.contractor.fullName)
            invoice.contractorName = this.contractorService.idToName(
              invoice.contractor
            );
          if (invoice.contractor.fullName)
            invoice.contractorName = invoice.contractor.fullName;
          return invoice;
        });
        this.source.load(invoices);
      });
  }

  invoiceDialog(event): void {
    this.dialogService
      .open(InvoiceDialogComponent, {
        context: {
          title: event.data
            ? this.isPhone()
              ? 'EDIÇÃO'
              : 'EDIÇÃO DE ORÇAMENTO'
            : 'CADASTRO DE ORÇAMENTO',
          invoice: event.data,
        },
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      })
      .onClose.pipe(take(1))
      .subscribe((invoice) => invoice && this.invoiceDialog({ data: invoice }));
  }

  async generatePDF(event): Promise<void> {
    this.pdf.generate(event.data);
  }

  pageWidth(): number {
    return window.innerWidth;
  }

  isPhone(): boolean {
    const { md } = this.breakpointService.getBreakpointsMap();
    return document.documentElement.clientWidth <= md;
  }

  statusColor(status: string): string {
    switch (status) {
      case 'Em análise':
        return 'warning';
      case 'Fechado':
        return 'success';
      case 'Negado':
        return 'danger';
    }
  }

  valueSort(direction: any, a: string, b: string): number {
    let first = +a.replace(/[,.]/g, '');
    let second = +b.replace(/[,.]/g, '');

    if (first < second) {
      return -1 * direction;
    }
    if (first > second) {
      return direction;
    }
    return 0;
  }

  codeSort(direction: any, a: string, b: string): number {
    let first = +a.match(/-(\d+)\//g)[0].match(/\d+/g)[0];
    let second = +b.match(/-(\d+)\//g)[0].match(/\d+/g)[0];

    if (first < second) {
      return -1 * direction;
    }
    if (first > second) {
      return direction;
    }
    return 0;
  }
}
