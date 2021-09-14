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

  constructor(
    private tableHelper: TableHelperService,
    private analyzerService: AnalyzerService
  ) {  }

  agInit(params: any): void {
    this.params = params;
  }

  refresh(): boolean {
    return false;
  }

  showPopover(seriesInfo) {
    this.tableHelper.showPopover(seriesInfo);
  }

  getPopoverTitle = (title: string, geo: string, freq: string, units: string, unitsShort: string) => {
    return `${title} (${geo}; ${freq}) (${units || unitsShort})`;
  }

  getPopoverContent = (seasonal: string, description: string, link: string, details: string) => {
    let content = '';
    if (seasonal === 'seasonally_adjusted') {
      content += 'Seasonally Adjusted<br />';
    }
    if (description) {
      content += `Source: ${description}<br />`;
    }
    if (link) {
      content += `<a target="_blank" href="${link}">${link}</a><br />`
    }
    if (details) {
      content += details;
    }
    return content;
  }

  addToAnalyzer(series) {
    series.analyze = true;
    this.analyzerService.addToAnalyzer(series.id);
  }

  removeFromAnalyzer(series) {
    series.analyze = false;
    this.analyzerService.removeFromAnalyzer(series.id);
  }
}
