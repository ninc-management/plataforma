import { Injectable } from '@angular/core';
import { cloneDeep } from 'lodash';
import { Observable, of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { StringUtilService } from './string-util.service';
import { TeamService } from './team.service';
import { UserService } from './user.service';
import { User } from '@models/user';

@Injectable({
  providedIn: 'root',
})
export class FinancialService {
  constructor(
    private userService: UserService,
    private stringUtil: StringUtilService,
    private teamService: TeamService
  ) {}

  userBalance(uId: string | User | undefined): Observable<string> {
    if (uId == undefined) return of('0,00');

    return this.teamService.getTeams().pipe(
      map((teams) => {
        const userTransactionsSum = this.userService
          .idToUser(uId)
          .transactions.reduce((sum, transaction) => (sum = this.stringUtil.sumMoney(sum, transaction.value)), '0,00');

        const allTeams = cloneDeep(teams);

        const userTeamTransactionsSum = allTeams
          .map((team) => team.transactions.filter((transaction) => this.userService.isEqual(transaction.from, uId)))
          .flat()
          .reduce((sum, transaction) => (sum = this.stringUtil.sumMoney(sum, transaction.value)), '0,00');
        return this.stringUtil.subtractMoney(userTransactionsSum, userTeamTransactionsSum);
      }, take(1))
    );
  }
}
