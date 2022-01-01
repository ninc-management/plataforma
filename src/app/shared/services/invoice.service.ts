import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserService } from './user.service';
import { ContractService } from './contract.service';
import { UtilsService } from './utils.service';
import { WebSocketService } from './web-socket.service';
import { take, takeUntil } from 'rxjs/operators';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { Socket } from 'ngx-socket-io';
import { Invoice } from '@models/invoice';
import { User } from '@models/user';
import { parseISO } from 'date-fns';
import { StringUtilService } from './string-util.service';
import { cloneDeep } from 'lodash';

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
    private utils: UtilsService,
    private stringUtil: StringUtilService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  saveInvoice(invoice: Invoice): void {
    invoice = this.setDefaultDistribution(invoice);
    const req = {
      invoice: invoice,
    };
    this.http
      .post('/api/invoice/', req)
      .pipe(take(1))
      .subscribe((res: any) => {
        const savedInvoice = res['invoice'];
        if (savedInvoice.status === INVOICE_STATOOS.FECHADO) this.contractService.saveContract(savedInvoice);
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
          const tmp = JSON.parse(JSON.stringify(invoices), (k, v) => {
            if (['created', 'lastUpdate'].includes(k)) return parseISO(v);
            return v;
          });
          this.invoices$.next(tmp as Invoice[]);
        });
      this.socket
        .fromEvent('dbchange')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => this.wsService.handle(data, this.invoices$, 'invoices'));
    }

    return this.invoices$;
  }

  invoicesSize(): Observable<number> {
    this.http
      .post('/api/invoice/count', {})
      .pipe(take(1))
      .subscribe((numberJson: any) => {
        this.size$.next(+numberJson['size'] + 1);
      });
    return this.size$;
  }

  idToInvoice(id: string | Invoice): Invoice {
    if (this.utils.isOfType<Invoice>(id, ['_id', 'author', 'department', 'coordination', 'code', 'type', 'contractor']))
      return id;
    const tmp = this.invoices$.getValue();
    return tmp[tmp.findIndex((el) => el._id === id)];
  }

  idToCode(id: string | Invoice | undefined): string {
    if (id === undefined) return '';
    return this.idToInvoice(id)?.code;
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
    const defaultDistribution = this.stringUtil.numberToString(100 / invoice.team.length, 20);

    const tmpInvoice = cloneDeep(invoice);
    tmpInvoice.team = invoice.team.map((member) => ({
      user: member.user,
      coordination: member.coordination,
      distribution: defaultDistribution,
      netValue: '',
      grossValue: '',
    }));

    return tmpInvoice;
  }
}
