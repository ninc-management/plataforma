import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'common-testing.module';
import { TextListComponent } from './text-list.component';

describe('TextListComponent', () => {
  let component: TextListComponent;
  let fixture: ComponentFixture<TextListComponent>;

  CommonTestingModule.setUpTestBed(TextListComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(TextListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
