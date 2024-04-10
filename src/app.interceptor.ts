import { catchError, Observable, throwError } from 'rxjs';
import { Request } from 'express';
import * as Sentry from '@sentry/node';
import { Scope } from '@sentry/core';
import {
  HttpArgumentsHost,
  RpcArgumentsHost,
  WsArgumentsHost,
} from '@nestjs/common/interfaces';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

@Injectable()
export class AppInterceptor implements NestInterceptor {
  private get client() {
    return Sentry;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((exception: Error) => {
        this.client.withScope((scope) => {
          this.captureException(context, scope, exception);
        });

        return throwError(() => exception);
      }),
    );
  }

  protected captureException(
    context: ExecutionContext,
    scope: Scope,
    exception: Error,
  ) {
    switch (context.getType()) {
      case 'http':
        return this.captureHttpException(
          scope,
          context.switchToHttp(),
          exception,
        );
      case 'rpc':
        return this.captureRpcException(
          scope,
          context.switchToRpc(),
          exception,
        );
      case 'ws':
        return this.captureWsException(scope, context.switchToWs(), exception);
    }
  }

  private captureHttpException(
    scope: Scope,
    http: HttpArgumentsHost,
    exception: Error,
  ): void {
    const request = http.getRequest<Request>();

    scope.setExtra('request_method', request.method);
    scope.setExtra('request_headers', request.headers);
    scope.setExtra('request_cookies', request.cookies);
    scope.setExtra('request_body', request.body);

    this.client.captureException(exception);
  }

  private captureRpcException(
    scope: Scope,
    rpc: RpcArgumentsHost,
    exception: Error,
  ): void {
    scope.setExtra('rpc_data', rpc.getData());

    this.client.captureException(exception);
  }

  private captureWsException(
    scope: Scope,
    ws: WsArgumentsHost,
    exception: Error,
  ): void {
    scope.setExtra('ws_client', ws.getClient());
    scope.setExtra('ws_data', ws.getData());

    this.client.captureException(exception);
  }
}
