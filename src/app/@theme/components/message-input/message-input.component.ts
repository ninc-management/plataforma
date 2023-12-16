import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NbComponentSize, NbComponentStatus } from '@nebular/theme';
import { combineLatest, map, Observable, of, Subject } from 'rxjs';

import { User } from '@models/user';

const MAX_CHARS = 524288; // the default max length per the html maxlength attribute
const MIN_SEARCH_LENGTH = 3;
const TEXT_SEARCHING = 'Procurando..';
const TEXT_NO_RESULTS = 'Nenhum resultado encontrado';
const noop = () => {};

const COMPLETER_CONTROL_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => NbMessageInputComponent),
  multi: true,
};

@Component({
  selector: 'nb-message-input',
  templateUrl: './message-input.component.html',
  styleUrls: ['./message-input.component.scss'],
  providers: [COMPLETER_CONTROL_VALUE_ACCESSOR],
})
export class NbMessageInputComponent implements OnInit, ControlValueAccessor {
  @Input() data$!: Observable<any>;
  @Input() inputName = '';
  @Input() nameProperty = '';
  @Input() pictureProperty = '';
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() fullWidth = false;
  @Input() showAvatar = true;
  @Input() minSearchLength = MIN_SEARCH_LENGTH;
  @Input() maxChars = MAX_CHARS;
  @Input() textSearching = TEXT_SEARCHING;
  @Input() textNoResults = TEXT_NO_RESULTS;
  @Input() status = 'basic' as NbComponentStatus;
  @Input() fieldSize = 'normal' as NbComponentSize;

  searchStr = '';
  messageStr = '';
  isInitialized = false;
  searchActive = false;
  mentionMode = false;
  isAlphabetic = new RegExp(/^[A-Za-z]+$/);
  filteredData$: Observable<any[]> = of([]);
  filteredDataIsEmpty$: Observable<boolean> = of(true);
  searchChange$ = new Subject<void>();
  private _onTouchedCallback: () => void = noop;
  private _onChangeCallback: (_: any) => void = noop;

  public ngOnInit(): void {
    if (this.data$) {
      this.filteredData$ = combineLatest([this.data$, this.searchChange$]).pipe(
        map(([objs, _]) => {
          if (objs.length == 0) return objs;
          this.searchActive = true;
          const filterValue = this.prepareString(this.searchStr);
          return objs.filter((obj: any) => {
            const result = this.prepareString(obj[this.nameProperty]).includes(filterValue);
            this.searchActive = false;
            return result;
          });
        })
      );
      this.filteredDataIsEmpty$ = this.filteredData$.pipe(map((objs) => objs.length === 0));
    }
  }

  public registerOnChange(fn: any): void {
    this._onChangeCallback = fn;
  }

  public registerOnTouched(fn: any): void {
    this._onTouchedCallback = fn;
  }

  public writeValue(value: any): void {
    if (value != undefined || value != null) {
      setTimeout(() => {
        this.messageStr = value;
      }, 100);
    }
  }

  prepareString(s: string): string {
    return s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  onSelect(event: User | string): void {
    if (this.isInitialized) {
      if (event && typeof event === 'object') {
        this.deactivateMentionMode();
      }
    } else this.isInitialized = true;
  }

  display(event: User | string): string {
    if (typeof event !== 'string') return this.prepareMention(event);

    if (this.mentionMode) {
      if (this.isAlphabetic.test(event.slice(-1)) || event.slice(-1) == '@') return event;
      return event.slice(0, event.length - 1);
    }

    return event;
  }

  onModelChange(event: User | string): void {
    if (typeof event !== 'string') this.messageStr = this.prepareMention(event);
    else if (!this.mentionMode || event.slice(-1) == '@') this.messageStr = event;
    this._onChangeCallback(this.messageStr);
  }

  handleKeyDown(event: KeyboardEvent) {
    if (this.shouldActivateMentionMode(event)) this.activateMentionMode();
    else if (this.shouldDeactivateMentionMode(event)) this.deactivateMentionMode();
    if (this.mentionMode && event.key != '@') this.handleMentioning(event);
  }

  private shouldActivateMentionMode(event: KeyboardEvent): boolean {
    return event.key == '@' && (this.messageStr.slice(-1) == ' ' || this.messageStr.length == 0);
  }

  private shouldDeactivateMentionMode(event: KeyboardEvent): boolean {
    return (
      event.code == 'Space' ||
      (this.messageStr.slice(-1) == '@' && event.code == 'Backspace' && this.searchStr.length == 0)
    );
  }

  private deactivateMentionMode(): void {
    this.mentionMode = false;
    this.searchStr = '';
    this.searchChange$.next();
  }

  private activateMentionMode(): void {
    this.searchChange$.next();
    this.mentionMode = true;
  }

  private handleMentioning(event: KeyboardEvent): void {
    if (event.code == 'Backspace') {
      this.searchStr = this.searchStr.slice(0, -1);
    } else if (event.key.length == 1 && this.isAlphabetic.test(event.key)) {
      this.searchStr += event.key;
    }

    this.searchChange$.next();
  }

  private prepareMention(event: User): string {
    return this.messageStr.slice(0, -1) + '*@' + (event.exibitionName ? event.exibitionName : event.fullName) + '* ';
  }
}
