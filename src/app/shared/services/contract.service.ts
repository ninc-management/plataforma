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

  saveContract(contract: any): void {
    this.userService.currentUser$.pipe(take(1)).subscribe((user) => {
      contract.author = user._id;
      const req = {
        contract: contract,
      };
      this.http
        .post('/api/contract/', req)
        .pipe(take(1))
        .subscribe(() => {
          let tmp = this.contracts$.getValue();
          contract.author = {
            fullName: user.fullName,
          };
          tmp.push(contract);
          this.contracts$.next(tmp);
        });
    });
  }

  editContract(contract: any): void {
    let tmp = Object.assign({}, contract);
    delete tmp.fullName;
    delete tmp.author.fullName;
    const req = {
      contract: tmp,
    };
    this.http
      .post('/api/contract/update', req)
      .pipe(take(1))
      .subscribe(() => {
        let tmpArray = this.contracts$.getValue();
        tmpArray[
          tmpArray.findIndex((el) => el.code === contract.code)
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
