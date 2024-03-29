import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { NbThemeService } from '@nebular/theme';
import { skip, take } from 'rxjs/operators';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ngx-fab-item',
  templateUrl: './fab-item.component.html',
  styleUrls: ['./fab-item.component.scss'],
})
export class FabItemComponent implements OnInit {
  @Input()
  icon = 'plus';
  @Input()
  pack = '';
  @Input()
  content = '';
  @Input()
  color!: string;
  @Input()
  disabled = false;
  @Input()
  iconTop = '0';
  @Input()
  iconLeft = '0';

  @Output()
  clicked: EventEmitter<any> = new EventEmitter();

  @ViewChild('elementref', { static: true })
  elementref!: ElementRef<HTMLElement>;

  @ViewChild('contentref', { static: true })
  contentref!: ElementRef<HTMLElement>;

  constructor(private theme: NbThemeService) {}

  ngOnInit(): void {
    this.theme
      .getJsTheme()
      .pipe(take(2), skip(1))
      .subscribe((config) => {
        const colors: any = config.variables;
        if (!this.color) this.color = colors.bg;
      });
  }

  emitClickEvent($event: Event): void {
    if (!this.disabled) this.clicked.emit($event);
  }
}
