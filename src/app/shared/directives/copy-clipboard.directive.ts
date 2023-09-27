import { Directive, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Directive({ selector: '[copy-clipboard]' })
export class CopyClipboardDirective {
  @Input('copy-clipboard')
  public payload: string = '';

  @Output('copied')
  public copied: EventEmitter<string> = new EventEmitter<string>();

  @HostListener('click', ['$event'])
  public onClick(event: MouseEvent): void {
    event.preventDefault();
    if (!this.payload) return;

    const listener = (e: ClipboardEvent) => {
      const clipboard = e.clipboardData || (window as any)['clipboardData'];
      clipboard.setData('text', this.payload.toString());
      e.preventDefault();

      this.copied.emit(this.payload);
    };

    document.addEventListener('copy', listener, false);
    document.execCommand('copy');
    document.removeEventListener('copy', listener, false);
  }
}
