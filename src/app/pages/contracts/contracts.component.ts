import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NbComponentStatus, NbDialogService } from '@nebular/theme';
import { combineLatest, Subject } from 'rxjs';
import { skipWhile, takeUntil } from 'rxjs/operators';

import { COMPONENT_TYPES, ContractDialogComponent } from './contract-dialog/contract-dialog.component';
import { LocalDataSource } from 'app/@theme/components/smart-table/lib/data-source/local/local.data-source';
import { ConfigService } from 'app/shared/services/config.service';
import { CONTRACT_STATOOS, ContractService } from 'app/shared/services/contract.service';
import { ContractorService } from 'app/shared/services/contractor.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { TeamService } from 'app/shared/services/team.service';
import { codeSort, isPhone, valueSort } from 'app/shared/utils';

import { Contract } from '@models/contract';
import { PlatformConfig } from '@models/platformConfig';

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
          contract.locals.fullName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          contract.locals.code.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          contract.locals.contractor.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          contract.locals.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
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
      'locals.fullName': {
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
      'locals.name': {
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
        compareFunction: valueSort,
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
          this.isDataLoaded = isContractDataLoaded && isInvoiceDataLoaded && isContractorDataLoaded && isTeamDataLoaded;
        }
      );

    this.source.setFilter([
      { field: 'locals.role', search: 'Equipe Gestor' },
      { field: 'status', search: 'Em andamento A receber Entregue' },
    ]);
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
