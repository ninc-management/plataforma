import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserService } from './user.service';
import { ContractService } from './contract.service';
import { WebSocketService } from './web-socket.service';
import { OnedriveService } from './onedrive.service';
import { take, takeUntil } from 'rxjs/operators';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { Socket } from 'ngx-socket-io';
import { INVOICE_STATOOS } from 'app/pages/invoices/invoice-item/invoice-item.component';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService implements OnDestroy {
  private requested = false;
  private size$ = new BehaviorSubject<number>(0);
  private invoices$ = new BehaviorSubject<any[]>([]);
  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private userService: UserService,
    private contractService: ContractService,
    private onedrive: OnedriveService,
    private wsService: WebSocketService,
    private socket: Socket
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  saveInvoice(invoice: any): void {
    const req = {
      invoice: invoice,
    };
    this.http
      .post('/api/invoice/', req)
      .pipe(take(1))
      .subscribe((res: any) => {
        const savedInvoice = res.invoice;
        if (savedInvoice.status === INVOICE_STATOOS.FECHADO)
          this.contractService.saveContract(savedInvoice);
      });
  }

  editInvoice(invoice: any): void {
    const req = {
      invoice: invoice,
    };
    this.http.post('/api/invoice/update', req).pipe(take(1)).subscribe();
  }

  getInvoices(): Observable<any[]> {
    if (!this.requested) {
      this.requested = true;
      this.http
        .post('/api/invoice/all', {})
        .pipe(take(1))
        .subscribe((invoices: any[]) => {
          this.invoices$.next(invoices);
        });
      this.socket
        .fromEvent('dbchange')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data) =>
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

  idToInvoice(id: string | 'object'): any {
    if (typeof id == 'object') return id;
    if (id === undefined) return undefined;
    const tmp = this.invoices$.getValue();
    return tmp[tmp.findIndex((el) => el._id === id)];
  }

  isInvoiceAuthor(iId: string | 'object', uId: string | 'object'): boolean {
    const author = this.idToInvoice(iId).author;
    return this.userService.idToUser(uId)._id == author._id;
  }

  isInvoiceMember(iId: string | 'object', uId: string | 'object'): boolean {
    const invoice = this.idToInvoice(iId);
    return invoice.team.filter(
      (member) =>
        this.userService.idToUser(member.user)._id ==
        this.userService.idToUser(uId)._id
    ).length > 0
      ? true
      : false;
  }

  role(invoice: any, user: any): string {
    if (this.isInvoiceAuthor(invoice._id, user._id)) return 'Gestor';
    if (this.isInvoiceMember(invoice._id, user._id)) return 'Equipe';
    return 'Nenhum';
  }
}
