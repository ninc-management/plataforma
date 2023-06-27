import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { cloneDeep } from 'lodash';
import { BehaviorSubject, combineLatest, lastValueFrom, Observable, Subject } from 'rxjs';
import { map, skipWhile, take, takeUntil } from 'rxjs/operators';

import { handle, isOfType, nameSort, reviveDates } from '../utils';
import { StringUtilService } from './string-util.service';
import { TransactionService } from './transaction.service';
import { UserService } from './user.service';
import { WebSocketService } from './web-socket.service';

import { Sector, SectorLocals } from '@models/shared/sector';
import { Team, TeamConfig, TeamLocals } from '@models/team';
import { User } from '@models/user';

export const CLIENT: Team = {
  _id: '000000000000000000000000',
  name: 'Cliente',
  members: [],
  created: new Date('May 11, 2023'),
  purpose: 'Time para representar o cliente',
  expenses: [],
  receipts: [],
  config: new TeamConfig(),
  abrev: 'Cliente',
  isOrganizationTeam: false,
  sectors: [],
  overrideSupportPercentages: false,
  overrideIntermediationPercentages: false,
  locals: {
    balance: '0,00',
    leaderName: '',
  },
};

@Injectable({
  providedIn: 'root',
})
export class TeamService implements OnDestroy {
  private requested = false;
  private destroy$ = new Subject<void>();
  private teams$ = new BehaviorSubject<Team[]>([]);
  private _isDataLoaded$ = new BehaviorSubject<boolean>(false);

  get isDataLoaded$(): Observable<boolean> {
    return this._isDataLoaded$.asObservable();
  }
  constructor(
    private http: HttpClient,
    private wsService: WebSocketService,
    private userService: UserService,
    private stringUtil: StringUtilService,
    private transactionService: TransactionService
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

  editTeam(team: Team): void {
    const req = {
      team: team,
    };
    this.http.post('/api/team/update', req).pipe(take(1)).subscribe();
  }

  getTeams(): Observable<Team[]> {
    if (!this.requested) {
      this.requested = true;
      this.http
        .post('/api/team/all', {})
        .pipe(take(1))
        .subscribe(async (teams: any) => {
          let teamsFromDatabase = reviveDates(teams);
          teamsFromDatabase = await this.updateBalance(teamsFromDatabase);
          this.teams$.next(teamsFromDatabase);
          this._isDataLoaded$.next(true);
        });
      this.wsService
        .fromEvent('dbchange')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => handle(data, this.teams$, 'teams', this.updateBalance.bind(this)));
    }
    return this.teams$;
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
    if (isOfType(Team, id)) return id;
    if (id == CLIENT._id) return CLIENT as Team;
    const tmp = this.teams$.getValue();
    return tmp[tmp.findIndex((el) => el._id === id)];
  }

  idToSector(id: string | Sector | undefined): Sector {
    if (!id) return new Sector();
    if (isOfType(Sector, id)) return id;
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

  async updateBalance(teams: Team[]): Promise<Team[]> {
    return lastValueFrom(
      combineLatest([this.transactionService.getTransactions(), this.transactionService.isDataLoaded$]).pipe(
        skipWhile(([_, isTransactionLoaded]) => !isTransactionLoaded),
        take(1),
        map(() => {
          return teams.map((team) => {
            if (!team.locals) team.locals = {} as TeamLocals;
            team.sectors.forEach((sector) => {
              if (!sector.locals) sector.locals = {} as SectorLocals;
            });
            team.locals.balance = this.stringUtil.numberToMoney(
              team.expenses.reduce((accumulator, expense) => {
                if (expense)
                  accumulator += this.stringUtil.moneyToNumber(this.transactionService.idToTransaction(expense).value);
                return accumulator;
              }, 0)
            );
            return team;
          });
        })
      )
    );
  }

  teamsList(): Team[] {
    return cloneDeep(this.teams$.getValue());
  }

  sectorsListAll(): Sector[] {
    const teams = this.teams$.getValue();
    const sectors = teams.map((team) => team.sectors);
    return sectors.flat().sort((a, b) => {
      return nameSort(1, a.name, b.name);
    });
  }

  sectorsList(teamAbrev: string): Sector[] {
    const team = this.teams$.getValue().find((team) => team.abrev == teamAbrev);
    return team ? team.sectors : [];
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
    if (isOfType(User, user) && !user._id) return [];
    return this.userService.idToUser(user).sectors.map((sector) => this.idToSector(sector));
  }

  hasOrganizationTeam(): boolean {
    return !!this.teams$.getValue().find((team) => team.isOrganizationTeam);
  }
}
