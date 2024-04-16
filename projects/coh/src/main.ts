import { enableProdMode, importProvidersFrom } from '@angular/core';
import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { cohRoutes } from './app/app-routing.module';
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
        provideRouter(cohRoutes,
            withComponentInputBinding(),
            withHashLocation(),
            withRouterConfig({
                onSameUrlNavigation: 'reload'
            })
        ),
        importProvidersFrom(
            BrowserModule,
            BrowserAnimationsModule,
            ServiceWorkerModule.register('./ngsw-worker.js', {
                enabled: environment.production
            })
        ),
        {
            provide: 'environment',
            useValue: environment
        },
        {
            provide: 'rootCategory',
            useValue: 4429
        },
        {
            provide: 'defaultRange',
            useValue: [
                { freq: 'A', range: 10, start: '', end: '' },
                { freq: 'Q', range: 10, start: '', end: '' },
                { freq: 'S', range: 10, start: '', end: '' },
                { freq: 'M', range: 10, start: '', end: '' },
                { freq: 'W', range: 2, start: '', end: '' },
                { freq: 'D', range: 1, start: '', end: '' }
            ]
        },
        {
            provide: 'logo',
            useValue: {
                altText: 'County of Hawaii Data Portal Logo',
                displayImg: true,
                headerText: 'County of Hawaii Data Portal',
                imgSrc: '../../assets/hawaii-county-logo-bw.svg',
                mobileLogo: false
            }
        },
        {
            provide: 'portal',
            useValue: {
                universe: 'coh',
                feedback: false,
                categoryTabs: false // Display subcategory navigation tabs in category chart/table view
            }
        },
        {
            provide: 'GoogleAnalyticsId',
            useValue: 'G-3DL2CGLWQZ'
        }
    ]
})
  .catch(err => console.error(err));
