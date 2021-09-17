import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[ngxSelectAllText]',
})
export class SelectAllTextDirective {
  constructor(
    private element: ElementRef<HTMLInputElement | HTMLTextAreaElement>
  ) {}

  @HostListener('focusin') onFocusIn(): void {
    this.element.nativeElement.select();
  }
}
