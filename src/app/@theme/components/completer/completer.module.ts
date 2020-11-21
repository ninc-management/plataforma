/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Ng2CompleterModule } from 'ng2-completer';
import {
  NbInputModule,
  NbListModule,
  NbTooltipModule,
  NbUserModule,
} from '@nebular/theme';

import { NbCompleterComponent } from './completer.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NbInputModule,
    NbListModule,
    NbTooltipModule,
    NbUserModule,
    Ng2CompleterModule,
  ],
  declarations: [NbCompleterComponent],
  exports: [NbCompleterComponent],
  providers: [],
})
export class NbCompleterModule {}
