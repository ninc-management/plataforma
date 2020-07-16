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

  constructor(private http: HttpClient, private userService: UserService) {}

  saveContract(contract: any): void {
    this.userService.currentUser$.pipe(take(1)).subscribe((user) => {
      contract.author = user._id;
      const req = {
        contract: contract,
      };
      this.http.post('/api/contract/', req).pipe(take(1)).subscribe();
    });
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
