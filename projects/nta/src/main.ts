import { enableProdMode, importProvidersFrom } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';


import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { ntaRoutes } from './app/app-routing.module';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { BrowserAnimationsModule, provideAnimations, provideNoopAnimations } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { RequestCache } from 'projects/shared/services/request-cache';
import { CacheInterceptor } from 'projects/shared/services/cache.interceptor';
import { provideRouter, withComponentInputBinding, withHashLocation, withRouterConfig } from '@angular/router';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
    providers: [
        provideAnimations(),
        provideNoopAnimations(),
        provideHttpClient(
            withInterceptorsFromDi()
        ),
        { provide: RequestCache, useClass: RequestCache },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: CacheInterceptor,
            multi: true
        },
        provideRouter(ntaRoutes,
            withComponentInputBinding(),
            withHashLocation(),
            withRouterConfig({
                onSameUrlNavigation: 'reload'
            })
        ),
        importProvidersFrom(
            BrowserModule,
            BrowserAnimationsModule,
            ServiceWorkerModule.register('ngsw-worker.js', {
                enabled: environment.production
            })
        ),
        {
            provide: 'environment',
            useValue: environment
        },
        {
            provide: 'rootCategory',
            useValue: 2487
        },
        {
            provide: 'logo',
            useValue: {
                altText: 'NTA Data Portal Logo',
                displayImg: true,
                headerText: '',
                imgSrc: '../../assets/nta-logo.svg',
                mobileLogo: true,
            }
        },
        {
            provide: 'defaultRange',
            useValue: [
                { freq: 'A', range: 40, start: '2000', end: '2040' },
            ]
        },
        {
            provide: 'portal',
            useValue: {
                universe: 'nta',
                feedback: false,
                categoryTabs: false // Display subcategory navigation tabs in category chart/table view
            }
        },
        {
            provide: 'GoogleAnalyticsId',
            useValue: 'UA-18074519-4'
        }
    ]
})
  .catch(err => console.error(err));
