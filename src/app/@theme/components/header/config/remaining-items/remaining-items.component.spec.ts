import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'common-testing.module';

import { RemainingItemsComponent } from './remaining-items.component';

describe('RemainingItemsComponent', () => {
  let component: RemainingItemsComponent;
  let fixture: ComponentFixture<RemainingItemsComponent>;

  CommonTestingModule.setUpTestBed(RemainingItemsComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(RemainingItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
