import { Component, Input, OnInit } from '@angular/core';
import { cloneDeep } from 'lodash';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserService } from 'app/shared/services/user.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { DepartmentService } from 'app/shared/services/department.service';
import { TeamService } from 'app/shared/services/team.service';
import { User } from '@models/user';
import { Team } from '@models/team';
import * as team_validation from 'app/shared/team-validation.json';

@Component({
  selector: 'ngx-team-item',
  templateUrl: './team-item.component.html',
  styleUrls: ['./team-item.component.scss'],
})
export class TeamItemComponent implements OnInit {
  @Input() iTeam = new Team();
  validation = (team_validation as any).default;
  team: Team = new Team();
  editing = false;
  memberChanged$ = new BehaviorSubject<boolean>(true);

  leaderSearch = '';
  memberSearch = '';
  currentMember = new User();
  availableUsers: Observable<User[]> = of([]);
  avaliableLeaders: Observable<User[]> = of([]);
  COORDINATIONS: string[] = [];

  constructor(
    private teamService: TeamService,
    public utils: UtilsService,
    public userService: UserService,
    public departamentService: DepartmentService
  ) {
    this.team.members = [] as User[];
  }

  ngOnInit(): void {
    if (this.iTeam._id !== undefined) {
      this.editing = true;
      this.team = cloneDeep(this.iTeam);
      this.leaderSearch = this.userService.idToName(this.team.leader);
    }
    this.availableUsers = combineLatest([
      this.userService.getUsers(),
      this.memberChanged$,
    ]).pipe(
      map(([users, _]) => {
        return users.filter((user) => {
          return this.team.members.find((member: User | string | undefined) =>
            this.userService.isEqual(user, member)
          ) === undefined
            ? true
            : false;
        });
      })
    );

    this.avaliableLeaders = combineLatest([
      this.userService.getUsers(),
      this.memberChanged$,
    ]).pipe(
      map(([users, _]) => {
        return users.filter((user) => {
          return this.team.members.find((member: User | string | undefined) =>
            this.userService.isEqual(user, member)
          ) === undefined
            ? false
            : true;
        });
      })
    );

    this.COORDINATIONS = this.departamentService.buildAllCoordinationsList();
  }

  createOrUpdate(): void {
    if (this.editing) {
      this.teamService.editTeam(this.team);
    } else {
      this.teamService.saveTeam(this.team);
    }
  }

  addMember(): void {
    this.team.members.push(cloneDeep(this.currentMember));
    this.memberSearch = '';
    this.currentMember = new User();
    this.memberChanged$.next(true);
  }

  handleLeader(index: number): void {
    if (this.userService.isEqual(this.team.leader, this.team.members[index])) {
      this.team.leader = new User();
      this.leaderSearch = '';
    }
  }
}
