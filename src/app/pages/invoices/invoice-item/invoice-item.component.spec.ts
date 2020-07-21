import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceItemComponent } from './invoice-item.component';

describe('InvoiceItemComponent', () => {
  let component: InvoiceItemComponent;
  let fixture: ComponentFixture<InvoiceItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InvoiceItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InvoiceItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
