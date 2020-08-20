import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractorDialogComponent } from './contractor-dialog.component';

describe('ContractorDialogComponent', () => {
  let component: ContractorDialogComponent;
  let fixture: ComponentFixture<ContractorDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ContractorDialogComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContractorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
