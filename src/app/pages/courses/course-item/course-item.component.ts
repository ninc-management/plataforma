import { Component, Input, OnInit } from '@angular/core';
import { Course, CourseParticipant } from '@models/course';
import { User } from '@models/user';
import { NbDialogService } from '@nebular/theme';

import * as course_validation from 'app/shared/course-validation.json';
import { CourseService } from 'app/shared/services/course.service';
import { UserService } from 'app/shared/services/user.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { cloneDeep } from 'lodash';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { take } from 'rxjs/operators';
import { CourseDialogComponent, DIALOG_TYPES } from '../course-dialog/course-dialog.component';

@Component({
  selector: 'ngx-course-item',
  templateUrl: './course-item.component.html',
  styleUrls: ['./course-item.component.scss'],
})
export class CourseItemComponent implements OnInit {
  @Input() iCourse = new Course();
  @Input() isDialogBlocked = new BehaviorSubject<boolean>(false);
  course: Course = new Course();
  validation = (course_validation as any).default;
  editing = false;
  speakerSearch = '';
  participantsSearch = '';
  avaliableSpeakers: Observable<User[]> = of([]);
  avaliableParticipants: Observable<User[]> = of([]);
  currentParticipant = new CourseParticipant();

  constructor(
    private courseService: CourseService,
    public userService: UserService,
    public utils: UtilsService,
    private dialogService: NbDialogService
  ) {}

  ngOnInit(): void {
    this.avaliableSpeakers = this.userService.getUsers();
    this.avaliableParticipants = this.userService.getUsers();
  }

  createCourse() {
    console.log(this.course);
    // this.courseService.saveCourse(this.course);
  }

  addSpeaker() {
    console.log('added');
  }

  addParticipant(): void {
    this.isDialogBlocked.next(true);
    this.dialogService
      .open(CourseDialogComponent, {
        context: {
          title: 'REGISTRAR' + this.editing ? 'PARTICIPANTE' : 'MINISTRANTE',
          course: this.course,
          componentType: DIALOG_TYPES.PARTICIPANT,
        },
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      })
      .onClose.pipe(take(1))
      .subscribe(() => {
        if (this.course.participants.length != 0) {
          this.course.speaker = cloneDeep(this.course.participants[0]);
        }
        this.isDialogBlocked.next(false);
      });
  }
}
