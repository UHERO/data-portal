import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import * as $ from 'jquery';

declare var gtag: (str: string, gaId: string, path: object) => void;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  private isBrowser;
  displayBrowserAlert: boolean = true;
  viewFullUI: boolean = true;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    @Inject('portal') public portal,
    //@Inject('GoogleAnalyticsId') private gaId,
    public router: Router
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.viewFullUI = !event.url.includes('/graph');
          //gtag('config', this.gaId, { page_path: event.urlAfterRedirects });
        }
      });
    }
  }

  ngOnInit() {
    if (this.isBrowser) {
      if (navigator.userAgent.search('Chrome') === -1) {
        $('.browser').show();
        setTimeout(() => {
          $('.browser').hide();
        }, 5000);
      } else {
        this.displayBrowserAlert = false;
        $('.browser').hide();
      }
    }
  }}
