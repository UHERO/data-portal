// Component for multi-chart view
import { Component, OnInit, AfterViewInit, AfterViewChecked, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';

import { UheroApiService } from '../uhero-api.service';
import { CategoryHelperService } from '../category-helper.service';
import { Frequency } from '../frequency';
import { Geography } from '../geography';

@Component({
  selector: 'app-landing-page',
  templateUrl: 'landing-page.component.html',
  styleUrls: ['landing-page.component.scss']
})
export class LandingPageComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
  private sub;
  private id: number;
  private routeGeo: string;
  private routeFreq: string;
  private routeView: string;
  private routeYoy;
  private routeYtd;
  private search = false;
  private queryParams: any = {};

  // Variables for geo and freq selectors
  public currentGeo: Geography;
  public currentFreq: Frequency;
  public categoryData;
  private loading = false;
  private fragment;
  private userEvent;
  private previousHeight;

  constructor(
    private _uheroAPIService: UheroApiService,
    private _catHelper: CategoryHelperService,
    private route: ActivatedRoute,
    private _router: Router
  ) {}

  ngOnInit() {
    this.currentGeo = { fips: null, name: null, handle: null };
    this.currentFreq = { freq: null, label: null };
  }

  ngAfterViewInit() {
    this.sub = this.route.queryParams.subscribe((params) => {
      this.id = this.getIdParam(params['id']);
      this.routeGeo = params['geo'];
      this.routeFreq = params['freq'];
      this.routeView = params['view'];
      this.routeYoy = params['yoy'];
      this.routeYtd = params['ytd'];
      if (this.id) { this.queryParams.id = this.id; };
      if (this.routeGeo) { this.queryParams.geo = this.routeGeo; };
      if (this.routeFreq) { this.queryParams.freq = this.routeFreq; };
      if (this.routeView) { this.queryParams.view = this.routeView; };
      if (this.routeYoy) { this.queryParams.yoy = this.routeYoy; } else { delete this.queryParams.yoy; }
      if (this.routeYtd) { this.queryParams.ytd = this.routeYtd; } else { delete this.queryParams.ytd; }
      this.categoryData = this.getData(this.id, this.routeGeo, this.routeFreq);
    });
  }

  ngAfterViewChecked() {
    // Check height of content and scroll to anchor if fragment is in URL
    // If true, height is changing, i.e. content still loading
    if (this.checkContainerHeight()) {
      this.scrollTo();
    }
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  getIdParam(id) {
    if (id === undefined) {
      return 42;
    }
    if (id && isNaN(+id)) {
      // id param is a string, display search results
      return id;
    }
    if (id && +id) {
      // id of category selected in sidebar
      return +id;
    }
  }

  getData(id, geo, freq) {
    if (typeof id === 'string' && geo && freq) {
      return this._catHelper.initSearch(id, geo, freq);
    }
    if (typeof id === 'string' && !geo && !freq) {
      return this._catHelper.initSearch(id);
    }
    if (typeof id === 'number' && geo && freq) {
      return this._catHelper.initContent(id, geo, freq);
    }
    if (typeof id === 'number' && !geo && !freq) {
      return this._catHelper.initContent(id, geo, freq);
    }
  }

  checkContainerHeight() {
    const contianer = $('.multi-series-container');
    const heightDiff = (this.previousHeight !== contianer.height());
    this.previousHeight = contianer.height();
    return heightDiff;
  }

  // Redraw series when a new region is selected
  redrawSeriesGeo(event, currentFreq, subId) {
    this.loading = true;
    setTimeout(() => {
      this.queryParams.geo = event.handle;
      this.queryParams.freq = currentFreq.freq;
      this.fragment = subId;
      this.updateRoute();
    }, 10);
    this.scrollToFragment();
  }

  redrawSeriesFreq(event, currentGeo, subId) {
    this.loading = true;
    setTimeout(() => {
      this.queryParams.geo = currentGeo.handle;
      this.queryParams.freq = event.freq;
      this.fragment = subId;
      this.updateRoute();
    }, 10);
    this.scrollToFragment();
  }

  switchView(subId) {
    this.loading = true;
    setTimeout(() => {
      this.queryParams.view = this.routeView === 'table' ? 'chart' : 'table';
      this.fragment = subId;
      this.updateRoute();
    });
    this.scrollToFragment();
  }

  yoyActive(e, subId) {
    this.loading = true;
    setTimeout(() => {
      this.queryParams.yoy = e.target.checked;
      this.fragment = subId;
      this.updateRoute();
    }, 10);
    this.scrollToFragment();
  }

  ytdActive(e, subId) {
    this.loading = true;
    setTimeout(() => {
      this.queryParams.ytd = e.target.checked;
      this.fragment = subId;
      this.updateRoute();
    }, 10);
    this.scrollToFragment();
  }

  // Work around for srolling to page anchor
  scrollToFragment() {
    setTimeout(() => {
      this.scrollTo();
    }, 10);
  }

  updateRoute() {
    this.queryParams.id = this.queryParams.id ? this.queryParams.id : this.id;
    this._router.navigate(['/category'], { queryParams: this.queryParams, queryParamsHandling: 'merge', fragment: this.fragment });
    this.loading = false;
  }

  scrollTo(): void {
    this.route.fragment.subscribe(frag => {
      const el = <HTMLElement>document.querySelector('#id_' + frag);
      if (el) {
        el.scrollIntoView(el);
        const scrolledY = window.scrollY;
        if (scrolledY) {
          window.scroll(0, scrolledY - 75);
        }
      }
      if (frag === 'top') { el.scrollTop; };
    });
  }
}
