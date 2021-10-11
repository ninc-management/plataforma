import { Component, Input, OnInit } from '@angular/core';
import { Team } from '@models/team';
import { User, UserFinancialTransaction } from '@models/user';
import { TeamService } from 'app/shared/services/team.service';
import { Observable, of } from 'rxjs';
import * as transaction_validation from 'app/shared/transaction-validation.json';

@Component({
  selector: 'ngx-user-transaction',
  templateUrl: './user-transaction.component.html',
  styleUrls: ['./user-transaction.component.scss'],
})
export class UserTransactionComponent implements OnInit {
  @Input() iTransaction = new UserFinancialTransaction();
  currentUser!: User;
  currentDestination!: Team;
  transaction = new UserFinancialTransaction();
  teamSearch = '';
  teamData: Observable<Team[]> = of([]);
  validation = (transaction_validation as any).default;

  constructor(private teamService: TeamService) {}

  ngOnInit(): void {
    this.teamData = this.teamService.getTeams();
  }

  registerTransaction(): void {}
}
