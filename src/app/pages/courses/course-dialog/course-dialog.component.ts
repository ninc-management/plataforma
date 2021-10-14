import { Component, OnInit, Inject, Optional, Input } from '@angular/core';
import { NbDialogRef, NB_DOCUMENT } from '@nebular/theme';
import { BaseDialogComponent } from 'app/shared/components/base-dialog/base-dialog.component';
import { UtilsService } from 'app/shared/services/utils.service';
import { Course, CourseParticipant } from '@models/course';

export enum DIALOG_TYPES {
  COURSE,
  PARTICIPANT,
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

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<CourseDialogComponent>,
    public utils: UtilsService
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  dismiss(): void {
    super.dismiss();
  }
}
