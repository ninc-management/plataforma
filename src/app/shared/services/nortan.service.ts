import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Expense } from '@models/expense';
import { parseISO } from 'date-fns';
import { Socket } from 'ngx-socket-io';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map, take, takeUntil } from 'rxjs/operators';
import { UtilsService } from './utils.service';
import { WebSocketService } from './web-socket.service';

export enum NORTAN_EXPENSE_TYPES {
  DIVISAO_DE_LUCRO = 'Divisão de lucro',
  FOLHA_DE_PAGAMENTO = 'Folha de pagamento',
  REEMBOLSO = 'Reembolso',
  INVESTIMENTOS_PATRIMONIO = 'Investimentos/patrimônio',
  ADIANTAMENTO_EMPRESTIMOS = 'Adiantamento/empréstimos',
  DESPESAS = 'Despesas',
  CUSTO_OPERACIONAL = 'Custo operacional',
  GASTOS_FIXOS = 'Gastos fixos',
  IMPOSTOS = 'Impostos',
  RECEITA = 'Receita',
}

export enum NORTAN_FIXED_EXPENSE_TYPES {
  ALUGUEL = 'Aluguel',
  INTERNET = 'Internet',
  ENERGIA = 'Energia',
  MARKETING = 'Marketing',
  ADMINISTRATIVO = 'Administrativo',
  OUTROS = 'Outros',
}

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
    private socket: Socket
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
    this.http.post('/api/nortan/updateExpense', req).pipe(take(1)).subscribe();
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
