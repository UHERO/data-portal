import { Component, Inject, PLATFORM_ID, ViewChild, OnInit } from '@angular/core';
import { isPlatformBrowser, NgIf } from '@angular/common';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { HeaderComponent } from 'projects/shared/components/header/header.component';
import { PrimengMenuNavComponent } from 'projects/shared/components/primeng-menu-nav/primeng-menu-nav.component';

declare var gtag: (str: string, gaId: string, path: object) => void;

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: true,
    imports: [NgIf, RouterOutlet, HeaderComponent, PrimengMenuNavComponent]
})
export class AppComponent implements OnInit {
  private isBrowser;
  displayBrowserAlert: boolean = true;
  viewFullUI: boolean = true;
  @ViewChild('browserAlert') browserAlert;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    @Inject('portal') public portal,
    @Inject('GoogleAnalyticsId') private gaId,
    public router: Router,
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
