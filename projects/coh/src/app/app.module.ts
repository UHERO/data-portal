import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { environment } from '../environments/environment';
import { ToolsModule } from 'tools';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    ToolsModule,
    AppRoutingModule,
    ServiceWorkerModule.register('./ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [
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
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
