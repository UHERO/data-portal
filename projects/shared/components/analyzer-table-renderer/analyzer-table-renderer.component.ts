import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { TableHelperService } from 'projects/shared/services/table-helper.service';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
    selector: 'lib-analyzer-table-renderer',
    templateUrl: './analyzer-table-renderer.component.html',
    styleUrls: ['./analyzer-table-renderer.component.scss'],
    standalone: true,
    imports: [NgIf, RouterLink]
})
export class AnalyzerTableRendererComponent implements ICellRendererAngularComp {
  public params: any;

  constructor(
    private tableHelper: TableHelperService
  ) { }

  agInit(params: any): void {
    this.params = params;
  }

  invokeParentUpdateAnalyzer() {
    this.params.context.componentParent.updateAnalyzer(this.params.data);
  }

  invokeParentUpdateChart() {
    this.params.context.componentParent.updateChart(this.params.data);
  }

  refresh(): boolean {
    return false;
  }

  showPopover = (seriesInfo: any) => this.tableHelper.showPopover(seriesInfo);
}
