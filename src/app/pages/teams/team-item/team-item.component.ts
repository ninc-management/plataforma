import { Component, Input, OnInit } from '@angular/core';
import { UserService } from 'app/shared/services/user.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { DepartmentService } from 'app/shared/services/department.service';
import { CompleterData, CompleterService } from 'ng2-completer';
import { cloneDeep } from 'lodash';
import { User } from '@models/user';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import * as team_validation from 'app/shared/team-validation.json';

@Component({
  selector: 'ngx-team-item',
  templateUrl: './team-item.component.html',
  styleUrls: ['./team-item.component.scss'],
})
export class TeamItemComponent implements OnInit {
  @Input() teamIndex?: number;
  validation = (team_validation as any).default;
  team: any = {};
  memberChanged$ = new BehaviorSubject<boolean>(true);

  leaderSearch = '';
  memberSearch = '';
  currentMember = new User();
  availableUsers: CompleterData = this.completerService.local([]);
  avaliableLeaders: CompleterData = this.completerService.local([]);
  COORDINATIONS: string[] = [];

  constructor(
    private completerService: CompleterService,
    public utils: UtilsService,
    public userService: UserService,
    public departamentService: DepartmentService
  ) {
    this.team.members = [] as User[];
  }

  ngOnInit(): void {
    this.availableUsers = this.completerService
      .local(
        combineLatest([this.userService.getUsers(), this.memberChanged$]).pipe(
          map(([users, _]) => {
            return users.filter((user) => {
              return this.team.members.find((member: User) =>
                this.userService.isEqual(user, member)
              ) === undefined
                ? true
                : false;
            });
          })
        ),
        'fullName',
        'fullName'
      )
      .imageField('profilePicture');

    this.avaliableLeaders = this.completerService
      .local(
        combineLatest([this.userService.getUsers(), this.memberChanged$]).pipe(
          map(([users, _]) => {
            return users.filter((user) => {
              return this.team.members.find((member: User) =>
                this.userService.isEqual(user, member)
              ) === undefined
                ? false
                : true;
            });
          })
        ),
        'fullName',
        'fullName'
      )
      .imageField('profilePicture');

    this.COORDINATIONS = this.departamentService.buildAllCoordinationsList();
  }

  createOrUpdate(): void {}

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
