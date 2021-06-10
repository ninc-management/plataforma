import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractDialogComponent } from './contract-dialog.component';
import { CommonTestingModule } from 'app/../common-testing.module';
import { NbIconLibraries } from '@nebular/theme';

describe('ContractDialogComponent', () => {
  let iconsLibrary: NbIconLibraries;
  let component: ContractDialogComponent;
  let fixture: ComponentFixture<ContractDialogComponent>;

  CommonTestingModule.setUpTestBed(ContractDialogComponent);

  beforeEach(() => {
    iconsLibrary = TestBed.inject(NbIconLibraries);
    iconsLibrary.registerFontPack('far', {
      packClass: 'far',
      iconClassPrefix: 'fa',
    });
    iconsLibrary.registerFontPack('fa', {
      packClass: 'fa',
      iconClassPrefix: 'fa',
    });
    iconsLibrary.registerSvgPack('fac', {
      onedrive: '<svg></svg>',
      'onedrive-add': '<svg></svg>',
    });
    fixture = TestBed.createComponent(ContractDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
