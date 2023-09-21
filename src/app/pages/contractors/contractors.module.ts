import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NbAlertModule,
  NbButtonModule,
  NbCardModule,
  NbCheckboxModule,
  NbDatepickerModule,
  NbFormFieldModule,
  NbIconModule,
  NbInputModule,
  NbListModule,
  NbMenuModule,
  NbProgressBarModule,
  NbRadioModule,
  NbSelectModule,
  NbSpinnerModule,
  NbTabsetModule,
  NbToggleModule,
  NbTooltipModule,
  NbUserModule,
} from '@nebular/theme';

import { NbFileUploaderModule } from '../../@theme/components/file-uploader/file-uploader.module';
import { ContractorDialogComponent } from './contractor-dialog/contractor-dialog.component';
import { ContractorItemComponent } from './contractor-item/contractor-item.component';
import { ContractorsComponent } from './contractors.component';
import { RepresentativeItemComponent } from './representative-item/representative-item.component';
import { NbSmartTableModule } from 'app/@theme/components/smart-table/smart-table.module';
import { ThemeModule } from 'app/@theme/theme.module';
import { SharedModule } from 'app/shared/shared.module';

@NgModule({
  imports: [
    FormsModule,
    NbAlertModule,
    NbButtonModule,
    NbCardModule,
    NbCheckboxModule,
    NbDatepickerModule,
    NbFileUploaderModule,
    NbFormFieldModule,
    NbIconModule,
    NbInputModule,
    NbListModule,
    NbMenuModule,
    NbProgressBarModule,
    NbRadioModule,
    NbSelectModule,
    NbSmartTableModule,
    NbSpinnerModule,
    NbTabsetModule,
    NbToggleModule,
    NbTooltipModule,
    NbUserModule,
    SharedModule,
    ThemeModule,
  ],
  declarations: [ContractorDialogComponent, ContractorItemComponent, ContractorsComponent, RepresentativeItemComponent],
  exports: [ContractorItemComponent, RepresentativeItemComponent],
})
export class ContractorsModule {}
