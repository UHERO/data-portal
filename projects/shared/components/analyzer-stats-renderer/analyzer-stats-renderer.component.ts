import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
    selector: 'lib-analyzer-stats-renderer',
    templateUrl: './analyzer-stats-renderer.component.html',
    styleUrls: ['./analyzer-stats-renderer.component.scss'],
    standalone: true,
    imports: [NgIf, RouterLink]
})
export class AnalyzerStatsRendererComponent implements ICellRendererAngularComp {
  public params: any;

  constructor() { }

  agInit(params: any): void {
    this.params = params;
  }

  refresh(): boolean {
    return false;
  }
}
