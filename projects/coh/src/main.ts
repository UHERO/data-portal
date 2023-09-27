import { enableProdMode, importProvidersFrom } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';


import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { AppRoutingModule } from './app/app-routing.module';
import { ToolsModule } from 'tools';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(BrowserModule, ToolsModule, AppRoutingModule, ServiceWorkerModule.register('./ngsw-worker.js', { enabled: environment.production })),
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
            useValue: 'UA-18074519-5'
        }
    ]
})
  .catch(err => console.error(err));
