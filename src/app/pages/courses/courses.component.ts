import { Component, OnInit } from '@angular/core';
import { Course } from '@models/course';
import { CourseService } from 'app/shared/services/course.service';
import { UserService } from 'app/shared/services/user.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { LocalDataSource } from 'ng2-smart-table';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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

  constructor(public utils: UtilsService, private courseService: CourseService, private userService: UserService) {}

  settings = {
    mode: 'external',
    noDataMessage: 'Não encontramos nenhum curso para o filtro selecionado.',
    add: {
      addButtonContent: '<i class="icon-file-csv"></i>',
      createButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
    },
    edit: {
      editButtonContent: '<i class="nb-edit"></i>',
      saveButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
    },
    delete: {
      deleteButtonContent: '<i class="fa fa-dollar-sign payment"></i>',
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
    this.courseService
      .getCourses()
      .pipe(takeUntil(this.destroy$))
      .subscribe((courses: Course[]) => {
        this.courses = courses.map((course: Course) => {
          if (course.speaker) {
            course.speaker = this.userService.idToName(course.speaker);
          }
          course.participantsQuantity = course.participants.length.toString();
          return course;
        });
        this.source.load(this.courses);
      });
  }

  pageWidth(): number {
    return window.innerWidth;
  }
}
