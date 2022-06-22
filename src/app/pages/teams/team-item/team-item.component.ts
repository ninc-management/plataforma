import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { cloneDeep, uniq } from 'lodash';
import { BehaviorSubject, combineLatest, Observable, of, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

import { TeamService } from 'app/shared/services/team.service';
import { UserService } from 'app/shared/services/user.service';
import { idToProperty, trackByIndex } from 'app/shared/utils';

import { Sector } from '@models/shared';
import { Team, TeamMember } from '@models/team';
import { User } from '@models/user';

import team_validation from 'app/shared/validators/team-validation.json';

@Component({
  selector: 'ngx-team-item',
  templateUrl: './team-item.component.html',
  styleUrls: ['./team-item.component.scss'],
})
export class TeamItemComponent implements OnInit, OnDestroy {
  @Input() iTeam = new Team();
  @Input() isFormDirty = new BehaviorSubject<boolean>(false);
  @ViewChild('form') ngForm = {} as NgForm;
  validation = team_validation as any;
  team: Team = new Team();
  editing = false;
  memberChanged$ = new BehaviorSubject<boolean>(true);
  private destroy$ = new Subject<void>();
  leaderSearch = '';
  memberSearch = '';
  currentMember = new TeamMember();
  availableUsers: Observable<User[]> = of([]);
  availableLeaders: Observable<User[]> = of([]);
  SECTORS: Sector[] = [];
  USER_SECTORS: Sector[] = [];
  options = { sectorName: '', sectorAbrev: '' };

  trackByIndex = trackByIndex;
  idToProperty = idToProperty;

  constructor(public teamService: TeamService, public userService: UserService) {
    this.team.members = [] as TeamMember[];
  }

  ngOnInit(): void {
    if (this.iTeam._id !== undefined) {
      this.editing = true;
      this.team = cloneDeep(this.iTeam);
      this.leaderSearch = idToProperty(this.team.leader, this.userService.idToUser.bind(this.userService), 'fullName');
    }
    this.availableUsers = combineLatest([this.userService.getUsers(), this.memberChanged$]).pipe(
      map(([users, _]) =>
        users.filter((user) => !this.userService.isUserInTeam(user, this.team.members) && user.active)
      )
    );

    this.availableLeaders = combineLatest([this.userService.getUsers(), this.memberChanged$]).pipe(
      map(([users, _]) => users.filter((user) => this.userService.isUserInTeam(user, this.team.members)))
    );

    this.memberChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.SECTORS = uniq(
        this.team.members
          .map((member: TeamMember) => member.sectors.map((sector) => this.teamService.idToSector(sector)))
          .flat()
      );
    });
  }

  ngAfterViewInit() {
    this.ngForm.statusChanges?.subscribe(() => {
      if (this.ngForm.dirty) this.isFormDirty.next(true);
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
    this.isFormDirty.next(false);
  }

  addMember(): void {
    console.log(cloneDeep(this.currentMember));
    this.team.members.push(cloneDeep(this.currentMember));
    this.memberSearch = '';
    this.currentMember.sectors = [];
    this.currentMember.user = new User();
    this.memberChanged$.next(true);
  }

  handleLeader(index: number): void {
    if (this.userService.isEqual(this.team.leader, this.team.members[index].user)) {
      this.team.leader = new User();
      this.leaderSearch = '';
    }
  }

  updateUserSectors(): void {
    if (this.currentMember.user) {
      const user = this.userService.idToUser(this.currentMember.user);
      this.USER_SECTORS = this.teamService.userToSectors(user);
    }
  }

  addSector(): void {
    const newSector = new Sector();
    newSector.name = this.options.sectorName;
    newSector.abrev = this.options.sectorAbrev;
    this.team.sectors.push(newSector);
    this.options.sectorName = '';
    this.options.sectorAbrev = '';
  }
}
