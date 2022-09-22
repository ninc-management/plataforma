import { TestBed } from '@angular/core/testing';

import { TeamService } from './team.service';
import { CommonTestingModule } from 'app/../common-testing.module';
import { Team, TeamConfig, TeamMember } from '@models/team';
import { HttpTestingController } from '@angular/common/http/testing';
import { User } from '@models/user';
import { AuthService } from 'app/auth/auth.service';
import { Socket } from 'ngx-socket-io';
import { cloneDeep } from 'lodash';
import { Subject } from 'rxjs';
import { SocketMock } from 'types/socketio-mock';
import MockedServerSocket from 'socket.io-mock';
import { take } from 'rxjs/operators';
import { reviveDates } from '../utils';
import { Sector } from '@models/shared';

fdescribe('TeamService', () => {
  let service: TeamService;
  let httpMock: HttpTestingController;

  let mockedUsers: User[];
  let mockedTeams: Team[];
  let mockedSectors: Sector[];

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
              const expectedTeams = reviveDates(mockedTeams) as Team[];
              expect(teams.length).toBe(2);
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
    mockedSectors = [];

    let tmpUser = new User();
    tmpUser._id = '0';
    tmpUser.fullName = 'Test1';
    tmpUser.email = 'test1@te.st';
    tmpUser.phone = '123456';
    mockedUsers.push(cloneDeep(tmpUser));

    tmpUser = new User();
    tmpUser._id = '1';
    tmpUser.fullName = 'Test2';
    tmpUser.email = 'test2@te.st';
    tmpUser.phone = '123456';
    mockedUsers.push(cloneDeep(tmpUser));

    tmpUser = new User();
    tmpUser._id = '2';
    tmpUser.fullName = 'Test3';
    tmpUser.email = 'test3@te.st';
    tmpUser.phone = '123456';
    mockedUsers.push(cloneDeep(tmpUser));

    const testSector1 = new Sector();
    testSector1._id = '0';
    testSector1.name = 'Test Sector 1';
    testSector1.abrev = 'TS1';

    const testSector2 = new Sector();
    testSector2._id = '1';
    testSector2.name = 'Test Sector 2';
    testSector2.abrev = 'TS2';

    mockedSectors = [testSector1, testSector2];

    const tmpTeam = new Team();
    tmpTeam._id = '0';
    tmpTeam.name = 'teamTest';
    tmpTeam.leader = mockedUsers[0];
    tmpTeam.members = [
      {
        user: mockedUsers[0],
        sectors: [],
      },
      {
        user: mockedUsers[1],
        sectors: [],
      },
    ] as TeamMember[];
    tmpTeam.transactions = [];
    tmpTeam.created = new Date();
    tmpTeam.purpose = 'created for testing team service methods';
    tmpTeam.expenses = [];
    tmpTeam.config = new TeamConfig();
    tmpTeam.abrev = 'TT';
    tmpTeam.isOrganizationTeam = false;
    tmpTeam.sectors.push(cloneDeep(testSector1));
    tmpTeam.overridePercentages = false;
    tmpTeam.organizationPercentage = '0,00';
    tmpTeam.nfPercentage = '0,00';
    mockedTeams.push(cloneDeep(tmpTeam));

    tmpTeam._id = '1';
    tmpTeam.name = 'Test Team 2';
    tmpTeam.abrev = 'TT2';
    tmpTeam.sectors = [cloneDeep(testSector2)];
    tmpTeam.members = [
      {
        user: mockedUsers[2],
        sectors: [],
      },
    ];
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
    tmpTeam.members = [
      {
        user: mockedUsers[0],
        sectors: [],
      },
      {
        user: mockedUsers[2],
        sectors: [],
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
            expect(teams.length).toBe(2);
            expect(teams).toEqual(reviveDates(mockedTeams));
            service.saveTeam(tmpTeam);
            const req1 = httpMock.expectOne('/api/team/');
            expect(req1.request.method).toBe('POST');
            req1.flush({ contractor: tmpTeam });
            socket.emit('dbchange', data);
            break;
          }
          case 3: {
            expect(teams.length).toBe(3);
            mockedTeams.push(tmpTeam);
            expect(teams).toEqual(reviveDates(mockedTeams));
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

  baseTest('idToComposedName should work', (expectedTeams: Team[]) => {
    expect(service.idToComposedName(undefined)).toEqual('');
    expect(service.idToComposedName('0')).toEqual('TT - teamTest');
  });

  // baseTest('idToSectorComposedName should work', (expectedTeams: Team[]) => {
  //   expect(service.idToSectorComposedName(undefined)).toEqual('');
  //   expect(service.idToSectorComposedName('0')).toEqual('TS1 - Test Sector 1');
  // });

  baseTest('idToTeam should work', (expectedTeams: Team[]) => {
    expect(service.idToTeam('0')).toEqual(expectedTeams[0]);
    expect(service.idToTeam('1')).toEqual(expectedTeams[1]);
    expect(service.idToTeam(expectedTeams[0])).toEqual(expectedTeams[0]);
  });

  baseTest('idToSector should work', (expectedTeams: Team[]) => {
    const sectorToTest = mockedSectors[0];
    expect(service.idToSector(undefined)).toEqual(new Sector());
    expect(service.idToSector(sectorToTest)).toEqual(sectorToTest);
    expect(service.idToSector('0')).toEqual({ ...sectorToTest });
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

  baseTest('userToTeamsMembersFiltered should work', (expectedTeams: Team[]) => {
    const teamWithMembersFiltered = cloneDeep(expectedTeams[0]);
    teamWithMembersFiltered.members.pop();
    expect(service.userToTeamsMembersFiltered(mockedUsers[0])).toEqual([teamWithMembersFiltered]);
    expect(service.userToTeamsMembersFiltered(undefined)).toEqual([]);
  });

  baseTest('teamsList should work', (expectedTeams: Team[]) => {
    expect(service.teamsList()).toEqual(expectedTeams);
  });

  baseTest('sectorsListAll should work', (expectedTeams: Team[]) => {
    expect(service.sectorsListAll()).toEqual(mockedSectors.map((sector) => ({ ...sector })));
  });

  baseTest('sectorsList should work', (expectedTeams: Team[]) => {
    expect(service.sectorsList(expectedTeams[0].abrev)).toEqual(expectedTeams[0].sectors);
  });

  it('extractAbreviation should work', () => {
    const composedName = 'CPN - Composed Name';
    expect(service.extractAbreviation(composedName)).toEqual('CPN');
  });

  baseTest('isSectorEqual should work', (expectedTeams: Team[]) => {
    const sectorToTest1 = mockedSectors[0];
    const sectorToTest2 = mockedSectors[1];

    expect(service.isSectorEqual('0', '1')).toBe(false);
    expect(service.isSectorEqual('0', '0')).toBe(true);
    expect(service.isSectorEqual(sectorToTest1, sectorToTest2)).toBe(false);
    expect(service.isSectorEqual(sectorToTest1, sectorToTest1)).toBe(true);
  });

  baseTest('isTeamEqual should work', (expectedTeams: Team[]) => {
    const teamToTest1 = expectedTeams[0];
    const teamToTest2 = expectedTeams[1];

    expect(service.isTeamEqual(undefined, '1')).toBe(false);
    expect(service.isTeamEqual('1', undefined)).toBe(false);
    expect(service.isTeamEqual('0', '1')).toBe(false);
    expect(service.isTeamEqual('0', '0')).toBe(true);
    expect(service.isTeamEqual(teamToTest1, teamToTest2)).toBe(false);
    expect(service.isTeamEqual(teamToTest1, teamToTest1)).toBe(true);
  });
});
