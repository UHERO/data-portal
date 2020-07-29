import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LandingPageComponent } from 'tools';
import { SingleSeriesComponent } from 'tools';
import { AnalyzerComponent } from 'tools';
import { CohHelpComponent } from './coh-help/coh-help.component';
import { EmbedGraphComponent } from 'tools';

const routes: Routes = [
  // map / to the landing page
  {
    path: '',
    component: LandingPageComponent,
  },
  {
    path: 'category',
    component: LandingPageComponent,
  },
  {
    path: 'search',
    component: LandingPageComponent,
  },
  {
    path: 'series',
    component: SingleSeriesComponent,
  },
  {
    path: 'analyzer',
    component: AnalyzerComponent,
  },
  {
    path: 'help',
    component: CohHelpComponent,
  },
  {
    path: 'graph',
    component: EmbedGraphComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      useHash: true,
      anchorScrolling: 'enabled',
      scrollPositionRestoration: 'enabled',
      scrollOffset: [0, 75],
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
