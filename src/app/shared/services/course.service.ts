import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Course, CourseParticipant } from '@models/course';
import { Socket } from 'ngx-socket-io';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { UtilsService } from './utils.service';
import { WebSocketService } from './web-socket.service';

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private requested = false;
  private courses$ = new BehaviorSubject<Course[]>([]);
  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private socket: Socket,
    private wsService: WebSocketService,
    private utils: UtilsService
  ) {}

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
        .subscribe((courses: any) => this.courses$.next(courses as Course[]));
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

  idToParticipantName(id: string | CourseParticipant | undefined): string {
    if (id === undefined) return '';
    return this.idToParticipant(id)?.name;
  }

  idToParticipant(id: string | CourseParticipant): CourseParticipant {
    if (this.utils.isOfType<CourseParticipant>(id, ['_id', 'name', 'email', 'isSpeaker'])) return id;
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
