import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractorEditComponent } from './contractor-edit.component';

describe('ContractorEditComponent', () => {
  let component: ContractorEditComponent;
  let fixture: ComponentFixture<ContractorEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ContractorEditComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ContractorEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
