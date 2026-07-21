import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { ApiError } from './api-error';

function getErrorMessage(error: HttpErrorResponse): string {
  if (typeof error.error?.error === 'string') {
    return error.error.error;
  }

  if (error.status === 0) {
    return 'Nao foi possivel conectar ao servidor.';
  }

  return 'Falha ao carregar dados.';
}

export const apiErrorInterceptor: HttpInterceptorFn = (_request, next) =>
  next(_request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        return throwError(
          () => new ApiError(getErrorMessage(error), error.status, error.error),
        );
      }

      return throwError(() => error);
    }),
  );
