import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CellModule } from '../cell/cell.module';
import { TbodyCreateCancelComponent } from './cells/create-cancel.component';
import { TbodyCustomComponent } from './cells/custom.component';
import { TbodyEditDeleteComponent } from './cells/edit-delete.component';
import { Ng2SmartTableTbodyComponent } from './tbody.component';

const TBODY_COMPONENTS = [
  TbodyCreateCancelComponent,
  TbodyEditDeleteComponent,
  TbodyCustomComponent,
  Ng2SmartTableTbodyComponent,
];

@NgModule({
  imports: [CommonModule, FormsModule, CellModule],
  declarations: [...TBODY_COMPONENTS],
  exports: [...TBODY_COMPONENTS],
})
export class TBodyModule {}
