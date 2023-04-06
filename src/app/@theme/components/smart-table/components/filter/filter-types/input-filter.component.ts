import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { NbPopoverDirective } from '@nebular/theme';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { DefaultFilter } from './default-filter';

@Component({
  selector: 'input-filter',
  template: `
    <input
      *ngIf="inputType == 'slider'"
      [ngClass]="inputClass"
      [formControl]="inputControl"
      class="form-control"
      type="text"
      placeholder="{{ column.title }}"
      [nbPopover]="rangeSliderBox"
      nbPopoverPlacement="bottom"
      nbPopoverTrigger="click"
    />
    <input
      *ngIf="inputType == 'input'"
      [ngClass]="inputClass"
      [formControl]="inputControl"
      class="form-control"
      type="text"
      placeholder="{{ column.title }}"
    />
    <ng-template #rangeSliderBox>
      <nb-card class="nb-card-slider" style="padding: 20px; margin-bottom: 0;">
        <nb-card-header style="padding-top: 0;text-align: center;">Selecione o intervalo de valores</nb-card-header>
        <range-slider-filter
          [minValue]="column.getFilterConfig().minValue"
          [maxValue]="column.getFilterConfig().maxValue"
          (valueChanged)="setInputValue($event)"
          [query]="this.query"
        ></range-slider-filter>
      </nb-card>
    </ng-template>
  `,
})
export class InputFilterComponent extends DefaultFilter implements OnInit {
  inputControl = new UntypedFormControl();
  inputType = 'input';
  @ViewChild(NbPopoverDirective) popover!: NbPopoverDirective;
  constructor() {
    super();
  }

  ngOnInit() {
    if (this.column.getFilterType() === 'slider') this.inputType = 'slider';
    if (this.query) {
      this.inputControl.setValue(this.query);
    }
    this.inputControl.valueChanges.pipe(distinctUntilChanged(), debounceTime(this.delay)).subscribe((value: string) => {
      this.query = value;
      this.setFilter();
    });
  }

  setInputValue(values: { min: string; max: string }): void {
    this.inputControl.setValue(values.min + ' - ' + values.max);
  }
}
