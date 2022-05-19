import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { EditionHistoryItem } from '@models/shared';
import { InternalTransaction } from '@models/internalTransaction';
import { Socket } from 'ngx-socket-io';
import { BehaviorSubject, Observable, Subject, take, takeUntil } from 'rxjs';
import { WebSocketService } from './web-socket.service';
import { reviveDates } from '../utils';

@Injectable({
  providedIn: 'root',
})
export class InternalTransactionService implements OnDestroy {
  private requested = false;
  private destroy$ = new Subject<void>();
  private transactions$ = new BehaviorSubject<InternalTransaction[]>([]);

  constructor(private http: HttpClient, private wsService: WebSocketService, private socket: Socket) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  saveTransaction(transaction: InternalTransaction): void {
    const req = {
      transaction: transaction,
    };
    this.http.post('/api/transaction/internal/', req).pipe(take(1)).subscribe();
  }

  saveManyTransaction(transactions: InternalTransaction[]): void {
    const req = {
      transactions: transactions,
    };
    this.http.post('/api/transaction/internal/many', req).pipe(take(1)).subscribe();
  }

  editTransaction(transaction: InternalTransaction, editionHistoryItem: EditionHistoryItem): void {
    transaction.editionHistory.push(editionHistoryItem);
    const req = {
      transaction: transaction,
    };
    this.http.post('/api/transaction/internal/update', req).pipe(take(1)).subscribe();
  }

  getTransactions(): Observable<InternalTransaction[]> {
    if (!this.requested) {
      this.requested = true;
      this.http
        .post('/api/transaction/internal/all', {})
        .pipe(take(1))
        .subscribe((transactions: any) => {
          const tmp = reviveDates(transactions);
          this.transactions$.next(tmp as InternalTransaction[]);
        });
      this.socket
        .fromEvent('dbchange')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => this.wsService.handle(data, this.transactions$, 'internaltransactions'));
    }
    return this.transactions$;
  }
}
