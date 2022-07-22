import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NbAccessChecker } from '@nebular/security';
import { NbComponentStatus, NbDialogService } from '@nebular/theme';
import { getYear } from 'date-fns';
import { saveAs } from 'file-saver';
import { combineLatest, Subject } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';

import { COMPONENT_TYPES, ContractDialogComponent } from './contract-dialog/contract-dialog.component';
import { LocalDataSource } from 'app/@theme/components/smart-table/lib/data-source/local/local.data-source';
import { SelectorDialogComponent } from 'app/shared/components/selector-dialog/selector-dialog.component';
import { CONTRACT_STATOOS, ContractService } from 'app/shared/services/contract.service';
import { ContractorService } from 'app/shared/services/contractor.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { TeamService } from 'app/shared/services/team.service';
import { UserService } from 'app/shared/services/user.service';
import {
  codeSort,
  idToProperty,
  isPhone,
  nfPercentage,
  nortanPercentage,
  Permissions,
  valueSort,
} from 'app/shared/utils';

import { Contract } from '@models/contract';
import { Invoice } from '@models/invoice';
import { Team } from '@models/team';

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
    },
    actions: {
      columnTitle: 'Ações',
      add: true,
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
            selectText: 'Todos',
            list: [{ value: 'Em andamento A receber Finalizado', title: 'Ativo' }].concat(
              Object.values(CONTRACT_STATOOS).map((status) => ({ value: status, title: status }))
            ),
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
    private userService: UserService,
    private stringUtil: StringUtilService,
    private accessChecker: NbAccessChecker,
    private teamService: TeamService,
    public invoiceService: InvoiceService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* eslint-disable indent */
  ngOnInit(): void {
    combineLatest([
      this.invoiceService.isDataLoaded$,
      this.contractorService.isDataLoaded$,
      this.teamService.isDataLoaded$,
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([reqInvoice, reqContractor, reqTeam]) => {
        this.isDataLoaded = reqInvoice && reqContractor && reqTeam;
      });

    combineLatest([
      this.contractService.getContracts(),
      this.invoiceService.getInvoices(),
      this.contractorService.getContractors(),
      this.teamService.getTeams(),
      this.userService.currentUser$,
    ])
      .pipe(
        takeUntil(this.destroy$),
        filter(
          ([contracts, invoices, contractors, teams, user]) =>
            contracts.length > 0 && invoices.length > 0 && contractors.length > 0 && teams.length > 0
        )
      )
      .subscribe(([contracts, invoices, contractors, user]) => {
        this.contracts = contracts.map((contract: Contract) => this.contractService.fillContract(contract));
        this.source.load(this.contracts);
      });
    this.accessChecker
      .isGranted(Permissions.ELO_PRINCIPAL, 'export-csv')
      .pipe(takeUntil(this.destroy$))
      .subscribe((isGranted) => (this.settings.actions.add = isGranted));
    this.source.setFilter([
      { field: 'locals.role', search: 'Equipe Gestor' },
      { field: 'status', search: 'Em andamento A receber Finalizado' },
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

  getReportReceivedValue(contract: Contract): string {
    return this.contractService.toNetValue(
      this.stringUtil.numberToMoney(
        contract.receipts.reduce((accumulator: number, recipt: any) => {
          if (recipt.paid) accumulator = accumulator + this.stringUtil.moneyToNumber(recipt.value);
          return accumulator;
        }, 0)
      ),
      nfPercentage(contract),
      nortanPercentage(contract),
      contract.created
    );
  }

  getReportExpensesValue(contract: Contract): string {
    const filteredExpenses = contract.expenses.filter((expense) => {
      return expense.paid && expense.paidDate && getYear(expense.paidDate) == 2021;
    });

    let totalExpenseValue = '0,00';
    filteredExpenses.map((expense) => {
      totalExpenseValue = this.stringUtil.sumMoney(totalExpenseValue, expense.value);
    });

    return totalExpenseValue;
  }

  getReportContractNotPaid(contract: Contract, invoice: Invoice): string {
    const paidValue = this.contractService.toNetValue(
      this.stringUtil.numberToMoney(
        contract.receipts.reduce((accumulator: number, recipt: any) => {
          if (recipt.paid) accumulator = accumulator + this.stringUtil.moneyToNumber(recipt.value);
          return accumulator;
        }, 0)
      ),
      nfPercentage(contract),
      nortanPercentage(contract),
      contract.created
    );

    return this.stringUtil.numberToMoney(
      this.stringUtil.moneyToNumber(
        this.contractService.toNetValue(
          invoice.value,
          nfPercentage(contract),
          nortanPercentage(contract),
          contract.created
        )
      ) - this.stringUtil.moneyToNumber(paidValue)
    );
  }

  createReportObject(contracts: Contract[]): string {
    const mainHeaders = [
      'Nº do Contrato',
      'Cliente',
      'Empreendimento',
      'Valor Bruto do Contrato',
      'Total de Comissões',
      'Valor Liquido do Contrato',
      'Valor Recebido',
      'Total de Despesas',
      'Saldo',
      'R$ em Caixa',
      'Time',
    ];

    const subHeaders = [
      '',
      'Responsável',
      'Situação',
      'Data Prevista da Entrega',
      'Data da Entrega',
      'IFC ou .RVT no Onedrive?',
      '% Conclusão',
    ];

    let csv = mainHeaders.join(';') + '\r\n';

    contracts
      .sort((a, b) => codeSort(1, a.locals.code, b.locals.code))
      .forEach((contract) => {
        if (contract.invoice) {
          const invoice = this.invoiceService.idToInvoice(contract.invoice);
          csv += invoice.code + ';';
          csv +=
            idToProperty(
              invoice.contractor,
              this.contractorService.idToContractor.bind(this.contractorService),
              'fullName'
            ) + ';';
          csv += invoice.name + ';';
          csv += invoice.value + ';';
          csv += this.contractService.getComissionsSum(contract) + ';';
          csv +=
            this.contractService.toNetValue(
              this.contractService.subtractComissions(
                this.stringUtil.removePercentage(invoice.value, contract.ISS),
                contract
              ),
              nfPercentage(contract),
              nortanPercentage(contract),
              contract.created
            ) + ';';
          csv += this.getReportReceivedValue(contract) + ';';
          csv += this.getReportExpensesValue(contract) + ';';
          csv += this.getReportContractNotPaid(contract, invoice) + ';';
          csv += this.contractService.balance(contract) + ';';
          csv += invoice.team
            .map((member) => {
              idToProperty(member.user, this.userService.idToUser.bind(this.userService), 'fullName');
            })
            .join(', ');
          csv += '\r\n';
          csv += subHeaders.join(';') + '\r\n';
          csv += invoice.products.map((product) => product.name).join('\r\n') + '\r\n';
          csv += '\r\n';
        }
      });

    return csv;
  }

  downloadReport(selectedNortanTeam: string | Team | undefined): void {
    if (selectedNortanTeam) {
      const filteredContracts = this.contracts.filter((contract) => {
        if (contract.invoice) {
          const invoice = this.invoiceService.idToInvoice(contract.invoice);
          return (
            this.teamService.isTeamEqual(invoice.nortanTeam, selectedNortanTeam) &&
            contract.status != CONTRACT_STATOOS.ARQUIVADO &&
            contract.status != CONTRACT_STATOOS.CONCLUIDO
          );
        }
        return false;
      });

      const csv = this.createReportObject(filteredContracts);
      const blob = new Blob([csv], { type: 'text/csv' });
      saveAs(blob, 'relatorio_' + this.teamService.idToTeam(selectedNortanTeam).abrev.toLowerCase() + '.csv');
    }
  }

  openTeamDialog(): void {
    this.dialogService
      .open(SelectorDialogComponent, {
        dialogClass: 'my-dialog',
        context: {
          selectorList: this.teamService.teamsList(),
          valueTransformer: (team) => team._id,
          textTransformer: (team) => team.abrev + ' - ' + team.name,
          title: 'Relatório dos contratos abertos',
          label: 'Selecione o time',
          placeholder: 'Selecione o time',
        },
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      })
      .onClose.pipe(take(1))
      .subscribe((team) => {
        if (team) this.downloadReport(team);
      });
  }
}
