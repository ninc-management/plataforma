import { NgModule } from '@angular/core';
import { BrMaskDirective } from './directives/br-mask';

@NgModule({
  exports: [BrMaskDirective],
  declarations: [BrMaskDirective],
})
export class SharedModule {}
