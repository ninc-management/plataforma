import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserService } from './user.service';
import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ContractService {
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
}
