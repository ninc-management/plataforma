import { Component, OnInit, OnDestroy, Inject, Input } from '@angular/core';
import { NbDialogRef, NbDialogService, NbTabComponent, NB_DOCUMENT } from '@nebular/theme';
import { getMonth, getYear } from 'date-fns';
import { saveAs } from 'file-saver';
import { cloneDeep, groupBy } from 'lodash';
import { LocalDataSource } from 'ng2-smart-table';
import { combineLatest, Observable, Subject } from 'rxjs';
import { filter, map, take, takeUntil } from 'rxjs/operators';
import { CLIENT, CONTRACT_BALANCE, UserService } from 'app/shared/services/user.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { UserDialogComponent } from './user-dialog/user-dialog.component';
import { ContractService, CONTRACT_STATOOS, EXPENSE_TYPES } from 'app/shared/services/contract.service';
import { InvoiceService, INVOICE_STATOOS } from 'app/shared/services/invoice.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { BaseDialogComponent } from 'app/shared/components/base-dialog/base-dialog.component';
import { User } from '@models/user';
import { Invoice } from '@models/invoice';
import { TeamService } from 'app/shared/services/team.service';
import { Prospect } from '@models/prospect';
import { ProspectService } from 'app/shared/services/prospect.service';
import { ConfirmationDialogComponent } from 'app/shared/components/confirmation-dialog/confirmation-dialog.component';

interface IndividualData {
  received: string;
  expenses: string;
  sent_invoices_manager: number;
  sent_invoices_team: number;
  opened_contracts_manager: number;
  opened_contracts_team: number;
  concluded_contracts_manager: number;
  concluded_contracts_team: number;
}

interface Overview {
  received: string;
  expenses: string;
  to_receive: string;
  sent_invoices_manager: number;
  sent_invoices_team: number;
  opened_contracts_manager: number;
  opened_contracts_team: number;
  concluded_contracts_manager: number;
  concluded_contracts_team: number;
}

interface ReportValue {
  monthly_data: IndividualData[];
  overview: Overview;
}

enum REPORT_TYPES {
  GERAL = 'Geral',
  NORTAN = 'Suporte Administrativo',
  PESSOAL = 'Administração Pessoal',
}

enum GROUP_BY {
  USER = 'Usuário',
  SECTOR = 'Setor',
}

enum TAB_TITLES {
  ASSOCIADOS = 'Associados',
  PROSPECTOS = 'Prospectos',
}

@Component({
  selector: 'ngx-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  users: User[] = [];
  prospects: Prospect[] = [];
  searchQuery = '';
  isProspectTab = false;
  get filtredUsers(): User[] {
    if (this.searchQuery !== '')
      return this.users.filter((user) => {
        return (
          user.fullName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          user.document.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          user.phone.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      });
    return this.users.sort((a, b) => {
      return this.utils.nameSort(1, a.fullName, b.fullName);
    });
  }

  get filteredProspects(): Prospect[] {
    if (this.searchQuery !== '')
      return this.prospects.filter((prospect) => {
        return (
          prospect.fullName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          prospect.phone.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          prospect.email.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      });
    return this.prospects.sort((a, b) => this.utils.nameSort(1, a.fullName, b.fullName));
  }

  settings = {
    mode: 'external',
    noDataMessage: 'Não encontramos nenhum usuário para o filtro selecionado.',
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
      deleteButtonContent: '<i class="fa fa-dollar-sign"></i>',
      confirmDelete: false,
    },
    actions: {
      columnTitle: 'Ações',
      add: true,
      edit: true,
      delete: false,
    },
    columns: {
      fullName: {
        title: 'Associado',
        type: 'string',
      },
      professionalEmail: {
        title: 'Email profissional',
        type: 'string',
      },
      phone: {
        title: 'Telefone',
        type: 'string',
      },
      email: {
        title: 'Conta Microsoft',
        type: 'string',
      },
      active: {
        title: 'Ativos?',
        type: 'string',
        valuePrepareFunction: (value: any) => (value ? '✅' : '❌'),
        filter: {
          type: 'list',
          config: {
            selectText: 'Todos',
            list: [
              {
                value: true,
                title: '✅',
              },
              {
                value: false,
                title: '❌',
              },
            ],
          },
        },
      },
    },
  };

  prospectsSettings = {
    mode: 'external',
    noDataMessage: 'Não encontramos nenhum prospecto para o filtro selecionado.',
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
      deleteButtonContent: '<i class="eva eva-checkmark-outline"></i>',
      confirmDelete: false,
    },
    actions: {
      columnTitle: 'Ações',
      add: false,
      edit: true,
      delete: true,
    },
    columns: {
      fullName: {
        title: 'Prospecto',
        type: 'string',
      },
      email: {
        title: 'Email',
        type: 'string',
      },
      phone: {
        title: 'Telefone',
        type: 'string',
      },
    },
  };

  source: LocalDataSource = new LocalDataSource();
  prospectSource: LocalDataSource = new LocalDataSource();

  constructor(
    private dialogService: NbDialogService,
    private userService: UserService,
    private contractService: ContractService,
    private invoiceService: InvoiceService,
    private stringUtil: StringUtilService,
    private prospectService: ProspectService,
    public utils: UtilsService,
    public teamService: TeamService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.userService
      .getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe((users: User[]) => {
        this.users = users;
        this.source.load(this.users);
      });

    this.prospectService
      .getProspects()
      .pipe(takeUntil(this.destroy$))
      .subscribe((prospects: Prospect[]) => {
        this.prospects = prospects;
        this.prospectSource.load(this.prospects);
      });
  }

  userDialog(event: { data?: User }): void {
    this.dialogService.open(UserDialogComponent, {
      context: {
        title: this.isProspectTab ? 'EDIÇÃO DE PROSPECTO' : 'EDIÇÃO DE ASSOCIADO',
        user: event.data ? event.data : new User(),
        isProspect: this.isProspectTab,
      },
      dialogClass: 'my-dialog',
      closeOnBackdropClick: false,
      closeOnEsc: false,
      autoFocus: false,
    });
  }

  createReportObject(): Record<string, ReportValue> {
    const data: Record<string, ReportValue> = {};

    this.users.forEach((user) => {
      const tmp: IndividualData[] = [];
      for (let i = 1; i <= 12; i++) {
        tmp.push({
          received: '0,00',
          expenses: '0,00',
          sent_invoices_manager: 0,
          sent_invoices_team: 0,
          opened_contracts_manager: 0,
          opened_contracts_team: 0,
          concluded_contracts_manager: 0,
          concluded_contracts_team: 0,
        });
      }
      data[user._id] = {
        monthly_data: cloneDeep(tmp),
        overview: {
          received: '0,00',
          expenses: '0,00',
          to_receive: '0,00',
          sent_invoices_manager: 0,
          sent_invoices_team: 0,
          opened_contracts_manager: 0,
          opened_contracts_team: 0,
          concluded_contracts_manager: 0,
          concluded_contracts_team: 0,
        },
      };
    });

    return cloneDeep(data);
  }

  createReportObjectBySector(): Record<string, ReportValue> {
    const data: Record<string, ReportValue> = {};

    this.teamService.sectorsListAll().forEach((sector) => {
      const tmp: IndividualData[] = [];
      for (let i = 1; i <= 12; i++) {
        tmp.push({
          received: '0,00',
          expenses: '0,00',
          sent_invoices_manager: 0,
          sent_invoices_team: 0,
          opened_contracts_manager: 0,
          opened_contracts_team: 0,
          concluded_contracts_manager: 0,
          concluded_contracts_team: 0,
        });
      }
      data[sector._id] = {
        monthly_data: cloneDeep(tmp),
        overview: {
          received: '0,00',
          expenses: '0,00',
          to_receive: '0,00',
          sent_invoices_manager: 0,
          sent_invoices_team: 0,
          opened_contracts_manager: 0,
          opened_contracts_team: 0,
          concluded_contracts_manager: 0,
          concluded_contracts_team: 0,
        },
      };
    });

    return cloneDeep(data);
  }

  computeReportData(type: REPORT_TYPES, year: number): Observable<Record<string, ReportValue>> {
    const data = this.createReportObject();

    return combineLatest([this.invoiceService.getInvoices(), this.contractService.getContracts()]).pipe(
      filter(([invoices, contracts]) => invoices.length > 0 && contracts.length > 0),
      map(([invoices, contracts]) => {
        Object.values(
          groupBy(
            invoices
              .filter((invoice) => {
                let typeFilter = true;
                if (type === REPORT_TYPES.NORTAN && invoice.administration != 'nortan') typeFilter = false;
                if (type === REPORT_TYPES.PESSOAL && invoice.administration == 'nortan') typeFilter = false;
                return getYear(invoice.created) == year && invoice.status != INVOICE_STATOOS.INVALIDADO && typeFilter;
              })
              .map((invoice) => ({ id: invoice._id, month: getMonth(invoice.created) })),
            '1'
          )
        ).forEach((monthInvoices) => {
          monthInvoices.forEach((monthInvoice) => {
            for (const uId of Object.keys(data)) {
              if (this.invoiceService.isInvoiceAuthor(monthInvoice.id, uId)) {
                data[uId].monthly_data[monthInvoice.month].sent_invoices_manager += 1;
                data[uId].overview.sent_invoices_manager += 1;
              } else if (this.invoiceService.isInvoiceMember(monthInvoice.id, uId)) {
                data[uId].monthly_data[monthInvoice.month].sent_invoices_team += 1;
                data[uId].overview.sent_invoices_team += 1;
              }
            }
          });
        });
        Object.values(
          groupBy(
            contracts
              .filter((contract) => {
                if (contract.invoice) {
                  const invoice = this.invoiceService.idToInvoice(contract.invoice);
                  let typeFilter = true;
                  if (type === REPORT_TYPES.NORTAN && invoice.administration != 'nortan') typeFilter = false;
                  if (type === REPORT_TYPES.PESSOAL && invoice.administration == 'nortan') typeFilter = false;
                  return getYear(contract.created) == year && typeFilter;
                }
                return false;
              })
              .map((contract) => ({ contract: contract, month: getMonth(contract.created) })),
            '1'
          )
        ).forEach((monthContracts) => {
          monthContracts.forEach((monthContract) => {
            monthContract.contract.liquid = this.contractService.toNetValue(
              this.contractService.subtractComissions(
                this.stringUtil.removePercentage(
                  this.invoiceService.idToInvoice(monthContract.contract.invoice as Invoice | string).value,
                  monthContract.contract.ISS
                ),
                monthContract.contract
              ),
              this.utils.nfPercentage(monthContract.contract),
              this.utils.nortanPercentage(monthContract.contract),
              monthContract.contract.created
            );
            for (const uId of Object.keys(data)) {
              if (this.invoiceService.isInvoiceAuthor(monthContract.contract.invoice as Invoice | string, uId)) {
                data[uId].monthly_data[monthContract.month].opened_contracts_manager += 1;
                data[uId].overview.opened_contracts_manager += 1;
                if (monthContract.contract.status == CONTRACT_STATOOS.CONCLUIDO) {
                  data[uId].monthly_data[monthContract.month].concluded_contracts_manager += 1;
                  data[uId].overview.concluded_contracts_manager += 1;
                }
              } else if (this.invoiceService.isInvoiceMember(monthContract.contract.invoice as Invoice | string, uId)) {
                data[uId].monthly_data[monthContract.month].opened_contracts_team += 1;
                data[uId].overview.opened_contracts_team += 1;
                if (monthContract.contract.status == CONTRACT_STATOOS.CONCLUIDO) {
                  data[uId].monthly_data[monthContract.month].concluded_contracts_team += 1;
                  data[uId].overview.concluded_contracts_team += 1;
                }
              }
              // Sum expenses in related months
              Object.values(
                groupBy(
                  monthContract.contract.expenses
                    .filter((expense) => expense.paid && expense.paidDate && getYear(expense.paidDate) == year)
                    .map((expense) => ({ expense: expense, month: getMonth(expense.paidDate as Date) })),
                  '1'
                )
              ).forEach((monthExpenses) => {
                monthExpenses.forEach((monthExpense) => {
                  if (
                    monthExpense.expense.paid &&
                    monthExpense.expense.type !== EXPENSE_TYPES.APORTE &&
                    monthExpense.expense.type !== EXPENSE_TYPES.COMISSAO &&
                    !this.userService.isEqual(monthExpense.expense.source, CONTRACT_BALANCE) &&
                    !this.userService.isEqual(monthExpense.expense.source, CLIENT)
                  ) {
                    const userExpense = monthExpense.expense.team.reduce((sum, member) => {
                      if (this.userService.isEqual(member.user, uId)) {
                        sum = this.stringUtil.sumMoney(sum, member.value);
                      }
                      return sum;
                    }, '0,00');

                    if (userExpense != '0,00') {
                      data[uId].monthly_data[monthExpense.month].expenses = this.stringUtil.sumMoney(
                        data[uId].monthly_data[monthExpense.month].expenses,
                        userExpense
                      );
                      data[uId].overview.expenses = this.stringUtil.sumMoney(data[uId].overview.expenses, userExpense);
                    }
                  }
                });
              });
              // Sum payments in related months
              Object.values(
                groupBy(
                  monthContract.contract.payments
                    .filter((payment) => payment.paid && payment.paidDate && getYear(payment.paidDate) == year)
                    .map((payment) => ({ payment: payment, month: getMonth(payment.paidDate as Date) })),
                  '1'
                )
              ).forEach((monthPayments) => {
                monthPayments.forEach((monthPayment) => {
                  const userPayment = monthPayment.payment.team.reduce((sum, payment) => {
                    if (this.userService.isEqual(payment.user, uId)) {
                      sum = this.stringUtil.sumMoney(sum, payment.value);
                    }
                    return sum;
                  }, '0,00');

                  if (userPayment != '0,00') {
                    data[uId].monthly_data[monthPayment.month].received = this.stringUtil.sumMoney(
                      data[uId].monthly_data[monthPayment.month].received,
                      userPayment
                    );
                    data[uId].overview.received = this.stringUtil.sumMoney(data[uId].overview.received, userPayment);
                  }
                });
              });
              // To receive value
              if (monthContract.contract.invoice) {
                const invoice = this.invoiceService.idToInvoice(monthContract.contract.invoice);
                const memberId = invoice.team.findIndex((member) => this.userService.isEqual(member.user, uId));
                if (memberId != -1) {
                  const toReceive = this.stringUtil.sumMoney(
                    this.contractService.notPaidValue(invoice.team[memberId].distribution, uId, monthContract.contract),
                    this.stringUtil.numberToMoney(
                      this.contractService.expensesContributions(monthContract.contract, uId).user.cashback
                    )
                  );
                  data[uId].overview.to_receive = this.stringUtil.sumMoney(data[uId].overview.to_receive, toReceive);
                }
              }
            }
          });
        });
        return data;
      })
    );
  }

  computeReportDataBySector(type: REPORT_TYPES, year: number): Observable<Record<string, ReportValue>> {
    const data = this.createReportObjectBySector();

    return combineLatest([this.invoiceService.getInvoices(), this.contractService.getContracts()]).pipe(
      filter(([invoices, contracts]) => invoices.length > 0 && contracts.length > 0),
      map(([invoices, contracts]) => {
        Object.values(
          groupBy(
            invoices
              .filter((invoice) => {
                let typeFilter = true;
                if (type === REPORT_TYPES.NORTAN && invoice.administration != 'nortan') typeFilter = false;
                if (type === REPORT_TYPES.PESSOAL && invoice.administration == 'nortan') typeFilter = false;
                return getYear(invoice.created) == year && invoice.status != INVOICE_STATOOS.INVALIDADO && typeFilter;
              })
              .map((invoice) => ({ invoice: invoice, month: getMonth(invoice.created) })),
            '1'
          )
        ).forEach((monthInvoices) => {
          monthInvoices.forEach((monthInvoice) => {
            for (const sector of Object.keys(data)) {
              if (this.teamService.isSectorEqual(monthInvoice.invoice.sector, sector)) {
                data[sector].monthly_data[monthInvoice.month].sent_invoices_manager += 1;
                data[sector].overview.sent_invoices_manager += 1;
              } else if (
                monthInvoice.invoice.team.filter((member) => this.teamService.isSectorEqual(member.sector, sector))
                  .length > 0
              ) {
                data[sector].monthly_data[monthInvoice.month].sent_invoices_team += 1;
                data[sector].overview.sent_invoices_team += 1;
              }
            }
          });
        });
        Object.values(
          groupBy(
            contracts
              .filter((contract) => {
                if (contract.invoice) {
                  const invoice = this.invoiceService.idToInvoice(contract.invoice);
                  let typeFilter = true;
                  if (type === REPORT_TYPES.NORTAN && invoice.administration != 'nortan') typeFilter = false;
                  if (type === REPORT_TYPES.PESSOAL && invoice.administration == 'nortan') typeFilter = false;
                  return getYear(contract.created) == year && typeFilter;
                }
                return false;
              })
              .map((contract) => ({ contract: contract, month: getMonth(contract.created) })),
            '1'
          )
        ).forEach((monthContracts) => {
          monthContracts.forEach((monthContract) => {
            monthContract.contract.liquid = this.contractService.toNetValue(
              this.contractService.subtractComissions(
                this.stringUtil.removePercentage(
                  this.invoiceService.idToInvoice(monthContract.contract.invoice as Invoice | string).value,
                  monthContract.contract.ISS
                ),
                monthContract.contract
              ),
              this.utils.nfPercentage(monthContract.contract),
              this.utils.nortanPercentage(monthContract.contract),
              monthContract.contract.created
            );
            for (const sector of Object.keys(data)) {
              if (
                this.teamService.isSectorEqual(
                  this.invoiceService.idToInvoice(monthContract.contract.invoice as Invoice | string).sector,
                  sector
                )
              ) {
                data[sector].monthly_data[monthContract.month].opened_contracts_manager += 1;
                data[sector].overview.opened_contracts_manager += 1;
                if (monthContract.contract.status == CONTRACT_STATOOS.CONCLUIDO) {
                  data[sector].monthly_data[monthContract.month].concluded_contracts_manager += 1;
                  data[sector].overview.concluded_contracts_manager += 1;
                }
              } else if (
                this.invoiceService
                  .idToInvoice(monthContract.contract.invoice as Invoice | string)
                  .team.filter((member) => this.teamService.isSectorEqual(member.sector, sector)).length > 0
              ) {
                data[sector].monthly_data[monthContract.month].opened_contracts_team += 1;
                data[sector].overview.opened_contracts_team += 1;
                if (monthContract.contract.status == CONTRACT_STATOOS.CONCLUIDO) {
                  data[sector].monthly_data[monthContract.month].concluded_contracts_team += 1;
                  data[sector].overview.concluded_contracts_team += 1;
                }
              }
              // Sum expenses in related months
              Object.values(
                groupBy(
                  monthContract.contract.expenses
                    .filter((expense) => expense.paid && expense.paidDate && getYear(expense.paidDate) == year)
                    .map((expense) => ({ expense: expense, month: getMonth(expense.paidDate as Date) })),
                  '1'
                )
              ).forEach((monthExpenses) => {
                monthExpenses.forEach((monthExpense) => {
                  if (
                    monthExpense.expense.paid &&
                    monthExpense.expense.type !== EXPENSE_TYPES.APORTE &&
                    monthExpense.expense.type !== EXPENSE_TYPES.COMISSAO &&
                    !this.userService.isEqual(monthExpense.expense.source, CONTRACT_BALANCE) &&
                    !this.userService.isEqual(monthExpense.expense.source, CLIENT)
                  ) {
                    const userExpense = monthExpense.expense.team.reduce((sum, member) => {
                      if (this.teamService.isSectorEqual(member.sector, sector)) {
                        sum = this.stringUtil.sumMoney(sum, member.value);
                      }
                      return sum;
                    }, '0,00');

                    if (userExpense != '0,00') {
                      data[sector].monthly_data[monthExpense.month].expenses = this.stringUtil.sumMoney(
                        data[sector].monthly_data[monthExpense.month].expenses,
                        userExpense
                      );
                      data[sector].overview.expenses = this.stringUtil.sumMoney(
                        data[sector].overview.expenses,
                        userExpense
                      );
                    }
                  }
                });
              });
              // Sum payments in related months
              Object.values(
                groupBy(
                  monthContract.contract.payments
                    .filter((payment) => payment.paid && payment.paidDate && getYear(payment.paidDate) == year)
                    .map((payment) => ({ payment: payment, month: getMonth(payment.paidDate as Date) })),
                  '1'
                )
              ).forEach((monthPayments) => {
                monthPayments.forEach((monthPayment) => {
                  const userPayment = monthPayment.payment.team.reduce((sum, payment) => {
                    if (this.teamService.isSectorEqual(payment.sector, sector)) {
                      sum = this.stringUtil.sumMoney(sum, payment.value);
                    }
                    return sum;
                  }, '0,00');

                  if (userPayment != '0,00') {
                    data[sector].monthly_data[monthPayment.month].received = this.stringUtil.sumMoney(
                      data[sector].monthly_data[monthPayment.month].received,
                      userPayment
                    );
                    data[sector].overview.received = this.stringUtil.sumMoney(
                      data[sector].overview.received,
                      userPayment
                    );
                  }
                });
              });
              // To receive value
              if (monthContract.contract.invoice) {
                const invoice = this.invoiceService.idToInvoice(monthContract.contract.invoice);
                invoice.team.forEach((member) => {
                  if (this.teamService.isSectorEqual(member.sector, sector)) {
                    const toReceive = this.stringUtil.sumMoney(
                      this.contractService.notPaidValue(member.distribution, member.user, monthContract.contract),
                      this.stringUtil.numberToMoney(
                        this.contractService.expensesContributions(monthContract.contract, member.user).user.cashback
                      )
                    );
                    data[sector].overview.to_receive = this.stringUtil.sumMoney(
                      data[sector].overview.to_receive,
                      toReceive
                    );
                  }
                });
              }
            }
          });
        });
        return data;
      })
    );
  }

  downloadReport(): void {
    this.dialogService
      .open(ReportConfigDialogComponent, {
        dialogClass: 'my-dialog',
        context: {
          selectorList: Object.values(REPORT_TYPES),
          title: 'Relatório anual',
          label: 'Selecione o tipo do relatório anual:',
          placeholder: 'Selecione o tipo',
        },
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      })
      .onClose.pipe(take(1))
      .subscribe((config) => {
        if (config.selected) this.generateCSV(config.groupBy, config.selected, config.year);
      });
  }

  generateCSV(groupBy: GROUP_BY, type: REPORT_TYPES, year: number): void {
    (groupBy == GROUP_BY.USER ? this.computeReportData(type, year) : this.computeReportDataBySector(type, year))
      .pipe(take(1))
      .subscribe((data) => {
        const header = [
          '',
          'Janeiro;;;;',
          'Fevereiro;;;;',
          'Março;;;;',
          'Abril;;;;',
          'Maio;;;;',
          'Junho;;;;',
          'Julho;;;;',
          'Agosto;;;;',
          'Setembro;;;;',
          'Outubro;;;;',
          'Novembro;;;;',
          'Dezembro;;;;',
          'Resumos;;;;;;;;',
        ];
        const monthlySubHeader = [
          'Recebido',
          'Despesas',
          'Orçamentos Passados',
          'Contratos Fechado',
          'Contrato Finalizados',
        ];
        const overviewSubHeader = [
          'Total Recebido',
          'Total Despesas',
          'A Receber',
          'Total Orçamentos Gestor',
          'Total Orçamentos Equipe',
          'Total Contratos Gestor',
          'Total Contratos Equipe',
          'Total Contrato Finalizados Gestor',
          'Total Contrato Finalizados Equipe',
        ];
        let csv = header.join(';');
        csv += '\r\n';
        csv += groupBy == GROUP_BY.USER ? 'Associados;' : 'Setores;';
        for (let i = 0; i < 12; i++) {
          csv += monthlySubHeader.join(';') + ';';
        }
        csv += overviewSubHeader.join(';');
        csv += '\r\n';

        for (const key of Object.keys(data)) {
          csv +=
            (groupBy == GROUP_BY.USER
              ? this.utils.idToProperty(key, this.userService.idToUser.bind(this.userService), 'fullName')
              : this.teamService.idToSectorComposedName(key)) + ';';
          data[key].monthly_data.forEach((individualData) => {
            csv += individualData.received + ';';
            csv += individualData.expenses + ';';
            csv += (individualData.sent_invoices_manager + individualData.sent_invoices_team).toString() + ';';
            csv += (individualData.opened_contracts_manager + individualData.opened_contracts_team).toString() + ';';
            csv +=
              (individualData.concluded_contracts_manager + individualData.concluded_contracts_team).toString() + ';';
          });
          csv += data[key].overview.received + ';';
          csv += data[key].overview.expenses + ';';
          csv += data[key].overview.to_receive + ';';
          csv += data[key].overview.sent_invoices_manager.toString() + ';';
          csv += data[key].overview.sent_invoices_team.toString() + ';';
          csv += data[key].overview.opened_contracts_manager.toString() + ';';
          csv += data[key].overview.opened_contracts_team.toString() + ';';
          csv += data[key].overview.concluded_contracts_manager.toString() + ';';
          csv += data[key].overview.concluded_contracts_team.toString();
          csv += '\r\n';
        }

        const blob = new Blob([csv], { type: 'text/csv' });
        saveAs(blob, 'relatorio geral.csv');
      });
  }

  setActiveTab(event: NbTabComponent) {
    this.isProspectTab = event.tabTitle.toLowerCase() == TAB_TITLES.PROSPECTOS.toLowerCase();
  }

  approveProspect(prospect: Prospect): void {
    this.dialogService
      .open(ConfirmationDialogComponent, {
        context: {
          question: 'Realmente deseja aprovar ' + prospect.fullName + '?',
        },
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      })
      .onClose.pipe(take(1))
      .subscribe((response) => {
        if (response) this.prospectService.approveProspect(prospect);
      });
  }
}

@Component({
  selector: 'ngx-report-config-dialog',
  template: `
    <nb-card
      [ngStyle]="{
        'width.px': dialogWidth()
      }"
    >
      <nb-card-header>{{ title }}</nb-card-header>
      <nb-card-body>
        <label class="label" for="input-selector">Selecione o tipo de agrupamento dos dados:</label>
        <nb-radio-group
          [(ngModel)]="config.groupBy"
          #groupBy="ngModel"
          id="input-group-type"
          name="groupBy"
          style="display: flex"
        >
          <nb-radio [value]="groupByTypes.USER">{{ groupByTypes.USER }}</nb-radio>
          <nb-radio [value]="groupByTypes.SECTOR">{{ groupByTypes.SECTOR }}</nb-radio>
        </nb-radio-group>
        <div class="row">
          <div class="col-6">
            <label class="label" for="input-selector">{{ label }}</label>
            <nb-select
              [(ngModel)]="config.selected"
              #listSelector="ngModel"
              id="input-selector"
              name="selectorList"
              [placeholder]="placeholder"
              fullWidth
              size="large"
              (ngModelChange)="config.selected && config.year ? dismiss() : ''"
              [required]="true"
              [status]="listSelector.dirty ? (listSelector.invalid ? 'danger' : 'success') : 'basic'"
              [attr.aria-invalid]="listSelector.invalid && listSelector.touched ? true : null"
            >
              <nb-option *ngFor="let item of selectorList" [value]="item">{{ item }}</nb-option>
            </nb-select>
          </div>
          <div class="col-6">
            <label class="label" for="input-selector">Selecione o ano:</label>
            <nb-select
              [(ngModel)]="config.year"
              #yearSelector="ngModel"
              id="year-selector"
              name="yearList"
              placeholder="Selecione o ano"
              fullWidth
              size="large"
              (ngModelChange)="config.selected && config.year ? dismiss() : ''"
              [required]="true"
              [status]="yearSelector.dirty ? (yearSelector.invalid ? 'danger' : 'success') : 'basic'"
              [attr.aria-invalid]="yearSelector.invalid && yearSelector.touched ? true : null"
            >
              <nb-option *ngFor="let year of years" [value]="year">{{ year }}</nb-option>
            </nb-select>
          </div>
        </div>
      </nb-card-body>
    </nb-card>
  `,
})
export class ReportConfigDialogComponent extends BaseDialogComponent implements OnInit {
  @Input() selectorList: string[] = [];
  @Input() title: string = '';
  @Input() label: string = '';
  @Input() placeholder: string = '';
  groupByTypes = GROUP_BY;
  config = {
    groupBy: GROUP_BY.USER,
    selected: '',
    year: '',
  };
  years = Array.from({ length: new Date().getFullYear() - 2020 + 1 }, (v, k) => 2020 + k);

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    protected derivedRef: NbDialogRef<ReportConfigDialogComponent>
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  dismiss(): void {
    super.dismiss(this.config);
  }

  dialogWidth(): number {
    return window.innerWidth * 0.5;
  }
}
