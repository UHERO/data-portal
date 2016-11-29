import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { ChartModule } from 'angular2-highcharts';
import { DataTableModule, SharedModule } from 'primeng/primeng';
import { routing } from './app.routes';

import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';

import { UheroApiService } from './uhero-api.service';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { GeoSelectorComponent } from './geo-selector/geo-selector.component';
import { SingleSeriesComponent } from './single-series/single-series.component';
import { SidebarNavComponent } from './sidebar-nav/sidebar-nav.component';
import { HighchartComponent } from './highchart/highchart.component';
import { FreqSelectorComponent } from './freq-selector/freq-selector.component';
import { HighstockComponent } from './highstock/highstock.component';
import { CategoryTableComponent } from './category-table/category-table.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    LandingPageComponent,
    GeoSelectorComponent,
    SingleSeriesComponent,
    SidebarNavComponent,
    HighchartComponent,
    FreqSelectorComponent,
    HighstockComponent,
    CategoryTableComponent,
  ],
  imports: [
    BrowserModule,
    ChartModule,
    FormsModule,
    HttpModule,
    routing,
    DataTableModule, SharedModule
  ],
  providers: [UheroApiService],
  bootstrap: [AppComponent]
})
export class AppModule { }
