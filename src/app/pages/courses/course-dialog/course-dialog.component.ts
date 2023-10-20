import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { NB_DOCUMENT, NbDialogRef, NbDialogService } from '@nebular/theme';
import { saveAs } from 'file-saver';
import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';

import { BaseDialogComponent } from 'app/shared/components/base-dialog/base-dialog.component';
import { ConfirmationDialogComponent } from 'app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { CourseService } from 'app/shared/services/course.service';
import { isObjectUpdated, isPhone, tooltipTriggers } from 'app/shared/utils';

import { Course, CourseParticipant } from '@models/course';

export enum DIALOG_TYPES {
  COURSE,
  PARTICIPANT,
  RESOURCE,
}
@Component({
  selector: 'ngx-course-dialog',
  templateUrl: './course-dialog.component.html',
  styleUrls: ['./course-dialog.component.scss'],
})
export class CourseDialogComponent extends BaseDialogComponent implements OnInit {
  @Input() title = '';
  @Input() course = new Course();
  @Input() participant = new CourseParticipant();
  @Input() componentType = DIALOG_TYPES.COURSE;
  dTypes = DIALOG_TYPES;
  objectOutdated$ = new Subject<void>();
  courseVersion?: number = 0;
  isOutdated: boolean = false;

  isPhone = isPhone;
  tooltipTriggers = tooltipTriggers;

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<CourseDialogComponent>,
    private dialogService: NbDialogService,
    private courseService: CourseService
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {
    this.courseVersion = this.course.__v;
    if (this.courseVersion !== undefined) {
      isObjectUpdated(
        this.courseService.getCourses(),
        { _id: this.course._id, __v: this.courseVersion },
        this.destroy$,
        this.objectOutdated$
      );
      this.objectOutdated$.subscribe(() => {
        this.isOutdated = true;
      });
    }
    super.ngOnInit();
  }

  dismiss(): void {
    if (this.isFormDirty.value) {
      this.dialogService
        .open(ConfirmationDialogComponent, {
          context: {
            question: 'Deseja descartar as alterações feitas?',
          },
          dialogClass: 'my-dialog',
          closeOnBackdropClick: false,
          closeOnEsc: false,
          autoFocus: false,
        })
        .onClose.pipe(take(1))
        .subscribe((response: boolean) => {
          if (response) {
            super.dismiss();
          }
        });
    } else {
      super.dismiss();
    }
  }

  exportCSV(): void {
    let csv = 'Nome,Participacao\r\n';
    csv += this.course.participants
      .map((participant) => participant.name + ',' + (participant.isSpeaker ? 'Ministrante' : 'Ouvinte'))
      .join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    saveAs(blob, 'participantes-' + this.course.name.replace(/\s+/g, '-').toLowerCase() + '.csv');
  }
}
