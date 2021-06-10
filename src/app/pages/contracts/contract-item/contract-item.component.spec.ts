import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractItemComponent } from './contract-item.component';
import { CommonTestingModule } from 'app/../common-testing.module';
import { NbIconLibraries } from '@nebular/theme';

describe('ContractItemComponent', () => {
  let component: ContractItemComponent;
  let fixture: ComponentFixture<ContractItemComponent>;
  let iconsLibrary: NbIconLibraries;

  CommonTestingModule.setUpTestBed(ContractItemComponent);

  beforeEach(() => {
    iconsLibrary = TestBed.inject(NbIconLibraries);
    iconsLibrary.registerFontPack('fa', {
      packClass: 'fa',
      iconClassPrefix: 'fa',
    });
    iconsLibrary.registerSvgPack('fac', {
      receipt: '<svg></svg>',
      minus: '<svg></svg>',
      scale: '<svg></svg>',
    });
    fixture = TestBed.createComponent(ContractItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
