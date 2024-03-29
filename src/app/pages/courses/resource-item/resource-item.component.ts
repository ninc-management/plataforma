import { Component, Input, OnInit } from '@angular/core';
import { cloneDeep } from 'lodash';

import { CourseService } from 'app/shared/services/course.service';

import { Course, CourseResource } from '@models/course';

import course_validation from 'app/shared/validators/course-validation.json';

@Component({
  selector: 'ngx-resource-item',
  templateUrl: './resource-item.component.html',
  styleUrls: ['./resource-item.component.scss'],
})
export class ResourceItemComponent implements OnInit {
  @Input() iCourse = new Course();
  validation = course_validation as any;
  resource = new CourseResource();
  get filteredURL(): string {
    return this.resource.url.replace(/https:\/\/|http:\/\//g, '');
  }

  constructor(private courseService: CourseService) {}

  ngOnInit(): void {}

  createResource(): void {
    this.iCourse.resources.push(cloneDeep(this.resource));
    this.courseService.editCourse(this.iCourse);
  }
}
