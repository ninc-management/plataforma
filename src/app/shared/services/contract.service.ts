import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { take, takeUntil } from 'rxjs/operators';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { Socket } from 'ngx-socket-io';
import { WebSocketService } from './web-socket.service';
import { OnedriveService } from './onedrive.service';
import { StringUtilService } from './string-util.service';
import { UserService, CONTRACT_BALANCE } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class ContractService implements OnDestroy {
  private requested = false;
  private size$ = new BehaviorSubject<number>(0);
  private destroy$ = new Subject<void>();
  private contracts$ = new BehaviorSubject<any[]>([]);

  constructor(
    private http: HttpClient,
    private wsService: WebSocketService,
    private onedrive: OnedriveService,
    private stringUtil: StringUtilService,
    private userService: UserService,
    private socket: Socket
  ) {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  saveContract(invoice: any): void {
    const currentTime = new Date();
    const contract = {
      invoice: invoice._id,
      payments: [],
      status: 'Em andamento',
      version: '00',
      total: '1',
      created: currentTime,
      lastUpdate: currentTime,
    };
    const req = {
      contract: contract,
    };
    this.http.post('/api/contract/', req).pipe(take(1)).subscribe();
  }

  editContract(contract: any): void {
    const currentTime = new Date();
    contract.lastUpdate = currentTime;
    const req = {
      contract: contract,
    };
    this.http
      .post('/api/contract/update', req)
      .pipe(take(1))
      .subscribe(() => {
        if (contract.status === 'Concluído')
          this.onedrive.moveToConcluded(contract.invoice);
      });
  }

  getContracts(): Observable<any[]> {
    if (!this.requested) {
      this.requested = true;
      this.http
        .post('/api/contract/all', {})
        .pipe(take(1))
        .subscribe((contracts: any[]) => {
          this.contracts$.next(contracts);
        });
      this.socket
        .fromEvent('dbchange')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data) =>
          this.wsService.handle(data, this.contracts$, 'contracts')
        );
    }
    return this.contracts$;
  }

  contractsSize(): Observable<number> {
    this.http
      .post('/api/contract/count', {})
      .pipe(take(1))
      .subscribe((numberJson) => {
        this.size$.next(+numberJson['size'] + 1);
      });
    return this.size$;
  }

  idToContract(id: string | 'object'): any {
    if (typeof id == 'object') return id;
    if (id === undefined) return undefined;
    const tmp = this.contracts$.getValue();
    return tmp[tmp.findIndex((el) => el._id === id)];
  }

  hasPayments(cId: any): boolean {
    const contract = this.idToContract(cId);
    return contract.payments.length != 0;
  }

  liquidValue(
    distribution: string,
    user: 'object',
    contract: 'object'
  ): string {
    const expenses = contract['expenses']
      .filter((expense) => expense.paid)
      .map((expense) => {
        return { source: expense.source, value: expense.value };
      })
      .flat()
      .reduce((sum, member) => {
        sum += this.stringUtil.moneyToNumber(member.value);
        return sum;
      }, 0);
    const result = this.stringUtil.round(
      (this.stringUtil.moneyToNumber(contract['liquid']) - expenses) *
        (1 - this.stringUtil.toMutiplyPercentage(distribution))
    );
    // Sum expenses paid by user
    const paid = contract['expenses']
      .filter((expense) => expense.paid)
      .map((expense) => {
        return { source: expense.source, value: expense.value };
      })
      .flat()
      .reduce((sum, member) => {
        if (this.userService.idToUser(member.source)._id == user['_id'])
          sum += this.stringUtil.moneyToNumber(member.value);
        return sum;
      }, 0);

    return this.stringUtil.numberToMoney(result + paid);
  }

  percentageToReceive(
    distribution: string,
    user: 'object',
    contract: 'object'
  ): string {
    let sum = this.stringUtil.numberToMoney(
      this.stringUtil.moneyToNumber(contract['notPaid']) +
        this.stringUtil.moneyToNumber(contract['balance'])
    );
    if (contract['balance'][0] == '-') sum = contract['notPaid'];
    return this.stringUtil
      .toPercentage(this.notPaidValue(distribution, user, contract), sum)
      .slice(0, -1);
  }

  receivedValue(user: 'object', contract: 'object'): string {
    const received = contract['payments']
      .map((payment) => payment.team)
      .flat()
      .reduce((sum, member) => {
        if (member.user == user['_id'])
          sum += this.stringUtil.moneyToNumber(member.value);
        return sum;
      }, 0);
    return this.stringUtil.numberToMoney(received);
  }

  notPaidValue(
    distribution: string,
    user: 'object',
    contract: 'object'
  ): string {
    return this.stringUtil.numberToMoney(
      this.stringUtil.moneyToNumber(
        this.liquidValue(distribution, user, contract)
      ) - this.stringUtil.moneyToNumber(this.receivedValue(user, contract))
    );
  }
}
