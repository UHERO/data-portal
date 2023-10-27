import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { TableHelperService } from 'projects/shared/services/table-helper.service';
import { AnalyzerService } from 'projects/shared/services/analyzer.service';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
    selector: 'lib-category-table-render',
    templateUrl: './category-table-render.component.html',
    styleUrls: ['./category-table-render.component.scss'],
    standalone: true,
    imports: [NgIf, RouterLink]
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
