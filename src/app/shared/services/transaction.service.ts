import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, take, takeUntil } from 'rxjs';

import { handle, isOfType, reviveDates } from '../utils';
import { ContractService } from './contract.service';
import { ProviderService } from './provider.service';
import { TeamService } from './team.service';
import { UserService } from './user.service';
import { WebSocketService } from './web-socket.service';

import { EditionHistoryItem } from '@models/shared';
import { Team } from '@models/team';
import { COST_CENTER_TYPES, Transaction } from '@models/transaction';
import { User } from '@models/user';

export enum TRANSACTION_TYPES {
  RECEIPT = 'Ordem de Empenho',
  EXPENSE = 'Despesa',
}

@Injectable({
  providedIn: 'root',
})
export class TransactionService implements OnDestroy {
  private requested = false;
  private destroy$ = new Subject<void>();
  private transactions$ = new BehaviorSubject<Transaction[]>([]);
  private _isDataLoaded$ = new BehaviorSubject<boolean>(false);

  get isDataLoaded$(): Observable<boolean> {
    return this._isDataLoaded$.asObservable();
  }

  constructor(
    private contractService: ContractService,
    private http: HttpClient,
    private providerService: ProviderService,
    private teamService: TeamService,
    private userService: UserService,
    private wsService: WebSocketService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  saveTransaction(transaction: Transaction): void {
    const req = {
      transaction: transaction,
    };
    this.http.post('/api/transaction/', req).pipe(take(1)).subscribe();
  }

  saveManyTransaction(transactions: Transaction[]): void {
    const req = {
      transactions: transactions,
    };
    this.http.post('/api/transaction/many', req).pipe(take(1)).subscribe();
  }

  editTransaction(transaction: Transaction, editionHistoryItem: EditionHistoryItem): void {
    transaction.editionHistory.push(editionHistoryItem);
    const req = {
      transaction: transaction,
    };
    this.http.post('/api/transaction/update', req).pipe(take(1)).subscribe();
  }

  getTransactions(): Observable<Transaction[]> {
    if (!this.requested) {
      this.requested = true;
      this.http
        .post('/api/transaction/all', {})
        .pipe(take(1))
        .subscribe((transactions: any) => {
          const tmp = reviveDates(transactions);
          this.transactions$.next(tmp as Transaction[]);
          this._isDataLoaded$.next(true);
        });
      this.wsService
        .fromEvent('dbchange')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => handle(data, this.transactions$, 'transactions'));
    }
    return this.transactions$;
  }

  idToTransaction(id: string | Transaction): Transaction {
    if (isOfType(Transaction, id)) return id;
    const tmp = this.transactions$.getValue();
    return tmp[tmp.findIndex((el) => el._id === id)];
  }

  populate(transaction: Transaction): void {
    if (transaction.author) transaction.author = this.userService.idToUser(transaction.author);
    if (transaction.costCenter) {
      if (transaction.modelCostCenter === COST_CENTER_TYPES.USER)
        transaction.costCenter = this.userService.idToUser(transaction.costCenter as User | string);
      if (transaction.modelCostCenter === COST_CENTER_TYPES.TEAM)
        transaction.costCenter = this.teamService.idToTeam(transaction.costCenter as Team | string);
    }
    if (transaction.provider) transaction.provider = this.providerService.idToProvider(transaction.provider);
    if (transaction.contract) transaction.contract = this.contractService.idToContract(transaction.contract);
  }
}
