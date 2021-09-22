import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { UserService } from './user.service';
import { UtilsService } from './utils.service';
import { WebSocketService } from './web-socket.service';
import { Team } from '@models/team';
import { User } from '@models/user';

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
        .subscribe((teams: any) => {
          const tmp = JSON.parse(JSON.stringify(teams));
          this.teams$.next(tmp as Team[]);
        });
      this.socket
        .fromEvent('dbchange')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => this.wsService.handle(data, this.teams$, 'teams'));
    }
    return this.teams$;
  }

  idToName(id: string | Team): string {
    return this.idToTeam(id).name;
  }

  idToTeam(id: string | Team): Team {
    if (this.utils.isOfType<Team>(id, ['_id', 'name', 'expertise', 'members'])) return id;
    const tmp = this.teams$.getValue();
    return tmp[tmp.findIndex((el) => el._id === id)];
  }

  isMember(uId: string | User | undefined, teamId: string | Team): boolean {
    if (uId == undefined) return false;
    return this.idToTeam(teamId).members.find((member) => this.userService.isEqual(member, uId)) == undefined
      ? false
      : true;
  }

  userToTeams(uId: string | User | undefined): string[] {
    if (uId == undefined) return [];
    return this.teams$
      .getValue()
      .filter((team) => this.isMember(uId, team))
      .map((team) => team.name);
  }
}
