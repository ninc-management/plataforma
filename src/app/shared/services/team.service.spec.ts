import { TestBed } from '@angular/core/testing';

import { TeamService } from './team.service';
import { CommonTestingModule } from 'app/../common-testing.module';
import { Team, TeamMember } from '@models/team';
import { HttpTestingController } from '@angular/common/http/testing';
import { User } from '@models/user';
import { AuthService } from 'app/auth/auth.service';
import { Socket } from 'ngx-socket-io';
import { cloneDeep } from 'lodash';
import { Subject } from 'rxjs';
import { SocketMock } from 'types/socketio-mock';
import MockedServerSocket from 'socket.io-mock';
import { take } from 'rxjs/operators';
import { parseISO } from 'date-fns';

describe('TeamService', () => {
  let service: TeamService;
  let httpMock: HttpTestingController;
  let mockedUsers: User[];
  let mockedTeams: Team[];
  const socket$ = new Subject<any>();
  const socket: SocketMock = new MockedServerSocket();
  const authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['userEmail'], {
    onUserChange$: new Subject<void>(),
  });
  const socketServiceSpy = jasmine.createSpyObj<Socket>('Socket', ['fromEvent']);
  CommonTestingModule.setUpTestBed();

  const baseTest = (name: string, test: (expectedTeams: Team[]) => void) => {
    it(name, (done: DoneFn) => {
      let i = 1;

      service
        .getTeams()
        .pipe(take(2))
        .subscribe((teams) => {
          switch (i) {
            case 1: {
              i += 1;
              expect(teams.length).toBe(0);
              break;
            }
            case 2: {
              const expectedTeams = JSON.parse(JSON.stringify(mockedTeams), (k, v) => {
                if (['created', 'lastUpdate', 'paidDate'].includes(k)) return parseISO(v);
                return v;
              }) as Team[];
              expect(teams.length).toBe(1);
              expect(teams).toEqual(expectedTeams);
              test(expectedTeams);
              done();
              break;
            }
            default: {
              break;
            }
          }
        });
      // mock response
      const req = httpMock.expectOne('/api/team/all');
      expect(req.request.method).toBe('POST');
      setTimeout(() => {
        req.flush(mockedTeams);
      }, 50);
    });
  };

  beforeEach(() => {
    TestBed.overrideProvider(AuthService, { useValue: authServiceSpy });
    TestBed.overrideProvider(Socket, { useValue: socketServiceSpy });
    authServiceSpy.userEmail.and.returnValue('test1@te.st');
    socketServiceSpy.fromEvent.and.returnValue(socket$);
    service = TestBed.inject(TeamService);
    httpMock = TestBed.inject(HttpTestingController);
    mockedUsers = [];
    mockedTeams = [];
    let tmpUser = new User();
    tmpUser._id = '0';
    tmpUser.fullName = 'Test1';
    tmpUser.email = 'test1@te.st';
    tmpUser.phone = '123456';
    tmpUser.adm = true;
    tmpUser.design = true;
    mockedUsers.push(cloneDeep(tmpUser));
    tmpUser = new User();
    tmpUser._id = '1';
    tmpUser.fullName = 'Test2';
    tmpUser.email = 'test2@te.st';
    tmpUser.phone = '123456';
    tmpUser.ambiental = true;
    tmpUser.arquitetura = true;
    mockedUsers.push(cloneDeep(tmpUser));
    tmpUser = new User();
    tmpUser._id = '2';
    tmpUser.fullName = 'Test3';
    tmpUser.email = 'test3@te.st';
    tmpUser.phone = '123456';
    mockedUsers.push(cloneDeep(tmpUser));
    const tmpTeam = new Team();
    tmpTeam._id = '0';
    tmpTeam.name = 'teamTest';
    tmpTeam.leader = mockedUsers[0];
    tmpTeam.expertise = 'teamTest1';
    tmpTeam.members = [
      {
        user: mockedUsers[0],
        coordination: 'C.D.I - Coordenação de Design de Interiores',
      },
      {
        user: mockedUsers[1],
        coordination: 'C.P.A - Coordenação de Projetos Arquitetônicos',
      },
    ] as TeamMember[];
    tmpTeam.transactions = [];
    tmpTeam.created = new Date();
    tmpTeam.purpose = 'created for testing team service methods';
    mockedTeams.push(cloneDeep(tmpTeam));

    const req = httpMock.expectOne('/api/user/all');
    expect(req.request.method).toBe('POST');
    req.flush(mockedUsers);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('saveTeam should work', (done: DoneFn) => {
    const tmpTeam = new Team();
    tmpTeam._id = '1';
    tmpTeam.name = 'teamTest2';
    tmpTeam.leader = mockedUsers[2];
    tmpTeam.expertise = 'teamTester2';
    tmpTeam.members = [
      {
        user: mockedUsers[0],
        coordination: 'test',
      },
      {
        user: mockedUsers[2],
        coordination: 'test2',
      },
    ] as TeamMember[];
    tmpTeam.transactions = [];
    tmpTeam.purpose = 'created for testing team service methods';
    let i = 1;
    const data = {
      ns: {
        coll: 'teams',
      },
      operationType: 'insert',
      fullDocument: tmpTeam,
    };
    socket.socketClient.on('dbchange', (data: any) => socket$.next(data));

    service
      .getTeams()
      .pipe(take(3))
      .subscribe((teams: Team[]) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(teams.length).toBe(0);
            break;
          }
          case 2: {
            i += 1;
            expect(teams.length).toBe(1);
            expect(teams).toEqual(
              JSON.parse(JSON.stringify(mockedTeams), (k, v) => {
                if (['created', 'lastUpdate', 'paidDate'].includes(k)) return parseISO(v);
                return v;
              }) as Team[]
            );
            service.saveTeam(tmpTeam);
            const req1 = httpMock.expectOne('/api/team/');
            expect(req1.request.method).toBe('POST');
            req1.flush({ contractor: tmpTeam });
            socket.emit('dbchange', data);
            break;
          }
          case 3: {
            expect(teams.length).toBe(2);
            mockedTeams.push(tmpTeam);
            expect(teams).toEqual(
              JSON.parse(JSON.stringify(mockedTeams), (k, v) => {
                if (['created', 'lastUpdate', 'paidDate'].includes(k)) return parseISO(v);
                return v;
              }) as Team[]
            );
            done();
            break;
          }
          default: {
            break;
          }
        }
      });

    // mock response
    const req = httpMock.expectOne('/api/team/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedTeams);
    }, 50);
  });
  baseTest('getTeams should work', (expectedTeams: Team[]) => {});

  baseTest('idToName should work', (expectedTeams: Team[]) => {
    expect(service.idToName('0')).toEqual(expectedTeams[0].name);
  });

  baseTest('idToTeam should work', (expectedTeams: Team[]) => {
    expect(service.idToTeam('0')).toEqual(expectedTeams[0]);
    expect(service.idToTeam(expectedTeams[0])).toEqual(expectedTeams[0]);
    expect(service.idToTeam('1')).toEqual(expectedTeams[1]);
    expect(service.idToTeam(expectedTeams[1])).toEqual(expectedTeams[1]);
  });

  baseTest('isMember should work', (expectedTeams: Team[]) => {
    expect(service.isMember('0', expectedTeams[0])).toBe(true);
    expect(service.isMember(mockedUsers[0], expectedTeams[0])).toBe(true);
    expect(service.isMember(mockedUsers[2], '0')).toBe(false);
    expect(service.isMember(undefined, expectedTeams[0])).toBe(false);
  });

  baseTest('userToTeams should work', (expectedTeams: Team[]) => {
    expect(service.userToTeams(mockedUsers[0])).toEqual([expectedTeams[0]]);
    expect(service.userToTeams(mockedUsers[1])).toEqual([expectedTeams[0]]);
    expect(service.userToTeams('0')).toEqual([expectedTeams[0]]);
    expect(service.userToTeams('1')).toEqual([expectedTeams[0]]);
    expect(service.userToTeams(undefined)).toEqual([]);
  });

  baseTest('usedCoordinations should work', (expectedTeams: Team[]) => {
    expect(service.usedCoordinations('0')).toEqual(['C.D.I - Coordenação de Design de Interiores']);
    expect(service.usedCoordinations('1')).toEqual(['C.P.A - Coordenação de Projetos Arquitetônicos']);
    expect(service.usedCoordinations(mockedUsers[0])).toEqual(['C.D.I - Coordenação de Design de Interiores']);
    expect(service.usedCoordinations(mockedUsers[1])).toEqual(['C.P.A - Coordenação de Projetos Arquitetônicos']);
    expect(service.usedCoordinations(undefined)).toEqual([]);
  });

  baseTest('usedToTeamsMembersFiltered should work', (expectedTeams: Team[]) => {
    const lastMember = expectedTeams[0].members.pop();
    expect(service.userToTeamsMembersFiltered('0')).toEqual([expectedTeams[0]]);
    expect(service.userToTeamsMembersFiltered(undefined)).toEqual([]);
  });

  baseTest('availableCoordinations should work', (expectedTeams: Team[]) => {
    expect(service.availableCoordinations('0')).toEqual(['C.ADM - Coordenação de Administração']);
    expect(service.availableCoordinations(mockedUsers[0])).toEqual(['C.ADM - Coordenação de Administração']);
    expect(service.availableCoordinations('1')).toEqual(['C.M.A - Coordenação de Meio Ambiente']);
    expect(service.availableCoordinations(mockedUsers[1])).toEqual(['C.M.A - Coordenação de Meio Ambiente']);
    expect(service.userToTeamsMembersFiltered(undefined)).toEqual([]);
  });
});
