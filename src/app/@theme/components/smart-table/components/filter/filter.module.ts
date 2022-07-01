import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Ng2CompleterModule } from 'ng2-completer';

import { CustomFilterComponent } from './custom-filter.component';
import { DefaultFilterComponent } from './default-filter.component';
import { FilterDefault } from './filter-default';
import { CheckboxFilterComponent } from './filter-types/checkbox-filter.component';
import { CompleterFilterComponent } from './filter-types/completer-filter.component';
import { DefaultFilter } from './filter-types/default-filter';
import { InputFilterComponent } from './filter-types/input-filter.component';
import { SelectFilterComponent } from './filter-types/select-filter.component';
import { FilterComponent } from './filter.component';

const FILTER_COMPONENTS = [
  FilterDefault,
  DefaultFilter,
  FilterComponent,
  DefaultFilterComponent,
  CustomFilterComponent,
  CheckboxFilterComponent,
  CompleterFilterComponent,
  InputFilterComponent,
  SelectFilterComponent,
];

@NgModule({
  imports: [CommonModule, FormsModule, ReactiveFormsModule, Ng2CompleterModule],
  declarations: [...FILTER_COMPONENTS],
  exports: [...FILTER_COMPONENTS],
})
export class FilterModule {}
