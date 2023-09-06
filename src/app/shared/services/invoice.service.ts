import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { cloneDeep } from 'lodash';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

import { numberToString } from '../string-utils';
import { handle, isOfType, reviveDates } from '../utils';
import { UserService } from './user.service';
import { WebSocketService } from './web-socket.service';

import { Invoice, InvoiceTeamMember } from '@models/invoice';
import { User } from '@models/user';

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
  private accumulated$ = new BehaviorSubject<number>(0);
  private invoices$ = new BehaviorSubject<Invoice[]>([]);
  private destroy$ = new Subject<void>();
  private _isDataLoaded$ = new BehaviorSubject<boolean>(false);

  get isDataLoaded$(): Observable<boolean> {
    return this._isDataLoaded$.asObservable();
  }

  constructor(private http: HttpClient, private userService: UserService, private wsService: WebSocketService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  saveInvoice(invoice: Invoice, callback?: (invoice: Invoice) => void): void {
    invoice = this.setDefaultDistribution(invoice);
    const req = {
      invoice: invoice,
    };
    this.http
      .post('/api/invoice/', req)
      .pipe(take(1))
      .subscribe((res: any) => {
        const savedInvoice = res['invoice'];
        if (callback && savedInvoice) callback(savedInvoice);
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
        .subscribe((invoices: any) => {
          const tmp = reviveDates(invoices);
          this.invoices$.next(tmp as Invoice[]);
          this._isDataLoaded$.next(true);
        });
      this.wsService
        .fromEvent('dbchange')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => handle(data, this.invoices$, 'invoices'));
    }

    return this.invoices$;
  }

  idToInvoice(id: string | Invoice): Invoice {
    if (isOfType(Invoice, id)) return id;
    const tmp = this.invoices$.getValue();
    return tmp[tmp.findIndex((el) => el._id === id)];
  }

  idToProfilePicture(iId: string | Invoice | undefined): string {
    if (iId === undefined) return '';
    const invoice = this.idToInvoice(iId);
    if (invoice.author === undefined) return '';
    const pic = this.userService.idToUser(invoice.author).profilePicture;
    if (pic === undefined) return '';
    return pic;
  }

  isInvoiceAuthor(iId: string | Invoice, uId: string | User): boolean {
    return this.userService.isEqual(uId, this.idToInvoice(iId).author);
  }

  isInvoiceMember(iId: string | Invoice, uId: string | User): boolean {
    const invoice = this.idToInvoice(iId);
    if (invoice.team) return invoice.team.filter((member) => this.userService.isEqual(member.user, uId)).length > 0;
    return false;
  }

  role(invoice: Invoice, user: User): string {
    if (this.isInvoiceAuthor(invoice._id, user._id)) return 'Gestor';
    if (this.isInvoiceMember(invoice._id, user._id)) return 'Equipe';
    return 'Nenhum';
  }

  setDefaultDistribution(invoice: Invoice): Invoice {
    const defaultDistribution = numberToString(100 / invoice.team.length, 20);

    const tmpInvoice = cloneDeep(invoice);
    tmpInvoice.team = invoice.team.map((member) => ({
      user: member.user,
      sector: member.sector,
      distribution: defaultDistribution,
      locals: {
        netValue: '',
        grossValue: '',
      },
    }));

    return tmpInvoice;
  }

  teamMembers(iInvoice: string | Invoice): User[] {
    return this.idToInvoice(iInvoice)
      .team.map((member: InvoiceTeamMember) => {
        return member.user ? this.userService.idToUser(member.user) : undefined;
      })
      .filter((user: User | undefined): user is User => user !== undefined);
  }

  currentYearInvoices(): Observable<number> {
    this.http
      .post('/api/invoice/currentYearInvoices', {})
      .pipe(take(1))
      .subscribe((numberJson: any) => {
        this.accumulated$.next(+numberJson['accumulated']);
      });
    return this.accumulated$;
  }
}
