import { Component, Input, OnInit } from '@angular/core';
import { CourseParticipant } from '@models/course';
import * as participant_validation from 'app/shared/participant-validation.json';

@Component({
  selector: 'ngx-participant-item',
  templateUrl: './participant-item.component.html',
  styleUrls: ['./participant-item.component.scss'],
})
export class ParticipantItemComponent implements OnInit {
  @Input() iParticipant = new CourseParticipant();
  participant = new CourseParticipant();
  validation = (participant_validation as any).default;

  constructor() {}

  ngOnInit(): void {}

  createParticipant() {
    console.log('created');
  }
}
