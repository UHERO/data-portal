import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { TableHelperService } from '../table-helper.service';

@Component({
  selector: 'lib-analyzer-table-renderer',
  templateUrl: './analyzer-table-renderer.component.html',
  styleUrls: ['./analyzer-table-renderer.component.scss']
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
