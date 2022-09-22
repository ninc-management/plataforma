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

    let mockedUser = new User();
    mockedUser._id = '0';
    mockedUser.fullName = 'Test1';
    mockedUser.email = 'test1@te.st';
    mockedUser.phone = '123456';
    mockedUsers.push(cloneDeep(mockedUser));

    mockedUser = new User();
    mockedUser._id = '1';
    mockedUser.fullName = 'Test2';
    mockedUser.email = 'test2@te.st';
    mockedUser.phone = '123456';
    mockedUsers.push(cloneDeep(mockedUser));

    mockedUser = new User();
    mockedUser._id = '2';
    mockedUser.fullName = 'Test3';
    mockedUser.email = 'test3@te.st';
    mockedUser.phone = '123456';
    mockedUsers.push(cloneDeep(mockedUser));

    const mockedSector1 = new Sector();
    mockedSector1._id = '0';
    mockedSector1.name = 'Test Sector 1';
    mockedSector1.abrev = 'TS1';

    const mockedSector2 = new Sector();
    mockedSector2._id = '1';
    mockedSector2.name = 'Test Sector 2';
    mockedSector2.abrev = 'TS2';

    mockedSectors = [mockedSector1, mockedSector2];

    const mockedTeam = new Team();
    mockedTeam._id = '0';
    mockedTeam.name = 'teamTest';
    mockedTeam.leader = mockedUsers[0];
    mockedTeam.members = [
      {
        user: mockedUsers[0],
        sectors: [],
      },
      {
        user: mockedUsers[1],
        sectors: [],
      },
    ] as TeamMember[];
    mockedTeam.transactions = [];
    mockedTeam.created = new Date();
    mockedTeam.purpose = 'created for testing team service methods';
    mockedTeam.expenses = [];
    mockedTeam.config = new TeamConfig();
    mockedTeam.abrev = 'TT';
    mockedTeam.isOrganizationTeam = false;
    mockedTeam.sectors.push(cloneDeep(mockedSector1));
    mockedTeam.overridePercentages = false;
    mockedTeam.organizationPercentage = '0,00';
    mockedTeam.nfPercentage = '0,00';
    mockedTeams.push(cloneDeep(mockedTeam));

    mockedTeam._id = '1';
    mockedTeam.name = 'Test Team 2';
    mockedTeam.abrev = 'TT2';
    mockedTeam.isOrganizationTeam = true;
    mockedTeam.sectors = [cloneDeep(mockedSector2)];
    mockedTeam.members = [
      {
        user: mockedUsers[2],
        sectors: [],
      },
    ];
    mockedTeams.push(cloneDeep(mockedTeam));

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
    const newMockedTeam = new Team();
    newMockedTeam._id = '1';
    newMockedTeam.name = 'teamTest2';
    newMockedTeam.leader = mockedUsers[2];
    newMockedTeam.members = [
      {
        user: mockedUsers[0],
        sectors: [],
      },
      {
        user: mockedUsers[2],
        sectors: [],
      },
    ] as TeamMember[];
    newMockedTeam.transactions = [];
    newMockedTeam.purpose = 'created for testing team service methods';
    let i = 1;
    const data = {
      ns: {
        coll: 'teams',
      },
      operationType: 'insert',
      fullDocument: newMockedTeam,
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
            service.saveTeam(newMockedTeam);
            const req1 = httpMock.expectOne('/api/team/');
            expect(req1.request.method).toBe('POST');
            socket.emit('dbchange', data);
            break;
          }
          case 3: {
            expect(teams.length).toBe(3);
            mockedTeams.push(newMockedTeam);
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

  baseTest('idToSectorComposedName should work', (expectedTeams: Team[]) => {
    expect(service.idToSectorComposedName(undefined)).toEqual('');
    expect(service.idToSectorComposedName('0')).toEqual('TS1 - Test Sector 1');
  });

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

  baseTest('hasOrganizationTeam should work', (expectedTeams: Team[]) => {
    expect(service.hasOrganizationTeam()).toBe(true);
  });
});
