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

  showPopover(e, seriesInfo, subcatIndex) {
    console.log('e', e)
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
    //const otherPopovers = Array.from(document.querySelectorAll('.popover')).filter(element => element !== e.target);
    /* otherPopovers.forEach((pop) => {
      pop.dispose()
    }) */
    const myPopover = document.getElementById(`series-${id}`).addEventListener('show.bs.popover', function() {
      const otherPopovers = Array.from(document.querySelectorAll('.info')).filter(element => element.id !== `series-${id}`)//.filter(element => element !== e.target);
      otherPopovers.forEach((pop) => {
        const triggerEl = document.getElementById(pop.id)
        Popover.getInstance(triggerEl)?.dispose();
      });
    });
    /*document.body.addEventListener('click', () => {
      const otherPopovers = Array.from(document.querySelectorAll('.info'))//.filter(element => element.id !== `series-${id}`)//.filter(element => element !== e.target);
      otherPopovers.forEach((pop) => {
        const triggerEl = document.getElementById(pop.id)
        Popover.getInstance(triggerEl)?.dispose();
      });
    })*/
    //const diffPopover = document.getE
    popover.show();
    /* .on('show.bs.popover', (e) => {
      // Display only one popover at a time
      $('.popover').not(e.target).popover('dispose');
      setTimeout(() => {
        // Close popover on next click (source link in popover is still clickable)
        $('body').one('click', () => {
          popover.popover('dispose');
        });
      }, 1);
    }); */
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
