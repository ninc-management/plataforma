import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserService } from './user.service';
import { ContractService } from './contract.service';
import { ContractorService } from './contractor.service';
import { UtilsService } from './utils.service';
import { WebSocketService } from './web-socket.service';
import { take, takeUntil } from 'rxjs/operators';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { Socket } from 'ngx-socket-io';

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
    private utils: UtilsService,
    private wsService: WebSocketService,
    private socket: Socket
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  saveInvoice(invoice: any): void {
    this.userService.currentUser$.pipe(take(1)).subscribe((user) => {
      invoice.author = user._id;
      const req = {
        invoice: invoice,
      };
      this.http
        .post('/api/invoice/', req)
        .pipe(take(1))
        .subscribe((res: any) => {
          const savedInvoice = res.invoice;
          if (savedInvoice.status === 'Fechado')
            this.contractService.saveContract(savedInvoice);
        });
    });
  }

  editInvoice(invoice: any): void {
    let tmp = this.utils.deepCopy(invoice);
    delete tmp.author;
    tmp.author = invoice.author._id;
    const req = {
      invoice: tmp,
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

  idToInvoice(id: string): any {
    if (id === undefined) return undefined;
    const tmp = this.invoices$.getValue();
    return tmp[tmp.findIndex((el) => el._id === id)];
  }

  isInvoiceAuthor(iId: any, uId: string): boolean {
    const author =
      iId._id == undefined ? this.idToInvoice(iId).author : iId.author;
    return (author?._id == undefined ? author : author._id) == uId;
  }

  isInvoiceMember(iId: any, uId: string): boolean {
    const invoice = iId._id == undefined ? this.idToInvoice(iId) : iId;
    return invoice.team.filter(
      (member) =>
        (member.user?._id == undefined ? member.user : member.user._id) == uId
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
