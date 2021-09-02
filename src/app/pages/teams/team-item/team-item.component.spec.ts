import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamItemComponent } from './team-item.component';
import { CommonTestingModule } from 'app/../common-testing.module';

describe('TeamItemComponent', () => {
  let component: TeamItemComponent;
  let fixture: ComponentFixture<TeamItemComponent>;

  CommonTestingModule.setUpTestBed(TeamItemComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(TeamItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
