import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Course } from '@models/course';
import { Socket } from 'ngx-socket-io';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { WebSocketService } from './web-socket.service';

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private requested = false;
  private courses$ = new BehaviorSubject<Course[]>([]);
  private destroy$ = new Subject<void>();

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
          const tmp = JSON.parse(JSON.stringify(courses));
          this.courses$.next(tmp as Course[]);
        });
      this.socket
        .fromEvent('dbchange')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => this.wsService.handle(data, this.courses$, 'courses'));
    }
    return this.courses$;
  }
}
