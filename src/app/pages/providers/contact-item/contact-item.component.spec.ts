import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'common-testing.module';
import { ContactItemComponent } from './contact-item.component';

describe('ContactItemComponent', () => {
  let component: ContactItemComponent;
  let fixture: ComponentFixture<ContactItemComponent>;

  CommonTestingModule.setUpTestBed(ContactItemComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ContactItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
