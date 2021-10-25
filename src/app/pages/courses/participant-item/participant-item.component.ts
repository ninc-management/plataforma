import { Component, Input, OnInit } from '@angular/core';
import { Course, CourseParticipant } from '@models/course';
import * as participant_validation from 'app/shared/participant-validation.json';
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

  constructor() {}

  ngOnInit(): void {}

  createParticipant() {
    this.iParticipant = cloneDeep(this.participant);
    this.iCourse.participants.push(cloneDeep(this.participant));
  }
}
