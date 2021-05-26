import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PromotionDialogComponent } from './promotion-dialog.component';

describe('PromotionDialogComponent', () => {
  let component: PromotionDialogComponent;
  let fixture: ComponentFixture<PromotionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PromotionDialogComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PromotionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
