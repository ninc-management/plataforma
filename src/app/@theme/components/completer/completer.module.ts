/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NbAutocompleteModule, NbInputModule, NbListModule, NbTooltipModule, NbUserModule } from '@nebular/theme';

import { NbCompleterComponent } from './completer.component';
import { NbMessageInputComponent } from '../message-input/message-input.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NbInputModule,
    NbListModule,
    NbTooltipModule,
    NbAutocompleteModule,
    NbUserModule,
  ],
  declarations: [NbCompleterComponent, NbMessageInputComponent],
  exports: [NbCompleterComponent, NbMessageInputComponent],
  providers: [],
})
export class NbCompleterModule {}
