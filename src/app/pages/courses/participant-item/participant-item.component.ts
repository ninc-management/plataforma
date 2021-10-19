import { Component, Input, OnInit } from '@angular/core';
import { Course, CourseParticipant } from '@models/course';
import * as participant_validation from 'app/shared/participant-validation.json';
import { CourseService } from 'app/shared/services/course.service';
import { cloneDeep } from 'lodash';

@Component({
  selector: 'ngx-participant-item',
  templateUrl: './participant-item.component.html',
  styleUrls: ['./participant-item.component.scss'],
})
export class ParticipantItemComponent implements OnInit {
  @Input() iParticipant = new CourseParticipant();
  @Input() iCourse = new Course();
  participant = new CourseParticipant();
  validation = (participant_validation as any).default;

  constructor(private courseService: CourseService) {}

  ngOnInit(): void {
    this.participant = cloneDeep(this.iParticipant);
  }

  createParticipant(): void {
    this.iCourse.participants.push(cloneDeep(this.participant));
    this.courseService.editCourse(this.iCourse);
  }
}
