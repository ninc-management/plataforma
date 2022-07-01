import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PagerComponent } from './pager.component';

@NgModule({
  imports: [CommonModule, FormsModule],
  declarations: [PagerComponent],
  exports: [PagerComponent],
})
export class PagerModule {}
