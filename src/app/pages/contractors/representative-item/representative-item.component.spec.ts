import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'common-testing.module';

import { RepresentativeItemComponent } from './representative-item.component';

import { LegalRepresentative } from '@models/contractor';

describe('RepresentativeItemComponent', () => {
  let component: RepresentativeItemComponent;
  let fixture: ComponentFixture<RepresentativeItemComponent>;

  CommonTestingModule.setUpTestBed(RepresentativeItemComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(RepresentativeItemComponent);
    component = fixture.componentInstance;
    component.representative = new LegalRepresentative();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
