import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'common-testing.module';

import { ExpansiveListComponent } from './expansive-list.component';

describe('ExpansiveListComponent', () => {
  let component: ExpansiveListComponent;
  let fixture: ComponentFixture<ExpansiveListComponent>;

  CommonTestingModule.setUpTestBed(ExpansiveListComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpansiveListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
