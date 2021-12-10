import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from 'app/shared/services/user.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { Subject } from 'rxjs';
import { LocalDataSource } from 'ng2-smart-table';
import { NbDialogService } from '@nebular/theme';
import { takeUntil } from 'rxjs/operators';
import { UserDialogComponent } from './user-dialog/user-dialog.component';
import { User } from '@models/user';
import { ContractService } from 'app/shared/services/contract.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { cloneDeep } from 'lodash';

interface IndividualData {
  payments: string;
  expenses: string;
  sent_invoices_manager: number;
  sent_invoices_team: number;
  opened_contracts_manager: number;
  opened_contracts_team: number;
  concluded_contracts_manager: number;
  concluded_contracts_team: number;
}

interface Overview {
  payments: string;
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

    const tmp: IndividualData[] = [];
    for (let i = 1; i <= 12; i++) {
      tmp.push({
        payments: '0,00',
        expenses: '0,00',
        sent_invoices_manager: 0,
        sent_invoices_team: 0,
        opened_contracts_manager: 0,
        opened_contracts_team: 0,
        concluded_contracts_manager: 0,
        concluded_contracts_team: 0,
      });
    }

    this.users.forEach((user) => {
      data[user._id] = {
        monthly_data: cloneDeep(tmp),
        overview: {
          payments: '0,00',
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

    return data;
  }

  // getPayments(): void {
  //   this.contractService
  //     .getContracts()
  //     .pipe(take(2))
  //     .subscribe((contracts) => {
  //       contracts.forEach((contract) => {
  //         contract.payments.forEach((payment) => {
  //           payment.team.find((member) => {
  //             if (member.user) {
  //               if (payment.paid && payment.paidDate) {
  //                 const paidDate = new Date(payment.paidDate);
  //                 data[member.user.toString()][paidDate.getMonth() - 1].payments = this.stringUtil.sumMoney(
  //                   data[member.user.toString()].payments,
  //                   member.value
  //                 );
  //               }
  //             }
  //           });
  //         });
  //       });
  //     });

  //   console.log(data);
  // }

  downloadReport(): void {
    this.generateCSV();
  }

  generateCSV(): void {
    const data = this.createReportObject();
    const header = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    let csv = header.join(';');
    csv += '\r\n';
    const subHeader = 'Recebido | Despesas | Orcamentos Enviados | Contratos Fechados';
    //['Recebido', 'Despesas', 'Orcamentos Enviados', 'Contratos Fechados'];
    for (let i = 1; i <= 12; i++) {
      csv += subHeader + ';';
    }
    csv += '\r\n';

    const blob = new Blob([csv], { type: 'text/csv' });
    saveAs(blob, 'report.csv');
  }
}
