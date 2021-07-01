import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { take, takeUntil } from 'rxjs/operators';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { Socket } from 'ngx-socket-io';
import { WebSocketService } from './web-socket.service';
import { OnedriveService } from './onedrive.service';
import { UtilsService } from './utils.service';
import { StringUtilService } from './string-util.service';
import { UserService } from './user.service';
import { User } from '../../../../backend/src/models/user';
import { Contract } from '../../../../backend/src/models/contract';
import { Invoice } from '../../../../backend/src/models/invoice';
import { parseISO } from 'date-fns';

export enum EXPENSE_TYPES {
  APORTE = 'Aporte',
  COMISSAO = 'Comissão',
  FOLHA = 'Folha de Pagamento',
  MATERIAL = 'Material',
  PRE_OBRA = 'Pré-Obra',
  TRANSPORTE_ALIMENTACAO = 'Transporte e Alimentação',
  OUTROS = 'Outros',
}

export enum SPLIT_TYPES {
  INDIVIDUAL = 'Individual',
  PERSONALIZADO = 'Personalizado',
  PROPORCIONAL = 'Proporcional',
}

@Injectable({
  providedIn: 'root',
})
export class ContractService implements OnDestroy {
  private requested = false;
  private size$ = new BehaviorSubject<number>(0);
  private destroy$ = new Subject<void>();
  private contracts$ = new BehaviorSubject<Contract[]>([]);

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
    const currentTime = new Date();
    const contract = {
      invoice: invoice._id,
      payments: [],
      status: 'Em andamento',
      version: '00',
      total: invoice.stages.length,
      created: currentTime,
      lastUpdate: currentTime,
      ISS: '0,00',
    };
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
    this.http
      .post('/api/contract/update', req)
      .pipe(take(1))
      .subscribe(() => {
        if (
          contract.status === 'Concluído' &&
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
            if (['created', 'lastUpdate', 'paidDate'].includes(k))
              return parseISO(v);
            return v;
          });
          this.contracts$.next(tmp as Contract[]);
        });
      this.socket
        .fromEvent('dbchange')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) =>
          this.wsService.handle(data, this.contracts$, 'contracts')
        );
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
    if (this.utils.isOfType<Contract>(id, ['_id', 'invoice', 'status']))
      return id;
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

  netValueBalance(
    distribution: string,
    contract: Contract,
    user?: User | string
  ): string {
    if (distribution == undefined) return '0,00';
    const expenseContribution = contract['expenses']
      .filter((expense) => expense.paid)
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
      this.stringUtil.moneyToNumber(contract.liquid) *
        this.stringUtil.toMultiplyPercentage(distribution) -
        expenseContribution.contract +
        expenseContribution.expense +
        expenseContribution.contribution
    );

    return this.stringUtil.numberToMoney(result);
  }

  percentageToReceive(
    distribution: string,
    user: User | string | undefined,
    contract: Contract,
    decimals = 2
  ): string {
    let sum = this.stringUtil.numberToMoney(
      this.stringUtil.moneyToNumber(contract.notPaid) +
        this.stringUtil.moneyToNumber(contract.balance)
    );
    if (contract.balance[0] == '-') sum = contract.notPaid;
    return this.stringUtil
      .toPercentage(
        this.notPaidValue(distribution, user, contract),
        sum,
        decimals
      )
      .slice(0, -1);
  }

  receivedValue(user: User | string | undefined, contract: Contract): string {
    const received = contract.payments
      .filter((payment) => payment.paid)
      .map((payment) => payment.team)
      .flat()
      .reduce((sum, member) => {
        if (this.userService.isEqual(member.user, user))
          sum += this.stringUtil.moneyToNumber(member.value);
        return sum;
      }, 0);
    return this.stringUtil.numberToMoney(received);
  }

  notPaidValue(
    distribution: string,
    user: User | string | undefined,
    contract: Contract
  ): string {
    return this.stringUtil.numberToMoney(
      this.stringUtil.moneyToNumber(
        this.netValueBalance(distribution, contract, user)
      ) - this.stringUtil.moneyToNumber(this.receivedValue(user, contract))
    );
  }

  toGrossValue(netValue: string, NF: string, nortanPercentage: string): string {
    return this.stringUtil.revertPercentage(
      this.stringUtil.revertPercentage(netValue, NF),
      nortanPercentage
    );
  }

  toNetValue(grossValue: string, NF: string, nortanPercentage: string): string {
    return this.stringUtil.removePercentage(
      this.stringUtil.removePercentage(grossValue, NF),
      nortanPercentage
    );
  }

  subtractComissions(contractValue: string, contract: Contract): string {
    const comissions = contract['expenses'].reduce((sum, expense) => {
      if (expense.type == EXPENSE_TYPES.COMISSAO)
        sum += this.stringUtil.moneyToNumber(expense.value);
      return sum;
    }, 0);

    return this.stringUtil.numberToMoney(
      this.stringUtil.moneyToNumber(contractValue) - comissions
    );
  }
}
