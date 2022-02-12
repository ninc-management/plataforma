import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { NbDialogService, NbComponentStatus } from '@nebular/theme';
import { LocalDataSource } from 'ng2-smart-table';
import { getYear } from 'date-fns';
import { saveAs } from 'file-saver';
import { take, takeUntil, filter } from 'rxjs/operators';
import { Subject, combineLatest } from 'rxjs';
import { NbAccessChecker } from '@nebular/security';
import { ContractDialogComponent, COMPONENT_TYPES } from './contract-dialog/contract-dialog.component';
import { ContractService, CONTRACT_STATOOS } from 'app/shared/services/contract.service';
import { ContractorService } from 'app/shared/services/contractor.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { UserService } from 'app/shared/services/user.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { UtilsService, Permissions } from 'app/shared/services/utils.service';
import { DepartmentService } from 'app/shared/services/department.service';
import { Contract } from '@models/contract';
import { Invoice } from '@models/invoice';
import { SelectorDialogComponent } from 'app/shared/components/selector-dialog/selector-dialog.component';
import { Team } from '@models/team';
import { TeamService } from 'app/shared/services/team.service';

@Component({
  selector: 'ngx-contracts',
  templateUrl: './contracts.component.html',
  styleUrls: ['./contracts.component.scss'],
})
export class ContractsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('smartTable', { read: ElementRef }) tableRef!: ElementRef;
  private destroy$ = new Subject<void>();
  contracts: Contract[] = [];
  searchQuery = '';
  get filtredContracts(): Contract[] {
    if (this.searchQuery !== '')
      return this.contracts.filter((contract) => {
        return (
          contract.fullName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          contract.code.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          contract.contractor.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          contract.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          contract.value.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          contract.status.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      });
    return this.contracts.sort((a, b) => this.utils.codeSort(-1, a.code, b.code));
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
      fullName: {
        title: 'Autor',
        type: 'string',
      },
      code: {
        title: 'Código',
        type: 'string',
        sortDirection: 'desc',
        compareFunction: this.utils.codeSort,
      },
      contractor: {
        title: 'Cliente',
        type: 'string',
      },
      name: {
        title: 'Empreendimento',
        type: 'string',
      },
      role: {
        title: 'Papel',
        type: 'string',
        width: '10%',
        filter: {
          type: 'list',
          config: {
            selectText: 'Todos',
            list: [
              { value: 'Gestor', title: 'Gestor' },
              { value: 'Equipe', title: 'Equipe' },
              { value: 'Equipe Gestor', title: 'Ambos' },
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
        compareFunction: this.valueSort,
      },
      interests: {
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
            list: [
              { value: 'Em andamento A receber', title: 'Ativo' },
              { value: 'Em andamento', title: 'Em andamento' },
              { value: 'A receber', title: 'A receber' },
              { value: 'Concluído', title: 'Concluído' },
              { value: 'Arquivado', title: 'Arquivado' },
            ],
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

  constructor(
    private dialogService: NbDialogService,
    private contractService: ContractService,
    private contractorService: ContractorService,
    private invoiceService: InvoiceService,
    private userService: UserService,
    private stringUtil: StringUtilService,
    private accessChecker: NbAccessChecker,
    private departmentService: DepartmentService,
    public utils: UtilsService,
    private teamService: TeamService
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
      this.userService.currentUser$,
    ])
      .pipe(
        takeUntil(this.destroy$),
        filter(
          ([contracts, invoices, contractors, user]) =>
            contracts.length > 0 && invoices.length > 0 && contractors.length > 0
        )
      )
      .subscribe(([contracts, invoices, contractors, user]) => {
        this.contracts = contracts.map((contract: Contract) => {
          if (contract.invoice) {
            const invoice = this.invoiceService.idToInvoice(contract.invoice);
            contract.invoice = invoice;
            if (invoice.author) {
              contract.fullName = this.userService.idToShortName(invoice.author);
            }
            if (invoice.contractor) {
              contract.contractor = this.contractorService.idToName(invoice.contractor);
            }
            contract.code = this.invoiceService.idToInvoice(contract.invoice).code;
            contract.name = invoice.name;
            contract.value = invoice.value;
            contract.interests = contract.receipts.length.toString() + '/' + contract.total;
            contract.role = this.invoiceService.role(invoice, user);
          }
          return contract;
        });
        this.source.load(this.contracts);
      });
    this.accessChecker
      .isGranted(Permissions.ELO_PRINCIPAL, 'export-csv')
      .pipe(takeUntil(this.destroy$))
      .subscribe((isGranted) => (this.settings.actions.add = isGranted));
  }
  /* eslint-enable indent */

  ngAfterViewInit(): void {
    combineLatest([
      this.contractService.getContracts(),
      this.invoiceService.getInvoices(),
      this.contractorService.getContractors(),
    ])
      .pipe(take(4))
      .subscribe(([contracts, invoices, contractors]) => {
        if (contracts.length > 0 && invoices.length > 0 && contractors.length > 0 && !this.utils.isPhone()) {
          setTimeout(() => {
            this.tableRef.nativeElement.children[0].children[0].children[1].children[5].children[0].children[0].children[0].children[0].children[0].value =
              'Equipe Gestor';
            this.tableRef.nativeElement.children[0].children[0].children[1].children[5].children[0].children[0].children[0].children[0].children[0].dispatchEvent(
              new Event('change')
            );
            this.tableRef.nativeElement.children[0].children[0].children[1].children[8].children[0].children[0].children[0].children[0].children[0].value =
              'Em andamento A receber';
            this.tableRef.nativeElement.children[0].children[0].children[1].children[8].children[0].children[0].children[0].children[0].children[0].dispatchEvent(
              new Event('change')
            );
          }, 1);
        }
      });
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

  valueSort(direction: number, a: string, b: string): number {
    const first = +a.replace(/[,.]/g, '');
    const second = +b.replace(/[,.]/g, '');

    if (first < second) {
      return -1 * direction;
    }
    if (first > second) {
      return direction;
    }
    return 0;
  }

  invoiceAuthorPic(iId: string | Invoice | undefined): string {
    if (iId === undefined) return '';
    const invoice = this.invoiceService.idToInvoice(iId);
    if (invoice.author === undefined) return '';
    const pic = this.userService.idToUser(invoice.author).profilePicture;
    if (pic === undefined) return '';
    return pic;
  }

  getReportReceivedValue(contract: Contract): string {
    return this.contractService.toNetValue(
      this.stringUtil.numberToMoney(
        contract.receipts.reduce((accumulator: number, recipt: any) => {
          if (recipt.paid) accumulator = accumulator + this.stringUtil.moneyToNumber(recipt.value);
          return accumulator;
        }, 0)
      ),
      this.utils.nfPercentage(contract),
      this.utils.nortanPercentage(contract)
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
      this.utils.nfPercentage(contract),
      this.utils.nortanPercentage(contract)
    );

    return this.stringUtil.numberToMoney(
      this.stringUtil.moneyToNumber(
        this.contractService.toNetValue(
          invoice.value,
          this.utils.nfPercentage(contract),
          this.utils.nortanPercentage(contract)
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
      .sort((a, b) => this.utils.codeSort(1, a.code, b.code))
      .forEach((contract) => {
        if (contract.invoice) {
          const invoice = this.invoiceService.idToInvoice(contract.invoice);
          csv += invoice.code + ';';
          csv += this.contractorService.idToName(invoice.contractor) + ';';
          csv += invoice.name + ';';
          csv += invoice.value + ';';
          csv += this.contractService.getComissionsSum(contract) + ';';
          csv +=
            this.contractService.toNetValue(
              this.contractService.subtractComissions(
                this.stringUtil.removePercentage(invoice.value, contract.ISS),
                contract
              ),
              this.utils.nfPercentage(contract),
              this.utils.nortanPercentage(contract)
            ) + ';';
          csv += this.getReportReceivedValue(contract) + ';';
          csv += this.getReportExpensesValue(contract) + ';';
          csv += this.getReportContractNotPaid(contract, invoice) + ';';
          csv += this.contractService.balance(contract) + ';';
          csv += invoice.team.map((member) => this.userService.idToName(member.user)).join(', ');
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

  openDepartmentDialog(): void {
    this.dialogService
      .open(SelectorDialogComponent, {
        dialogClass: 'my-dialog',
        context: {
          selectorList: this.departmentService.buildDepartmentList(),
          title: 'Relatório dos contratos abertos:',
          label: 'Selecione a diretoria',
          placeholder: 'Selecione a diretoria',
        },
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      })
      .onClose.pipe(take(1))
      .subscribe((department) => {
        if (department) this.downloadReport(department);
      });
  }
}
