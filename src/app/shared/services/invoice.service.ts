import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { cloneDeep, isEqualWith } from 'lodash';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

import { numberToString } from '../string-utils';
import { handle, isOfType, omitDeep, reviveDates } from '../utils';
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

  submittedToEdit$ = new Subject<void>();

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

  editInvoice(invoice: Invoice, callback?: () => void): void {
    const req = {
      invoice: invoice,
    };
    this.http
      .post('/api/invoice/update', req)
      .pipe(take(1))
      .subscribe(() => {
        if (callback) callback();
      });
    this.submittedToEdit$.next();
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

  isEqual(i1: string | Invoice | undefined, i2: string | Invoice | undefined): boolean {
    if (i1 == undefined || i2 == undefined) return false;
    if (typeof i1 !== 'string' && !i1.statusHistory) i1.statusHistory = [];
    if (typeof i2 !== 'string' && !i2.statusHistory) i2.statusHistory = [];
    i1 = omitDeep(this.idToInvoice(i1), ['locals', 'team._id']);
    i2 = omitDeep(this.idToInvoice(i2), ['locals', 'team._id']);
    return isEqualWith(i1, i2, (value, other, key) => {
      if (key == 'user') {
        return this.userService.isEqual(value, other);
      }
      return undefined;
    });
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
