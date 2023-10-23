import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, take, takeUntil } from 'rxjs';

import { handle, isOfType, reviveDates } from '../utils';
import { WebSocketService } from './web-socket.service';

import { Contract } from '@models/contract';
import { Provider } from '@models/provider';
import { EditionHistoryItem } from '@models/shared/editionHistoryItem';
import { Team } from '@models/team';
import { COST_CENTER_TYPES, Transaction } from '@models/transaction';
import { User } from '@models/user';

export enum TRANSACTION_TYPES {
  RECEIPT = 'Ordem de Empenho',
  EXPENSE = 'Despesa',
}

export interface SaveTransactionResponse {
  message: string;
  transaction: Transaction;
}

@Injectable({
  providedIn: 'root',
})
export class TransactionService implements OnDestroy {
  private requested = false;
  private destroy$ = new Subject<void>();
  private transactions$ = new BehaviorSubject<Transaction[]>([]);
  private _isDataLoaded$ = new BehaviorSubject<boolean>(false);
  private _edited$ = new Subject<void>();

  get edited$(): Observable<void> {
    return this._edited$.asObservable();
  }
  get isDataLoaded$(): Observable<boolean> {
    return this._isDataLoaded$.asObservable();
  }

  constructor(private http: HttpClient, private wsService: WebSocketService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  saveTransaction(transaction: Transaction, callback?: (savedTransaction: Transaction) => void): void {
    const req = {
      transaction: transaction,
    };

    this.http
      .post<SaveTransactionResponse>('/api/transaction/', req)
      .pipe(take(1))
      .subscribe((obj) => {
        if (callback && obj.transaction) callback(obj.transaction);
      });
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
        .subscribe((data: any) => handle(data, this.transactions$, 'transactions', undefined, this._edited$));
    }
    return this.transactions$;
  }

  idToTransaction(id: string | Transaction): Transaction {
    if (isOfType(Transaction, id)) return id;
    const tmp = this.transactions$.getValue();
    return tmp[tmp.findIndex((el) => el._id === id)];
  }

  populateCostCenter(
    transaction: Transaction,
    teamRevival: (...arg: any) => Team,
    userRevival: (...arg: any) => User
  ): User | Team {
    let costCenter: User | Team = new User();
    if (transaction.costCenter) {
      if (transaction.modelCostCenter === COST_CENTER_TYPES.USER)
        costCenter = userRevival(transaction.costCenter as User | string);
      if (transaction.modelCostCenter === COST_CENTER_TYPES.TEAM)
        costCenter = teamRevival(transaction.costCenter as Team | string);
      transaction.costCenter = costCenter;
    }
    return costCenter;
  }

  populate(
    transaction: Transaction,
    contractRevival: (...arg: any) => Contract,
    providerRevival: (...arg: any) => Provider,
    teamRevival: (...arg: any) => Team,
    userRevival: (...arg: any) => User
  ): void {
    if (transaction.author) transaction.author = userRevival(transaction.author);
    this.populateCostCenter(transaction, teamRevival, userRevival);
    if (transaction.provider) transaction.provider = providerRevival(transaction.provider);
    if (transaction.contract) transaction.contract = contractRevival(transaction.contract);
  }

  loadedTransactionsCount(): number {
    return this.transactions$.getValue().length;
  }
}
