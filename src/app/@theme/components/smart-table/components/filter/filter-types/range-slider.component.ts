import { Options } from '@angular-slider/ngx-slider';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { debounceTime, distinctUntilChanged, fromEvent, map } from 'rxjs';

import { StringUtilService } from 'app/shared/services/string-util.service';

@Component({
  selector: 'range-slider-filter',
  template: `
    <div>
      <p>
        Mínimo:
        <input [(ngModel)]="minValue" nbInput #minInput />
      </p>
      <p>
        Máximo:
        <input [(ngModel)]="maxValue" nbInput #maxInput />
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
export class RangeFilterComponent implements OnInit, AfterViewInit {
  @Input() maxValue!: number;
  @Input() minValue!: number;
  @Input() query!: string;
  minValueSlider!: number;
  maxValueSlider!: number;
  @Output() valueChanged = new EventEmitter<{ min: string; max: string }>();
  @ViewChild('minInput') minInput!: ElementRef;
  @ViewChild('maxInput') maxInput!: ElementRef;
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
  }

  ngAfterViewInit(): void {
    fromEvent(this.minInput.nativeElement, 'input')
      .pipe(
        map((event: any) => (event.target as HTMLInputElement).value),
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe((data) => {
        if (this.options.floor) {
          if (+data < this.options.floor) this.minInput.nativeElement.value = this.options.floor;
          this.minValueSlider = this.minInput.nativeElement.value;
        }
      });

    fromEvent(this.maxInput.nativeElement, 'input')
      .pipe(
        map((event: any) => (event.target as HTMLInputElement).value),
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe((data) => {
        if (this.options.ceil) {
          if (+data > this.options.ceil) this.maxInput.nativeElement.value = this.options.ceil;
          this.maxValueSlider = this.maxInput.nativeElement.value;
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
