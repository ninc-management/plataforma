import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { BehaviorSubject, Subject } from 'rxjs';
import { take } from 'rxjs/operators';

import { LocalDataSource } from 'app/@theme/components/smart-table/lib/data-source/local/local.data-source';
import {
  COMPONENT_TYPES,
  ContractDialogComponent,
} from 'app/pages/contracts/contract-dialog/contract-dialog.component';
import { ContractService } from 'app/shared/services/contract.service';
import { ContractorService } from 'app/shared/services/contractor.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { ReceivableByContract } from 'app/shared/services/metrics.service';
import { codeSort, idToProperty, isPhone, valueSort } from 'app/shared/utils';

import { Contract } from '@models/contract';
import { Contractor } from '@models/contractor';
import { Invoice } from '@models/invoice';

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

  isPhone = isPhone;
  idToProperty = idToProperty;

  get filteredReceivables(): ReceivableByContract[] {
    if (this.searchQuery !== '')
      return this.userReceivableContracts.filter((receivable) => {
        if (receivable.contract.invoice && typeof receivable.contract.invoice !== 'string')
          return (
            receivable.contract.invoice.code.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            idToProperty(
              receivable.contract.invoice.contractor,
              this.contractorService.idToContractor.bind(this.contractorService),
              'fullName'
            )
              .toLowerCase()
              .includes(this.searchQuery.toLowerCase()) ||
            receivable.contract.invoice.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            receivable.receivableValue.toLowerCase().includes(this.searchQuery.toLowerCase())
          );
        return false;
      });
    return this.userReceivableContracts.sort((a, b) =>
      codeSort(
        -1,
        idToProperty(a.contract.invoice, this.invoiceService.idToInvoice.bind(this.invoiceService), 'code'),
        idToProperty(b.contract.invoice, this.invoiceService.idToInvoice.bind(this.invoiceService), 'code')
      )
    );
  }

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
      'contract.invoice.code': {
        title: 'Contrato',
        type: 'string',
      },
      'contract.invoice.contractor': {
        title: 'Cliente',
        type: 'string',
        valuePrepareFunction: (contractor: Contractor | string | undefined): string =>
          contractor ? this.contractorService.idToContractor(contractor).fullName : '',
        filterFunction: (contractor: Contractor | string | undefined, search?: string): boolean => {
          return contractor && search
            ? this.contractorService.idToContractor(contractor).fullName.toLowerCase().includes(search.toLowerCase())
            : false;
        },
      },
      'contract.invoice.name': {
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

  constructor(
    private dialogService: NbDialogService,
    public invoiceService: InvoiceService,
    public contractService: ContractService,
    public contractorService: ContractorService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.source.load(this.userReceivableContracts.filter((receivable) => receivable.receivableValue !== '0,00'));
  }

  getContractorName(invoice: Invoice | string | undefined): string {
    if (invoice) {
      invoice = this.invoiceService.idToInvoice(invoice);
      return idToProperty(
        invoice.contractor,
        this.contractorService.idToContractor.bind(this.contractorService),
        'fullName'
      );
    }
    return '';
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
