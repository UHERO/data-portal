import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { TableHelperService } from '../table-helper.service';
import { AnalyzerService } from '../analyzer.service';

@Component({
  selector: 'lib-category-table-render',
  templateUrl: './category-table-render.component.html',
  styleUrls: ['./category-table-render.component.scss']
})
export class CategoryTableRenderComponent implements ICellRendererAngularComp {
  public params: any;
  startDate: string;

  constructor(
    private tableHelper: TableHelperService,
    private analyzerService: AnalyzerService,
  ) { 
    
  }

  agInit(params: any): void {
    this.params = params;
    const displayedColumns = params.columnApi.getAllDisplayedColumns();
    this.startDate = displayedColumns[displayedColumns.length - 2].colDef.field;
  }

  refresh(): boolean {
    return false;
  }

  showPopover(seriesInfo) {
    this.tableHelper.showPopover(seriesInfo);
  }

  addToAnalyzer(series) {
    series.analyze = true;
    this.analyzerService.addToAnalyzer(series.id);
  }

  removeFromAnalyzer(series) {
    series.analyze = false;
    this.analyzerService.removeFromAnalyzer(series.id, this.startDate);
  }
}
