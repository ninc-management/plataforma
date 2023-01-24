import { Component, OnInit } from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { combineLatest, Subject } from 'rxjs';
import { skipWhile, takeUntil } from 'rxjs/operators';

import { CourseDialogComponent, DIALOG_TYPES } from './course-dialog/course-dialog.component';
import { LocalDataSource } from 'app/@theme/components/smart-table/lib/data-source/local/local.data-source';
import { CourseService } from 'app/shared/services/course.service';
import { UserService } from 'app/shared/services/user.service';
import { isPhone } from 'app/shared/utils';

import { Course, CourseParticipant } from '@models/course';

@Component({
  selector: 'ngx-courses',
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.scss'],
})
export class CoursesComponent implements OnInit {
  private destroy$ = new Subject<void>();
  searchQuery = '';
  courses: Course[] = [];
  source: LocalDataSource = new LocalDataSource();
  isDataLoaded = false;

  isPhone = isPhone;

  constructor(
    public userService: UserService,
    private dialogService: NbDialogService,
    private courseService: CourseService
  ) {}

  settings = {
    mode: 'external',
    noDataMessage: 'Não encontramos nenhum curso para o filtro selecionado.',
    add: {
      addButtonContent: '<i class="nb-plus"></i>',
      createButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
    },
    edit: {
      editButtonContent: '<i class="nb-edit"></i>',
      saveButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
    },
    delete: {
      deleteButtonContent: '<i class="eva eva-person-add-outline"></i>',
      confirmDelete: false,
    },
    actions: {
      columnTitle: 'Ações',
      add: true,
      edit: true,
      delete: true,
    },
    columns: {
      name: {
        title: 'Nome',
        type: 'string',
      },
      speaker: {
        title: 'Ministrante',
        valuePrepareFunction: (speaker: CourseParticipant): string => speaker.name,
        type: 'string',
      },
      participantsQuantity: {
        title: 'Nº de Participantes',
        type: 'string',
      },
      hasCertificate: {
        title: 'Tem certificado?',
        type: 'string',
        valuePrepareFunction: (value: any) => (value ? '✅' : '❌'),
        filter: {
          type: 'list',
          config: {
            selectText: 'Todos',
            list: [
              {
                value: true,
                title: '✅',
              },
              {
                value: false,
                title: '❌',
              },
            ],
          },
        },
      },
    },
  };

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    combineLatest([this.courseService.getCourses(), this.courseService.isDataLoaded$])
      .pipe(
        skipWhile(([, isCourseDataLoaded]) => !isCourseDataLoaded),
        takeUntil(this.destroy$)
      )
      .subscribe(([courses]) => {
        this.courses = courses.map((course: Course) => {
          course.participantsQuantity = course.participants.length.toString();
          return course;
        });
        this.source.load(this.courses);
        this.isDataLoaded = true;
      });
  }

  openDialog(event: { data?: Course }): void {
    this.dialogService.open(CourseDialogComponent, {
      context: {
        title: event.data ? 'EDIÇÃO DE CURSO' : 'CADASTRO DE CURSO',
        course: event.data ? event.data : new Course(),
      },
      dialogClass: 'my-dialog',
      closeOnBackdropClick: false,
      closeOnEsc: false,
      autoFocus: false,
    });
  }

  pageWidth(): number {
    return window.innerWidth;
  }

  openParticipantDialog(event: { data: Course }): void {
    this.dialogService.open(CourseDialogComponent, {
      context: {
        title: 'REGISTRAR PARTICIPANTE',
        course: event.data,
        componentType: DIALOG_TYPES.PARTICIPANT,
      },
      dialogClass: 'my-dialog',
      closeOnBackdropClick: false,
      closeOnEsc: false,
      autoFocus: false,
    });
  }
}
