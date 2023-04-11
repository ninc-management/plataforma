import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { BehaviorSubject, Subject } from 'rxjs';
import { take } from 'rxjs/operators';

import { LocalDataSource } from 'app/@theme/components/smart-table/lib/data-source/local/local.data-source';
import {
  COMPONENT_TYPES,
  ContractDialogComponent,
} from 'app/pages/contracts/contract-dialog/contract-dialog.component';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { ReceivableByContract } from 'app/shared/services/metrics.service';
import { isPhone, valueSort } from 'app/shared/utils';

import { Contract } from '@models/contract';

@Component({
  selector: 'ngx-user-receivables',
  templateUrl: './user-receivables.component.html',
  styleUrls: ['./user-receivables.component.scss'],
})
export class UserReceivablesComponent implements OnInit, OnDestroy {
  @Input() isDialogBlocked = new BehaviorSubject<boolean>(false);
  @Input() userReceivableContracts: ReceivableByContract[] = [];
  destroy$ = new Subject<void>();
  source: LocalDataSource = new LocalDataSource();
  searchQuery = '';

  settings = {
    mode: 'external',
    noDataMessage: 'Não encontramos nenhum contrato para o filtro selecionado.',
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
      confirmDelete: false,
    },
    actions: {
      columnTitle: 'Ações',
      add: false,
      edit: true,
      delete: false,
    },
    columns: {
      'contract.locals.code': {
        title: 'Contrato',
        type: 'string',
      },
      'contract.locals.contractor': {
        title: 'Cliente',
        type: 'string',
      },
      'contract.locals.name': {
        title: 'Empreendimento',
        type: 'string',
      },
      receivableValue: {
        title: 'Valor a receber',
        type: 'string',
        sortDirection: 'desc',
        compareFunction: valueSort,
      },
    },
  };

  get filteredReceivables(): ReceivableByContract[] {
    if (this.searchQuery !== '')
      return this.userReceivableContracts.filter((receivable) => {
        return (
          receivable.contract.locals.code.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          receivable.contract.locals.contractor.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          receivable.contract.locals.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          receivable.receivableValue.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      });
    return this.userReceivableContracts;
  }

  isPhone = isPhone;

  constructor(public invoiceService: InvoiceService, private dialogService: NbDialogService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.source.load(this.userReceivableContracts.filter((receivable) => receivable.receivableValue !== '0,00'));
  }

  contractDialog(event: { data?: ReceivableByContract }): void {
    this.isDialogBlocked.next(true);
    this.dialogService
      .open(ContractDialogComponent, {
        context: {
          title: 'EDIÇÃO DE CONTRATO',
          contract: event.data ? event.data.contract : new Contract(),
          componentType: COMPONENT_TYPES.CONTRACT,
        },
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      })
      .onClose.pipe(take(1))
      .subscribe(() => {
        this.isDialogBlocked.next(false);
      });
  }
}
