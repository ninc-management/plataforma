import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

import { isOfType, reviveDates } from '../utils';
import { WebSocketService } from './web-socket.service';

import { Course, CourseParticipant } from '@models/course';

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private requested = false;
  private courses$ = new BehaviorSubject<Course[]>([]);
  private destroy$ = new Subject<void>();
  private _isDataLoaded$ = new BehaviorSubject<boolean>(false);

  get isDataLoaded$(): Observable<boolean> {
    return this._isDataLoaded$.asObservable();
  }

  constructor(private http: HttpClient, private socket: Socket, private wsService: WebSocketService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getCourses(): Observable<Course[]> {
    if (!this.requested) {
      this.requested = true;
      this.http
        .post('/api/course/all', {})
        .pipe(take(1))
        .subscribe((courses: any) => {
          this.courses$.next(reviveDates(courses) as Course[]);
          this._isDataLoaded$.next(true);
        });
      this.socket
        .fromEvent('dbchange')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => this.wsService.handle(data, this.courses$, 'courses'));
    }
    return this.courses$;
  }

  saveCourse(course: Course): void {
    const req = {
      course: course,
    };
    this.http.post('/api/course/', req).pipe(take(1)).subscribe();
  }

  idToParticipant(id: string | CourseParticipant): CourseParticipant {
    if (isOfType(CourseParticipant, id)) return id;
    const tmp = this.courses$
      .getValue()
      .map((course) => course.participants)
      .flat();
    return tmp[tmp.findIndex((el) => el._id === id)];
  }

  editCourse(course: Course): void {
    const req = {
      course: course,
    };
    this.http.post('/api/course/update', req).pipe(take(1)).subscribe();
  }
}
