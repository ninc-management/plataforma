import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserService } from './user.service';
import { take } from 'rxjs/operators';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ContractService {
  private size$ = new BehaviorSubject<number>(0);
  private contracts$ = new BehaviorSubject<any[]>([]);

  constructor(private http: HttpClient, private userService: UserService) {}

  saveContract(invoice: any): void {
    const contract = {
      invoice: invoice._id,
      payments: [],
      status: 'Em andamento',
      version: '00',
    };
    const req = {
      contract: contract,
    };
    this.http
      .post('/api/contract/', req)
      .pipe(take(1))
      .subscribe((res: any) => {
        let tmp = this.contracts$.getValue();
        let savedContract = res.contract;
        savedContract.invoice = invoice;
        tmp.push(savedContract);
        this.contracts$.next(tmp);
      });
  }

  editContract(contract: any): void {
    let tmp = Object.assign({}, contract);
    delete tmp.invoice;
    tmp.invoice = contract.invoice._id;
    tmp.payments = tmp.payments.map((payment) => payment._id);
    const req = {
      contract: tmp,
    };
    this.http
      .post('/api/contract/update', req)
      .pipe(take(1))
      .subscribe(() => {
        let tmpArray = this.contracts$.getValue();
        tmpArray[
          tmpArray.findIndex((el) => el._id === contract._id)
        ] = contract;
        this.contracts$.next(tmpArray);
      });
  }

  getContracts(): Observable<any[]> {
    this.http
      .post('/api/contract/all', {})
      .pipe(take(1))
      .subscribe((contracts: any[]) => {
        this.contracts$.next(contracts);
      });
    return this.contracts$;
  }

  contractsSize(): Observable<number> {
    this.http
      .post('/api/contract/count', {})
      .pipe(take(1))
      .subscribe((numberJson) => {
        this.size$.next(+numberJson['size'] + 1);
      });
    return this.size$;
  }
}
