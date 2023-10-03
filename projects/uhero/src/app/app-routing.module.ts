import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LandingPageComponent } from 'projects/shared/components/landing-page/landing-page.component';
import { SingleSeriesComponent } from 'projects/shared/components/single-series/single-series.component';
import { AnalyzerComponent } from 'projects/shared/components/analyzer/analyzer.component';
import { EmbedGraphComponent } from 'projects/shared/components/embed-graph/embed-graph.component';

export const uheroRoutes: Routes = [
  // map / to the landing page
  {
    path: '',
    component: LandingPageComponent
  },
  {
    path: 'category',
    component: LandingPageComponent
  },
  {
    path: 'search',
    component: LandingPageComponent
  },
  {
    path: 'series',
    component: SingleSeriesComponent
  },
  {
    path: 'analyzer',
    component: AnalyzerComponent
  },
  {
    path: 'graph',
    component: EmbedGraphComponent
  }
];
