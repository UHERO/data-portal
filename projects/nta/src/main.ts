import { enableProdMode, importProvidersFrom } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';


import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { ToolsModule } from 'tools';
import { AppRoutingModule } from './app/app-routing.module';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(BrowserModule, AppRoutingModule, ToolsModule, ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })),
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
