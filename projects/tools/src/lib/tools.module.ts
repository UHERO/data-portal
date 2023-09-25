import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToolsComponent } from './tools.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HeaderComponent } from './header/header.component';
import { SliderModule } from 'primeng/slider';
import { TableModule } from 'primeng/table';
import { PrimengMenuNavComponent } from './primeng-menu-nav/primeng-menu-nav.component';
import { PanelMenuModule } from 'primeng/panelmenu';
import { TabViewModule } from 'primeng/tabview';
import { CalendarModule } from 'primeng/calendar';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { CategoryChartsComponent } from './category-charts/category-charts.component';
import { CategoryTableViewComponent } from './category-table-view/category-table-view.component';
import { DateSliderComponent } from './date-slider/date-slider.component';
import { FreqSelectorComponent } from './freq-selector/freq-selector.component';
import { GeoSelectorComponent } from './geo-selector/geo-selector.component';
import { ForecastSelectorComponent } from './forecast-selector/forecast-selector.component';
import { HighchartComponent } from './highchart/highchart.component';
import { HighchartsChartModule } from 'highcharts-angular';
import { AgGridModule } from 'ag-grid-angular';
import { CategoryTableRenderComponent } from './category-table-render/category-table-render.component';
import { SingleSeriesComponent } from './single-series/single-series.component';
import { HighstockComponent } from './highstock/highstock.component';
import { ShareLinkComponent } from './share-link/share-link.component';
import { SearchBarComponent } from './search-bar/search-bar.component';
import { AnalyzerComponent } from './analyzer/analyzer.component';
import { AnalyzerHighstockComponent } from './analyzer-highstock/analyzer-highstock.component';
import { AnalyzerTableComponent } from './analyzer-table/analyzer-table.component';
import { AnalyzerStatsRendererComponent } from './analyzer-stats-renderer/analyzer-stats-renderer.component';
import { AnalyzerTableRendererComponent } from './analyzer-table-renderer/analyzer-table-renderer.component';
import { MeasurementSelectorComponent } from './measurement-selector/measurement-selector.component';
import { EmbedGraphComponent } from './embed-graph/embed-graph.component';
import { SearchResultsComponent } from './search-results/search-results.component';
import { DialogModule } from 'primeng/dialog';
import { RequestCache } from './request-cache';
import { CacheInterceptor } from './cache.interceptor';
import { SummaryStatisticsComponent } from './summary-statistics/summary-statistics.component';
import { SingleSeriesTableComponent } from './single-series-table/single-series-table.component';

@NgModule({
  declarations: [
    ToolsComponent,
    HeaderComponent,
    PrimengMenuNavComponent,
    LandingPageComponent,
    CategoryChartsComponent,
    CategoryTableViewComponent,
    DateSliderComponent,
    FreqSelectorComponent,
    GeoSelectorComponent,
    ForecastSelectorComponent,
    HighchartComponent,
    CategoryTableRenderComponent,
    SingleSeriesComponent,
    HighstockComponent,
    ShareLinkComponent,
    SearchBarComponent,
    AnalyzerComponent,
    AnalyzerHighstockComponent,
    AnalyzerTableComponent,
    AnalyzerStatsRendererComponent,
    AnalyzerTableRendererComponent,
    MeasurementSelectorComponent,
    EmbedGraphComponent,
    SearchResultsComponent,
    SummaryStatisticsComponent,
    SingleSeriesTableComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    HttpClientModule,
    TableModule,
    SliderModule,
    PanelMenuModule,
    DialogModule,
    CalendarModule,
    TabViewModule,
    HighchartsChartModule,
    AgGridModule
  ],
  exports: [
    ToolsComponent,
    HeaderComponent,
    PrimengMenuNavComponent,
    LandingPageComponent,
    CategoryChartsComponent,
    CategoryTableViewComponent,
    FreqSelectorComponent,
    GeoSelectorComponent,
    ForecastSelectorComponent,
    HighchartComponent,
    SingleSeriesComponent,
    HighstockComponent,
    ShareLinkComponent,
    SearchBarComponent,
    AnalyzerComponent,
    AnalyzerHighstockComponent,
    AnalyzerTableComponent,
    AnalyzerStatsRendererComponent,
    AnalyzerTableRendererComponent,
    MeasurementSelectorComponent,
    SummaryStatisticsComponent,
    SingleSeriesTableComponent
  ],
  providers: [
    RequestCache,
    { provide: HTTP_INTERCEPTORS, useClass: CacheInterceptor, multi: true }
  ]
})
export class ToolsModule { }
