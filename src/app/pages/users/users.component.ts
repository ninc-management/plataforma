import { Component, OnInit, OnDestroy } from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { LocalDataSource } from 'ng2-smart-table';
import { combineLatest, Observable, Subject } from 'rxjs';
import { filter, map, take, takeUntil } from 'rxjs/operators';
import { cloneDeep, groupBy } from 'lodash';
import { getMonth, getYear } from 'date-fns';
import { CLIENT, CONTRACT_BALANCE, UserService } from 'app/shared/services/user.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { UserDialogComponent } from './user-dialog/user-dialog.component';
import { ContractService, CONTRACT_STATOOS, EXPENSE_TYPES } from 'app/shared/services/contract.service';
import { InvoiceService, INVOICE_STATOOS } from 'app/shared/services/invoice.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { User } from '@models/user';
import { Invoice } from '@models/invoice';

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

@Component({
  selector: 'ngx-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  users: User[] = [];
  searchQuery = '';
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
      emailNortan: {
        title: 'Email Nortan',
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
    },
  };

  source: LocalDataSource = new LocalDataSource();

  constructor(
    private dialogService: NbDialogService,
    private userService: UserService,
    public utils: UtilsService,
    private contractService: ContractService,
    private invoiceService: InvoiceService,
    private stringUtil: StringUtilService
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
  }

  userDialog(event: { data?: User }): void {
    this.dialogService.open(UserDialogComponent, {
      context: {
        title: 'EDIÇÃO DE ASSOCIADO',
        user: event.data ? event.data : new User(),
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

  computeReportData(): Observable<Record<string, ReportValue>> {
    const data = this.createReportObject();

    return combineLatest([this.invoiceService.getInvoices(), this.contractService.getContracts()]).pipe(
      filter(([invoices, contracts]) => invoices.length > 0 && contracts.length > 0),
      map(([invoices, contracts]) => {
        Object.values(
          groupBy(
            invoices
              .filter((invoice) => getYear(invoice.created) == 2021 && invoice.status != INVOICE_STATOOS.INVALIDADO)
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
              .filter((contract) => getYear(contract.created) == 2021)
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
              this.utils.nortanPercentage(monthContract.contract)
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
                    .filter((expense) => expense.paid && expense.paidDate && getYear(expense.paidDate) == 2021)
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
                    const userExpense = monthExpense.expense.team.reduce((sum, expense) => {
                      if (this.userService.isEqual(expense.user, uId)) {
                        sum = this.stringUtil.sumMoney(sum, expense.value);
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
                    .filter((payment) => payment.paid && payment.paidDate && getYear(payment.paidDate) == 2021)
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

  downloadReport(): void {
    this.generateCSV();
  }

  generateCSV(): void {
    this.computeReportData()
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
        csv += 'Associados;';
        for (let i = 0; i < 12; i++) {
          csv += monthlySubHeader.join(';') + ';';
        }
        csv += overviewSubHeader.join(';');
        csv += '\r\n';

        for (const key of Object.keys(data)) {
          csv += this.userService.idToName(key) + ';';
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
}
