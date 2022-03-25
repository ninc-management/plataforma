import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { cloneDeep } from 'lodash';
import { StringUtilService } from './string-util.service';
import { UserService } from './user.service';
import { UtilsService } from './utils.service';
import { WebSocketService } from './web-socket.service';
import { Sector } from '@models/shared';
import { Team } from '@models/team';
import { User } from '@models/user';
import { parseISO } from 'date-fns';

@Injectable({
  providedIn: 'root',
})
export class TeamService implements OnDestroy {
  private requested = false;
  private destroy$ = new Subject<void>();
  private teams$ = new BehaviorSubject<Team[]>([]);

  constructor(
    private http: HttpClient,
    private wsService: WebSocketService,
    private userService: UserService,
    private stringUtil: StringUtilService,
    private socket: Socket,
    private utils: UtilsService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  saveTeam(team: Team): void {
    const req = {
      team: team,
    };
    this.http.post('/api/team/', req).pipe(take(1)).subscribe();
  }

  editTeam(team: Team, creatingExpense = false): void {
    const req = {
      team: team,
      creatingExpense: creatingExpense,
    };
    this.http.post('/api/team/update', req).pipe(take(1)).subscribe();
  }

  getTeams(): Observable<Team[]> {
    if (!this.requested) {
      this.requested = true;
      this.http
        .post('/api/team/all', {})
        .pipe(take(1))
        .subscribe((teams: any) => {
          const tmp = JSON.parse(JSON.stringify(teams), (k, v) => {
            if (['created', 'lastUpdate', 'paidDate'].includes(k)) return parseISO(v);
            return v;
          });
          this.keepUpdatingBalance();
          this.teams$.next(tmp as Team[]);
        });
      this.socket
        .fromEvent('dbchange')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => this.wsService.handle(data, this.teams$, 'teams'));
    }
    return this.teams$;
  }

  idToName(id: string | Team | undefined): string {
    if (!id) return '';
    return this.idToTeam(id).name;
  }

  idToAbbreviation(id: string | Team | undefined): string {
    if (!id) return '';
    return this.idToTeam(id).abrev;
  }

  idToComposedName(id: string | Team | undefined): string {
    if (!id) return '';
    return this.idToTeam(id).abrev + ' - ' + this.idToTeam(id).name;
  }

  idToSectorComposedName(id: string | Sector | undefined): string {
    if (!id) return '';
    return this.idToSector(id).abrev + ' - ' + this.idToSector(id).name;
  }

  idToTeam(id: string | Team): Team {
    if (this.utils.isOfType<Team>(id, ['_id', 'name', 'members', 'config'])) return id;
    const tmp = this.teams$.getValue();
    return tmp[tmp.findIndex((el) => el._id === id)];
  }

  idToSector(id: string | Sector | undefined): Sector {
    if (!id) return new Sector();
    if (this.utils.isOfType<Sector>(id, ['_id', 'name', 'abrev'])) return id;
    const tmp = this.sectorsListAll().find((sector) => sector._id == id);
    if (tmp) return tmp;
    return new Sector();
  }

  isMember(uId: string | User | undefined, teamId: string | Team): boolean {
    if (uId == undefined) return false;
    return this.idToTeam(teamId).members.find((member) => this.userService.isEqual(member.user, uId)) == undefined
      ? false
      : true;
  }

  userToTeams(uId: string | User | undefined): Team[] {
    if (uId == undefined) return [];
    return this.teams$.getValue().filter((team) => this.isMember(uId, team));
  }

  userToTeamsMembersFiltered(uId: string | User | undefined): Team[] {
    if (uId == undefined) return [];
    return cloneDeep(this.userToTeams(uId)).map((team) => {
      team.members = team.members.filter((member) => this.userService.isEqual(member.user, uId));
      return team;
    });
  }

  keepUpdatingBalance(): void {
    this.teams$.pipe(takeUntil(this.destroy$)).subscribe((teams) => {
      teams.map((team) => {
        team.balance = this.stringUtil.numberToMoney(
          team.transactions.reduce((accumulator, t) => (accumulator += this.stringUtil.moneyToNumber(t.value)), 0)
        );
        return team;
      });
    });
  }

  teamsList(): string[] {
    const teams = this.teams$.getValue();
    return teams.map((team) => team.abrev + ' - ' + team.name);
  }

  sectorsListAll(): Sector[] {
    const teams = this.teams$.getValue();
    const sectors = teams.map((team) => team.config.sectors);
    return sectors.flat().sort((a, b) => {
      return this.utils.nameSort(1, a.name, b.name);
    });
  }

  sectorsList(teamAbrev: string): Sector[] {
    const team = this.teams$.getValue().find((team) => team.abrev == teamAbrev);
    return team ? team.config.sectors : [];
  }

  extractAbreviation(composedName: string): string {
    return composedName.split(' ')[0];
  }

  isSectorEqual(s1: string | Sector | undefined, s2: string | Sector | undefined): boolean {
    if (s1 == undefined || s2 == undefined) return false;
    return this.idToSector(s1)._id == this.idToSector(s2)._id;
  }

  isTeamEqual(s1: string | Team | undefined, s2: string | Team | undefined): boolean {
    if (s1 == undefined || s2 == undefined) return false;
    return this.idToTeam(s1)._id == this.idToTeam(s2)._id;
  }

  userToSectors(user: User | string | undefined): Sector[] {
    if (!user) return [];
    if (this.utils.isOfType<User>(user, ['fullName', 'sectors', 'position']) && !user._id) return [];
    return this.userService.idToUser(user).sectors.map((sector) => this.idToSector(sector));
  }
}
