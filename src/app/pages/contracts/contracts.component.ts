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
import { ConfigService } from 'app/shared/services/config.service';
import { CONTRACT_STATOOS, ContractService } from 'app/shared/services/contract.service';
import { ContractorService } from 'app/shared/services/contractor.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { TeamService } from 'app/shared/services/team.service';
import { UserService } from 'app/shared/services/user.service';
import {
  codeSort,
  formatDate,
  greaterAndSmallerValue,
  idToProperty,
  isOfType,
  isPhone,
  nameSort,
  valueSort,
} from 'app/shared/utils';

import { Contract } from '@models/contract';
import { Contractor } from '@models/contractor';
import { Invoice } from '@models/invoice';
import { PlatformConfig } from '@models/platformConfig';
import { User } from '@models/user';

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

  idToProperty = idToProperty;

  get filteredContracts(): Contract[] {
    if (this.searchQuery !== '')
      return this.contracts.filter((contract) => {
        if (isOfType(Invoice, contract.invoice)) {
          return (
            idToProperty(contract.invoice.author, this.userService.idToUser.bind(this.userService), 'exibitionName')
              .toLowerCase()
              .includes(this.searchQuery.toLowerCase()) ||
            contract.invoice.code.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            idToProperty(
              contract.invoice.contractor,
              this.contractorService.idToContractor.bind(this.contractorService),
              'fullName'
            )
              .toLowerCase()
              .includes(this.searchQuery.toLowerCase()) ||
            contract.invoice.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            contract.invoice.value.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            contract.status.toLowerCase().includes(this.searchQuery.toLowerCase())
          );
        }
      });
    return this.contracts.sort((a, b) =>
      codeSort(
        -1,
        idToProperty(a.invoice, this.invoiceService.idToInvoice.bind(this.invoiceService), 'code'),
        idToProperty(b.invoice, this.invoiceService.idToInvoice.bind(this.invoiceService), 'code')
      )
    );
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
      'invoice.author': {
        title: 'Autor',
        type: 'string',
        valuePrepareFunction: (author: User | string | undefined) =>
          author ? this.userService.idToShortName(author) : '',
        filterFunction: (author: User | string | undefined, search?: string): boolean => {
          return author && search
            ? this.userService.idToShortName(author).toLowerCase().includes(search.toLowerCase())
            : false;
        },
        compareFunction: (
          direction: number | undefined,
          a: User | string | undefined,
          b: User | string | undefined
        ) => {
          const a1 = a ? this.userService.idToShortName(a) : '';
          const a2 = b ? this.userService.idToShortName(b) : '';
          return nameSort(direction, a1, a2);
        },
      },
      'invoice.code': {
        title: 'Código',
        type: 'string',
        sortDirection: 'desc',
        compareFunction: codeSort,
      },
      'invoice.contractor': {
        title: 'Cliente',
        type: 'string',
        valuePrepareFunction: (contractor: Contractor | string | undefined): string =>
          contractor ? this.contractorService.idToContractor(contractor).fullName : '',
        filterFunction: (contractor: Contractor | string | undefined, search?: string): boolean => {
          return contractor && search
            ? this.contractorService.idToContractor(contractor).fullName.toLowerCase().includes(search.toLowerCase())
            : false;
        },
        compareFunction: (
          direction: number | undefined,
          a: Contractor | string | undefined,
          b: Contractor | string | undefined
        ) => {
          const a1 = a ? this.contractorService.idToContractor(a).fullName : '';
          const a2 = b ? this.contractorService.idToContractor(b).fullName : '';
          return nameSort(direction, a1, a2);
        },
      },
      'invoice.name': {
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
      'invoice.value': {
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
    private teamService: TeamService,
    private configService: ConfigService,
    public contractService: ContractService,
    public contractorService: ContractorService,
    public invoiceService: InvoiceService,
    public userService: UserService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* eslint-disable indent */
  ngOnInit(): void {
    combineLatest([
      this.contractService.getContracts(),
      this.invoiceService.getInvoices(),
      this.contractorService.getContractors(),
      this.teamService.getTeams(),
      this.configService.getConfig(),
      this.contractService.isDataLoaded$,
      this.invoiceService.isDataLoaded$,
      this.contractorService.isDataLoaded$,
      this.teamService.isDataLoaded$,
      this.configService.isDataLoaded$,
    ])
      .pipe(
        skipWhile(
          ([
            ,
            ,
            ,
            ,
            ,
            isContractDataLoaded,
            isInvoiceDataLoaded,
            isContractorDataLoaded,
            isTeamDataLoaded,
            isConfigDataLoaded,
          ]) =>
            !(
              isContractDataLoaded &&
              isInvoiceDataLoaded &&
              isContractorDataLoaded &&
              isTeamDataLoaded &&
              isConfigDataLoaded
            )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(
        ([
          contracts,
          ,
          ,
          ,
          configs,
          isContractDataLoaded,
          isInvoiceDataLoaded,
          isContractorDataLoaded,
          isTeamDataLoaded,
        ]) => {
          this.contracts = contracts.map((contract: Contract) => this.contractService.fillContract(contract));
          this.source.load(this.contracts);
          this.config = configs[0];
          const contractsValues = greaterAndSmallerValue(this.contracts.map((c) => c.invoice));
          this.settings.columns['invoice.value'].filter.config.minValue = contractsValues.min;
          this.settings.columns['invoice.value'].filter.config.maxValue = contractsValues.max;
          this.isDataLoaded = isContractDataLoaded && isInvoiceDataLoaded && isContractorDataLoaded && isTeamDataLoaded;
        }
      );

    this.source.setFilter([
      { field: 'locals.role', search: 'Equipe Gestor' },
      {
        field: 'status',
        search: [CONTRACT_STATOOS.EM_ANDAMENTO, CONTRACT_STATOOS.A_RECEBER, CONTRACT_STATOOS.ENTREGUE].join(' '),
      },
    ]);
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

  contractDialog(event: { data?: Contract }, isEditing: boolean): void {
    this.dialogService.open(ContractDialogComponent, {
      context: {
        title: isEditing ? 'EDIÇÃO DE CONTRATO' : 'ADICIONAR ORDEM DE EMPENHO',
        contract: event.data ? event.data : new Contract(),
        componentType: isEditing ? COMPONENT_TYPES.CONTRACT : COMPONENT_TYPES.RECEIPT,
      },
      dialogClass: 'my-dialog',
      closeOnBackdropClick: false,
      closeOnEsc: false,
      autoFocus: false,
    });
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
