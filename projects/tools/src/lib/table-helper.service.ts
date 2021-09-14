import { Injectable } from '@angular/core';
import { Popover } from 'bootstrap/dist/js/bootstrap.esm.min.js';

@Injectable({
  providedIn: 'root'
})
export class TableHelperService {

  constructor() { }

  showPopover (seriesInfo) {
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
    const popoverId = `popover-${id}`;
    const content = this.getPopoverContent(seasonalAdjustment, sourceDescription, sourceLink, sourceDetails);
    const popoverTitle = this.getPopoverTitle(title, geography.shortName, frequency, unitsLabel, unitsLabelShort);
    const popover = new Popover(document.querySelector(`#${popoverId}`), {
      container: 'body',
      html: true,
      title: popoverTitle,
      placement: 'left',
      content: content,
      trigger: 'manual'
    });
    // display only one popover at a time
    document.getElementById(popoverId).addEventListener('show.bs.popover', (e) => {
      const existingPopover = document.querySelector('.popover');
      Popover.getInstance(document.getElementById(existingPopover?.id))?.dispose();
      // clicking anywhere closes the popover
      setTimeout(() => {
        document.addEventListener('click', () => {
          if (Object.values(popover).some(v => v !== null)) {
            popover.dispose();
          }
        });
      }, 1);
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
}
