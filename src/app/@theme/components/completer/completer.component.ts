'use strict';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ViewChild,
  forwardRef,
  OnDestroy,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { CtrCompleter, CompleterData, CompleterItem } from 'ng2-completer';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { NbTrigger, NbComponentStatus, NbComponentSize } from '@nebular/theme';

const MAX_CHARS = 524288; // the default max length per the html maxlength attribute
const MIN_SEARCH_LENGTH = 3;
const PAUSE = 10;
const TEXT_SEARCHING = 'Procurando..';
const TEXT_NO_RESULTS = 'Nenhum resultado encontrado';
const CLEAR_TIMEOUT = 50;

function isNil(value: any) {
  return typeof value === 'undefined' || value === null;
}

// tslint:disable-next-line:no-empty
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
/* eslint-disable @typescript-eslint/indent */
export class NbCompleterComponent
  implements OnInit, OnDestroy, ControlValueAccessor
{
  @Input() public dataService!: CompleterData;
  @Input() public inputName = '';
  @Input() public pause = PAUSE;
  @Input() public minSearchLength = MIN_SEARCH_LENGTH;
  @Input() public maxChars = MAX_CHARS;
  @Input() public overrideSuggested = false;
  @Input() public fillHighlighted = false;
  @Input() public clearSelected = false;
  @Input() public openOnFocus = true;
  @Input() public openOnClick = false;
  @Input() public selectOnClick = false;
  @Input() public selectOnFocus = true;
  @Input() public placeholder = '';
  @Input() public selectedText: string | undefined;
  @Input() public matchClass: string | undefined;
  @Input() public textSearching = TEXT_SEARCHING;
  @Input() public textNoResults = TEXT_NO_RESULTS;
  @Input() public fieldTabindex: number | undefined;
  @Input() public autoMatch = false;
  @Input() public disableInput = false;
  @Input() public fullWidth = false;
  @Input() public fieldSize = 'normal' as NbComponentSize;
  @Input() public status = 'basic' as NbComponentStatus;
  @Input() public isPhone = false;
  @Input() public showAvatar = true;
  @Input() public inputObject: any | undefined;
  @Input() public tooltipFunction: (args: any) => string = function (
    args: any
  ) {
    return '';
  };
  @Output() public selected = new EventEmitter<CompleterItem>();
  @Output() public highlighted = new EventEmitter<CompleterItem>();
  @Output() public blur = new EventEmitter<void>();

  public displaySearching = true;
  public searchStr = '';
  public focused = false;
  public tooltipTriggers = NbTrigger;

  @ViewChild(CtrCompleter, { static: true }) private completer:
    | CtrCompleter
    | undefined;
  /* eslint-enable @typescript-eslint/indent */

  private destroy$ = new Subject<void>();
  private _onTouchedCallback: () => void = noop;
  private _onChangeCallback: (_: any) => void = noop;
  private lastSelected: CompleterItem | undefined;

  get value(): any {
    return this.searchStr;
  }

  set value(v: any) {
    if (v !== this.searchStr) {
      this.searchStr = v;
      this._onChangeCallback(v);
    }
  }

  public onTouched(): void {
    this._onTouchedCallback();
  }

  public writeValue(value: any): void {
    this.searchStr = value;
  }

  public registerOnChange(fn: any): void {
    this._onChangeCallback = fn;
  }

  public registerOnTouched(fn: any): void {
    this._onTouchedCallback = fn;
  }

  public ngOnInit(): void {
    if (!this.completer) {
      return;
    }

    this.completer.selected
      .pipe(
        filter((c): c is CompleterItem => c != null),
        takeUntil(this.destroy$)
      )
      .subscribe((item: CompleterItem) => {
        if (item) {
          this.selected.emit(item);
          this.lastSelected = item;
          this._onChangeCallback(item.title);
        }
      });
    this.completer.highlighted
      .pipe(
        filter((c): c is CompleterItem => c != null),
        takeUntil(this.destroy$)
      )
      .subscribe((item: CompleterItem) => {
        this.highlighted.emit(item);
      });

    if (this.textSearching === 'false') {
      this.displaySearching = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public onBlur(): void {
    this.blur.emit();
    setTimeout(() => {
      this.focused = false;
      this.searchStr = this.selectedText ? this.selectedText : '';
    }, 500);
    this.onTouched();
  }

  public onFocus(): void {
    this.focused = true;
  }
}
