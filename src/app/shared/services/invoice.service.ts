import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserService } from './user.service';
import { ContractService } from './contract.service';
import { ContractorService } from './contractor.service';
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
        .subscribe((data) => this.watchHandler(data));
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

  watchHandler(data: any): void {
    if (data == {}) return;
    switch (data.operationType) {
      case 'update': {
        let tmpArray = this.invoices$.getValue();
        let idx = tmpArray.findIndex((el) => el._id === data.documentKey._id);
        if (data.updateDescription.updatedFields)
          tmpArray[idx] = Object.assign(
            tmpArray[idx],
            data.updateDescription.updatedFields
          );
        if (data.updateDescription.removedFields.length > 0)
          for (const f of data.updateDescription.removedFields)
            delete tmpArray[idx][f];
        this.invoices$.next(tmpArray);
        break;
      }

      case 'insert': {
        let tmpArray = this.invoices$.getValue();
        tmpArray.push(data.fullDocument);
        this.invoices$.next(tmpArray);
        break;
      }

      default: {
        console.log('Caso não tratado!', data);
        break;
      }
    }
  }
}
