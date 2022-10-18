'use strict';
import { Component, ElementRef, EventEmitter, forwardRef, Input, OnInit, Output, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NbComponentSize, NbComponentStatus, NbTrigger } from '@nebular/theme';
import { cloneDeep } from 'lodash';
import { BehaviorSubject, combineLatest, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { accessNestedProperty } from 'app/shared/utils';

const MAX_CHARS = 524288; // the default max length per the html maxlength attribute
const MIN_SEARCH_LENGTH = 3;
const TEXT_SEARCHING = 'Procurando..';
const TEXT_NO_RESULTS = 'Nenhum resultado encontrado';
const noop = () => {};

const COMPLETER_CONTROL_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => NbCompleterComponent),
  multi: true,
};

@Component({
  selector: 'nb-completer',
  templateUrl: './completer.component.html',
  styleUrls: ['./completer.component.scss'],
  providers: [COMPLETER_CONTROL_VALUE_ACCESSOR],
})
export class NbCompleterComponent<T extends object> implements OnInit, ControlValueAccessor {
  @Input() data$!: Observable<T[]>;
  @Input() inputName = '';
  @Input() nameProperty = '';
  @Input() searchableProperties: string[] = [];
  @Input() pictureProperty = '';
  @Input() minSearchLength = MIN_SEARCH_LENGTH;
  @Input() maxChars = MAX_CHARS;
  @Input() placeholder = '';
  @Input() textSearching = TEXT_SEARCHING;
  @Input() textNoResults = TEXT_NO_RESULTS;
  @Input() disabled = false;
  @Input() fullWidth = false;
  @Input() fieldSize = 'normal' as NbComponentSize;
  @Input() status = 'basic' as NbComponentStatus;
  @Input() isPhone = false;
  @Input() showAvatar = true;
  @Input() inputObject: any | undefined;
  @Input() tooltipFunction: (args: any) => string = function (args: any) {
    return '';
  };
  @Output() selected = new EventEmitter<any>();
  @Output() blur = new EventEmitter<void>();

  @ViewChild('autoInput') input!: ElementRef;

  searchStr = '';
  lastSelected = '';
  displaySearching = true;
  isInitialized = false;
  searchActive = false;
  filteredData$: Observable<any[]> = of([]);
  filteredDataIsEmpty$: Observable<boolean> = of(true);
  tooltipTriggers = NbTrigger;
  searchChange$ = new BehaviorSubject<boolean>(true);
  private _onTouchedCallback: () => void = noop;
  private _onChangeCallback: (_: any) => void = noop;

  public ngOnInit(): void {
    if (this.searchableProperties.length == 0) this.searchableProperties.push(this.nameProperty);

    if (this.data$) {
      this.filteredData$ = combineLatest([this.data$, this.searchChange$]).pipe(
        map(([objs, _]) => {
          if (objs.length == 0) return objs;
          this.searchActive = true;
          const filterValue = this.prepareString(this.searchStr);

          return objs.filter((obj: any) => {
            const result = this.searchableProperties.map((property) => {
              const propertiesToAccess = property.split('.');
              const value =
                propertiesToAccess.length > 1
                  ? accessNestedProperty(obj, cloneDeep(propertiesToAccess))
                  : obj[property];

              if (value === undefined)
                console.error(
                  `A propriedade "${property}" não é propriedade do objeto. As propriedades são:`,
                  Object.keys(obj)
                );

              return this.prepareString(value).includes(filterValue);
            });

            this.searchActive = false;
            return result.some((e) => e);
          });
        })
      );
      this.filteredDataIsEmpty$ = this.filteredData$.pipe(map((objs) => objs.length === 0));
    }
  }

  prepareString(s: string): string {
    return s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  display(event: any): string {
    return typeof event === 'string' ? event : this.getItemValueByProperty(event, this.nameProperty);
  }

  onModelChange(event: any): void {
    if (typeof event === 'string') this.searchStr = event;
    else this.searchStr = this.getItemValueByProperty(event, this.nameProperty);
    this.searchChange$.next(true);
  }

  onSelect(event: any): void {
    if (this.isInitialized) {
      if (event) {
        if (typeof event === 'object') {
          this.lastSelected = this.getItemValueByProperty(event, this.nameProperty);
          this._onChangeCallback(this.searchStr);
          this.selected.emit(event);
        } else if (typeof event === 'string') {
          this.lastSelected = event;
        }
      }
    } else this.isInitialized = true;
  }

  onBlur(): void {
    setTimeout(() => {
      this.searchStr = this.lastSelected;
      this._onTouchedCallback();
      this.blur.emit();
    }, 500);
  }

  getItemValueByProperty(item: any, property: string): string {
    const propertiesToAccess = property.split('.');
    return propertiesToAccess.length > 1 ? accessNestedProperty(item, cloneDeep(propertiesToAccess)) : item[property];
  }

  public writeValue(value: any): void {
    if (value != undefined || value != null) {
      setTimeout(() => {
        this.searchStr = value;
        this.lastSelected = value;
      }, 100);
    }
  }

  public registerOnChange(fn: any): void {
    this._onChangeCallback = fn;
  }

  public registerOnTouched(fn: any): void {
    this._onTouchedCallback = fn;
  }
}
