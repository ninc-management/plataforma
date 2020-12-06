import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressSectionComponent } from './progress-section.component';

describe('ProgressSectionComponent', () => {
  let component: ProgressSectionComponent;
  let fixture: ComponentFixture<ProgressSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProgressSectionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgressSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
