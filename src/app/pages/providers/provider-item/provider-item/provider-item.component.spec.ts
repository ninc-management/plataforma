import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonTestingModule } from 'common-testing.module';

import { ProviderItemComponent } from './provider-item.component';

describe('ProviderItemComponent', () => {
  let component: ProviderItemComponent;
  let fixture: ComponentFixture<ProviderItemComponent>;

  CommonTestingModule.setUpTestBed(ProviderItemComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ProviderItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
