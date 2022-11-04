import { Component, OnInit, Inject, PLATFORM_ID, ViewChild, AfterViewInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';

declare var gtag: (str: string, gaId: string, path: object) => void;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit, OnInit {
  private isBrowser;
  displayBrowserAlert: boolean = true;
  viewFullUI: boolean = true;
  @ViewChild('browserAlert') browserAlert;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    @Inject('portal') public portal,
    @Inject('GoogleAnalyticsId') private gaId,
    public router: Router
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          this.viewFullUI = !event.url.includes('/graph');
          gtag('config', this.gaId, { page_path: event.urlAfterRedirects });
        }
      });
    }
  }

  ngOnInit() {
    if (this.isBrowser) {
      if (navigator.userAgent.search('Chrome') !== -1) {
        this.displayBrowserAlert = false;
      }
    }
  }

  ngAfterViewInit() {
    if (this.isBrowser) {
      if (navigator.userAgent.search('Chrome') === -1) {
        this.browserAlert.nativeElement.style.display = 'block';
        setTimeout(() => {
          this.browserAlert.nativeElement.style.display = 'none';
        }, 5000);
      }
    }
  }
}
