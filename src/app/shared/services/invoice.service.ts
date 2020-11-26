import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserService } from './user.service';
import { ContractService } from './contract.service';
import { ContractorService } from './contractor.service';
import { WebSocketService } from './web-socket.service';
import { take, takeUntil } from 'rxjs/operators';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService implements OnDestroy {
  private size$ = new BehaviorSubject<number>(0);
  private invoices$ = new BehaviorSubject<any[]>([]);
  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private userService: UserService,
    private contractService: ContractService,
    private contractorService: ContractorService,
    private wsService: WebSocketService,
    private socket: Socket
  ) {
    this.contractorService.getContractors();
  }

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
    let tmp = Object.assign({}, invoice);
    delete tmp.author;
    tmp.author = invoice.author._id;
    const req = {
      invoice: tmp,
    };
    this.http.post('/api/invoice/update', req).pipe(take(1)).subscribe();
  }

  getInvoices(): Observable<any[]> {
    if (this.invoices$.getValue().length == 0) {
      this.http
        .post('/api/invoice/all', {})
        .pipe(take(1))
        .subscribe((invoices: any[]) => {
          this.invoices$.next(invoices);
        });
      this.socket
        .fromEvent('invoices')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data) => this.wsService.handle(data, this.invoices$));
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
}
