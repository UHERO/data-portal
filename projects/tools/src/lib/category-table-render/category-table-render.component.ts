import { Component, Inject } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { TableHelperService } from '../table-helper.service';
import { AnalyzerService } from '../analyzer.service';
import 'jquery';
import { Popover } from 'bootstrap/dist/js/bootstrap.esm.min.js';
declare var $: any;

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

  /*showPopover = (seriesInfo, subcatIndex) => {
    return this.tableHelper.showPopover(seriesInfo, subcatIndex);
  }*/

  showPopover(seriesInfo, subcatIndex) {
    const {
      id,
      title,
      geography,
      frequency,
      unitsLabel,
      unitsLabelShort,
      seasonalAdjustment,
      sourceDescription,
      sourceLink,
      sourceDetails
    } = seriesInfo;
    const content = this.getPopoverContent(seasonalAdjustment, sourceDescription, sourceLink, sourceDetails);
    const popoverTitle = this.getPopoverTitle(title, geography.shortName, frequency, unitsLabel, unitsLabelShort);
    const popover = new Popover(document.querySelector(`#series-${id}`), {
      container: 'body',
      html: true,
      title: popoverTitle,
      content: content,
      trigger: 'manual'
    });
    const myPopover = document.getElementById(`series-${id}`).addEventListener('show.bs.popover', (e) => {
      const existingPopover = document.querySelector('.popover');
      Popover.getInstance(document.getElementById(existingPopover?.id))?.dispose();
      setTimeout(() => {
        document.addEventListener('click', () => {
          if (popover !== null) {
            console.log('popover', popover)
            popover?.dispose();
          }
        })
      }, 1)
    });
    popover.toggle();
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
