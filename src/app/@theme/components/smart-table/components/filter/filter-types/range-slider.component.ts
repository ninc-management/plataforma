import { Options } from '@angular-slider/ngx-slider';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

import { appInjector } from 'app/shared/injector.module';
import { StringUtilService } from 'app/shared/services/string-util.service';

@Component({
  selector: 'range-slider-filter',
  template: `
    <div>
      <p>
        Mínimo:
        <input [(ngModel)]="minValue" nbInput (ngModelChange)="restrictMinValue$.next($event)" />
      </p>
      <p>
        Máximo:
        <input [(ngModel)]="maxValue" nbInput (ngModelChange)="restrictMaxValue$.next($event)" />
      </p>
    </div>
    <ngx-slider
      [(value)]="minValueSlider"
      [(highValue)]="maxValueSlider"
      [options]="options"
      (valueChange)="updateValues()"
      (highValueChange)="updateValues()"
    ></ngx-slider>
  `,
})
export class RangeFilterComponent implements OnInit {
  @Input() maxValue!: number;
  @Input() minValue!: number;
  @Input() query!: string;
  minValueSlider!: number;
  maxValueSlider!: number;
  @Output() valueChanged = new EventEmitter<{ min: string; max: string }>();
  restrictMinValue$: Subject<string> = new Subject();
  restrictMaxValue$: Subject<string> = new Subject();

  options: Options = {
    translate: (value: number): string => {
      return 'R$ ' + this.stringUtil.numberToMoney(value);
    },
    enforceStep: false,
    enforceRange: false,
  };

  constructor(private stringUtil: StringUtilService) {}

  ngOnInit() {
    this.options.floor = this.minValue;
    this.options.ceil = this.maxValue;
    this.minValueSlider = this.options.floor;
    this.maxValueSlider = this.options.ceil;
    if (this.query) {
      const [min, max] = this.query.split(' - ');
      this.minValue = this.stringUtil.moneyToNumber(min);
      this.maxValue = this.stringUtil.moneyToNumber(max);
      this.minValueSlider = this.minValue;
      this.maxValueSlider = this.maxValue;
    }
    this.restrictMinValue$.pipe(debounceTime(700), distinctUntilChanged()).subscribe((value) => {
      if (this.options.floor) {
        if (+value > this.options.floor) {
          this.minValue = this.options.floor;
          this.minValueSlider = this.minValue;
        } else {
          this.minValueSlider = this.minValue;
        }
      }
    });
    this.restrictMaxValue$.pipe(debounceTime(700), distinctUntilChanged()).subscribe((value) => {
      if (this.options.ceil) {
        if (+value > this.options.ceil) {
          this.maxValue = this.options.ceil;
          this.maxValueSlider = this.maxValue;
        } else {
          this.maxValueSlider = this.maxValue;
        }
      }
    });
  }

  updateValues() {
    this.minValue = this.minValueSlider;
    this.maxValue = this.maxValueSlider;
    this.valueChanged.emit({
      min: this.stringUtil.numberToMoney(+this.minValue),
      max: this.stringUtil.numberToMoney(+this.maxValue),
    });
  }
}

export function sliderRangeFilter(cell: any, search?: string): boolean {
  const stringUtil = appInjector.get(StringUtilService);
  if (search) {
    const range = search.split(' - ');
    return (
      stringUtil.moneyToNumber(cell) >= stringUtil.moneyToNumber(range[0]) &&
      stringUtil.moneyToNumber(cell) <= stringUtil.moneyToNumber(range[1])
    );
  }
  return false;
}
