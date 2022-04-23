import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { EditionHistoryItem } from '@models/shared';
import { Transaction } from '@models/transaction';
import { parseISO } from 'date-fns';
import { Socket } from 'ngx-socket-io';
import { BehaviorSubject, Observable, Subject, take, takeUntil } from 'rxjs';
import { UtilsService } from './utils.service';
import { WebSocketService } from './web-socket.service';

@Injectable({
  providedIn: 'root',
})
export class TransactionService implements OnDestroy {
  private requested = false;
  private destroy$ = new Subject<void>();
  private transactions$ = new BehaviorSubject<Transaction[]>([]);

  constructor(
    private http: HttpClient,
    private wsService: WebSocketService,
    private socket: Socket,
    private utils: UtilsService
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
          const tmp = JSON.parse(JSON.stringify(transactions), (k, v) => {
            if (['created', 'lastUpdate', 'paidDate', 'date'].includes(k)) return parseISO(v);
            return v;
          });
          this.transactions$.next(tmp as Transaction[]);
        });
      this.socket
        .fromEvent('dbchange')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => this.wsService.handle(data, this.transactions$, 'transactions'));
    }
    return this.transactions$;
  }
}