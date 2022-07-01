import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'common-testing.module';

import { ExpansiveGridComponent } from './expansive-grid.component';

describe('ExpansiveGridComponent', () => {
  let component: ExpansiveGridComponent;
  let fixture: ComponentFixture<ExpansiveGridComponent>;

  CommonTestingModule.setUpTestBed(ExpansiveGridComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpansiveGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
