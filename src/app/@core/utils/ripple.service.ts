import { Injectable } from '@angular/core';
import { RippleGlobalOptions } from '@angular/material/core';

@Injectable({ providedIn: 'root' })
export class RippleService implements RippleGlobalOptions {
  public disabled: boolean = false;
  public animation = {
    enterDuration: 400,
    exitDuration: 200,
  };

  public toggle(enabled: boolean): void {
    this.disabled = !enabled;
  }
}
