import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Course, CourseParticipant } from '@models/course';
import { User } from '@models/user';
import { AuthService } from 'app/auth/auth.service';
import { CommonTestingModule } from 'common-testing.module';
import { cloneDeep } from 'lodash';

import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import MockedServerSocket from 'socket.io-mock';
import { SocketMock } from 'types/socketio-mock';
import { externalMockedCourseParticipants, externalMockedCourses } from '../mocked-data/mocked-courses';
import { externalMockedUsers } from '../mocked-data/mocked-users';
import { reviveDates } from '../utils';
import { CourseService } from './course.service';
import { WebSocketService } from './web-socket.service';

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
  const socketServiceSpy = jasmine.createSpyObj<WebSocketService>('WebSocketService', ['fromEvent']);
  CommonTestingModule.setUpTestBed();

  const baseTest = (name: string, test: (expectedCourses: Course[]) => void) => {
    it(name, (done: DoneFn) => {
      let i = 1;

      service
        .getCourses()
        .pipe(take(2))
        .subscribe((courses: Course[]) => {
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
    TestBed.overrideProvider(WebSocketService, { useValue: socketServiceSpy });
    authServiceSpy.userEmail.and.returnValue('test1@te.st');
    socketServiceSpy.fromEvent.and.returnValue(socket$);
    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(CourseService);

    mockedUsers = cloneDeep(externalMockedUsers);
    mockedParticipants = cloneDeep(externalMockedCourseParticipants);
    mockedCourses = cloneDeep(externalMockedCourses);
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
            expect(courses).toEqual(reviveDates(mockedCourses));
            service.saveCourse(tmpCourse);
            const req1 = httpMock.expectOne('/api/course/');
            expect(req1.request.method).toBe('POST');
            req1.flush(null);
            socket.emit('dbchange', data);
            break;
          }
          case 3: {
            expect(courses.length).toBe(3);
            mockedCourses.push(tmpCourse);
            expect(courses).toEqual(reviveDates(mockedCourses));
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
    expect(service.idToParticipant(reviveDates(mockedParticipants[0]))).toEqual(expectedCourses[0].participants[0]);
    expect(service.idToParticipant(reviveDates(mockedParticipants[1]))).toEqual(expectedCourses[0].participants[1]);
  });
});
