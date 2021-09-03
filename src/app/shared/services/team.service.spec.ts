import { TestBed } from '@angular/core/testing';

import { TeamService } from './team.service';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('TeamService', () => {
  let service: TeamService;

  CommonTestingModule.setUpTestBed();

  beforeEach(() => {
    service = TestBed.inject(TeamService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
