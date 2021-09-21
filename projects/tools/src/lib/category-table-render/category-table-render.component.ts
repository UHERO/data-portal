import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { TableHelperService } from '../table-helper.service';
import { AnalyzerService } from '../analyzer.service';
<<<<<<< HEAD
import 'jquery';
//import { Popover } from 'bootstrap/dist/js/bootstrap.esm.min.js';
declare var $: any;
=======
>>>>>>> f86a666cb72b69e88d0d6717c11eb4e0852a4175

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
    /*Array.from(document.querySelectorAll('[data-bs-toggle="popover"]'))
    .forEach(popoverNode => new Popover(popoverNode))*/
    /* const ex = document.getElementById(`${params.data.seriesInfo.id}`)
    const popover = new bootstrap.Popover(ex, {
      container: 'body'
    });
    console.log(popover) */
    /* Array.from(document.querySelectorAll('[data-bs-toggle="popover"]'))
    .forEach(popoverNode => new Popover(popoverNode))
    console.log(document.getElementById(`${params.data.seriesInfo.id}`))
    const popover = new Popover(document.getElementById(`${params.data.seriesInfo.id}`), {
      container: 'body'
    }) */
  }

  refresh(): boolean {
    return false;
  }

  showPopover(seriesInfo) {
    this.tableHelper.showPopover(seriesInfo);
  }

  addToAnalyzer(series) {
    series.analyze = true;
<<<<<<< HEAD
    this.analyzerService.addToAnalzyer(series.id);
=======
    this.analyzerService.addToAnalyzer(series.id);
>>>>>>> f86a666cb72b69e88d0d6717c11eb4e0852a4175
  }

  removeFromAnalyzer(series) {
    series.analyze = false;
    this.analyzerService.removeFromAnalyzer(series.id);
  }
}
