import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserService } from './user.service';
import { take } from 'rxjs/operators';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  private size$ = new BehaviorSubject<number>(0);
  private invoices$ = new BehaviorSubject<any[]>([]);

  constructor(private http: HttpClient, private userService: UserService) {}

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
          let tmp = this.invoices$.getValue();
          let savedInvoice = res.invoice;
          savedInvoice.author = {
            fullName: user.fullName,
          };
          tmp.push(savedInvoice);
          this.invoices$.next(tmp);
        });
    });
  }

  editInvoice(invoice: any): void {
    let tmp = Object.assign({}, invoice);
    delete tmp.fullName;
    delete tmp.author.fullName;
    const req = {
      invoice: tmp,
    };
    this.http
      .post('/api/invoice/update', req)
      .pipe(take(1))
      .subscribe(() => {
        let tmpArray = this.invoices$.getValue();
        tmpArray[tmpArray.findIndex((el) => el._id === invoice._id)] = invoice;
        this.invoices$.next(tmpArray);
      });
  }

  getInvoices(): Observable<any[]> {
    this.http
      .post('/api/invoice/all', {})
      .pipe(take(1))
      .subscribe((invoices: any[]) => {
        this.invoices$.next(invoices);
      });
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
