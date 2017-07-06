export { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Component, Directive, Injectable, Input, Type } from '@angular/core';
import { ActivatedRoute, Route, Params, ActivatedRouteSnapshot, UrlSegment, Data, NavigationExtras } from '@angular/router';

// RouterLinkStub
@Directive({
    selector: '[routerLink]',
    host: {
        '(click)': 'onclick()'
    }
})
export class RouterLinkStubDirective {
    @Input('routerLink') linkParams: any;
    navigatedTo: any = null;

    onClick() {
        this.navigatedTo = this.linkParams;
    }
}

@Directive({
    selector: '[appQueryParams]',
    host: {
        '(click)': 'onclick()'
    }
})
export class QueryParamsStubDirective {
    @Input('queryParams') queryParams: any;
    navigatedTo: any = null;

    onClick() {
        this.navigatedTo = this.queryParams;
    }
}

// RouterOutletStub
@Component({ selector: 'app-router-outlet', template: '' })
class RouterOutletStubComponent { }

// RouterStub
@Injectable()
export class RouterStub {
    navigate(commands: any[], extras?: NavigationExtras) { }
}

@Injectable()
export class ActivatedRouteStub {
    snapshot: ActivatedRouteSnapshot;
    url: Observable<UrlSegment[]>;
    params: Observable<Params>;
    queryParams: {};
    fragment: Observable<string>;
    data: Observable<Data>;
    outlet: string;
    component: Type<any> | string;
    routeConfig: Route;
    root: ActivatedRoute;
    parent: ActivatedRoute;
    firstChild: ActivatedRoute;
    children: ActivatedRoute[];
    pathFromRoot: ActivatedRoute[];
    toString(): string {
        return '';
    };
}
// Only implements params and part of snapshot.params
/* import { BehaviorSubject } from 'rxjs/BehaviorSubject';
@Injectable()
export class ActivatedRouteStub {

  // ActivatedRoute.params is Observable
  private subject = new BehaviorSubject(this.testParams);
  params = this.subject.asObservable();

  // Test parameters
  private _testParams: {};
  get testParams() { return this._testParams; }
  set testParams(params: {}) {
    this._testParams = params;
    this.subject.next(params);
  }

  // ActivatedRoute.snapshot.params
  get snapshot() {
    return { params: this.testParams };
  }
} */
