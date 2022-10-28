import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { take } from 'rxjs/operators';

import { TeamService } from 'app/shared/services/team.service';
import { UserService } from 'app/shared/services/user.service';

import { Team } from '@models/team';
import { User, UserFinancialTransaction } from '@models/user';

import transaction_validation from 'app/shared/validators/transaction-validation.json';

@Component({
  selector: 'ngx-user-transaction',
  templateUrl: './user-transaction.component.html',
  styleUrls: ['./user-transaction.component.scss'],
})
export class UserTransactionComponent implements OnInit {
  @Input() transactionIndex?: number;
  @Input() isFormDirty = new BehaviorSubject<boolean>(false);
  @ViewChild('form') ngForm = {} as NgForm;
  currentUser!: User;
  currentDestination!: Team;
  transaction = new UserFinancialTransaction();
  teamSearch = '';
  teamData: Observable<Team[]> = of([]);
  validation = transaction_validation as any;

  constructor(private teamService: TeamService, private userService: UserService) {}

  ngOnInit(): void {
    this.userService.currentUser$.pipe(take(1)).subscribe((user) => {
      this.currentUser = user;
      this.teamData = of(this.teamService.userToTeamsMembersFiltered(this.currentUser));
    });
  }

  ngAfterViewInit() {
    this.ngForm.statusChanges?.subscribe(() => {
      if (this.ngForm.dirty) this.isFormDirty.next(true);
    });
  }

  registerTransaction(): void {
    // TODO: [NWS-1169] Avaliar movimentação usuário para time
    // const teamTransaction = new TeamFinancialTransaction();
    // teamTransaction.from = this.currentUser;
    // teamTransaction.to = this.currentDestination;
    // teamTransaction.description = this.transaction.description;
    // teamTransaction.value = this.transaction.value;
    // this.currentDestination.transactions.push(cloneDeep(teamTransaction));
    // this.isFormDirty.next(false);
    // this.teamService.editTeam(this.currentDestination);
  }
}
