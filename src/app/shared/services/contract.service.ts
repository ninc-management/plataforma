import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, take, takeUntil } from 'rxjs/operators';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { Socket } from 'ngx-socket-io';
import { isBefore, parseISO } from 'date-fns';
import { cloneDeep } from 'lodash';
import { WebSocketService } from './web-socket.service';
import { OnedriveService } from './onedrive.service';
import { UtilsService } from './utils.service';
import { StringUtilService } from './string-util.service';
import { CLIENT, CONTRACT_BALANCE, UserService } from './user.service';
import { User } from '@models/user';
import { Contract, ContractExpense } from '@models/contract';
import { Invoice } from '@models/invoice';
import { StatusHistoryItem } from '@models/baseStatusHistory';

export enum EXPENSE_TYPES {
  APORTE = 'Aporte',
  COMISSAO = 'Comissão',
  FOLHA = 'Folha de Pagamento',
  MATERIAL = 'Material',
  PRE_OBRA = 'Pré-Obra',
  TRANSPORTE_ALIMENTACAO = 'Transporte e Alimentação',
  GASOLINA = 'Gasolina',
  OUTROS = 'Outros',
}

export enum SPLIT_TYPES {
  INDIVIDUAL = 'Individual',
  PERSONALIZADO = 'Personalizado',
  PROPORCIONAL = 'Proporcional',
}

export enum CONTRACT_STATOOS {
  EM_ANDAMENTO = 'Em andamento',
  A_RECEBER = 'A receber',
  FINALIZADO = 'Finalizado',
  CONCLUIDO = 'Concluído',
  ARQUIVADO = 'Arquivado',
}

export interface ExpenseParts {
  expense: number;
  contribution: number;
  cashback: number;
  comission: number;
}

@Injectable({
  providedIn: 'root',
})
export class ContractService implements OnDestroy {
  private requested = false;
  private size$ = new BehaviorSubject<number>(0);
  private destroy$ = new Subject<void>();
  private contracts$ = new BehaviorSubject<Contract[]>([]);
  edited$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private wsService: WebSocketService,
    private onedrive: OnedriveService,
    private stringUtil: StringUtilService,
    private userService: UserService,
    private socket: Socket,
    private utils: UtilsService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  saveContract(invoice: Invoice): void {
    const contract = new Contract();
    contract.statusHistory.push({
      status: contract.status,
      start: contract.created,
    });
    contract.invoice = invoice;
    contract.total = invoice.stages.length.toString();
    const req = {
      contract: contract,
    };
    this.http
      .post('/api/contract/', req)
      .pipe(take(1))
      .subscribe(() => this.onedrive.copyModelFolder(invoice));
  }

  editContract(contract: Contract): void {
    contract.lastUpdate = new Date();
    const req = {
      contract: contract,
    };
    const history = cloneDeep(contract.statusHistory);
    const isMoved = history.splice(0, history.length - 1).find((el: StatusHistoryItem) => el.status === 'Concluído');
    this.http
      .post('/api/contract/update', req)
      .pipe(take(1))
      .subscribe(() => {
        this.edited$.next();
        if (
          contract.status === 'Concluído' &&
          !isMoved &&
          this.utils.isOfType<Invoice>(contract.invoice, [
            '_id',
            'author',
            'department',
            'coordination',
            'code',
            'type',
            'contractor',
          ])
        )
          this.onedrive.moveToConcluded(contract.invoice);
      });
  }

  getContracts(): Observable<Contract[]> {
    if (!this.requested) {
      this.requested = true;
      this.http
        .post('/api/contract/all', {})
        .pipe(take(1))
        .subscribe((contracts: any) => {
          const tmp = JSON.parse(JSON.stringify(contracts), (k, v) => {
            if (['created', 'lastUpdate', 'paidDate'].includes(k)) return parseISO(v);
            return v;
          });
          this.contracts$.next(tmp as Contract[]);
        });
      this.socket
        .fromEvent('dbchange')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => this.wsService.handle(data, this.contracts$, 'contracts'));
    }
    return this.contracts$;
  }

  contractsSize(): Observable<number> {
    this.http
      .post('/api/contract/count', {})
      .pipe(take(1))
      .subscribe((numberJson: any) => {
        this.size$.next(+numberJson['size'] + 1);
      });
    return this.size$;
  }

  idToContract(id: string | Contract): Contract {
    if (this.utils.isOfType<Contract>(id, ['_id', 'invoice', 'status'])) return id;
    const tmp = this.contracts$.getValue();
    return tmp[tmp.findIndex((el) => el._id === id)];
  }

  hasReceipts(cId: string | Contract): boolean {
    const contract = this.idToContract(cId);
    return contract.receipts.length != 0;
  }

  hasPayments(cId: string | Contract): boolean {
    const contract = this.idToContract(cId);
    return contract.payments.length != 0;
  }

  hasExpenses(cId: string | Contract): boolean {
    const contract = this.idToContract(cId);
    return contract.expenses.length != 0;
  }

  balance(contract: Contract): string {
    const paid = this.toNetValue(
      this.stringUtil.numberToMoney(
        contract.receipts.reduce((accumulator: number, recipt: any) => {
          if (recipt.paid) accumulator = accumulator + this.stringUtil.moneyToNumber(recipt.value);
          return accumulator;
        }, 0)
      ),
      this.utils.nfPercentage(contract),
      this.utils.nortanPercentage(contract)
    );

    const expenseContribution = this.expensesContributions(contract);
    return this.stringUtil.numberToMoney(
      this.stringUtil.round(
        this.stringUtil.moneyToNumber(paid) -
          contract.payments.reduce((accumulator: number, payment: any) => {
            if (payment.paid) accumulator = accumulator + this.stringUtil.moneyToNumber(payment.value);
            return accumulator;
          }, 0) -
          expenseContribution.global.expense +
          expenseContribution.global.contribution +
          expenseContribution.global.cashback
      )
    );
  }

  netValueBalance(distribution: string, contract: Contract, user: User | string | undefined): string {
    if (distribution == undefined) return '0,00';
    const expenseContribution = contract.expenses
      .filter(
        (expense) =>
          expense.paid &&
          expense.source &&
          this.userService.idToUser(expense.source)._id != CLIENT._id &&
          expense.type != EXPENSE_TYPES.COMISSAO
      )
      .reduce(
        (sum, expense) => {
          if (expense.type == EXPENSE_TYPES.APORTE) {
            if (this.userService.isEqual(expense.source, user))
              sum.contribution += this.stringUtil.moneyToNumber(expense.value);
          } else {
            if (this.userService.isEqual(expense.source, user))
              sum.expense += this.stringUtil.moneyToNumber(expense.value);
            for (const member of expense.team) {
              if (this.userService.isEqual(member.user, user))
                sum.contract += this.stringUtil.moneyToNumber(member.value);
            }
          }
          return sum;
        },
        { expense: 0, contribution: 0, contract: 0 }
      );
    const result = this.stringUtil.round(
      this.stringUtil.moneyToNumber(contract.liquid) * this.stringUtil.toMultiplyPercentage(distribution) -
        expenseContribution.contract +
        expenseContribution.expense +
        expenseContribution.contribution
    );

    return this.stringUtil.numberToMoney(result);
  }

  /* eslint-disable @typescript-eslint/indent */
  expensesContributions(
    contract: Contract,
    user?: User | string
  ): {
    user: ExpenseParts;
    global: ExpenseParts;
  } {
    /* eslint-enable @typescript-eslint/indent */
    return contract.expenses
      .filter(
        (expense) => expense.paid && expense.source && this.userService.idToUser(expense.source)._id != CLIENT._id
      )
      .reduce(
        (accumulator, expense: ContractExpense) => {
          if (expense.source && this.userService.idToUser(expense.source)._id == CONTRACT_BALANCE._id) {
            const expenseValue = this.stringUtil.moneyToNumber(expense.value);
            const member = expense.team.find((el) => {
              return this.userService.isEqual(el.user, user);
            });

            if (expense.type == EXPENSE_TYPES.COMISSAO) {
              accumulator.global.comission += this.stringUtil.moneyToNumber(expense.value);
            }
            if (member && expense.type != EXPENSE_TYPES.COMISSAO) {
              accumulator.user.expense += this.stringUtil.moneyToNumber(member.value);
            }
            accumulator.global.expense += expenseValue;
          }

          if (expense.type == EXPENSE_TYPES.APORTE) {
            const contributionValue = this.stringUtil.moneyToNumber(expense.value);
            if (this.userService.isEqual(expense.author, user)) {
              accumulator.user.contribution += contributionValue;
            }
            accumulator.global.contribution += contributionValue;
          }

          if (expense.nf) {
            let cashbackValue = -1;
            if (expense.paidDate && isBefore(expense.paidDate, new Date('2021/11/01'))) {
              if (expense.uploadedFiles.length >= (expense.type == EXPENSE_TYPES.GASOLINA ? 4 : 1))
                cashbackValue = this.stringUtil.moneyToNumber(this.stringUtil.applyPercentage(expense.value, '15,00'));
            } else {
              if (expense.uploadedFiles.length >= 1 && expense.type == EXPENSE_TYPES.MATERIAL)
                cashbackValue = this.stringUtil.moneyToNumber(this.stringUtil.applyPercentage(expense.value, '15,00'));
            }
            if (cashbackValue != -1) {
              const member = expense.team.find((el) => {
                return this.userService.isEqual(el.user, user);
              });
              if (member) {
                accumulator.user.cashback += this.stringUtil.moneyToNumber(
                  this.stringUtil.applyPercentage(this.stringUtil.numberToMoney(cashbackValue), member.percentage)
                );
              }
              accumulator.global.cashback += cashbackValue;
            }
          }
          return accumulator;
        },
        {
          user: { expense: 0, contribution: 0, cashback: 0, comission: 0 },
          global: { expense: 0, contribution: 0, cashback: 0, comission: 0 },
        }
      );
  }

  percentageToReceive(distribution: string, user: User | string | undefined, contract: Contract, decimals = 2): string {
    let sum = this.stringUtil.numberToMoney(
      this.stringUtil.moneyToNumber(contract.notPaid) + this.stringUtil.moneyToNumber(contract.balance)
    );
    if (contract.balance[0] == '-') sum = contract.notPaid;
    return this.stringUtil.toPercentage(this.notPaidValue(distribution, user, contract), sum, decimals).slice(0, -1);
  }

  receivedValue(user: User | string | undefined, contract: Contract): string {
    const received = contract.payments
      .filter((payment) => payment.paid)
      .map((payment) => payment.team)
      .flat()
      .reduce((sum, member) => {
        if (this.userService.isEqual(member.user, user)) sum += this.stringUtil.moneyToNumber(member.value);
        return sum;
      }, 0);
    return this.stringUtil.numberToMoney(received);
  }

  notPaidValue(distribution: string, user: User | string | undefined, contract: Contract): string {
    return this.stringUtil.numberToMoney(
      this.stringUtil.moneyToNumber(this.netValueBalance(distribution, contract, user)) -
        this.stringUtil.moneyToNumber(this.receivedValue(user, contract))
    );
  }

  toGrossValue(netValue: string, NF: string, nortanPercentage: string): string {
    return this.stringUtil.revertPercentage(this.stringUtil.revertPercentage(netValue, NF), nortanPercentage);
  }

  toNetValue(grossValue: string, NF: string, nortanPercentage: string): string {
    return this.stringUtil.removePercentage(this.stringUtil.removePercentage(grossValue, NF), nortanPercentage);
  }

  subtractComissions(contractValue: string, contract: Contract): string {
    const comissionsSum = this.getComissionsSum(contract);

    return this.stringUtil.numberToMoney(this.stringUtil.moneyToNumber(contractValue) - comissionsSum);
  }

  getComissionsSum(contract: Contract): number {
    return this.expensesContributions(contract).global.comission;
  }

  getMemberExpensesSum(user: User | string | undefined, contract: Contract): string {
    const filteredExpenses = contract.expenses
      .filter((expense) => {
        return (
          expense.paid &&
          expense.type !== EXPENSE_TYPES.APORTE &&
          expense.type !== EXPENSE_TYPES.COMISSAO &&
          !this.userService.isEqual(expense.source, CONTRACT_BALANCE) &&
          !this.userService.isEqual(expense.source, CLIENT)
        );
      })
      .map((expense) => expense.team)
      .flat();

    const expensesSum = filteredExpenses.reduce((sum, expense) => {
      if (this.userService.isEqual(expense.user, user)) {
        sum += this.stringUtil.moneyToNumber(expense.value);
      }
      return sum;
    }, 0);

    return this.stringUtil.numberToMoney(expensesSum);
  }

  getMemberBalance(user: User | string | undefined, contract: Contract): string {
    const receivedSum = this.receivedValue(user, contract);
    const expensesSum = this.getMemberExpensesSum(user, contract);
    return this.stringUtil.numberToMoney(
      this.stringUtil.moneyToNumber(receivedSum) - this.stringUtil.moneyToNumber(expensesSum)
    );
  }

  checkEditPermission(invoice: Invoice): Observable<boolean> {
    return this.userService.currentUser$.pipe(
      map((user: User) => {
        if (invoice.team.length == 0) return true;
        return this.isUserAnAER(user, invoice) || this.userService.isEqual(user, invoice.team[0].user);
      })
    );
  }

  private isUserAnAER(user: User, invoice: Invoice): boolean {
    if (user.AER && user.AER.length != 0) {
      return user.AER.find((member) => this.userService.isEqual(member, invoice.team[0].user)) != undefined;
    }
    return false;
  }
}
