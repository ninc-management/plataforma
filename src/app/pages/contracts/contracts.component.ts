import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NbComponentStatus, NbDialogService } from '@nebular/theme';
import { combineLatest, Subject } from 'rxjs';
import { skipWhile, takeUntil } from 'rxjs/operators';

import { COMPONENT_TYPES, ContractDialogComponent } from './contract-dialog/contract-dialog.component';
import {
  DateFilterComponent,
  dateRangeFilter,
} from 'app/@theme/components/smart-table/components/filter/filter-types/date-filter.component';
import { sliderRangeFilter } from 'app/@theme/components/smart-table/components/filter/filter-types/range-slider.component';
import { LocalDataSource } from 'app/@theme/components/smart-table/lib/data-source/local/local.data-source';
import { TransactionDialogComponent } from 'app/shared/components/transactions/transaction-dialog/transaction-dialog.component';
import { ConfigService } from 'app/shared/services/config.service';
import { CONTRACT_STATOOS, ContractService } from 'app/shared/services/contract.service';
import { ContractorService } from 'app/shared/services/contractor.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { TeamService } from 'app/shared/services/team.service';
import { TRANSACTION_TYPES, TransactionService } from 'app/shared/services/transaction.service';
import { codeSort, formatDate, greaterAndSmallerValue, isPhone, valueSort } from 'app/shared/utils';

import { Contract } from '@models/contract';
import { PlatformConfig } from '@models/platformConfig';
import { Transaction } from '@models/transaction';

@Component({
  selector: 'ngx-contracts',
  templateUrl: './contracts.component.html',
  styleUrls: ['./contracts.component.scss'],
})
export class ContractsComponent implements OnInit, OnDestroy {
  @ViewChild('smartTable', { read: ElementRef }) tableRef!: ElementRef;
  private destroy$ = new Subject<void>();
  contracts: Contract[] = [];
  searchQuery = '';
  isDataLoaded = false;
  config: PlatformConfig = new PlatformConfig();

  get filtredContracts(): Contract[] {
    if (this.searchQuery !== '')
      return this.contracts.filter((contract) => {
        return (
          contract.locals.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          contract.locals.code.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          contract.locals.contractor.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          contract.locals.description.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          contract.locals.value.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          contract.status.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      });
    return this.contracts.sort((a, b) => codeSort(-1, a.locals.code, b.locals.code));
  }
  settings = {
    mode: 'external',
    noDataMessage: 'Não encontramos nenhum contrato para o filtro selecionado.',
    edit: {
      editButtonContent: '<i class="nb-edit"></i>',
      saveButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
    },
    delete: {
      deleteButtonContent: '<i class="fa fa-dollar-sign payment"></i>',
      confirmDelete: false,
    },
    actions: {
      columnTitle: 'Ações',
      add: false,
      edit: true,
      delete: true,
    },
    columns: {
      'locals.name': {
        title: 'Autor',
        type: 'string',
      },
      'locals.code': {
        title: 'Código',
        type: 'string',
        sortDirection: 'desc',
        compareFunction: codeSort,
      },
      'locals.contractor': {
        title: 'Cliente',
        type: 'string',
      },
      'locals.description': {
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
      'locals.value': {
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
      'locals.interests': {
        title: 'Parcelas',
        type: 'string',
        width: '50px',
      },
      status: {
        title: 'Status',
        type: 'string',
        width: '10%',
        filter: {
          type: 'list',
          config: {
            multiple: true,
            selectText: 'Todos',
            list: Object.values(CONTRACT_STATOOS).map((status) => ({ value: status, title: status })),
          },
        },
        filterFunction(cell: string, search?: string): boolean {
          if (search && search.includes(cell)) return true;
          return false;
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

  isPhone = isPhone;

  constructor(
    private dialogService: NbDialogService,
    private contractService: ContractService,
    private contractorService: ContractorService,
    private teamService: TeamService,
    private configService: ConfigService,
    private transactionService: TransactionService,
    public invoiceService: InvoiceService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* eslint-disable indent */
  ngOnInit(): void {
    combineLatest([
      this.contractService.getContracts(),
      this.configService.getConfig(),
      this.invoiceService.getInvoices(),
      this.contractorService.getContractors(),
      this.teamService.getTeams(),
      this.transactionService.getTransactions(),
      this.contractService.isDataLoaded$,
      this.configService.isDataLoaded$,
      this.invoiceService.isDataLoaded$,
      this.contractorService.isDataLoaded$,
      this.teamService.isDataLoaded$,
      this.transactionService.isDataLoaded$,
    ])
      .pipe(
        skipWhile(
          ([
            ,
            ,
            ,
            ,
            ,
            ,
            isContractDataLoaded,
            isConfigDataLoaded,
            isInvoiceDataLoaded,
            isContractorDataLoaded,
            isTeamDataLoaded,
            isTransactionDataLoaded,
          ]) =>
            !(
              isContractDataLoaded &&
              isInvoiceDataLoaded &&
              isContractorDataLoaded &&
              isTeamDataLoaded &&
              isConfigDataLoaded &&
              isTransactionDataLoaded
            )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(([contracts, configs, , , , , , , , , ,]) => {
        this.contracts = contracts.map((contract: Contract) => this.contractService.fillContract(contract));
        this.source.load(this.contracts);
        this.config = configs[0];
        const contractsValues = greaterAndSmallerValue(this.contracts.map((c) => c.invoice));
        this.settings.columns['locals.value'].filter.config.minValue = contractsValues.min;
        this.settings.columns['locals.value'].filter.config.maxValue = contractsValues.max;
        this.isDataLoaded = true;
      });

    this.source.setFilter([
      { field: 'locals.role', search: 'Equipe Gestor' },
      {
        field: 'status',
        search: [CONTRACT_STATOOS.EM_ANDAMENTO, CONTRACT_STATOOS.A_RECEBER, CONTRACT_STATOOS.ENTREGUE].join(' '),
      },
    ]);
  }

  openDialog(event: { data?: Contract }, isEditing: boolean): void {
    if (isEditing) {
      this.dialogService.open(ContractDialogComponent, {
        context: {
          title: 'EDIÇÃO DE CONTRATO',
          contract: event.data ? event.data : new Contract(),
          componentType: COMPONENT_TYPES.CONTRACT,
        },
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      });
    } else {
      this.dialogService.open(TransactionDialogComponent, {
        context: {
          title: 'ADICIONAR MOVIMENTAÇÃO',
          transaction: new Transaction(),
          contract: event.data ? event.data : new Contract(),
          type: TRANSACTION_TYPES.RECEIPT,
        },
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      });
    }
  }

  pageWidth(): number {
    return window.innerWidth;
  }

  statusColor(status: string): NbComponentStatus {
    switch (status) {
      case 'Em andamento':
        return 'warning';
      case 'Concluído':
        return 'success';
      case 'Arquivado':
        return 'danger';
      default:
        return 'warning';
    }
  }
}
