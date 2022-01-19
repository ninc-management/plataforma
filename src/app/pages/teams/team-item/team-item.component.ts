import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { cloneDeep, uniq } from 'lodash';
import { BehaviorSubject, combineLatest, Observable, of, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { UserService } from 'app/shared/services/user.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { DepartmentService } from 'app/shared/services/department.service';
import { TeamService } from 'app/shared/services/team.service';
import { User } from '@models/user';
import { Team, TeamMember } from '@models/team';
import * as team_validation from 'app/shared/team-validation.json';

@Component({
  selector: 'ngx-team-item',
  templateUrl: './team-item.component.html',
  styleUrls: ['./team-item.component.scss'],
})
export class TeamItemComponent implements OnInit, OnDestroy {
  @Input() iTeam = new Team();
  validation = (team_validation as any).default;
  team: Team = new Team();
  editing = false;
  memberChanged$ = new BehaviorSubject<boolean>(true);
  private destroy$ = new Subject<void>();

  leaderSearch = '';
  memberSearch = '';
  currentMember = new TeamMember();
  availableUsers: Observable<User[]> = of([]);
  availableLeaders: Observable<User[]> = of([]);
  COORDINATIONS: string[] = [];
  USER_COORDINATIONS: string[] = [];

  constructor(
    private teamService: TeamService,
    public utils: UtilsService,
    public userService: UserService,
    public departamentService: DepartmentService
  ) {
    this.team.members = [] as TeamMember[];
  }

  ngOnInit(): void {
    if (this.iTeam._id !== undefined) {
      this.editing = true;
      this.team = cloneDeep(this.iTeam);
      this.leaderSearch = this.userService.idToName(this.team.leader);
    }
    this.availableUsers = combineLatest([this.userService.getUsers(), this.memberChanged$]).pipe(
      map(([users, _]) => {
        return users.filter((user) => {
          if (this.teamService.availableCoordinations(user).length == 0) return false;
          const isUserInTeam = this.userService.isUserInTeam(user, this.team.members);
          const hasTeamInCoordination = this.teamService.usedCoordinations(user).some((coordination) => {
            //a coordenacao do usuario é igual a alguma coordenacao do time?
            return this.COORDINATIONS.includes(coordination);
          });

          return !isUserInTeam && !hasTeamInCoordination && user.active;
        });
      })
    );

    this.availableLeaders = combineLatest([this.userService.getUsers(), this.memberChanged$]).pipe(
      map(([users, _]) => {
        return users.filter((user) => this.userService.isUserInTeam(user, this.team.members));
      })
    );

    this.memberChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.COORDINATIONS = uniq(this.team.members.map((member: TeamMember) => member.coordination));
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
    this.currentMember.coordination = '';
    this.currentMember.user = new User();
    this.memberChanged$.next(true);
  }

  handleLeader(index: number): void {
    if (this.userService.isEqual(this.team.leader, this.team.members[index].user)) {
      this.team.leader = new User();
      this.leaderSearch = '';
    }
  }

  updateUserCoordinations(): void {
    this.USER_COORDINATIONS = this.teamService.availableCoordinations(this.currentMember.user);
  }
}
