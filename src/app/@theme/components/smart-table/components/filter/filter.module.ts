import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NbCardModule, NbDatepickerModule, NbInputModule, NbPopoverModule, NbSelectModule } from '@nebular/theme';
import { Ng2CompleterModule } from 'ng2-completer';

import { CustomFilterComponent } from './custom-filter.component';
import { DefaultFilterComponent } from './default-filter.component';
import { FilterDefault } from './filter-default';
import { CheckboxFilterComponent } from './filter-types/checkbox-filter.component';
import { CompleterFilterComponent } from './filter-types/completer-filter.component';
import { DateFilterComponent } from './filter-types/date-filter.component';
import { DefaultFilter } from './filter-types/default-filter';
import { InputFilterComponent } from './filter-types/input-filter.component';
import { RangeFilterComponent } from './filter-types/range-slider.component';
import { SelectFilterComponent } from './filter-types/select-filter.component';
import { FilterComponent } from './filter.component';

const FILTER_COMPONENTS = [
  FilterDefault,
  DefaultFilter,
  FilterComponent,
  DateFilterComponent,
  DefaultFilterComponent,
  CustomFilterComponent,
  CheckboxFilterComponent,
  CompleterFilterComponent,
  InputFilterComponent,
  SelectFilterComponent,
  RangeFilterComponent,
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    Ng2CompleterModule,
    NbSelectModule,
    NbDatepickerModule,
    NgxSliderModule,
    NbPopoverModule,
    NbCardModule,
    NbInputModule,
  ],

  declarations: [...FILTER_COMPONENTS],
  exports: [...FILTER_COMPONENTS],
})
export class FilterModule {}
