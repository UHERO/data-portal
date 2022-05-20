import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpResponse,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable, of as observableOf } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RequestCache } from './request-cache';

@Injectable()
export class CacheInterceptor implements HttpInterceptor {

  constructor(private cache: RequestCache) {}
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    request = request.clone({
      setHeaders: {
        Authorization: `Bearer -VI_yuv0UzZNy4av1SM5vQlkfPK_JKnpGfMzuJR7d0M=`
      }
    });
    const cachedResponse = this.cache.get(request);
    return cachedResponse ? observableOf(cachedResponse) : this.sendRequest(request, next, this.cache);
  }

  sendRequest(request: HttpRequest<any>, next: HttpHandler, cache: RequestCache): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          cache.put(request, event);
        }
      })
    );
  }
}
