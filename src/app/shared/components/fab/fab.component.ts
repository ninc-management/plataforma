import {
  Component,
  Input,
  ContentChildren,
  ChangeDetectorRef,
  AfterContentInit,
  OnDestroy,
  Output,
} from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FabItemComponent } from './fab-item/fab-item.component';

@Component({
  selector: 'ngx-fab',
  templateUrl: './fab.component.html',
  styleUrls: ['./fab.component.scss'],
})
export class FabComponent implements AfterContentInit, OnDestroy {
  @Input()
  icon = 'plus';
  @Input()
  direction: 'top' | 'bottom' | 'left' | 'right' = 'top';
  @Input()
  spaceBetweenButtons = 55;
  @Input()
  open = new Subject<boolean>();
  @Input()
  color = '#7abb9e';
  @Input()
  disabled = false;
  @Output()
  events = new Subject<any>();
  @ContentChildren(FabItemComponent)
  buttons: any;

  state: BehaviorSubject<any>;
  private destroy$ = new Subject<void>();

  constructor(private cd: ChangeDetectorRef) {
    this.state = new BehaviorSubject({
      display: false,
      direction: 'top',
      event: 'start',
      spaceBetweenButtons: this.spaceBetweenButtons,
    });
  }

  toggle(): void {
    if (!this.disabled) {
      this.state.next({
        ...this.state.getValue(),
        display: !this.state.getValue().display,
        event: !this.state.getValue().display ? 'open' : 'close',
      });
    }
  }

  // only top and bottom support content element
  private checkDirectionType(): void {
    if (this.buttons.toArray()) {
      let display = 'block';

      if (this.direction === 'right' || this.direction === 'left') {
        display = 'none';
      }

      this.buttons.toArray().forEach((element: any) => {
        element.contentref.nativeElement.style.display = display;
      });
    }
  }

  // transition
  private animateButtons(eventType: string): void {
    this.buttons.toArray().forEach((btn: any, i: number) => {
      i += 1;
      const style = btn.elementref.nativeElement.style;

      btn.contentref.nativeElement.style.display = this.state.getValue().display
        ? 'block'
        : 'none';

      if (eventType !== 'directionChanged' && this.state.getValue().display) {
        style['transform'] = 'scale(1)';
        style['transition-duration'] = '0s';

        if (btn.timeout) {
          clearTimeout(btn.timeout);
        }
      }

      setTimeout(() => {
        style['transition-duration'] = this.state.getValue().display
          ? `${90 + 100 * i}ms`
          : '';
        style['transform'] = this.state.getValue().display
          ? this.getTranslate(i)
          : '';
      }, 50);

      if (eventType !== 'directionChanged' && !this.state.getValue().display) {
        btn.timeout = setTimeout(() => {
          style['transform'] = 'scale(0)';
        }, 90 + 100 * i);
      }
    });
  }

  // get transition direction
  private getTranslate(i: number): string {
    let animation;

    switch (this.direction) {
      case 'right':
        animation = `translate3d(${
          this.state.getValue().spaceBetweenButtons * i
        }px,0,0)`;
        break;
      case 'bottom':
        animation = `translate3d(0,${
          this.state.getValue().spaceBetweenButtons * i
        }px,0)`;
        break;
      case 'left':
        animation = `translate3d(-${
          this.state.getValue().spaceBetweenButtons * i
        }px,0,0)`;
        break;
      default:
        animation = `translate3d(0,-${
          this.state.getValue().spaceBetweenButtons * i
        }px,0)`;
        break;
    }

    return animation;
  }

  ngAfterContentInit(): void {
    if (this.direction) {
      // first time to check
      this.checkDirectionType();
    }

    this.buttons.toArray().map((v: any) => {
      v.clicked.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.state.next({
          ...this.state.getValue(),
          display: false,
          event: 'close',
        });
      });
    });

    this.state.pipe(takeUntil(this.destroy$)).subscribe((v) => {
      this.animateButtons(v.event);

      this.events.next({
        display: v.display,
        event: v.event,
        direction: v.direction,
      });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
  }
}
