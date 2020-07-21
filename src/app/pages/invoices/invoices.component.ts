import { Component, OnInit, OnDestroy } from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { InvoiceDialogComponent } from './invoice-dialog/invoice-dialog.component';
import { LocalDataSource } from 'ng2-smart-table';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { InvoiceService } from '../../shared/services/invoice.service';

@Component({
  selector: 'ngx-invoices',
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.scss'],
})
export class InvoicesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
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
      deleteButtonContent: '<i class="nb-trash"></i>',
      confirmDelete: true,
    },
    actions: {
      columnTitle: 'Ações',
      add: true,
      edit: true,
      delete: false,
    },
    columns: {
      fullName: {
        title: 'Autor',
        type: 'string',
      },
      code: {
        title: 'Código',
        type: 'string',
      },
      contractor: {
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
      },
    },
  };

  source: LocalDataSource = new LocalDataSource();

  constructor(
    private dialogService: NbDialogService,
    private invoicetService: InvoiceService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.invoicetService
      .getInvoices()
      .pipe(takeUntil(this.destroy$))
      .subscribe((contracts: any[]) => {
        this.source.load(
          contracts.map((contract: any) => {
            if (!contract.fullName)
              contract.fullName = contract.author.fullName;
            return contract;
          })
        );
      });
  }

  contractDialog(event): void {
    this.dialogService.open(InvoiceDialogComponent, {
      context: {
        title: event.data ? 'EDIÇÃO DE ORÇAMENTO' : 'CADASTRO DE ORÇAMENTO',
        invoice: event.data,
      },
      dialogClass: 'my-dialog',
      closeOnBackdropClick: false,
      closeOnEsc: false,
      autoFocus: false,
    });
  }
}
