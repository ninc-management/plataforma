import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NbDialogService } from '@nebular/theme';
import { cloneDeep } from 'lodash';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { CourseDialogComponent, DIALOG_TYPES } from '../course-dialog/course-dialog.component';
import { CourseService } from 'app/shared/services/course.service';
import { UserService } from 'app/shared/services/user.service';
import { trackByIndex } from 'app/shared/utils';

import { Course } from '@models/course';
import { User } from '@models/user';

import course_validation from 'app/shared/validators/course-validation.json';

@Component({
  selector: 'ngx-course-item',
  templateUrl: './course-item.component.html',
  styleUrls: ['./course-item.component.scss'],
})
export class CourseItemComponent implements OnInit, AfterViewInit {
  @Input() iCourse = new Course();
  @Input() isDialogBlocked = new BehaviorSubject<boolean>(false);
  @Input() isFormDirty = new BehaviorSubject<boolean>(false);
  @ViewChild('form') ngForm = {} as NgForm;
  course: Course = new Course();
  validation = course_validation as any;
  editing = false;
  speakerSearch = '';
  participantsSearch = '';
  availableSpeakers: Observable<User[]> = of([]);
  availableParticipants: Observable<User[]> = of([]);
  dTypes = DIALOG_TYPES;

  get speakerName(): string {
    if (this.iCourse._id != undefined) {
      return this.course.speaker.name;
    } else {
      return (this.course.speaker as any)?.name;
    }
  }

  trackByIndex = trackByIndex;

  constructor(
    private courseService: CourseService,
    public userService: UserService,
    private dialogService: NbDialogService
  ) {}

  ngOnInit(): void {
    if (this.iCourse._id != undefined) {
      this.course = cloneDeep(this.iCourse);
      this.course.startDate = new Date(this.course.startDate);
      this.editing = true;
    }
    this.availableSpeakers = this.userService.getUsers().pipe(map((users) => users.filter((user) => user.active)));
    this.availableParticipants = this.userService.getUsers().pipe(map((users) => users.filter((user) => user.active)));
  }

  ngAfterViewInit(): void {
    this.ngForm.statusChanges?.subscribe(() => {
      if (this.ngForm.dirty) this.isFormDirty.next(true);
    });
  }

  registerCourse(): void {
    if (this.iCourse._id != undefined) {
      this.courseService.editCourse(this.course);
    } else {
      this.courseService.saveCourse(this.course);
    }
    this.isFormDirty.next(false);
  }

  addSpeaker(): void {
    console.log('added');
  }

  openDialog(type: DIALOG_TYPES): void {
    let title = '';
    this.isDialogBlocked.next(true);
    switch (type) {
      case DIALOG_TYPES.RESOURCE:
        title = 'ADICIONAR RECURSO';
        break;
      case DIALOG_TYPES.PARTICIPANT:
        title = 'REGISTRAR' + this.editing ? 'PARTICIPANTE' : 'MINISTRANTE';
        break;
      default:
        break;
    }
    this.dialogService
      .open(CourseDialogComponent, {
        context: {
          title: title,
          course: this.course,
          componentType: type,
        },
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      })
      .onClose.pipe(take(1))
      .subscribe(() => {
        this.isDialogBlocked.next(false);
      });
  }
}
