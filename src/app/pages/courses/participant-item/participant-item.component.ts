import { Component, Input, OnInit } from '@angular/core';
import { cloneDeep } from 'lodash';

import { CourseService } from 'app/shared/services/course.service';

import { Course, CourseParticipant } from '@models/course';

import participant_validation from 'app/shared/validators/participant-validation.json';

@Component({
  selector: 'ngx-participant-item',
  templateUrl: './participant-item.component.html',
  styleUrls: ['./participant-item.component.scss'],
})
export class ParticipantItemComponent implements OnInit {
  @Input() iParticipant = new CourseParticipant();
  @Input() iCourse = new Course();
  participant = new CourseParticipant();
  validation = participant_validation as any;

  constructor(private courseService: CourseService) {}

  ngOnInit(): void {
    this.participant = cloneDeep(this.iParticipant);
  }

  createParticipant(): void {
    if (this.iCourse.participants.length == 0) {
      this.participant.isSpeaker = true;
    }
    this.iParticipant = cloneDeep(this.participant);
    this.iCourse.participants.push(cloneDeep(this.participant));
    this.courseService.editCourse(this.iCourse);
  }
}
