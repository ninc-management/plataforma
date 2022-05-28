import { Injector, NgModule } from '@angular/core';

export let appInjector: Injector;

@NgModule({
  imports: [],
  exports: [],
  declarations: [],
})
export class InjectorModule {
  constructor(private injector: Injector) {
    appInjector = this.injector;
  }
}
