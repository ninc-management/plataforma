import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'app/../common-testing.module';

import { PromotionDialogComponent } from './promotion-dialog.component';

describe('PromotionDialogComponent', () => {
  let component: PromotionDialogComponent;
  let fixture: ComponentFixture<PromotionDialogComponent>;

  CommonTestingModule.setUpTestBed(PromotionDialogComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(PromotionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
