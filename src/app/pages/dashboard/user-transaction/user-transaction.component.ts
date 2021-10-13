import { Component, Input, OnInit } from '@angular/core';
import { Team, TeamFinancialTransaction } from '@models/team';
import { User, UserFinancialTransaction } from '@models/user';
import { TeamService } from 'app/shared/services/team.service';
import { Observable, of } from 'rxjs';
import * as transaction_validation from 'app/shared/transaction-validation.json';
import { UserService } from 'app/shared/services/user.service';
import { take } from 'rxjs/operators';
import { cloneDeep } from 'lodash';

@Component({
  selector: 'ngx-user-transaction',
  templateUrl: './user-transaction.component.html',
  styleUrls: ['./user-transaction.component.scss'],
})
export class UserTransactionComponent implements OnInit {
  @Input() transactionIndex?: number;
  currentUser!: User;
  currentDestination!: Team;
  transaction = new UserFinancialTransaction();
  teamSearch = '';
  teamData: Observable<Team[]> = of([]);
  validation = (transaction_validation as any).default;

  constructor(private teamService: TeamService, private userService: UserService) {}

  ngOnInit(): void {
    this.userService.currentUser$.pipe(take(1)).subscribe((user) => {
      this.currentUser = user
      this.teamData = of(this.teamService.userToTeamsMembersFiltered(this.currentUser))
    })
  }

  registerTransaction(): void {
  }
}
