import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Expense } from '@models/expense';
import { parseISO } from 'date-fns';
import { Socket } from 'ngx-socket-io';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map, take, takeUntil } from 'rxjs/operators';
import { UtilsService } from './utils.service';
import { WebSocketService } from './web-socket.service';

@Injectable({
  providedIn: 'root',
})
export class NortanService implements OnDestroy {
  private requested = false;
  private destroy$ = new Subject<void>();
  private expenses$ = new BehaviorSubject<Expense[]>([]);

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

  saveExpense(expense: Expense): void {
    const req = {
      expense: expense,
    };
    this.http.post('/api/nortan/expense', req).pipe(take(1)).subscribe();
  }

  editExpense(expense: Expense): void {
    const req = {
      expense: expense,
    };
    this.http
      .post('/api/nortan/updateExpense', req)
      .pipe(take(1))
      .subscribe(() => {
        const tmp = this.expenses$.getValue();
        tmp[tmp.findIndex((el) => el._id === expense._id)] = expense;
        this.expenses$.next(tmp);
      });
  }

  getExpenses(): Observable<Expense[]> {
    if (!this.requested) {
      this.requested = true;
      this.http
        .post('/api/nortan/allExpenses', {})
        .pipe(take(1))
        .subscribe((expenses: any) => {
          const tmp = JSON.parse(JSON.stringify(expenses), (k, v) => {
            if (['created', 'lastUpdate', 'paidDate'].includes(k))
              return parseISO(v);
            return v;
          });
          this.expenses$.next(tmp as Expense[]);
        });
      this.socket
        .fromEvent('dbchange')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) =>
          this.wsService.handle(data, this.expenses$, 'expenses')
        );
    }
    return this.expenses$;
  }

  expensesSize(): Observable<number> {
    return this.getExpenses().pipe(map((expenses) => expenses.length));
  }
}
