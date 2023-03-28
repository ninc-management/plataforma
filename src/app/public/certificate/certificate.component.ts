import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CourseService } from 'app/shared/services/course.service';

import { Course, CourseParticipant } from '@models/course';

@Component({
  selector: 'ngx-certificate',
  templateUrl: './certificate.component.html',
  styleUrls: ['./certificate.component.scss'],
})
export class NgxCertificateComponent implements OnInit {
  private destroy$ = new Subject<void>();
  courseID!: string;
  participantID!: string;
  course = new Course();
  courseStartDate!: string;
  participant = new CourseParticipant();
  today!: string;
  now!: string;

  constructor(private route: ActivatedRoute, private courseService: CourseService) {
    this.route.params.subscribe((params) => {
      if (params['courseID'] && params['participantID']) {
        this.courseID = params['courseID'];
        this.participantID = params['participantID'];
      }
    });
    const todayDate = new Date();
    this.today = todayDate.toLocaleDateString('pt-br');
    this.now = todayDate.toLocaleTimeString('pt-br');
    this.course.speaker = new CourseParticipant();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.courseService
      .getCourses()
      .pipe(takeUntil(this.destroy$))
      .subscribe((courses: Course[]) => {
        const course = courses.find((course: Course) => course._id.toString() == this.courseID.toString());
        if (course) {
          this.course = course;
          this.courseStartDate = new Date(this.course.startDate).toLocaleDateString('pt-br');
          const participant = this.course.participants.find((participant) => participant._id == this.participantID);
          if (participant) {
            this.participant = participant;
          }
        }
      });
  }
}
