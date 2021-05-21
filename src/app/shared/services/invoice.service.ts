import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserService } from './user.service';
import { ContractService } from './contract.service';
import { UtilsService } from './utils.service';
import { WebSocketService } from './web-socket.service';
import { take, takeUntil } from 'rxjs/operators';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { Socket } from 'ngx-socket-io';
import { Invoice } from '../../../../backend/src/models/invoice';
import { User } from '../../../../backend/src/models/user';

export enum INVOICE_STATOOS {
  EM_ANALISE = 'Em análise',
  FECHADO = 'Fechado',
  NEGADO = 'Negado',
  INVALIDADO = 'Invalidado',
}

@Injectable({
  providedIn: 'root',
})
export class InvoiceService implements OnDestroy {
  private requested = false;
  private size$ = new BehaviorSubject<number>(0);
  private invoices$ = new BehaviorSubject<Invoice[]>([]);
  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private userService: UserService,
    private contractService: ContractService,
    private wsService: WebSocketService,
    private socket: Socket,
    private utils: UtilsService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  saveInvoice(invoice: Invoice): void {
    const req = {
      invoice: invoice,
    };
    this.http
      .post('/api/invoice/', req)
      .pipe(take(1))
      .subscribe((res: 'object') => {
        const savedInvoice = res['invoice'];
        if (savedInvoice.status === INVOICE_STATOOS.FECHADO)
          this.contractService.saveContract(savedInvoice);
      });
  }

  editInvoice(invoice: Invoice): void {
    const req = {
      invoice: invoice,
    };
    this.http.post('/api/invoice/update', req).pipe(take(1)).subscribe();
  }

  getInvoices(): Observable<Invoice[]> {
    if (!this.requested) {
      this.requested = true;
      this.http
        .post('/api/invoice/all', {})
        .pipe(take(1))
        .subscribe((invoices: Invoice[]) => {
          this.invoices$.next(invoices);
        });
      this.socket
        .fromEvent('dbchange')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: 'object') =>
          this.wsService.handle(data, this.invoices$, 'invoices')
        );
    }

    return this.invoices$;
  }

  invoicesSize(): Observable<number> {
    this.http
      .post('/api/invoice/count', {})
      .pipe(take(1))
      .subscribe((numberJson) => {
        this.size$.next(+numberJson['size'] + 1);
      });
    return this.size$;
  }

  idToInvoice(id: string | Invoice): Invoice {
    if (
      this.utils.isOfType<Invoice>(id, [
        '_id',
        'author',
        'department',
        'coordination',
        'code',
        'type',
        'contractor',
      ])
    )
      return id;
    if (id === undefined) return undefined;
    const tmp = this.invoices$.getValue();
    return tmp[tmp.findIndex((el) => el._id === id)];
  }

  isInvoiceAuthor(iId: string | Invoice, uId: string | User): boolean {
    return (
      this.userService.idToUser(uId)._id ==
      this.userService.idToUser(this.idToInvoice(iId).author)._id
    );
  }

  isInvoiceMember(iId: string | Invoice, uId: string | User): boolean {
    const invoice = this.idToInvoice(iId);
    return invoice.team.filter(
      (member) =>
        this.userService.idToUser(member.user)._id ==
        this.userService.idToUser(uId)._id
    ).length > 0
      ? true
      : false;
  }

  role(invoice: Invoice, user: User): string {
    if (this.isInvoiceAuthor(invoice._id, user._id)) return 'Gestor';
    if (this.isInvoiceMember(invoice._id, user._id)) return 'Equipe';
    return 'Nenhum';
  }
}
