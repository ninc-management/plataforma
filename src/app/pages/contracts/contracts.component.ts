import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NbAccessChecker } from '@nebular/security';
import { NbComponentStatus, NbDialogService, NbTabComponent } from '@nebular/theme';
import saveAs from 'file-saver';
import { combineLatest, Subject } from 'rxjs';
import { skipWhile, take, takeUntil } from 'rxjs/operators';

import { COMPONENT_TYPES, ContractDialogComponent } from './contract-dialog/contract-dialog.component';
import {
  DateFilterComponent,
  dateRangeFilter,
} from 'app/@theme/components/smart-table/components/filter/filter-types/date-filter.component';
import { sliderRangeFilter } from 'app/@theme/components/smart-table/components/filter/filter-types/range-slider.component';
import { LocalDataSource } from 'app/@theme/components/smart-table/lib/data-source/local/local.data-source';
import { TaskModel } from 'app/shared/components/charts/gantt-chart/task-data.model';
import { ConfigService } from 'app/shared/services/config.service';
import { CONTRACT_STATOOS, ContractService } from 'app/shared/services/contract.service';
import { ContractorService } from 'app/shared/services/contractor.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { TeamService } from 'app/shared/services/team.service';
import { UserService } from 'app/shared/services/user.service';
import { moneyToNumber, numberToMoney } from 'app/shared/string-utils';
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
  isComercialManager = false;
  areRowsVisible = true;
  contractsData: TaskModel[] = [];

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
    add: {
      addButtonContent: '<i class="icon-file-csv"></i>',
      createButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
    },
    edit: {
      editButtonContent: '<i class="nb-edit"></i>',
      saveButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
    },
    delete: {
      deleteButtonContent: '<i class="fa fa-dollar-sign payment"></i>',
      confirmDelete: false,
      setDeleteButtonColor: (rowData: any, content: string): string => {
        const parser = new DOMParser();
        const htmlElement = parser.parseFromString(content, 'text/html');
        const newContent = htmlElement.querySelector('i');
        const balance = moneyToNumber(rowData.locals.balance);
        if (newContent) {
          balance > 0.0 ? newContent.classList.add('green-balance') : newContent.classList.remove('green-balance');
          balance < 0.0 ? newContent.classList.add('red-balance') : newContent.classList.remove('red-balance');
        }
        return newContent ? newContent.outerHTML : content;
      },
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
    private accessChecker: NbAccessChecker,
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
    this.accessChecker
      .isGranted('dc', 'download-data')
      .pipe(take(1))
      .subscribe((isGranted) => {
        this.isComercialManager = isGranted;
        this.settings.actions.add = true;
        this.settings = Object.assign({}, this.settings);
      });

    this.source
      .onChanged()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.transformContractsData();
      });
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

  downloadContractData(): void {
    //TODO:
    this.source.getFilteredAndSorted().then((contracts: Contract[]) => {
      const csv = this.createContractsDataObject(contracts);
      const blob = new Blob([csv], { type: 'text/csv' });
      saveAs(blob, 'dados_contratos.csv');

      this.downloadReceiptsData(contracts);
      this.downloadPaymentsData(contracts);
      this.downloadExpensesData(contracts);
    });
  }

  downloadReceiptsData(contracts: Contract[]) {
    const filteredContracts = contracts.filter((contract) => contract.receipts.length > 0);
    const csv = this.createReceiptsDataObject(filteredContracts);
    const blob = new Blob([csv], { type: 'text/csv' });

    saveAs(blob, 'dados_ordens_de_empenho.csv');
  }

  createReceiptsDataObject(contracts: Contract[]): string {
    const mainHeaders = [
      'Código do Orçamento',
      'Nº da OE no Contrato',
      'Valor',
      'Valor Líquido',
      'NF (%)',
      'Empresa(%)',
      'ISS (%)',
      'Descrição',
      'Será pago em',
      'Pago?',
      'Data do Pagamento',
      'Data de Criação',
      'Última Atualização',
    ];

    let csv = mainHeaders.join(';') + '\r\n';

    contracts.forEach((contract) => {
      contract.receipts.forEach((receipt, idx) => {
        if (contract.invoice) {
          csv +=
            idToProperty(contract.invoice, this.invoiceService.idToInvoice.bind(this.invoiceService), 'code') + ';';
          csv += `#${idx + 1}` + ';';
          csv += receipt.value + ';';
          csv += this.contractService.receiptNetValue(receipt) + ';';
          csv += receipt.notaFiscal + ';';
          csv += receipt.nortanPercentage + ';';
          csv += (receipt.ISS ? receipt.ISS : '0,00') + ';';
          csv += receipt.description + ';';
          csv += (receipt.dueDate ? formatDate(receipt.dueDate) : '') + ';';
          csv += (receipt.paid ? 'Sim' : 'Não') + ';';
          csv += (receipt.paidDate ? formatDate(receipt.paidDate) : '') + ';';
          csv += formatDate(receipt.created) + ';';
          csv += formatDate(receipt.lastUpdate) + ';';
          csv += '\r\n';
        }
      });
    });

    return csv;
  }

  downloadPaymentsData(contracts: Contract[]) {
    const filteredContracts = contracts.filter((contract) => contract.payments.length > 0);
    const csv = this.createPaymentsDataObject(filteredContracts);
    const blob = new Blob([csv], { type: 'text/csv' });
    saveAs(blob, 'dados_ordem_de_pagamento.csv');
  }

  createPaymentsDataObject(contracts: Contract[]): string {
    const mainHeaders = [
      'Código do Orçamento',
      'Nº da OP no Contrato',
      'Valor',
      'Data prevista do pagamento',
      'Pago?',
      'Data de pagamento',
      'Data de criação',
      'Data de atualização',
      'Serviço',
    ];

    let csv = mainHeaders.join(';') + '\r\n';

    contracts.forEach((contract) => {
      contract.payments.forEach((payment, idx) => {
        if (contract.invoice) {
          csv +=
            idToProperty(contract.invoice, this.invoiceService.idToInvoice.bind(this.invoiceService), 'code') + ';';
          csv += `#${idx + 1}` + ';';
          csv += payment.value + ';';
          csv += formatDate(payment.predictedDate) + ';';
          csv += (payment.paid ? 'Sim' : 'Não') + ';';
          csv += (payment.paidDate ? formatDate(payment.paidDate) : '') + ';';
          csv += formatDate(payment.created) + ';';
          csv += formatDate(payment.lastUpdate) + ';';
          csv += payment.service + ';';
          csv += '\r\n';
        }
      });
    });

    return csv;
  }

  createContractsDataObject(contracts: Contract[]): string {
    const mainHeaders = [
      'Código do Orçamento',
      'Gestor',
      'Revisão',
      'Status',
      'Time',
      'Setor',
      'Cliente',
      'Administração do contrato',
      'Empreendimento',
      'Valor do contrato',
      'Valor de comissão',
      'Valor líquido',
      'Data de Criação',
      'Última Atualização',
      'Caixa',
      'Valor pago',
      'Parcelas criadas',
      'Parcelas totais',
    ];

    let csv = mainHeaders.join(';') + '\r\n';

    contracts.forEach((contract) => {
      if (contract.invoice) {
        const invoice = this.invoiceService.idToInvoice(contract.invoice);
        csv += invoice.code + ';';
        csv += idToProperty(invoice.author, this.userService.idToUser.bind(this.userService), 'fullName') + ';';
        csv += contract.version + ';';
        csv += contract.status + ';';
        csv += (invoice.nortanTeam ? this.teamService.idToTeam(invoice.nortanTeam).abrev : '') + ';';
        csv += this.teamService.idToSectorComposedName(invoice.sector) + ';';
        csv += (invoice.contractor ? this.contractorService.idToContractor(invoice.contractor).fullName : '') + ';';
        csv +=
          (invoice.administration === 'nortan'
            ? 'Suporte Empresarial'
            : invoice.administration === 'pessoal'
            ? 'Intermediação de Negócios'
            : '') + ';';
        csv += invoice.name + ';';
        csv += invoice.value + ';';
        csv += numberToMoney(this.contractService.getComissionsSum(contract)) + ';';
        csv += contract.locals.liquid + ';';
        csv += formatDate(contract.created) + ';';
        csv += formatDate(contract.lastUpdate) + ';';
        csv += contract.locals.balance + ';';
        csv += this.contractService.paidValue(contract) + ';';
        csv += contract.receipts.length + ';';
        csv += contract.total + ';';
        csv += '\r\n';
      }
    });

    return csv;
  }

  downloadExpensesData(contracts: Contract[]): void {
    const filteredContracts = contracts.filter((contract) => contract.expenses.length > 0);
    const csv = this.createExpensesDataObject(filteredContracts);
    const blob = new Blob([csv], { type: 'text/csv' });
    saveAs(blob, 'dados_despesas.csv');
  }

  createExpensesDataObject(contracts: Contract[]): string {
    const mainHeaders = ['#', 'Fonte', 'Descrição', 'Valor', 'Categoria', 'Tipo', 'Criação', 'Pago?', 'Pagamento'];

    let csv = mainHeaders.join(';') + '\r\n';

    contracts.forEach((contract) => {
      contract.expenses.forEach((expense, idx) => {
        if (contract.invoice) {
          csv +=
            idToProperty(contract.invoice, this.invoiceService.idToInvoice.bind(this.invoiceService), 'code') + ';';
          csv += `#${idx + 1}` + ';';
          csv += expense.source + ';';
          csv += expense.description + ';';
          csv += expense.value + ';';
          csv += expense.type + ';';
          csv += expense.subType + ';';
          csv += expense.created + ';';
          csv += (expense.paid ? 'Sim' : 'Não') + ';';
          csv += (expense.paidDate ? formatDate(expense.paidDate) : '') + ';';
          csv += '\r\n';
        }
      });
    });

    return csv;
  }

  setActiveTab(event: NbTabComponent): void {
    event.tabTitle === 'Visão em Tabela' ? (this.areRowsVisible = true) : (this.areRowsVisible = false);
  }

  transformContractsData() {
    let groupCount = 0;
    let taskCount = 0;
    const taskData: TaskModel[] = [];

    return this.source.getFilteredAndSorted().then((contracts: Contract[]) => {
      contracts.forEach((contract) => {
        groupCount += 1;
        taskCount = 0;

        if (contract.invoice) {
          const invoice = this.invoiceService.idToInvoice(contract.invoice);

          taskData.push({
            groupName: invoice.code,
            groupOrder: groupCount,
            taskName: invoice.code,
            taskId: groupCount.toString() + taskCount.toString(),
            taskDependencies: [],
            start: contract.created,
            end:
              contract.status === 'Concluído'
                ? contract.statusHistory[contract.statusHistory.length - 1].start
                : new Date(),
            progressPercentage: 0, //this.isItemOverdue(item) ? 100 : this.percentualItemProgress(item),
            owner: idToProperty(invoice.author, this.userService.idToUser.bind(this.userService), 'fullName'),
            image: idToProperty(invoice.author, this.userService.idToUser.bind(this.userService), 'profilePicture'),
            isFinished: contract.status === 'Concluído' ? 1 : 0,
            isAction: 0,
            isContract: true,
          } as TaskModel);
        }
      });

      this.contractsData = taskData;
    });
  }
}
