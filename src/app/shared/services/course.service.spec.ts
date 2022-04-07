import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Course, CourseParticipant } from '@models/course';
import { User } from '@models/user';
import { AuthService } from 'app/auth/auth.service';
import { CommonTestingModule } from 'common-testing.module';
import { cloneDeep } from 'lodash';
import { Socket } from 'ngx-socket-io';
import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import MockedServerSocket from 'socket.io-mock';
import { SocketMock } from 'types/socketio-mock';
import { CourseService } from './course.service';

describe('CourseService', () => {
  let service: CourseService;
  let httpMock: HttpTestingController;
  let mockedUsers: User[];
  let mockedParticipants: CourseParticipant[];
  let mockedCourses: Course[];
  const socket$ = new Subject<any>();
  const socket: SocketMock = new MockedServerSocket();
  const authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['userEmail'], {
    onUserChange$: new Subject<void>(),
  });
  const socketServiceSpy = jasmine.createSpyObj<Socket>('Socket', ['fromEvent']);
  CommonTestingModule.setUpTestBed();

  const baseTest = (name: string, test: (expectedCourses: Course[]) => void) => {
    it(name, (done: DoneFn) => {
      let i = 1;

      service
        .getCourses()
        .pipe(take(2))
        .subscribe((courses) => {
          switch (i) {
            case 1: {
              i += 1;
              expect(courses.length).toBe(0);
              break;
            }
            case 2: {
              const expectedCourses = mockedCourses;
              expect(courses.length).toBe(2);
              expect(courses).toEqual(expectedCourses);
              test(expectedCourses);
              done();
              break;
            }
            default: {
              break;
            }
          }
        });
      // mock response
      const req = httpMock.expectOne('/api/course/all');
      expect(req.request.method).toBe('POST');
      setTimeout(() => {
        req.flush(mockedCourses);
      }, 50);
    });
  };

  beforeEach(() => {
    TestBed.overrideProvider(AuthService, { useValue: authServiceSpy });
    TestBed.overrideProvider(Socket, { useValue: socketServiceSpy });
    authServiceSpy.userEmail.and.returnValue('test1@te.st');
    socketServiceSpy.fromEvent.and.returnValue(socket$);
    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(CourseService);
    mockedUsers = [];
    mockedParticipants = [];
    mockedCourses = [];
    const tmpUser = new User();
    tmpUser._id = '0';
    tmpUser.fullName = 'Test1';
    tmpUser.email = 'test1@te.st';
    tmpUser.phone = '123456';
    mockedUsers.push(cloneDeep(tmpUser));
    let tmpParticipant = new CourseParticipant();
    tmpParticipant._id = '0';
    tmpParticipant.name = 'testUser';
    tmpParticipant.isSpeaker = true;
    tmpParticipant.email = 'test@.com';
    tmpParticipant.phone = '(00) 0000-0000';
    tmpParticipant.CPF = '000.000.000-12';
    tmpParticipant.address = 'rua teste';
    tmpParticipant.job = 'any';
    mockedParticipants.push(cloneDeep(tmpParticipant));
    tmpParticipant = new CourseParticipant();
    tmpParticipant._id = '1';
    tmpParticipant.name = 'testUser2';
    tmpParticipant.email = 'test2@.com';
    tmpParticipant.phone = '(00) 0000-0000';
    tmpParticipant.CPF = '000.000.000-12';
    tmpParticipant.address = 'rua teste2';
    tmpParticipant.job = 'any';
    mockedParticipants.push(cloneDeep(tmpParticipant));
    let tmpCourse = new Course();
    tmpCourse._id = '0';
    tmpCourse.name = 'testCourse';
    tmpCourse.hasCertificate = true;
    tmpCourse.courseHours = '00';
    tmpCourse.speaker = mockedParticipants[0];
    tmpCourse.place = 'online';
    tmpCourse.price = '00.00';
    tmpCourse.participants = mockedParticipants;
    tmpCourse.resources = [];
    mockedCourses.push(cloneDeep(tmpCourse));
    tmpCourse = new Course();
    tmpCourse._id = '1';
    tmpCourse.name = 'testCourse2';
    tmpCourse.hasCertificate = true;
    tmpCourse.courseHours = '00';
    tmpCourse.speaker = mockedParticipants[0];
    tmpCourse.place = 'online';
    tmpCourse.price = '00.00';
    tmpCourse.participants = mockedParticipants;
    tmpCourse.resources = [];
    mockedCourses.push(cloneDeep(tmpCourse));
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('saveCourse should work', (done: DoneFn) => {
    const tmpCourse = new Course();
    tmpCourse._id = '2';
    tmpCourse.name = 'testCourse2';
    tmpCourse.hasCertificate = true;
    tmpCourse.courseHours = '00';
    tmpCourse.speaker = mockedParticipants[0];
    tmpCourse.place = 'online';
    tmpCourse.price = '00.00';
    tmpCourse.participants = mockedParticipants;
    tmpCourse.resources = [];
    let i = 1;
    const data = {
      ns: {
        coll: 'courses',
      },
      operationType: 'insert',
      fullDocument: tmpCourse,
    };
    socket.socketClient.on('dbchange', (data: any) => socket$.next(data));
    service
      .getCourses()
      .pipe(take(3))
      .subscribe((courses: Course[]) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(courses.length).toBe(0);
            break;
          }
          case 2: {
            i += 1;
            expect(courses.length).toBe(2);
            expect(courses).toEqual(mockedCourses);
            service.saveCourse(tmpCourse);
            const req1 = httpMock.expectOne('/api/course/');
            expect(req1.request.method).toBe('POST');
            req1.flush({});
            socket.emit('dbchange', data);
            break;
          }
          case 3: {
            expect(courses.length).toBe(3);
            mockedCourses.push(tmpCourse);
            expect(courses).toEqual(mockedCourses);
            done();
            break;
          }
          default: {
            break;
          }
        }
      });

    // mock response
    const req = httpMock.expectOne('/api/course/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedCourses);
    }, 50);
  });

  it('editCourse should work', (done: DoneFn) => {
    const tmpCourse = cloneDeep(mockedCourses[1]);
    let i = 1;
    const data = {
      ns: {
        coll: 'courses',
      },
      operationType: 'update',
      documentKey: {
        _id: '1',
      },
      updateDescription: {
        updatedFields: { price: '25.00' },
        removedFields: [] as any[],
      },
    };
    socket.socketClient.on('dbchange', (data: any) => socket$.next(data));
    service
      .getCourses()
      .pipe(take(3))
      .subscribe((courses: Course[]) => {
        switch (i) {
          case 1: {
            i += 1;
            expect(courses.length).toBe(0);
            break;
          }
          case 2: {
            i += 1;
            expect(courses.length).toBe(2);
            expect(courses).toEqual(mockedCourses);
            service.editCourse(tmpCourse);
            const req1 = httpMock.expectOne('/api/course/update');
            expect(req1.request.method).toBe('POST');
            req1.flush(null);
            socket.emit('dbchange', data);
            break;
          }
          case 3: {
            expect(courses.length).toBe(2);
            expect(courses[1].price).toBe('25.00');
            done();
            break;
          }
          default: {
            break;
          }
        }
      });

    // mock response
    const req = httpMock.expectOne('/api/course/all');
    expect(req.request.method).toBe('POST');
    setTimeout(() => {
      req.flush(mockedCourses);
    }, 50);
  });

  baseTest('getCourses should work', (expectedCourses: Course[]) => {});

  baseTest('idToParticipant should work', (expectedCourses: Course[]) => {
    expect(service.idToParticipant('0')).toEqual(expectedCourses[0].participants[0]);
    expect(service.idToParticipant('1')).toEqual(expectedCourses[0].participants[1]);
    expect(service.idToParticipant(mockedParticipants[0])).toEqual(expectedCourses[0].participants[0]);
    expect(service.idToParticipant(mockedParticipants[1])).toEqual(expectedCourses[0].participants[1]);
  });
});
