import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  OnInit,
  ChangeDetectionStrategy,
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
