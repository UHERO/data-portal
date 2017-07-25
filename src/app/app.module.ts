import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { ChartModule } from 'angular2-highcharts';
// Temp workaround for build errors
// See: https://github.com/gevgeny/angular2-highcharts/issues/160
import { HighchartsStatic } from 'angular2-highcharts/dist/HighchartsService';
declare var require: any;
export function highchartsFactory() {
  const highcharts = require('highcharts/js/highstock');
  const exp = require('highcharts/js/modules/exporting');
  const offlineExport = require('highcharts/js/modules/offline-exporting');
  const csv = require('./csv-export');

  exp(highcharts);
  offlineExport(highcharts);
  csv(highcharts);
  highcharts.setOptions({
    lang: {
      thousandsSep: ','
    }
  });
  return (highcharts);
}
import { Shared } from './shared/shared.module';
import { routing } from './app.routes';
import { AppComponent } from './app.component';
import { UheroApiService } from './uhero-api.service';
import { CategoryHelperService } from './category-helper.service';
import { DataPortalSettingsService } from './data-portal-settings.service';
import { SeriesHelperService } from './series-helper.service';
import { HelperService } from './helper.service';
import { GoogleAnalyticsEventsService } from './google-analytics-events.service';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { HelpDocService } from './help-doc.service';
import { HelpOutletDirective } from './help-outlet.directive';

@NgModule({
  declarations: [
    AppComponent,
    LandingPageComponent,
    HelpOutletDirective,
  ],
  imports: [
    Shared,
    routing,
    BrowserModule,
    ChartModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule
  ],
  providers: [
    UheroApiService,
    DataPortalSettingsService,
    CategoryHelperService,
    SeriesHelperService,
    HelperService,
    GoogleAnalyticsEventsService,
    HelpDocService,
    {
      provide: HighchartsStatic,
      useFactory: highchartsFactory
    },
    {
      provide: 'rootCategory',
      useValue: 59
    },
    {
      provide: 'defaultCategory',
      useValue: 42
    },
    {
      provide: 'logo',
      useValue: '../../assets/UHEROdata-Logo-color.svg'
    },
    {
      provide: 'portal',
      useValue: 'uhero'
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
