import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpErrorResponse,
  HttpResponse,
} from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { NbGlobalPhysicalPosition, NbToastrService } from '@nebular/theme';

@Injectable({
  providedIn: 'root',
})
export class ResponseNotifierService implements HttpInterceptor {
  constructor(private toastrService: NbToastrService) {}

  handleErrorMessage(error: HttpErrorResponse): string {
    if (error.error.error.code == 'itemNotFound') {
      return 'Pasta do contrato não encontrada no OneDrive';
    }

    return 'Erro ao fazer operação no OneDrive';
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): any {
    return next.handle(request).pipe(
      tap(
        (event) => {
          if (
            event instanceof HttpResponse &&
            event.body &&
            event.body.message !== undefined
          ) {
            this.toastrService.show('', event.body.message, {
              position: NbGlobalPhysicalPosition.TOP_RIGHT,
              status: 'success',
              icon: { icon: 'checkmark', pack: 'eva' },
            });
          }
        },
        (error) => {
          console.log(error, request.url);
          if (error instanceof HttpErrorResponse) {
            if (request.url.includes('graph.microsoft.com'))
              this.toastrService.show('', this.handleErrorMessage(error), {
                position: NbGlobalPhysicalPosition.TOP_RIGHT,
                status: 'danger',
                icon: { icon: 'close', pack: 'eva' },
              });
            else
              this.toastrService.show('', error.error.message, {
                position: NbGlobalPhysicalPosition.TOP_RIGHT,
                status: 'danger',
                icon: { icon: 'close', pack: 'eva' },
              });
          }
        }
      )
    );
  }
}
