import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractorItemComponent } from './contractor-item.component';

describe('ContractorItemComponent', () => {
  let component: ContractorItemComponent;
  let fixture: ComponentFixture<ContractorItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ContractorItemComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContractorItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
