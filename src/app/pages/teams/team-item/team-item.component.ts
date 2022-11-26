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
  @Input() clonedTeam = new Team();
  @Input() isFormDirty = new BehaviorSubject<boolean>(false);
  @ViewChild('form') ngForm = {} as NgForm;
  validation = team_validation as any;
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

  constructor(public teamService: TeamService, public userService: UserService) {}

  ngOnInit(): void {
    if (this.clonedTeam._id !== undefined) {
      this.editing = true;
      this.leaderSearch = idToProperty(
        this.clonedTeam.leader,
        this.userService.idToUser.bind(this.userService),
        'name'
      );
    }
    this.availableUsers = combineLatest([this.userService.getUsers(), this.memberChanged$]).pipe(
      map(([users, _]) =>
        users.filter((user) => !this.userService.isUserInTeam(user, this.clonedTeam.members) && user.active)
      )
    );

    this.availableLeaders = combineLatest([this.userService.getUsers(), this.memberChanged$]).pipe(
      map(([users, _]) => users.filter((user) => this.userService.isUserInTeam(user, this.clonedTeam.members)))
    );

    this.memberChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.SECTORS = uniq(
        this.clonedTeam.members
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
      this.teamService.editTeam(this.clonedTeam);
    } else {
      this.teamService.saveTeam(this.clonedTeam);
    }
    this.isFormDirty.next(false);
  }

  addMember(): void {
    this.clonedTeam.members.push(cloneDeep(this.currentMember));
    this.memberSearch = '';
    this.currentMember.sectors = [];
    this.currentMember.user = new User();
    this.memberChanged$.next(true);
  }

  handleLeader(index: number): void {
    if (this.userService.isEqual(this.clonedTeam.leader, this.clonedTeam.members[index].user)) {
      this.clonedTeam.leader = new User();
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
    this.clonedTeam.sectors.push(newSector);
    this.options.sectorName = '';
    this.options.sectorAbrev = '';
  }
}
